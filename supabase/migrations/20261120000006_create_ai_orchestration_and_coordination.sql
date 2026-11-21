-- ==============================================================================
-- CIVICEYE MIGRATION: PHASE 9 AI MULTI-AGENCY ORCHESTRATION & SMART DECISION SUPPORT
-- ==============================================================================

-- 1. AI Analysis Records (Structured analysis snapshot per civic report)
CREATE TABLE IF NOT EXISTS ai_analysis_records (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    detected_issue_type TEXT NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    civic_priority_score INTEGER NOT NULL CHECK (civic_priority_score >= 0 AND civic_priority_score <= 100),
    public_safety_concern TEXT,
    accessibility_impact TEXT,
    environmental_impact TEXT,
    potential_public_impact TEXT,
    suggested_primary_dept TEXT NOT NULL,
    suggested_supporting_depts JSONB DEFAULT '[]'::jsonb,
    missing_evidence JSONB DEFAULT '[]'::jsonb,
    investigation_steps JSONB DEFAULT '[]'::jsonb,
    confidence_score NUMERIC(4,2) NOT NULL DEFAULT 0.85,
    model_provider TEXT DEFAULT 'CivicEye Grounded Heuristic Engine',
    is_grounded BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Infrastructure Relationship Intelligence (Inter-issue dependency & corridors)
CREATE TABLE IF NOT EXISTS infrastructure_relationships (
    id TEXT PRIMARY KEY,
    report_id_a TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    report_id_b TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    classification TEXT NOT NULL CHECK (classification IN (
        'Possible shared cause',
        'Spatially related',
        'Temporally related',
        'Recurring issue',
        'Infrastructure dependency',
        'Unconfirmed relationship'
    )),
    confidence NUMERIC(4,2) NOT NULL DEFAULT 0.80,
    distance_meters INTEGER,
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_infra_relationship UNIQUE (report_id_a, report_id_b)
);

-- 3. Multi-Agency Coordination Plans (Cross-department orchestration proposals)
CREATE TABLE IF NOT EXISTS multi_agency_coordination_plans (
    id TEXT PRIMARY KEY,
    primary_report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    related_report_ids JSONB DEFAULT '[]'::jsonb,
    title TEXT NOT NULL,
    primary_dept_id TEXT NOT NULL,
    primary_dept_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'AI Proposed',
        'Awaiting Human Review',
        'Approved',
        'Rejected',
        'Planning',
        'In Progress',
        'Blocked',
        'Completed',
        'Cancelled'
    )) DEFAULT 'AI Proposed',
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'high',
    target_timeline_hours INTEGER DEFAULT 48,
    ai_confidence NUMERIC(4,2) DEFAULT 0.85,
    proposed_next_actions JSONB DEFAULT '[]'::jsonb,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Coordination Department Dependencies (Sequencing and inter-departmental risks)
CREATE TABLE IF NOT EXISTS coordination_department_dependencies (
    id TEXT PRIMARY KEY,
    coordination_id TEXT NOT NULL REFERENCES multi_agency_coordination_plans(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL,
    department_name TEXT NOT NULL,
    role_type TEXT NOT NULL CHECK (role_type IN ('primary', 'supporting', 'regulatory', 'safety_audit')),
    dependency_order INTEGER NOT NULL DEFAULT 1,
    involvement_reason TEXT NOT NULL,
    risk_if_delayed TEXT NOT NULL,
    required_evidence TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'active', 'cleared', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Coordination Approval History (Append-only audit trail for human decisions)
CREATE TABLE IF NOT EXISTS coordination_approval_history (
    id TEXT PRIMARY KEY,
    coordination_id TEXT NOT NULL REFERENCES multi_agency_coordination_plans(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN (
        'proposed',
        'reviewed',
        'approved',
        'rejected',
        'modified',
        'status_changed',
        'note_added'
    )),
    previous_status TEXT,
    new_status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Preventive Civic Action Proposals (Pattern mining & proactive infrastructure works)
CREATE TABLE IF NOT EXISTS preventive_action_proposals (
    id TEXT PRIMARY KEY,
    pattern_title TEXT NOT NULL,
    problem_pattern TEXT NOT NULL,
    evidence_summary TEXT NOT NULL,
    related_report_ids JSONB DEFAULT '[]'::jsonb,
    trend_period TEXT NOT NULL,
    potential_impact TEXT NOT NULL,
    suggested_action TEXT NOT NULL,
    recommended_dept_id TEXT NOT NULL,
    recommended_dept_name TEXT NOT NULL,
    confidence NUMERIC(4,2) NOT NULL DEFAULT 0.85,
    limitations JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'reviewed', 'scheduled', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI Operational Recommendation Records (Daily decision-support queue)
CREATE TABLE IF NOT EXISTS ai_recommendation_records (
    id TEXT PRIMARY KEY,
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
        'critical_investigation',
        'hotspot_mitigation',
        'cross_dept_coordination',
        'incomplete_resolution_audit',
        'accessibility_priority',
        'workload_balancing'
    )),
    target_audience TEXT NOT NULL CHECK (target_audience IN ('operations', 'reviewer', 'citizen', 'supervisor', 'admin')),
    title TEXT NOT NULL,
    rationale TEXT NOT NULL,
    supporting_data TEXT NOT NULL,
    impact_if_delayed TEXT,
    suggested_action TEXT NOT NULL,
    confidence NUMERIC(4,2) NOT NULL DEFAULT 0.85,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acted_upon', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. INDEXES FOR PERFORMANCE & FAST LOOKUP
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_ai_analysis_report ON ai_analysis_records(report_id);
CREATE INDEX IF NOT EXISTS idx_infra_rel_a ON infrastructure_relationships(report_id_a);
CREATE INDEX IF NOT EXISTS idx_infra_rel_b ON infrastructure_relationships(report_id_b);
CREATE INDEX IF NOT EXISTS idx_coordination_status ON multi_agency_coordination_plans(status);
CREATE INDEX IF NOT EXISTS idx_coordination_primary_report ON multi_agency_coordination_plans(primary_report_id);
CREATE INDEX IF NOT EXISTS idx_coord_dept_coord_id ON coordination_department_dependencies(coordination_id);
CREATE INDEX IF NOT EXISTS idx_coord_history_coord_id ON coordination_approval_history(coordination_id);
CREATE INDEX IF NOT EXISTS idx_preventive_status ON preventive_action_proposals(status);
CREATE INDEX IF NOT EXISTS idx_ai_rec_status ON ai_recommendation_records(status);

-- ==============================================================================
-- 9. IMMUTABILITY TRIGGER ON COORDINATION AUDIT HISTORY
-- ==============================================================================
CREATE OR REPLACE FUNCTION prevent_coordination_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Coordination audit history records are immutable. UPDATE and DELETE operations are strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_coordination_history ON coordination_approval_history;
CREATE TRIGGER trg_immutable_coordination_history
BEFORE UPDATE OR DELETE ON coordination_approval_history
FOR EACH ROW
EXECUTE FUNCTION prevent_coordination_audit_tampering();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES & PERMISSIONS
-- ==============================================================================
ALTER TABLE ai_analysis_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_agency_coordination_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordination_department_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordination_approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_action_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendation_records ENABLE ROW LEVEL SECURITY;

-- Revoke dangerous direct modifications from anon/public
REVOKE UPDATE, DELETE, TRUNCATE ON coordination_approval_history FROM anon, authenticated, public;

-- A. ai_analysis_records RLS
-- Anyone can read AI analysis for public civic reports
CREATE POLICY "Public read AI analysis records"
ON ai_analysis_records
FOR SELECT
TO anon, authenticated, public
USING (true);

-- Municipal staff / service role can insert or update AI analysis
CREATE POLICY "Staff manage AI analysis records"
ON ai_analysis_records
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'reviewer', 'supervisor', 'staff')
  OR auth.role() = 'service_role'
);

-- B. infrastructure_relationships RLS
CREATE POLICY "Public read infrastructure relationships"
ON infrastructure_relationships
FOR SELECT
TO anon, authenticated, public
USING (true);

CREATE POLICY "Staff manage infrastructure relationships"
ON infrastructure_relationships
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'reviewer', 'supervisor', 'staff')
  OR auth.role() = 'service_role'
);

-- C. multi_agency_coordination_plans RLS
-- Citizens can read Approved or Completed plans for transparency
CREATE POLICY "Public read approved coordination plans"
ON multi_agency_coordination_plans
FOR SELECT
TO anon, authenticated, public
USING (status IN ('Approved', 'Planning', 'In Progress', 'Completed'));

-- Municipal personnel can inspect all plans including pending AI proposals
CREATE POLICY "Staff inspect all coordination plans"
ON multi_agency_coordination_plans
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'reviewer', 'supervisor', 'staff')
);

-- Supervisors and Admins can create, approve, and modify plans
CREATE POLICY "Supervisors manage coordination plans"
ON multi_agency_coordination_plans
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'supervisor')
  OR auth.role() = 'service_role'
);

-- D. coordination_department_dependencies RLS
CREATE POLICY "Public read department dependencies"
ON coordination_department_dependencies
FOR SELECT
TO anon, authenticated, public
USING (true);

CREATE POLICY "Staff manage department dependencies"
ON coordination_department_dependencies
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'supervisor', 'staff')
  OR auth.role() = 'service_role'
);

-- E. coordination_approval_history RLS
CREATE POLICY "Public read coordination history"
ON coordination_approval_history
FOR SELECT
TO anon, authenticated, public
USING (true);

CREATE POLICY "Staff insert coordination history"
ON coordination_approval_history
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' IN ('admin', 'reviewer', 'supervisor', 'staff')
  OR auth.role() = 'service_role'
);

-- F. preventive_action_proposals RLS
CREATE POLICY "Public read preventive proposals"
ON preventive_action_proposals
FOR SELECT
TO anon, authenticated, public
USING (true);

CREATE POLICY "Staff manage preventive proposals"
ON preventive_action_proposals
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'supervisor', 'reviewer')
  OR auth.role() = 'service_role'
);

-- G. ai_recommendation_records RLS
CREATE POLICY "Public read ai recommendations"
ON ai_recommendation_records
FOR SELECT
TO anon, authenticated, public
USING (true);

CREATE POLICY "Staff manage ai recommendations"
ON ai_recommendation_records
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'supervisor', 'reviewer', 'staff')
  OR auth.role() = 'service_role'
);
