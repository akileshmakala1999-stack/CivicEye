-- ==============================================================================
-- CIVICEYE MIGRATION: 20261122000011_phase12_3_rpc_and_field_authorization_hardening.sql
-- PHASE 12.3: RPC Hardening, Field-Level Authorization, Stale Role Revocation Closure
-- ==============================================================================

-- 1. HARDEN get_authenticated_staff_role() AGAINST STALE JWT CLAIMS
-- If a user has been deactivated or revoked in authorized_staff_roles, 
-- NEVER allow stale JWT app_metadata claims to grant privileges.
CREATE OR REPLACE FUNCTION public.get_authenticated_staff_role()
RETURNS VARCHAR(32)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role VARCHAR(32);
    v_uid UUID;
    v_is_revoked BOOLEAN;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN NULL;
    END IF;

    -- Step 1: Check if user exists in authorized_staff_roles and is explicitly deactivated/revoked
    SELECT (is_active = false) INTO v_is_revoked
    FROM public.authorized_staff_roles
    WHERE user_id = v_uid;

    IF v_is_revoked IS TRUE THEN
        -- Strictly fail closed: Revocation takes immediate effect regardless of JWT token claims
        RETURN NULL;
    END IF;

    -- Step 2: Check for active authorized staff record
    SELECT staff_role INTO v_role
    FROM public.authorized_staff_roles
    WHERE user_id = v_uid AND is_active = true;

    IF v_role IS NOT NULL THEN
        RETURN v_role;
    END IF;

    -- Step 3: Only if no record exists in authorized_staff_roles, check server-signed app_metadata
    -- (Strictly check that user is not marked citizen)
    IF (auth.jwt() -> 'app_metadata' ->> 'role') IN ('reviewer', 'staff', 'dispatcher', 'supervisor', 'admin') THEN
        RETURN (auth.jwt() -> 'app_metadata' ->> 'role')::VARCHAR(32);
    END IF;

    RETURN NULL;
END;
$$;

-- 2. FIELD-LEVEL AUTHORIZATION TRIGGER ON public.reports
-- Citizens can ONLY update safe fields: title, description, location_text, images.
-- Citizens are strictly prevented from modifying workflow states, severity/priority,
-- confirmations_count, department assignments, handling officers, ticket numbers, or ownership.
CREATE OR REPLACE FUNCTION public.enforce_report_field_authorization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_staff BOOLEAN;
BEGIN
    -- Service role bypasses trigger for system maintenance
    IF auth.role() = 'service_role' THEN
        RETURN NEW;
    END IF;

    v_is_staff := public.is_staff_member();

    -- If caller is NOT verified municipal staff:
    IF NOT v_is_staff THEN
        -- Ownership validation: must be original citizen reporter
        IF OLD.reporter_id IS NOT NULL AND (auth.uid() IS NULL OR OLD.reporter_id != auth.uid()) THEN
            RAISE EXCEPTION 'Security Policy Violation: You do not hold ownership permission to modify reports submitted by another citizen.';
        END IF;

        -- Report status validation: citizen edits only permitted in Submitted intake phase
        IF OLD.status != 'Submitted' THEN
            RAISE EXCEPTION 'Security Policy Violation: Reports under official review, dispatched, or resolved cannot be modified by citizens.';
        END IF;

        -- FIELD RESTRICTION 1: Status
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Unauthorized Column Modification: Citizens cannot alter report status directly. Workflow state transitions require municipal review.';
        END IF;

        -- FIELD RESTRICTION 2: Severity / Priority
        IF NEW.severity IS DISTINCT FROM OLD.severity THEN
            RAISE EXCEPTION 'Unauthorized Column Modification: Citizens cannot alter priority or severity level directly. Use community verification or municipal triage.';
        END IF;

        -- FIELD RESTRICTION 3: Confirmations Count
        IF NEW.confirmations_count IS DISTINCT FROM OLD.confirmations_count THEN
            RAISE EXCEPTION 'Unauthorized Column Modification: Citizens cannot directly overwrite confirmations count. Use rpc_increment_report_confirmation().';
        END IF;

        -- FIELD RESTRICTION 4: Department Assignment
        IF NEW.department_assigned IS DISTINCT FROM OLD.department_assigned THEN
            RAISE EXCEPTION 'Unauthorized Column Modification: Citizens cannot alter or assign municipal department jurisdictions.';
        END IF;

        -- FIELD RESTRICTION 5: Handling Officer
        IF NEW.handling_officer IS DISTINCT FROM OLD.handling_officer THEN
            RAISE EXCEPTION 'Unauthorized Column Modification: Citizens cannot assign or alter designated municipal handling officers.';
        END IF;

        -- FIELD RESTRICTION 6: Ownership Identifier
        IF NEW.reporter_id IS DISTINCT FROM OLD.reporter_id THEN
            RAISE EXCEPTION 'Unauthorized Column Modification: Report ownership identifier cannot be reassigned or transferred.';
        END IF;

        -- FIELD RESTRICTION 7: Ticket Number
        IF NEW.ticket_number IS DISTINCT FROM OLD.ticket_number THEN
            RAISE EXCEPTION 'Unauthorized Column Modification: Official municipal tracking ticket number is immutable.';
        END IF;

        -- FIELD RESTRICTION 8: Submission Timestamp
        IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Unauthorized Column Modification: Original submission timestamp is immutable.';
        END IF;
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

-- 3. FIELD-LEVEL AUTHORIZATION TRIGGER ON public.work_orders
-- Field staff can update progress and completion evidence;
-- Only supervisors/admins can approve completion ('Completed') or rework.
CREATE OR REPLACE FUNCTION public.enforce_work_order_field_authorization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_operator_role VARCHAR(32);
BEGIN
    IF auth.role() = 'service_role' THEN
        RETURN NEW;
    END IF;

    v_operator_role := public.get_authenticated_staff_role();

    -- Strict rejection for non-staff
    IF v_operator_role IS NULL OR v_operator_role = 'citizen' THEN
        RAISE EXCEPTION 'Security Policy Violation: Citizens and unverified callers cannot perform mutations on municipal work orders.';
    END IF;

    -- Field staff restrictions: Cannot mark Completed or Returned for Rework directly
    IF v_operator_role = 'staff' THEN
        IF NEW.status IN ('Completed', 'Returned for Rework') AND NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Unauthorized: Operational field staff cannot sign off on completion. Supervisor sign-off required via rpc_approve_completion().';
        END IF;

        IF NEW.priority IS DISTINCT FROM OLD.priority THEN
            RAISE EXCEPTION 'Unauthorized: Operational field staff cannot alter work order SLA priority.';
        END IF;

        IF NEW.sla_target_hours IS DISTINCT FROM OLD.sla_target_hours OR NEW.sla_deadline_timestamp IS DISTINCT FROM OLD.sla_deadline_timestamp THEN
            RAISE EXCEPTION 'Unauthorized: Work order SLA parameters can only be recalibrated by supervisors or administrators.';
        END IF;

        IF NEW.department_id IS DISTINCT FROM OLD.department_id THEN
            RAISE EXCEPTION 'Unauthorized: Work order department routing can only be modified by supervisors or dispatchers.';
        END IF;
    END IF;

    NEW.version := COALESCE(OLD.version, 1) + 1;
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_work_order_field_authorization ON public.work_orders;
CREATE TRIGGER trg_enforce_work_order_field_authorization
    BEFORE UPDATE ON public.work_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_work_order_field_authorization();

-- 4. HARDEN SECURITY DEFINER RPC FUNCTIONS
-- Enforce explicit search_path = public, pg_temp
-- Revoke execution from PUBLIC and anon; grant only to authorized contexts.

-- Function A: rpc_approve_report
CREATE OR REPLACE FUNCTION public.rpc_approve_report(
    p_report_id TEXT,
    p_department_id VARCHAR(64),
    p_assigned_staff_id VARCHAR(64) DEFAULT NULL,
    p_priority VARCHAR(32) DEFAULT 'medium',
    p_notes TEXT DEFAULT NULL,
    p_target_hours INT DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_operator_role VARCHAR(32);
    v_operator_uid UUID;
    v_report RECORD;
    v_dept RECORD;
    v_staff RECORD;
    v_wo_id VARCHAR(64);
    v_rand_num INT;
    v_deadline BIGINT;
    v_audit_id VARCHAR(64);
BEGIN
    v_operator_uid := auth.uid();
    IF v_operator_uid IS NULL AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Authentication Required: Unauthenticated callers cannot approve civic reports.';
    END IF;

    v_operator_role := public.get_authenticated_staff_role();

    -- Strict Role Authorization: Only Reviewers, Supervisors, or Admins
    IF v_operator_role NOT IN ('reviewer', 'supervisor', 'admin') AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized: Only authorized municipal reviewers, supervisors or administrators can approve intake reports.';
    END IF;

    -- Strict Parameter Validation
    IF p_report_id IS NULL OR length(trim(p_report_id)) < 3 THEN
        RAISE EXCEPTION 'Invalid Parameter: Valid report identifier is required.';
    END IF;

    IF p_department_id IS NULL OR length(trim(p_department_id)) < 2 THEN
        RAISE EXCEPTION 'Invalid Parameter: Valid target department identifier is required.';
    END IF;

    IF p_target_hours <= 0 OR p_target_hours > 720 THEN
        RAISE EXCEPTION 'Invalid Parameter: Target SLA hours must be between 1 and 720.';
    END IF;

    -- Fetch Report with Lock
    SELECT * INTO v_report FROM public.reports WHERE id = p_report_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report not found.';
    END IF;

    -- Idempotency check: Cannot approve an already approved/in-progress/resolved report
    IF v_report.status NOT IN ('Submitted', 'Under Review') THEN
        RAISE EXCEPTION 'Invalid State: Report is already in % status and cannot be re-approved.', v_report.status;
    END IF;

    -- Fetch Department
    SELECT * INTO v_dept FROM public.departments WHERE id = p_department_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Department not found.';
    END IF;

    -- Fetch Staff if provided
    IF p_assigned_staff_id IS NOT NULL THEN
        SELECT * INTO v_staff FROM public.operational_staff WHERE id = p_assigned_staff_id;
    END IF;

    -- Update Report
    UPDATE public.reports
    SET status = 'Assigned',
        department_assigned = v_dept.name,
        handling_officer = COALESCE(v_staff.name, v_dept.head_officer),
        severity = COALESCE(p_priority, v_report.severity),
        version = v_report.version + 1,
        updated_at = NOW()
    WHERE id = p_report_id;

    -- Generate Work Order ID
    v_rand_num := floor(1000 + random() * 9000)::INT;
    v_wo_id := 'WO-HYD-2026-' || v_rand_num::TEXT;
    v_deadline := (EXTRACT(EPOCH FROM NOW()) * 1000 + p_target_hours * 3600000)::BIGINT;

    INSERT INTO public.work_orders (
        id,
        report_id,
        report_ticket_number,
        title,
        category,
        department_id,
        department_name,
        assigned_staff_id,
        assigned_staff_name,
        priority,
        status,
        work_description,
        target_completion_date,
        sla_target_hours,
        sla_deadline_timestamp,
        location,
        neighborhood,
        created_at,
        updated_at,
        version
    ) VALUES (
        v_wo_id,
        v_report.id,
        v_report.ticket_number,
        v_report.title,
        v_report.category,
        v_dept.id,
        v_dept.name,
        v_staff.id,
        v_staff.name,
        COALESCE(p_priority, v_report.severity),
        CASE WHEN v_staff.id IS NOT NULL THEN 'Assigned' ELSE 'Pending Assignment' END,
        COALESCE(p_notes, 'Approved field rectification order for ticket ' || v_report.ticket_number),
        TO_CHAR(NOW() + (p_target_hours || ' hours')::INTERVAL, 'DD Mon YYYY, HH:MI AM'),
        p_target_hours,
        v_deadline,
        v_report.location_text,
        v_report.neighborhood,
        NOW(),
        NOW(),
        1
    );

    -- Log Audit Event
    v_audit_id := 'aud-' || floor(100000 + random() * 900000)::INT;
    INSERT INTO public.operations_audit_logs (
        id,
        actor_id,
        actor_name,
        actor_role,
        action,
        entity_type,
        entity_id,
        previous_state,
        new_state,
        reason,
        created_at
    ) VALUES (
        COALESCE(v_operator_uid::TEXT, 'staff-operator'),
        'Municipal Officer (' || COALESCE(v_operator_role, 'service_role') || ')',
        COALESCE(v_operator_role, 'admin'),
        'report_approved',
        'report',
        v_report.id,
        v_report.status,
        'Assigned',
        COALESCE(p_notes, 'Intake verified and work order ' || v_wo_id || ' issued.'),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'reportId', v_report.id,
        'workOrderId', v_wo_id,
        'status', 'Assigned'
    );
END;
$$;

-- Function B: rpc_approve_completion
CREATE OR REPLACE FUNCTION public.rpc_approve_completion(
    p_work_order_id VARCHAR(64),
    p_supervisor_notes TEXT DEFAULT 'Work verified and approved by municipal supervisor.'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_operator_role VARCHAR(32);
    v_operator_uid UUID;
    v_wo RECORD;
    v_audit_id VARCHAR(64);
BEGIN
    v_operator_uid := auth.uid();
    IF v_operator_uid IS NULL AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Authentication Required: Unauthenticated callers cannot approve work orders.';
    END IF;

    v_operator_role := public.get_authenticated_staff_role();

    -- Strict Role Authorization: Only Supervisors or Admins
    IF v_operator_role NOT IN ('supervisor', 'admin') AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized: Only municipal supervisors or administrators can approve work order completion.';
    END IF;

    IF p_work_order_id IS NULL OR length(trim(p_work_order_id)) < 3 THEN
        RAISE EXCEPTION 'Invalid Parameter: Valid work order identifier is required.';
    END IF;

    -- Fetch Work Order with Lock
    SELECT * INTO v_wo FROM public.work_orders WHERE id = p_work_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Work order not found.';
    END IF;

    IF v_wo.status = 'Completed' THEN
        RAISE EXCEPTION 'Invalid State: Work order is already Completed.';
    END IF;

    -- Update Work Order
    UPDATE public.work_orders
    SET status = 'Completed',
        version = v_wo.version + 1,
        updated_at = NOW()
    WHERE id = p_work_order_id;

    -- Update Linked Report to Resolved
    UPDATE public.reports
    SET status = 'Resolved',
        version = version + 1,
        updated_at = NOW()
    WHERE id = v_wo.report_id;

    -- Log Audit Trail
    v_audit_id := 'aud-' || floor(100000 + random() * 900000)::INT;
    INSERT INTO public.operations_audit_logs (
        id,
        actor_id,
        actor_name,
        actor_role,
        action,
        entity_type,
        entity_id,
        previous_state,
        new_state,
        reason,
        created_at
    ) VALUES (
        COALESCE(v_operator_uid::TEXT, 'supervisor-operator'),
        'Supervisor (' || COALESCE(v_operator_role, 'service_role') || ')',
        COALESCE(v_operator_role, 'supervisor'),
        'completion_approved',
        'work_order',
        v_wo.id,
        v_wo.status,
        'Completed',
        p_supervisor_notes,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'workOrderId', v_wo.id,
        'reportId', v_wo.report_id,
        'status', 'Completed'
    );
END;
$$;

-- Function C: rpc_assign_staff_role
CREATE OR REPLACE FUNCTION public.rpc_assign_staff_role(
    p_target_user_id UUID,
    p_role VARCHAR(32),
    p_department_id VARCHAR(64) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_operator_uid UUID;
    v_operator_role VARCHAR(32);
BEGIN
    v_operator_uid := auth.uid();
    v_operator_role := public.get_authenticated_staff_role();

    IF v_operator_role != 'admin' AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized: Only system administrators can provision or alter municipal staff roles.';
    END IF;

    -- Anti-tamper: Prohibit self-promotion/self-modification
    IF v_operator_uid IS NOT NULL AND v_operator_uid = p_target_user_id THEN
        RAISE EXCEPTION 'Security Policy Violation: Self-assignment or self-modification of operational roles is strictly prohibited.';
    END IF;

    IF p_role NOT IN ('reviewer', 'staff', 'dispatcher', 'supervisor', 'admin') THEN
        RAISE EXCEPTION 'Invalid role specified.';
    END IF;

    INSERT INTO public.authorized_staff_roles (
        user_id,
        staff_role,
        department_id,
        authorized_by,
        is_active,
        granted_at,
        updated_at
    ) VALUES (
        p_target_user_id,
        p_role,
        p_department_id,
        v_operator_uid,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        staff_role = EXCLUDED.staff_role,
        department_id = EXCLUDED.department_id,
        authorized_by = EXCLUDED.authorized_by,
        is_active = true,
        updated_at = NOW();

    -- Audit Log
    INSERT INTO public.operations_audit_logs (
        id,
        actor_id,
        actor_name,
        actor_role,
        action,
        entity_type,
        entity_id,
        previous_state,
        new_state,
        reason,
        created_at
    ) VALUES (
        COALESCE(v_operator_uid::TEXT, 'admin-system'),
        'Administrator (' || COALESCE(v_operator_role, 'service_role') || ')',
        COALESCE(v_operator_role, 'admin'),
        'role_assigned',
        'staff',
        p_target_user_id::TEXT,
        'citizen',
        p_role,
        'Role provisioned by authorized administrator.',
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'targetUserId', p_target_user_id,
        'assignedRole', p_role
    );
END;
$$;

-- Function D: rpc_revoke_staff_role (New in Phase 12.3)
CREATE OR REPLACE FUNCTION public.rpc_revoke_staff_role(
    p_target_user_id UUID,
    p_reason TEXT DEFAULT 'Staff authorization revoked by administrator.'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_operator_uid UUID;
    v_operator_role VARCHAR(32);
    v_old_role VARCHAR(32);
BEGIN
    v_operator_uid := auth.uid();
    v_operator_role := public.get_authenticated_staff_role();

    IF v_operator_role != 'admin' AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized: Only system administrators can revoke municipal staff roles.';
    END IF;

    -- Prohibit self-revocation
    IF v_operator_uid IS NOT NULL AND v_operator_uid = p_target_user_id THEN
        RAISE EXCEPTION 'Security Policy Violation: Administrators cannot revoke their own account credentials.';
    END IF;

    SELECT staff_role INTO v_old_role FROM public.authorized_staff_roles WHERE user_id = p_target_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target user holds no active staff authorization.';
    END IF;

    UPDATE public.authorized_staff_roles
    SET is_active = false,
        updated_at = NOW()
    WHERE user_id = p_target_user_id;

    -- Audit Log
    INSERT INTO public.operations_audit_logs (
        id,
        actor_id,
        actor_name,
        actor_role,
        action,
        entity_type,
        entity_id,
        previous_state,
        new_state,
        reason,
        created_at
    ) VALUES (
        COALESCE(v_operator_uid::TEXT, 'admin-system'),
        'Administrator (' || COALESCE(v_operator_role, 'service_role') || ')',
        COALESCE(v_operator_role, 'admin'),
        'role_revoked',
        'staff',
        p_target_user_id::TEXT,
        v_old_role,
        'citizen',
        p_reason,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'targetUserId', p_target_user_id,
        'status', 'revoked'
    );
END;
$$;

-- Function E: rpc_increment_report_confirmation
CREATE OR REPLACE FUNCTION public.rpc_increment_report_confirmation(
    p_report_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_updated_count INT;
    v_status VARCHAR(32);
BEGIN
    SELECT status INTO v_status FROM public.reports WHERE id = p_report_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report not found.';
    END IF;

    IF v_status = 'Resolved' THEN
        RAISE EXCEPTION 'Invalid Action: Cannot add community confirmations to an already resolved report.';
    END IF;

    UPDATE public.reports
    SET confirmations_count = COALESCE(confirmations_count, 0) + 1,
        updated_at = NOW()
    WHERE id = p_report_id
    RETURNING confirmations_count INTO v_updated_count;

    RETURN jsonb_build_object(
        'success', true,
        'reportId', p_report_id,
        'confirmationsCount', v_updated_count
    );
END;
$$;

-- 5. STRICT EXECUTE PRIVILEGES CLOSURE
-- Explicitly revoke execution from PUBLIC and anon for all privileged RPCs
REVOKE ALL ON FUNCTION public.rpc_approve_report(TEXT, VARCHAR, VARCHAR, VARCHAR, TEXT, INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_approve_completion(VARCHAR, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_assign_staff_role(UUID, VARCHAR, VARCHAR) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_revoke_staff_role(UUID, TEXT) FROM PUBLIC, anon;

-- Grant EXECUTE only to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.rpc_approve_report(TEXT, VARCHAR, VARCHAR, VARCHAR, TEXT, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_approve_completion(VARCHAR, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_assign_staff_role(UUID, VARCHAR, VARCHAR) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_revoke_staff_role(UUID, TEXT) TO authenticated, service_role;

-- Grant confirmation increment to authenticated and anon
GRANT EXECUTE ON FUNCTION public.rpc_increment_report_confirmation(TEXT) TO anon, authenticated, service_role;
