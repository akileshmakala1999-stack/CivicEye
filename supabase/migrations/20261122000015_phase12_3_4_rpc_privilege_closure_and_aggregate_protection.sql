-- ==============================================================================
-- CIVICEYE MIGRATION: PHASE 12.3.4
-- RPC PRIVILEGE CLOSURE, AGGREGATE RECALCULATION DEFENSE & CONFIRMATION HARDENING
--
-- 1. Revokes direct execution of recalculate_report_validation_aggregates from authenticated/anon
-- 2. Restricts recalculation strictly to service_role and internal SECURITY DEFINER triggers
-- 3. Hardens rpc_increment_report_confirmation: requires authenticated session & row-level locking
-- 4. Revokes anonymous execution on all privileged and operational RPCs
-- 5. Enforces database constraints on idempotency key bounds and format
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. AGGREGATE RECALCULATION RPC PRIVILEGE CLOSURE
-- ------------------------------------------------------------------------------
-- Prevent authenticated users from calling recalculation directly to cause DoS/locks
REVOKE EXECUTE ON FUNCTION public.recalculate_report_validation_aggregates(TEXT) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalculate_report_validation_aggregates(TEXT) TO service_role;

-- ------------------------------------------------------------------------------
-- 2. HARDEN rpc_increment_report_confirmation
-- ------------------------------------------------------------------------------
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
    -- 1. Mandatory authenticated session (Fail-closed for anonymous callers)
    v_uid := auth.uid();
    IF v_uid IS NULL AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Authentication Required: An authentic citizen session is strictly required to confirm reports.';
    END IF;

    v_user_id_str := COALESCE(v_uid::TEXT, 'service-role');

    -- 2. Validate report identifier
    IF p_report_id IS NULL OR length(trim(p_report_id)) < 3 OR length(p_report_id) > 64 THEN
        RAISE EXCEPTION 'Validation Error: Invalid report identifier provided.';
    END IF;

    -- 3. Idempotency key format check if provided
    IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
        IF length(trim(p_idempotency_key)) < 6 OR length(p_idempotency_key) > 128 THEN
            RAISE EXCEPTION 'Validation Error: Idempotency key must be between 6 and 128 characters.';
        END IF;
    END IF;

    -- 4. Acquire exclusive per-report row lock
    SELECT status INTO v_status FROM public.reports WHERE id = p_report_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report Not Found: Target report does not exist.';
    END IF;

    IF v_status = 'Resolved' THEN
        RAISE EXCEPTION 'Invalid State: Cannot add community confirmations to an already resolved report.';
    END IF;

    -- 5. Duplicate Confirmation Prevention (Strict 1 confirmation per citizen per report)
    IF EXISTS (
        SELECT 1 FROM public.report_confirmations
        WHERE report_id = p_report_id AND user_id = v_user_id_str
    ) THEN
        SELECT confirmations_count INTO v_updated_count FROM public.reports WHERE id = p_report_id;
        RETURN jsonb_build_object(
            'success', true,
            'reportId', p_report_id,
            'confirmationsCount', COALESCE(v_updated_count, 0),
            'alreadyConfirmed', true,
            'message', 'User has already confirmed this report. Count unchanged.'
        );
    END IF;

    -- 6. Record confirmation
    INSERT INTO public.report_confirmations (report_id, user_id, confirmed_at)
    VALUES (p_report_id, v_user_id_str, NOW())
    ON CONFLICT (report_id, user_id) DO NOTHING;

    -- 7. Atomically increment confirmation counter
    UPDATE public.reports
    SET 
        confirmations_count = COALESCE(confirmations_count, 0) + 1,
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

-- Revoke confirmation RPC execution from anon and PUBLIC
REVOKE EXECUTE ON FUNCTION public.rpc_increment_report_confirmation(TEXT, TEXT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_increment_report_confirmation(TEXT, TEXT) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. AUDIT ALL PRIVILEGED OPERATIONAL RPCs
-- ------------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.rpc_assign_staff_role(UUID, VARCHAR) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_revoke_staff_role(UUID, TEXT) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_approve_report(TEXT, VARCHAR) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_approve_completion(VARCHAR, TEXT) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_submit_community_validation(TEXT, TEXT, TEXT, TEXT) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.rpc_assign_staff_role(UUID, VARCHAR) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_revoke_staff_role(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_approve_report(TEXT, VARCHAR) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_approve_completion(VARCHAR, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_submit_community_validation(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. DATABASE INTEGRITY CONSTRAINTS: IDEMPOTENCY KEY BOUNDS
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'idempotent_operations'
    ) THEN
        ALTER TABLE public.idempotent_operations 
            DROP CONSTRAINT IF EXISTS chk_idempotency_key_format;
        ALTER TABLE public.idempotent_operations 
            ADD CONSTRAINT chk_idempotency_key_format 
            CHECK (length(trim(idempotency_key)) >= 6 AND length(idempotency_key) <= 128);
    END IF;
END $$;
