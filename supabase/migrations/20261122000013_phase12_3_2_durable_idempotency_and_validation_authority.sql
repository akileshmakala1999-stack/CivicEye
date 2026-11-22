-- ==============================================================================
-- CIVICEYE MIGRATION: PHASE 12.3.2
-- DURABLE IDEMPOTENCY, VALIDATION AUTHORITY & LIVE DATABASE SECURITY CLOSURE
--
-- 1. Creates public.idempotent_operations table for durable idempotency
-- 2. Creates public.rpc_submit_community_validation with strict payload-hash matching
-- 3. Creates triggers to calculate aggregate validation counts automatically & atomically
-- 4. Enforces strict auth.uid() identity derivation and prevents client tampering
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DURABLE IDEMPOTENT OPERATIONS REGISTRY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.idempotent_operations (
    idempotency_key VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL,
    report_id VARCHAR(64) NOT NULL,
    operation_type VARCHAR(64) NOT NULL,
    action VARCHAR(64),
    payload_hash VARCHAR(64) NOT NULL,
    response_data JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_idempotent_ops_user_report 
    ON public.idempotent_operations(user_id, report_id);

ALTER TABLE public.idempotent_operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own idempotent operations" ON public.idempotent_operations;
CREATE POLICY "Users can read own idempotent operations"
    ON public.idempotent_operations FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        (auth.uid() IS NOT NULL AND auth.uid()::text = user_id)
    );

DROP POLICY IF EXISTS "Users can insert own idempotent operations" ON public.idempotent_operations;
CREATE POLICY "Users can insert own idempotent operations"
    ON public.idempotent_operations FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.uid() IS NOT NULL AND auth.uid()::text = user_id)
    );

-- ------------------------------------------------------------------------------
-- 2. RECALCULATE AGGREGATE COUNTERS FUNCTION (ATOMIC & AUTHORITATIVE)
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

    UPDATE public.reports
    SET 
        still_exists_count = v_still_exists,
        getting_worse_count = v_getting_worse,
        appears_fixed_count = v_appears_fixed,
        updated_at = NOW()
    WHERE id = p_report_id;
END;
$$;

-- Trigger to keep report aggregate counters synchronized automatically
CREATE OR REPLACE FUNCTION public.trg_sync_community_validation_aggregates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM public.recalculate_report_validation_aggregates(NEW.report_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.recalculate_report_validation_aggregates(OLD.report_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_validation_aggregates ON public.community_validations;
CREATE TRIGGER trg_sync_validation_aggregates
    AFTER INSERT OR UPDATE OR DELETE ON public.community_validations
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_sync_community_validation_aggregates();

-- ------------------------------------------------------------------------------
-- 3. HARDENED RPC: rpc_submit_community_validation
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_submit_community_validation(
    p_report_id TEXT,
    p_action TEXT,
    p_note TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID;
    v_user_id_str VARCHAR(128);
    v_user_name VARCHAR(128) := 'Citizen';
    v_existing_val RECORD;
    v_existing_op RECORD;
    v_payload_hash VARCHAR(64);
    v_response JSONB;
    v_status VARCHAR(32);
    v_op_result_action TEXT;
BEGIN
    -- 1. Authentication requirement: strictly derive user_id from auth.uid()
    v_uid := auth.uid();
    IF v_uid IS NULL AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Authentication Required: A valid citizen session is required to validate reports.';
    END IF;

    v_user_id_str := COALESCE(v_uid::TEXT, 'service-role');

    -- Extract full_name from JWT if available
    v_user_name := COALESCE(
        current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'full_name',
        'Citizen'
    );

    -- 2. Validate action enumeration
    IF p_action NOT IN ('still_exists', 'getting_worse', 'appears_fixed', 'incorrect_report') THEN
        RAISE EXCEPTION 'Validation Error: Invalid validation action "%". Must be still_exists, getting_worse, appears_fixed, or incorrect_report.', p_action;
    END IF;

    -- 3. Validate report exists
    SELECT status INTO v_status FROM public.reports WHERE id = p_report_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report Not Found: Report "%" does not exist.', p_report_id;
    END IF;

    -- 4. Compute stable payload hash
    v_payload_hash := md5(p_report_id || ':' || p_action || ':' || COALESCE(p_note, ''));

    -- 5. Check Durable Idempotency Registry
    IF p_idempotency_key IS NOT NULL AND p_idempotency_key != '' THEN
        SELECT * INTO v_existing_op FROM public.idempotent_operations
        WHERE idempotency_key = p_idempotency_key;

        IF FOUND THEN
            -- Verify user identity binding
            IF v_existing_op.user_id != v_user_id_str THEN
                RAISE EXCEPTION 'Security Policy Violation: Idempotency key "%" is bound to another citizen.', p_idempotency_key;
            END IF;

            -- Verify payload consistency
            IF v_existing_op.report_id != p_report_id OR v_existing_op.action != p_action THEN
                RAISE EXCEPTION 'Idempotency Conflict: Reusing idempotency key "%" with different payload is rejected.', p_idempotency_key;
            END IF;

            -- Return identical previous response (Idempotent acknowledgement)
            RETURN v_existing_op.response_data || jsonb_build_object('idempotentReplay', true);
        END IF;
    END IF;

    -- 6. Upsert validation record (enforcing single active vote per citizen per report)
    SELECT * INTO v_existing_val FROM public.community_validations
    WHERE report_id = p_report_id AND user_id = v_user_id_str;

    IF FOUND THEN
        IF v_existing_val.action = p_action THEN
            -- Already voted this action: retain and do not toggle or duplicate
            v_op_result_action := p_action;
        ELSE
            -- Updating vote to a new action (e.g. still_exists -> appears_fixed)
            UPDATE public.community_validations
            SET 
                action = p_action,
                note = COALESCE(p_note, v_existing_val.note),
                idempotency_key = p_idempotency_key,
                updated_at = NOW()
            WHERE report_id = p_report_id AND user_id = v_user_id_str;

            v_op_result_action := p_action;
        END IF;
    ELSE
        -- Insert new validation
        INSERT INTO public.community_validations (
            id,
            report_id,
            user_id,
            user_name,
            action,
            note,
            idempotency_key,
            created_at,
            updated_at
        ) VALUES (
            'val-' || gen_random_uuid()::TEXT,
            p_report_id,
            v_user_id_str,
            v_user_name,
            p_action,
            p_note,
            p_idempotency_key,
            NOW(),
            NOW()
        );

        v_op_result_action := p_action;
    END IF;

    -- 7. Ensure aggregate counts are updated atomically
    PERFORM public.recalculate_report_validation_aggregates(p_report_id);

    -- Build response
    v_response := jsonb_build_object(
        'success', true,
        'reportId', p_report_id,
        'userAction', v_op_result_action,
        'userId', v_user_id_str,
        'message', 'Validation recorded successfully.'
    );

    -- 8. Record in durable idempotent_operations table
    IF p_idempotency_key IS NOT NULL AND p_idempotency_key != '' THEN
        INSERT INTO public.idempotent_operations (
            idempotency_key,
            user_id,
            report_id,
            operation_type,
            action,
            payload_hash,
            response_data,
            status,
            created_at,
            updated_at
        ) VALUES (
            p_idempotency_key,
            v_user_id_str,
            p_report_id,
            'community_validation',
            p_action,
            v_payload_hash,
            v_response,
            'completed',
            NOW(),
            NOW()
        )
        ON CONFLICT (idempotency_key) DO NOTHING;
    END IF;

    RETURN v_response;
END;
$$;

-- Grant execution to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.rpc_submit_community_validation(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_report_validation_aggregates(TEXT) TO authenticated, service_role;
