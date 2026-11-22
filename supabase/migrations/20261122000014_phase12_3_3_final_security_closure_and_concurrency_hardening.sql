-- ==============================================================================
-- CIVICEYE MIGRATION: PHASE 12.3.3
-- FINAL SECURITY CLOSURE, FAIL-CLOSED QUEUE ISOLATION & CONCURRENCY HARDENING
--
-- 1. Audits & enforces least privilege on public.idempotent_operations
-- 2. Revokes direct INSERT/UPDATE/DELETE/TRUNCATE from anon and authenticated
-- 3. Enforces strict record immutability via trigger trg_enforce_idempotent_operation_immutability
-- 4. Implements per-report row-level locking (SELECT ... FOR UPDATE) in aggregate recalculation
-- 5. Audits and tightens search_path and execution grants across all security-sensitive RPCs
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. LEAST PRIVILEGE AUDIT: public.idempotent_operations
-- ------------------------------------------------------------------------------
-- Revoke all direct modification privileges from anon and authenticated
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.idempotent_operations FROM anon, authenticated, PUBLIC;

-- Only SELECT is permitted for authenticated users (scoped strictly by RLS)
GRANT SELECT ON public.idempotent_operations TO authenticated;

-- Service role retains full maintenance privileges
GRANT ALL ON public.idempotent_operations TO service_role;

-- Drop any previous direct insert policy for authenticated users
DROP POLICY IF EXISTS "Users can insert own idempotent operations" ON public.idempotent_operations;
DROP POLICY IF EXISTS "Public insert idempotent operations" ON public.idempotent_operations;

-- Ensure SELECT policy strictly checks auth.uid()
DROP POLICY IF EXISTS "Users can read own idempotent operations" ON public.idempotent_operations;
CREATE POLICY "Users can read own idempotent operations"
    ON public.idempotent_operations FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        (auth.uid() IS NOT NULL AND auth.uid()::text = user_id)
    );

-- ------------------------------------------------------------------------------
-- 2. IDEMPOTENCY RECORD IMMUTABILITY TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_idempotent_operation_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Prevent changing critical idempotency fields
        IF NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key OR
           NEW.user_id IS DISTINCT FROM OLD.user_id OR
           NEW.report_id IS DISTINCT FROM OLD.report_id OR
           NEW.operation_type IS DISTINCT FROM OLD.operation_type OR
           NEW.payload_hash IS DISTINCT FROM OLD.payload_hash OR
           NEW.action IS DISTINCT FROM OLD.action THEN
            RAISE EXCEPTION 'Security Policy Violation: Completed idempotency operation records are strictly immutable.';
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- Prevent deletion to ensure replay protection cannot be bypassed
        IF auth.role() != 'service_role' THEN
            RAISE EXCEPTION 'Security Policy Violation: Idempotency records cannot be deleted. Replay protection is permanent.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_idempotent_operation_immutability ON public.idempotent_operations;
CREATE TRIGGER trg_enforce_idempotent_operation_immutability
    BEFORE UPDATE OR DELETE ON public.idempotent_operations
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_idempotent_operation_immutability();

-- ------------------------------------------------------------------------------
-- 3. CONCURRENCY-SAFE AGGREGATE RECALCULATION WITH PER-REPORT ROW LOCKING
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_report_validation_aggregates(p_report_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_still_exists INT := 0;
    v_getting_worse INT := 0;
    v_appears_fixed INT := 0;
    v_incorrect INT := 0;
BEGIN
    -- 1. Input sanitization & bounds check
    IF p_report_id IS NULL OR length(p_report_id) = 0 OR length(p_report_id) > 64 THEN
        RAISE EXCEPTION 'Validation Error: Invalid report ID provided for aggregate recalculation.';
    END IF;

    -- 2. Acquire per-report row lock (FOR UPDATE)
    -- This serializes concurrent transactions updating the same report's aggregates,
    -- preventing lost updates, race conditions, negative counts, and inconsistent snapshots.
    PERFORM 1 FROM public.reports WHERE id = p_report_id FOR UPDATE;

    IF NOT FOUND THEN
        -- Report doesn't exist; exit cleanly without modifying non-existent rows
        RETURN;
    END IF;

    -- 3. Recalculate authoritative counts from unique validation records
    SELECT 
        COUNT(*) FILTER (WHERE action = 'still_exists'),
        COUNT(*) FILTER (WHERE action = 'getting_worse'),
        COUNT(*) FILTER (WHERE action = 'appears_fixed'),
        COUNT(*) FILTER (WHERE action = 'incorrect_report')
    INTO 
        v_still_exists,
        v_getting_worse,
        v_appears_fixed,
        v_incorrect
    FROM public.community_validations
    WHERE report_id = p_report_id;

    -- 4. Atomically update report aggregate counters with locked row
    UPDATE public.reports
    SET 
        still_exists_count = v_still_exists,
        getting_worse_count = v_getting_worse,
        appears_fixed_count = v_appears_fixed,
        updated_at = NOW()
    WHERE id = p_report_id;
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. SECURITY DEFINER RPC AUDIT & EXECUTION PERMISSION HARDENING
-- ------------------------------------------------------------------------------
-- Revoke all function execution privileges from anon for sensitive operational RPCs
REVOKE EXECUTE ON FUNCTION public.rpc_assign_staff_role(UUID, VARCHAR) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_revoke_staff_role(UUID, TEXT) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_approve_report(TEXT, VARCHAR) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_approve_completion(VARCHAR, TEXT) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_submit_community_validation(TEXT, TEXT, TEXT, TEXT) FROM anon, PUBLIC;

-- Explicitly grant execution only to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.rpc_assign_staff_role(UUID, VARCHAR) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_revoke_staff_role(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_approve_report(TEXT, VARCHAR) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_approve_completion(VARCHAR, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_submit_community_validation(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_report_validation_aggregates(TEXT) TO authenticated, service_role;
