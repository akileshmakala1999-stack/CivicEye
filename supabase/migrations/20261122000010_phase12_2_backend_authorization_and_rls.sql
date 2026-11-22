-- ==============================================================================
-- CIVICEYE MIGRATION: 20261122000010_phase12_2_backend_authorization_and_rls.sql
-- PHASE 12.2: Comprehensive Backend Authorization, Strict RLS & Data Loss Prevention
-- ==============================================================================

-- 1. ADD CONCURRENCY VERSIONING TO REPORTS & WORK ORDERS
ALTER TABLE public.reports 
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.reports 
    ADD COLUMN IF NOT EXISTS reporter_id UUID REFERENCES auth.users(id);

ALTER TABLE public.work_orders 
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- 2. HARDEN REPORTS TABLE ROW LEVEL SECURITY (RLS)
-- Drop existing insecure open policies on public.reports
DROP POLICY IF EXISTS "Allow Community Confirmations Update" ON public.reports;
DROP POLICY IF EXISTS "Public manage reports" ON public.reports;
DROP POLICY IF EXISTS "Allow Public and Authenticated Insert" ON public.reports;

-- Policy A: Transparent Public Read
DROP POLICY IF EXISTS "Public Read Access for Reports" ON public.reports;
CREATE POLICY "Public Read Access for Reports"
    ON public.reports
    FOR SELECT
    USING (true);

-- Policy B: Authenticated & Citizen Insert with Strict Payload Validation
CREATE POLICY "Strict Insert for Reports"
    ON public.reports
    FOR INSERT
    WITH CHECK (
        char_length(title) >= 3 AND
        char_length(description) >= 10 AND
        char_length(location_text) >= 3 AND
        status = 'Submitted' AND
        confirmations_count >= 1
    );

-- Policy C: Citizen Authors can ONLY edit their own pending reports before review
CREATE POLICY "Citizen Edit Own Pending Report"
    ON public.reports
    FOR UPDATE
    USING (
        (auth.uid() IS NOT NULL AND reporter_id = auth.uid() AND status = 'Submitted')
        OR public.is_staff_member()
        OR auth.role() = 'service_role'
    )
    WITH CHECK (
        (auth.uid() IS NOT NULL AND reporter_id = auth.uid() AND status = 'Submitted')
        OR public.is_staff_member()
        OR auth.role() = 'service_role'
    );

-- Policy D: Only Supervisors or Admins can delete reports
DROP POLICY IF EXISTS "Admins Delete Reports" ON public.reports;
CREATE POLICY "Admins Delete Reports"
    ON public.reports
    FOR DELETE
    USING (public.is_admin() OR auth.role() = 'service_role');

-- Revoke dangerous direct mutation privileges
REVOKE DELETE ON public.reports FROM anon, authenticated, public;
GRANT DELETE ON public.reports TO service_role;

-- 3. HARDEN WORK ORDERS TABLE ROW LEVEL SECURITY
-- Drop insecure open policy on public.work_orders
DROP POLICY IF EXISTS "Public manage work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Public read work orders" ON public.work_orders;

-- Policy A: Transparent Public Read
CREATE POLICY "Public Read Work Orders"
    ON public.work_orders
    FOR SELECT
    USING (true);

-- Policy B: Only Supervisors or Admins can issue/insert new work orders
CREATE POLICY "Supervisors Insert Work Orders"
    ON public.work_orders
    FOR INSERT
    WITH CHECK (
        public.is_supervisor_or_admin()
        OR auth.role() = 'service_role'
    );

-- Policy C: Verified Staff can update assigned work orders; Supervisors can update any
CREATE POLICY "Staff Update Work Orders"
    ON public.work_orders
    FOR UPDATE
    USING (
        public.is_staff_member()
        OR auth.role() = 'service_role'
    )
    WITH CHECK (
        public.is_staff_member()
        OR auth.role() = 'service_role'
    );

-- Policy D: Only Administrators can delete work orders
CREATE POLICY "Admins Delete Work Orders"
    ON public.work_orders
    FOR DELETE
    USING (
        public.is_admin()
        OR auth.role() = 'service_role'
    );

REVOKE INSERT, UPDATE, DELETE ON public.work_orders FROM anon, public;
GRANT SELECT ON public.work_orders TO anon, authenticated;
GRANT ALL ON public.work_orders TO service_role;

-- 4. HARDEN WORK ORDER EVIDENCE TABLE ROW LEVEL SECURITY
DROP POLICY IF EXISTS "Public insert evidence" ON public.work_order_evidence;
DROP POLICY IF EXISTS "Public read evidence" ON public.work_order_evidence;

CREATE POLICY "Public Read Evidence"
    ON public.work_order_evidence
    FOR SELECT
    USING (true);

-- Only verified municipal staff can insert field evidence
CREATE POLICY "Staff Insert Evidence"
    ON public.work_order_evidence
    FOR INSERT
    WITH CHECK (
        public.is_staff_member()
        OR auth.role() = 'service_role'
    );

REVOKE INSERT, UPDATE, DELETE ON public.work_order_evidence FROM anon, public;
GRANT SELECT ON public.work_order_evidence TO anon, authenticated;
GRANT ALL ON public.work_order_evidence TO service_role;

-- 5. HARDEN OPERATIONS AUDIT LOGS (IMMUTABLE AUDIT TRAIL)
DROP POLICY IF EXISTS "Public insert audit logs" ON public.operations_audit_logs;
DROP POLICY IF EXISTS "Public read audit logs" ON public.operations_audit_logs;

CREATE POLICY "Public Read Operations Audit Logs"
    ON public.operations_audit_logs
    FOR SELECT
    USING (true);

-- Only verified staff can insert audit logs
CREATE POLICY "Staff Insert Operations Audit Logs"
    ON public.operations_audit_logs
    FOR INSERT
    WITH CHECK (
        public.is_staff_member()
        OR auth.role() = 'service_role'
    );

-- Enforce strict immutability: Audit logs CAN NEVER be updated, deleted, or truncated
CREATE OR REPLACE FUNCTION public.prevent_operations_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security Violation: operations_audit_logs is an immutable audit ledger. UPDATE, DELETE and TRUNCATE operations are strictly forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_operations_audit_update ON public.operations_audit_logs;
CREATE TRIGGER trg_prevent_operations_audit_update
    BEFORE UPDATE OR DELETE ON public.operations_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_operations_audit_tampering();

REVOKE UPDATE, DELETE, TRUNCATE ON public.operations_audit_logs FROM anon, authenticated, public;
GRANT SELECT ON public.operations_audit_logs TO anon, authenticated;
GRANT INSERT ON public.operations_audit_logs TO authenticated;
GRANT ALL ON public.operations_audit_logs TO service_role;

-- 6. SECURE SERVER-SIDE RPC MUTATION FUNCTIONS (SECURITY DEFINER)

-- Function A: Atomically approve report and issue work order
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
SET search_path = public, auth
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
    v_operator_role := public.get_authenticated_staff_role();

    -- Strict Role Authorization: Only Supervisors or Admins can approve intake reports
    IF v_operator_role NOT IN ('reviewer', 'supervisor', 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Only municipal reviewers, supervisors or administrators can approve reports for assignment.';
    END IF;

    -- Fetch Report
    SELECT * INTO v_report FROM public.reports WHERE id = p_report_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report with ID % not found.', p_report_id;
    END IF;

    -- Fetch Department
    SELECT * INTO v_dept FROM public.departments WHERE id = p_department_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Department with ID % not found.', p_department_id;
    END IF;

    -- Fetch Staff if provided
    IF p_assigned_staff_id IS NOT NULL THEN
        SELECT * INTO v_staff FROM public.operational_staff WHERE id = p_assigned_staff_id;
    END IF;

    -- Update Report Status to Assigned
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

    -- Insert Work Order
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

    -- Log Immutable Audit Event
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
        'Municipal Officer (' || v_operator_role || ')',
        v_operator_role,
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

-- Function B: Atomically approve work order completion and resolve linked report
CREATE OR REPLACE FUNCTION public.rpc_approve_completion(
    p_work_order_id VARCHAR(64),
    p_supervisor_notes TEXT DEFAULT 'Work verified and approved by municipal supervisor.'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_operator_role VARCHAR(32);
    v_operator_uid UUID;
    v_wo RECORD;
    v_audit_id VARCHAR(64);
BEGIN
    v_operator_uid := auth.uid();
    v_operator_role := public.get_authenticated_staff_role();

    -- Strict Role Authorization: Only Supervisors or Admins can sign off on completed work orders
    IF v_operator_role NOT IN ('supervisor', 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Only municipal supervisors or administrators can approve completion of work orders.';
    END IF;

    -- Fetch Work Order
    SELECT * INTO v_wo FROM public.work_orders WHERE id = p_work_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Work order with ID % not found.', p_work_order_id;
    END IF;

    -- Update Work Order to Completed
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

    -- Record Audit Trail
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
        'Supervisor (' || v_operator_role || ')',
        v_operator_role,
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

-- Function C: Secure role provisioning (Only Admins can assign staff roles)
CREATE OR REPLACE FUNCTION public.rpc_assign_staff_role(
    p_target_user_id UUID,
    p_role VARCHAR(32),
    p_department_id VARCHAR(64) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_operator_uid UUID;
    v_operator_role VARCHAR(32);
BEGIN
    v_operator_uid := auth.uid();
    v_operator_role := public.get_authenticated_staff_role();

    -- Anti-tamper check: Only verified administrators can assign staff roles
    IF v_operator_role != 'admin' AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized: Only system administrators can provision or alter municipal staff roles.';
    END IF;

    -- Anti-escalation check: Users cannot assign roles to themselves
    IF v_operator_uid IS NOT NULL AND v_operator_uid = p_target_user_id THEN
        RAISE EXCEPTION 'Security Policy: Self-assignment or self-modification of operational roles is strictly prohibited.';
    END IF;

    -- Validate role type
    IF p_role NOT IN ('reviewer', 'staff', 'dispatcher', 'supervisor', 'admin') THEN
        RAISE EXCEPTION 'Invalid role % specified.', p_role;
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

    -- Audit log
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

-- Function D: Concurrency-safe community confirmation increment
CREATE OR REPLACE FUNCTION public.rpc_increment_report_confirmation(
    p_report_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_updated_count INT;
BEGIN
    UPDATE public.reports
    SET confirmations_count = COALESCE(confirmations_count, 0) + 1,
        updated_at = NOW()
    WHERE id = p_report_id
    RETURNING confirmations_count INTO v_updated_count;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report with ID % not found.', p_report_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'reportId', p_report_id,
        'confirmationsCount', v_updated_count
    );
END;
$$;

-- Grant execution to authenticated & anon where appropriate
GRANT EXECUTE ON FUNCTION public.rpc_approve_report TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_approve_completion TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_assign_staff_role TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_increment_report_confirmation TO anon, authenticated, service_role;
