-- ==============================================================================
-- CIVICEYE MIGRATION: PHASE 8 CIVIC TRUST, TRANSPARENCY & ACCOUNTABILITY SYSTEM
-- (PHASE 8.2 FINAL SECURITY HARDENING, IMMUTABILITY & DATA INTEGRITY PATCH)
-- ==============================================================================

-- 1. Resolution Quality Feedback
CREATE TABLE IF NOT EXISTS resolution_quality_feedback (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    completeness TEXT NOT NULL CHECK (completeness IN ('fully_fixed', 'partially_fixed', 'still_broken', 'worsened')),
    has_recurred BOOLEAN NOT NULL DEFAULT false,
    feedback_comment TEXT CHECK (feedback_comment IS NULL OR char_length(feedback_comment) <= 1000),
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Enforce single active verdict per citizen per report
    CONSTRAINT uq_report_user_feedback UNIQUE (report_id, user_id)
);

-- 2. Public Audit Events (Strictly Append-Only)
CREATE TABLE IF NOT EXISTS public_audit_events (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('report', 'work_order')),
    entity_id TEXT NOT NULL,
    ticket_number TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    actor_title TEXT NOT NULL,
    action_label TEXT NOT NULL,
    previous_state TEXT,
    new_state TEXT,
    public_explanation TEXT NOT NULL,
    department_name TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Department Performance Snapshots
CREATE TABLE IF NOT EXISTS department_performance_snapshots (
    id TEXT PRIMARY KEY,
    department_id TEXT NOT NULL,
    department_name TEXT NOT NULL,
    department_code TEXT NOT NULL,
    reports_received INTEGER NOT NULL DEFAULT 0,
    reports_resolved INTEGER NOT NULL DEFAULT 0,
    avg_resolution_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
    on_time_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    verification_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    snapshot_date DATE DEFAULT CURRENT_DATE
);

-- 4. Periodic Public Accountability Reports
CREATE TABLE IF NOT EXISTS periodic_accountability_reports (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    period_label TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'department_audit', 'citizen_verification')),
    total_intake INTEGER NOT NULL DEFAULT 0,
    resolved_count INTEGER NOT NULL DEFAULT 0,
    verification_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    sla_adherence_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
    key_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_res_feedback_report_id ON resolution_quality_feedback(report_id);
CREATE INDEX IF NOT EXISTS idx_res_feedback_user_id ON resolution_quality_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_public_audit_ticket ON public_audit_events(ticket_number);
CREATE INDEX IF NOT EXISTS idx_public_audit_created ON public_audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dept_snapshots_date ON department_performance_snapshots(snapshot_date);

-- ==============================================================================
-- 6. IMMUTABILITY TRIGGERS: ENFORCE STRICT APPEND-ONLY AUDIT LEDGER
-- ==============================================================================

-- A. Block UPDATE and DELETE on audit ledger
CREATE OR REPLACE FUNCTION prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit records are immutable and strictly append-only. UPDATE and DELETE operations are prohibited on public_audit_events.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_audit_events ON public_audit_events;
CREATE TRIGGER trg_immutable_audit_events
BEFORE UPDATE OR DELETE ON public_audit_events
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_tampering();

-- B. Block TRUNCATE on audit ledger
CREATE OR REPLACE FUNCTION prevent_audit_truncate()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'TRUNCATE operation is strictly prohibited on public_audit_events. Audit records are permanently append-only.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_audit_truncate ON public_audit_events;
CREATE TRIGGER trg_immutable_audit_truncate
BEFORE TRUNCATE ON public_audit_events
FOR EACH STATEMENT
EXECUTE FUNCTION prevent_audit_truncate();

-- C. Feedback Mutation Protection: Prevent DELETE and enforce immutable identifiers (id, report_id, user_id, created_at)
CREATE OR REPLACE FUNCTION handle_feedback_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Citizen resolution feedback cannot be deleted. Historical verification records are permanent.';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.user_id != NEW.user_id OR OLD.report_id != NEW.report_id OR OLD.id != NEW.id THEN
      RAISE EXCEPTION 'Immutable fields (user_id, report_id, id) cannot be altered on resolution feedback.';
    END IF;
    NEW.created_at := OLD.created_at; -- Preserve original submission timestamp
    NEW.updated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feedback_mutation_guard ON resolution_quality_feedback;
CREATE TRIGGER trg_feedback_mutation_guard
BEFORE UPDATE OR DELETE ON resolution_quality_feedback
FOR EACH ROW
EXECUTE FUNCTION handle_feedback_mutation();

-- D. Concurrency-Safe Feedback Rate Limiting Trigger
-- Uses PostgreSQL transaction advisory lock to serialize concurrent submissions for the SAME user
-- while allowing different users to execute in parallel without friction.
CREATE OR REPLACE FUNCTION check_feedback_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
  lock_key BIGINT;
BEGIN
  -- 64-bit advisory transaction lock derived from user_id hash
  lock_key := ('x' || substr(md5('civiceye_rl_' || NEW.user_id), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(lock_key);

  SELECT COUNT(*) INTO recent_count
  FROM resolution_quality_feedback
  WHERE user_id = NEW.user_id
  AND (created_at > NOW() - INTERVAL '1 minute' OR updated_at > NOW() - INTERVAL '1 minute');

  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Feedback rate limit exceeded: maximum 5 verification submissions per minute per user. Please wait before submitting additional feedback.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feedback_rate_limit ON resolution_quality_feedback;
CREATE TRIGGER trg_feedback_rate_limit
BEFORE INSERT OR UPDATE ON resolution_quality_feedback
FOR EACH ROW
EXECUTE FUNCTION check_feedback_rate_limit();

-- ==============================================================================
-- 7. SECURE PUBLIC VIEWS (AGGREGATED ONLY — ZERO PII OR FREEFORM LEAKAGE)
-- ==============================================================================

-- Drop individual feedback view to prevent accidental comment or private photo leakage
DROP VIEW IF EXISTS public_sanitized_resolution_feedback;

-- Aggregated feedback metrics view for public transparency:
-- Exposes ONLY mathematical aggregates (counts, percentages, average ratings).
-- Exposes ZERO individual records, ZERO comments, ZERO photos, and ZERO user identifiers.
CREATE OR REPLACE VIEW public_resolution_feedback_summary
WITH (security_invoker = false) AS
SELECT 
    report_id,
    COUNT(*) AS total_feedbacks,
    ROUND(AVG(rating), 2) AS average_rating,
    COUNT(*) FILTER (WHERE completeness = 'fully_fixed') AS fully_fixed_count,
    COUNT(*) FILTER (WHERE completeness = 'partially_fixed') AS partially_fixed_count,
    COUNT(*) FILTER (WHERE completeness = 'still_broken') AS still_broken_count,
    COUNT(*) FILTER (WHERE completeness = 'worsened') AS worsened_count,
    COUNT(*) FILTER (WHERE has_recurred = true) AS recurred_count
FROM resolution_quality_feedback
GROUP BY report_id;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES & PERMISSIONS
-- ==============================================================================
ALTER TABLE resolution_quality_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodic_accountability_reports ENABLE ROW LEVEL SECURITY;

-- Revoke direct destructive operations across tables
REVOKE ALL PRIVILEGES ON resolution_quality_feedback FROM anon, public;
REVOKE ALL PRIVILEGES ON public_audit_events FROM anon, public;
REVOKE UPDATE, DELETE, TRUNCATE ON public_audit_events FROM anon, authenticated, public;
REVOKE UPDATE, DELETE, TRUNCATE ON department_performance_snapshots FROM anon, authenticated, public;
REVOKE UPDATE, DELETE, TRUNCATE ON periodic_accountability_reports FROM anon, authenticated, public;

-- Grant selective, narrow column privileges to authenticated users
GRANT SELECT, INSERT ON resolution_quality_feedback TO authenticated;
GRANT UPDATE (rating, completeness, has_recurred, feedback_comment, photo_url, updated_at) 
ON resolution_quality_feedback TO authenticated;

GRANT SELECT ON public_audit_events TO anon, authenticated, public;
GRANT INSERT ON public_audit_events TO authenticated;

-- A. resolution_quality_feedback RLS
-- Citizens can only SELECT their own submitted feedback directly
CREATE POLICY "Citizens read own feedback"
ON resolution_quality_feedback
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Authorized municipal staff can inspect feedback for verification review and rework planning
CREATE POLICY "Staff read all resolution feedback"
ON resolution_quality_feedback
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'reviewer', 'supervisor', 'staff')
);

-- Only authenticated citizens can insert feedback for valid reports matching their own user_id
CREATE POLICY "Authenticated citizens insert feedback"
ON resolution_quality_feedback
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid()::text = user_id
  AND EXISTS (
    SELECT 1 FROM reports r
    WHERE r.id = report_id
  )
);

-- Authenticated citizens can update their own previously submitted verdict (e.g. escalating to challenged)
CREATE POLICY "Citizens update own feedback"
ON resolution_quality_feedback
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (
  auth.uid()::text = user_id
  AND report_id = OLD.report_id
);

-- B. public_audit_events RLS
-- Public read access strictly for sanitized public events
CREATE POLICY "Public read audit events"
ON public_audit_events
FOR SELECT
TO anon, authenticated, public
USING (is_public = true);

-- Only authorized municipal staff / admin or backend service role can insert operational audit records
CREATE POLICY "Staff insert audit events"
ON public_audit_events
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' IN ('admin', 'reviewer', 'supervisor', 'staff')
  OR auth.role() = 'service_role'
);

-- C. department_performance_snapshots & periodic_accountability_reports RLS
CREATE POLICY "Public read department snapshots"
ON department_performance_snapshots
FOR SELECT
TO anon, authenticated, public
USING (true);

CREATE POLICY "Public read accountability reports"
ON periodic_accountability_reports
FOR SELECT
TO anon, authenticated, public
USING (true);

CREATE POLICY "Staff insert department snapshots"
ON department_performance_snapshots
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' IN ('admin', 'supervisor')
  OR auth.role() = 'service_role'
);

CREATE POLICY "Staff insert accountability reports"
ON periodic_accountability_reports
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' IN ('admin', 'supervisor')
  OR auth.role() = 'service_role'
);

-- Grant SELECT strictly on the aggregated summary view
GRANT SELECT ON public_resolution_feedback_summary TO anon, authenticated, public;
