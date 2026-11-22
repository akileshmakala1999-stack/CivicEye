-- ==============================================================================
-- CIVICEYE MIGRATION: 20261122000012_phase12_3_1_strict_role_field_authorization_and_community_validation.sql
-- PHASE 12.3.1: Strict Role-Based Field Authorization, AI Default-Deny & Community Validation Integrity
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. RECONSTRUCT REPORT FIELD AUTHORIZATION TRIGGER
-- Replaces naive "IF NOT v_is_staff" bypass with granular role-specific field matrix:
-- Roles: citizen, staff (field staff), reviewer, supervisor, admin.
-- Immutable across all roles: reporter_id, ticket_number, created_at.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_report_field_authorization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_operator_role VARCHAR(32);
    v_uid UUID;
BEGIN
    -- Service role bypass for scheduled maintenance or migrations
    IF auth.role() = 'service_role' THEN
        NEW.version := COALESCE(OLD.version, 1) + 1;
        NEW.updated_at := NOW();
        RETURN NEW;
    END IF;

    v_uid := auth.uid();
    v_operator_role := public.get_authenticated_staff_role();

    -- IMMUTABLE SYSTEM COLUMNS (Protected from all roles including Admin)
    IF NEW.reporter_id IS DISTINCT FROM OLD.reporter_id THEN
        RAISE EXCEPTION 'Security Policy Violation: Report ownership (reporter_id) is immutable.';
    END IF;

    IF NEW.ticket_number IS DISTINCT FROM OLD.ticket_number THEN
        RAISE EXCEPTION 'Security Policy Violation: Municipal tracking ticket number (ticket_number) is immutable.';
    END IF;

    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Security Policy Violation: Initial submission timestamp (created_at) is immutable.';
    END IF;

    -- =========================================================================
    -- ROLE 1: CITIZEN / UNVERIFIED USER
    -- =========================================================================
    IF v_operator_role IS NULL OR v_operator_role = 'citizen' THEN
        -- Ownership validation: Must be original citizen reporter
        IF OLD.reporter_id IS NOT NULL AND (v_uid IS NULL OR OLD.reporter_id != v_uid) THEN
            RAISE EXCEPTION 'Security Policy Violation: Citizens cannot modify reports submitted by other residents.';
        END IF;

        -- Status boundary: Citizen edits permitted only in initial Submitted phase
        IF OLD.status != 'Submitted' THEN
            RAISE EXCEPTION 'Security Policy Violation: Reports already under review or dispatched cannot be edited by citizens.';
        END IF;

        -- FORBIDDEN FIELD: Status
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Unauthorized Column Modification: Citizens cannot alter report status directly. Municipal workflow transitions require staff authorization.';
        END IF;

        -- FORBIDDEN FIELD: Severity / Priority
        IF NEW.severity IS DISTINCT FROM OLD.severity THEN
            RAISE EXCEPTION 'Unauthorized Column Modification: Citizens cannot alter priority or severity level directly.';
        END IF;

        -- FORBIDDEN FIELD: Department Assigned
        IF NEW.department_assigned IS DISTINCT FROM OLD.department_assigned THEN
            RAISE EXCEPTION 'Unauthorized Column Modification: Citizens cannot alter municipal department jurisdictions.';
        END IF;

        -- FORBIDDEN FIELD: Handling Officer
        IF NEW.handling_officer IS DISTINCT FROM OLD.handling_officer THEN
            RAISE EXCEPTION 'Unauthorized Column Modification: Citizens cannot assign or modify municipal handling officers.';
        END IF;

        -- FORBIDDEN FIELD: Confirmations Count
        IF NEW.confirmations_count IS DISTINCT FROM OLD.confirmations_count THEN
            RAISE EXCEPTION 'Unauthorized Column Modification: Citizens cannot directly overwrite confirmations count. Use rpc_increment_report_confirmation().';
        END IF;

        -- FORBIDDEN FIELDS: Community Validation Counters
        IF NEW.still_exists_count IS DISTINCT FROM OLD.still_exists_count OR
           NEW.getting_worse_count IS DISTINCT FROM OLD.getting_worse_count OR
           NEW.appears_fixed_count IS DISTINCT FROM OLD.appears_fixed_count THEN
            RAISE EXCEPTION 'Unauthorized Column Modification: Direct counter manipulation is forbidden. Submit validation actions via community_validations.';
        END IF;

        -- FORBIDDEN FIELDS: Internal Notes
        IF NEW.internal_notes IS DISTINCT FROM OLD.internal_notes THEN
            RAISE EXCEPTION 'Unauthorized Column Modification: Citizens cannot access or modify internal municipal notes.';
        END IF;

    -- =========================================================================
    -- ROLE 2: FIELD STAFF (OPERATIONAL WORKER)
    -- =========================================================================
    ELSIF v_operator_role = 'staff' THEN
        -- Field staff cannot change severity (triaged by reviewers/supervisors)
        IF NEW.severity IS DISTINCT FROM OLD.severity THEN
            RAISE EXCEPTION 'Unauthorized: Operational field staff cannot alter report severity. Supervisor triage required.';
        END IF;

        -- Field staff cannot reassign department jurisdiction
        IF NEW.department_assigned IS DISTINCT FROM OLD.department_assigned THEN
            RAISE EXCEPTION 'Unauthorized: Operational field staff cannot reassign departmental jurisdiction.';
        END IF;

        -- Field staff cannot directly mark a report 'Resolved' (must submit work order completion for supervisor sign-off)
        IF NEW.status = 'Resolved' AND OLD.status != 'Resolved' THEN
            RAISE EXCEPTION 'Unauthorized: Field staff cannot mark reports Resolved directly. Completion sign-off requires supervisor approval via rpc_approve_completion().';
        END IF;

        -- Field staff cannot manipulate confirmation / community validation counters
        IF NEW.confirmations_count IS DISTINCT FROM OLD.confirmations_count OR
           NEW.still_exists_count IS DISTINCT FROM OLD.still_exists_count OR
           NEW.getting_worse_count IS DISTINCT FROM OLD.getting_worse_count OR
           NEW.appears_fixed_count IS DISTINCT FROM OLD.appears_fixed_count THEN
            RAISE EXCEPTION 'Unauthorized: Operational staff cannot alter citizen validation counters.';
        END IF;

    -- =========================================================================
    -- ROLE 3: REVIEWER (INTAKE & TRIAGE)
    -- =========================================================================
    ELSIF v_operator_role = 'reviewer' THEN
        -- Reviewers cannot mark report 'Resolved' directly (supervisor approval required)
        IF NEW.status = 'Resolved' AND OLD.status != 'Resolved' THEN
            RAISE EXCEPTION 'Unauthorized: Municipal reviewers cannot mark reports Resolved. Supervisor inspection sign-off required.';
        END IF;

        -- Reviewers cannot alter citizen validation counters
        IF NEW.confirmations_count IS DISTINCT FROM OLD.confirmations_count OR
           NEW.still_exists_count IS DISTINCT FROM OLD.still_exists_count OR
           NEW.getting_worse_count IS DISTINCT FROM OLD.getting_worse_count OR
           NEW.appears_fixed_count IS DISTINCT FROM OLD.appears_fixed_count THEN
            RAISE EXCEPTION 'Unauthorized: Reviewers cannot alter citizen validation counters.';
        END IF;

    -- =========================================================================
    -- ROLE 4 & 5: SUPERVISOR & ADMINISTRATOR
    -- =========================================================================
    ELSIF v_operator_role IN ('supervisor', 'admin') THEN
        -- Supervisors & Admins have workflow authority, but cannot alter citizen validation counters directly
        IF NEW.confirmations_count IS DISTINCT FROM OLD.confirmations_count OR
           NEW.still_exists_count IS DISTINCT FROM OLD.still_exists_count OR
           NEW.getting_worse_count IS DISTINCT FROM OLD.getting_worse_count OR
           NEW.appears_fixed_count IS DISTINCT FROM OLD.appears_fixed_count THEN
            RAISE EXCEPTION 'Unauthorized: Direct manipulation of citizen community validation totals is forbidden.';
        END IF;

    ELSE
        RAISE EXCEPTION 'Security Policy Violation: Unrecognized role "%". Authorization failed closed.', v_operator_role;
    END IF;

    -- Concurrency Version Control
    NEW.version := COALESCE(OLD.version, 1) + 1;
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_report_field_authorization ON public.reports;
CREATE TRIGGER trg_enforce_report_field_authorization
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_report_field_authorization();

-- ------------------------------------------------------------------------------
-- 2. RECONSTRUCT WORK ORDER FIELD AUTHORIZATION TRIGGER
-- Enforces role-specific restrictions on work orders:
-- Field staff cannot self-approve completion; reviewers cannot sign off; citizens blocked.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_work_order_field_authorization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_operator_role VARCHAR(32);
    v_uid UUID;
BEGIN
    IF auth.role() = 'service_role' THEN
        NEW.updated_at := NOW();
        RETURN NEW;
    END IF;

    v_uid := auth.uid();
    v_operator_role := public.get_authenticated_staff_role();

    -- Strict rejection for citizens and unverified callers
    IF v_operator_role IS NULL OR v_operator_role = 'citizen' THEN
        RAISE EXCEPTION 'Security Policy Violation: Citizens cannot perform mutations on municipal work orders.';
    END IF;

    -- IMMUTABLE WORK ORDER COLUMNS
    IF NEW.report_id IS DISTINCT FROM OLD.report_id THEN
        RAISE EXCEPTION 'Security Policy Violation: Work order linkage to report_id is immutable.';
    END IF;

    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Security Policy Violation: Work order creation timestamp is immutable.';
    END IF;

    -- =========================================================================
    -- FIELD STAFF RESTRICTIONS
    -- =========================================================================
    IF v_operator_role = 'staff' THEN
        -- Cannot sign off on supervisor approval
        IF NEW.supervisor_approved IS DISTINCT FROM OLD.supervisor_approved THEN
            RAISE EXCEPTION 'Unauthorized: Operational field staff cannot sign off on supervisor approval.';
        END IF;

        -- Cannot mark status Completed or Returned for Rework directly
        IF NEW.status IN ('Completed', 'Returned for Rework') AND NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Unauthorized: Field staff cannot mark work orders Completed directly. Supervisor sign-off required via rpc_approve_completion().';
        END IF;

        -- Cannot alter priority or SLA targets
        IF NEW.priority IS DISTINCT FROM OLD.priority THEN
            RAISE EXCEPTION 'Unauthorized: Operational field staff cannot alter work order priority.';
        END IF;

        IF NEW.sla_target_hours IS DISTINCT FROM OLD.sla_target_hours OR
           NEW.sla_deadline_timestamp IS DISTINCT FROM OLD.sla_deadline_timestamp THEN
            RAISE EXCEPTION 'Unauthorized: Operational field staff cannot modify SLA deadlines.';
        END IF;

        -- Cannot reassign department or staff slot
        IF NEW.assigned_department IS DISTINCT FROM OLD.assigned_department OR
           NEW.assigned_staff_id IS DISTINCT FROM OLD.assigned_staff_id THEN
            RAISE EXCEPTION 'Unauthorized: Operational field staff cannot reassign work orders to other teams or staff.';
        END IF;

    -- =========================================================================
    -- REVIEWER RESTRICTIONS
    -- =========================================================================
    ELSIF v_operator_role = 'reviewer' THEN
        -- Reviewers cannot approve completion or mark rework (supervisor only)
        IF NEW.status IN ('Completed', 'Returned for Rework') AND NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Unauthorized: Municipal reviewers cannot mark work orders Completed or Returned for Rework. Supervisor sign-off required.';
        END IF;

        IF NEW.supervisor_approved IS DISTINCT FROM OLD.supervisor_approved THEN
            RAISE EXCEPTION 'Unauthorized: Only supervisors can sign off on work order completion.';
        END IF;

    -- =========================================================================
    -- SUPERVISOR & ADMIN
    -- =========================================================================
    ELSIF v_operator_role IN ('supervisor', 'admin') THEN
        -- Supervisors & Admins have full operational authority over work orders
        NULL;
    ELSE
        RAISE EXCEPTION 'Security Policy Violation: Unrecognized role "%". Authorization failed closed.', v_operator_role;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_work_order_field_authorization ON public.work_orders;
CREATE TRIGGER trg_enforce_work_order_field_authorization
    BEFORE UPDATE ON public.work_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_work_order_field_authorization();

-- ------------------------------------------------------------------------------
-- 3. COMMUNITY VALIDATION INTEGRITY & DUPLICATE VOTE PREVENTION
-- ------------------------------------------------------------------------------
-- Ensure unique citizen validation per report (prevent duplicate votes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'community_validations' AND constraint_name = 'unique_citizen_report_validation'
    ) THEN
        ALTER TABLE public.community_validations
        DROP CONSTRAINT IF EXISTS unique_user_report_action;

        ALTER TABLE public.community_validations
        ADD CONSTRAINT unique_citizen_report_validation UNIQUE (report_id, user_id);
    END IF;
END $$;

-- Add idempotency_key column if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'community_validations' AND column_name = 'idempotency_key'
    ) THEN
        ALTER TABLE public.community_validations ADD COLUMN idempotency_key VARCHAR(128);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_community_validations_idempotency ON public.community_validations(idempotency_key) WHERE idempotency_key IS NOT NULL;
    END IF;
END $$;

-- Drop insecure public RLS policy on community_validations
DROP POLICY IF EXISTS "Public insert/update community validations" ON public.community_validations;
DROP POLICY IF EXISTS "Public read community validations" ON public.community_validations;
DROP POLICY IF EXISTS "Authenticated Insert Community Validation" ON public.community_validations;
DROP POLICY IF EXISTS "Authenticated Update Community Validation" ON public.community_validations;
DROP POLICY IF EXISTS "Authenticated Delete Community Validation" ON public.community_validations;

-- Secure RLS Policies:
-- Read: Public can read community validations
CREATE POLICY "Public read community validations"
    ON public.community_validations FOR SELECT USING (true);

-- Insert: Authenticated citizens can only insert validations for their own user_id
CREATE POLICY "Authenticated Insert Community Validation"
    ON public.community_validations FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.uid() IS NOT NULL AND auth.uid()::text = user_id)
    );

-- Update: Authenticated citizens can only update their own validation (e.g. changing from still_exists to appears_fixed)
CREATE POLICY "Authenticated Update Community Validation"
    ON public.community_validations FOR UPDATE
    USING (
        auth.role() = 'service_role' OR
        (auth.uid() IS NOT NULL AND auth.uid()::text = user_id)
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.uid() IS NOT NULL AND auth.uid()::text = user_id)
    );

-- Delete: Authenticated citizens can only withdraw their own validation
CREATE POLICY "Authenticated Delete Community Validation"
    ON public.community_validations FOR DELETE
    USING (
        auth.role() = 'service_role' OR
        (auth.uid() IS NOT NULL AND auth.uid()::text = user_id)
    );

-- Community validation integrity trigger
CREATE OR REPLACE FUNCTION public.enforce_community_validation_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Prevent altering vote ownership
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION 'Security Policy Violation: Community validation ownership cannot be transferred.';
    END IF;

    -- Prevent altering report linkage
    IF NEW.report_id IS DISTINCT FROM OLD.report_id THEN
        RAISE EXCEPTION 'Security Policy Violation: Community validation report linkage cannot be altered.';
    END IF;

    -- Enforce valid action types
    IF NEW.action NOT IN ('still_exists', 'getting_worse', 'appears_fixed', 'incorrect_report') THEN
        RAISE EXCEPTION 'Validation Error: Invalid community validation action "%".', NEW.action;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_community_validation_integrity ON public.community_validations;
CREATE TRIGGER trg_enforce_community_validation_integrity
    BEFORE UPDATE ON public.community_validations
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_community_validation_integrity();

-- ------------------------------------------------------------------------------
-- 4. CITIZEN CONFIRMATION TRACKING TABLE & DUPLICATE PREVENTION
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.report_confirmations (
    report_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(128) NOT NULL,
    confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (report_id, user_id)
);

ALTER TABLE public.report_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read confirmations" ON public.report_confirmations;
CREATE POLICY "Public read confirmations"
    ON public.report_confirmations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated insert confirmations" ON public.report_confirmations;
CREATE POLICY "Authenticated insert confirmations"
    ON public.report_confirmations FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.uid() IS NOT NULL AND auth.uid()::text = user_id)
    );

-- Hardened rpc_increment_report_confirmation with duplicate prevention
CREATE OR REPLACE FUNCTION public.rpc_increment_report_confirmation(
    p_report_id TEXT,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_updated_count INT;
    v_status VARCHAR(32);
    v_uid UUID;
    v_user_id_str VARCHAR(128);
BEGIN
    v_uid := auth.uid();
    v_user_id_str := COALESCE(v_uid::TEXT, 'anon-' || COALESCE(p_idempotency_key, gen_random_uuid()::TEXT));

    SELECT status INTO v_status FROM public.reports WHERE id = p_report_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report not found.';
    END IF;

    IF v_status = 'Resolved' THEN
        RAISE EXCEPTION 'Invalid Action: Cannot add community confirmations to an already resolved report.';
    END IF;

    -- Duplicate Vote Prevention: Check if this user has already confirmed this report
    IF EXISTS (
        SELECT 1 FROM public.report_confirmations
        WHERE report_id = p_report_id AND user_id = v_user_id_str
    ) THEN
        -- Idempotent return: do not increment count again
        SELECT confirmations_count INTO v_updated_count FROM public.reports WHERE id = p_report_id;
        RETURN jsonb_build_object(
            'success', true,
            'reportId', p_report_id,
            'confirmationsCount', v_updated_count,
            'alreadyConfirmed', true,
            'message', 'User has already confirmed this report. Count unchanged.'
        );
    END IF;

    -- Record confirmation
    INSERT INTO public.report_confirmations (report_id, user_id, confirmed_at)
    VALUES (p_report_id, v_user_id_str, NOW())
    ON CONFLICT (report_id, user_id) DO NOTHING;

    UPDATE public.reports
    SET confirmations_count = COALESCE(confirmations_count, 0) + 1,
        updated_at = NOW()
    WHERE id = p_report_id
    RETURNING confirmations_count INTO v_updated_count;

    RETURN jsonb_build_object(
        'success', true,
        'reportId', p_report_id,
        'confirmationsCount', v_updated_count,
        'alreadyConfirmed', false
    );
END;
$$;

-- Grant execute on confirmation RPC to authenticated and anon
GRANT EXECUTE ON FUNCTION public.rpc_increment_report_confirmation(TEXT, TEXT) TO anon, authenticated, service_role;
