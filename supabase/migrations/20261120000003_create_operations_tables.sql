-- ==============================================================================
-- CIVICEYE MIGRATION: Phase 6 - Municipal Operations & Resolution Management
-- Tables for work orders, department routing, staff tasks, completion evidence,
-- SLA targets, and immutable operations audit trail.
-- ==============================================================================

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(32) NOT NULL,
    description TEXT,
    head_officer VARCHAR(128),
    contact_number VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. OPERATIONAL STAFF TABLE
CREATE TABLE IF NOT EXISTS public.operational_staff (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('staff', 'supervisor', 'reviewer', 'admin')),
    department_id VARCHAR(64) REFERENCES public.departments(id),
    title VARCHAR(128),
    phone VARCHAR(64),
    status VARCHAR(32) DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WORK ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.work_orders (
    id VARCHAR(64) PRIMARY KEY,
    report_id VARCHAR(64) NOT NULL,
    report_ticket_number VARCHAR(64) NOT NULL,
    title VARCHAR(256) NOT NULL,
    category VARCHAR(64) NOT NULL,
    department_id VARCHAR(64) NOT NULL REFERENCES public.departments(id),
    department_name VARCHAR(128) NOT NULL,
    assigned_staff_id VARCHAR(64) REFERENCES public.operational_staff(id),
    assigned_staff_name VARCHAR(128),
    priority VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN (
        'Pending Assignment',
        'Assigned',
        'Accepted',
        'In Progress',
        'Blocked',
        'Submitted for Review',
        'Returned for Rework',
        'Completed',
        'Cancelled'
    )),
    work_description TEXT,
    target_completion_date VARCHAR(64),
    sla_target_hours INT NOT NULL DEFAULT 24,
    sla_deadline_timestamp BIGINT NOT NULL,
    location TEXT,
    neighborhood VARCHAR(64),
    blocked_reason TEXT,
    rework_notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_orders_report ON public.work_orders(report_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_staff ON public.work_orders(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_dept ON public.work_orders(department_id);

-- 4. WORK ORDER PROGRESS NOTES & COMPLETION EVIDENCE TABLE
CREATE TABLE IF NOT EXISTS public.work_order_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id VARCHAR(64) NOT NULL REFERENCES public.work_orders(id),
    evidence_type VARCHAR(32) NOT NULL CHECK (evidence_type IN ('progress_note', 'completion_proof')),
    author_id VARCHAR(64) NOT NULL,
    author_name VARCHAR(128) NOT NULL,
    note TEXT NOT NULL,
    photo_url TEXT,
    materials_used TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_order_evidence_wo ON public.work_order_evidence(work_order_id);

-- 5. OPERATIONS AUDIT LOG (IMMUTABLE AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS public.operations_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(128) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(32) NOT NULL CHECK (entity_type IN ('report', 'work_order')),
    entity_id VARCHAR(64) NOT NULL,
    previous_state VARCHAR(64),
    new_state VARCHAR(64),
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operations_audit_entity ON public.operations_audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_operations_audit_action ON public.operations_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_operations_audit_created ON public.operations_audit_logs(created_at);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Public read staff" ON public.operational_staff FOR SELECT USING (true);
CREATE POLICY "Public read work orders" ON public.work_orders FOR SELECT USING (true);
CREATE POLICY "Public manage work orders" ON public.work_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read evidence" ON public.work_order_evidence FOR SELECT USING (true);
CREATE POLICY "Public insert evidence" ON public.work_order_evidence FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read audit logs" ON public.operations_audit_logs FOR SELECT USING (true);
CREATE POLICY "Public insert audit logs" ON public.operations_audit_logs FOR INSERT WITH CHECK (true);
