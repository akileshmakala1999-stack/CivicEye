-- ==============================================================================
-- CIVICEYE MIGRATION: PHASE 12.3.5
-- STRICT REGEX CONSTRAINT ON IDEMPOTENCY KEYS
--
-- 1. Drops legacy length-only constraint on public.idempotent_operations
-- 2. Enforces strict regex match ^[A-Za-z0-9_-]{6,128}$ at PostgreSQL boundary
-- 3. Rejects whitespace, newlines, control chars, punctuation, and Unicode lookalikes
-- ==============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'idempotent_operations'
    ) THEN
        -- Safely drop legacy length-only check constraint
        ALTER TABLE public.idempotent_operations 
            DROP CONSTRAINT IF EXISTS chk_idempotency_key_format;

        -- Enforce strict regex constraint matching application validation
        ALTER TABLE public.idempotent_operations 
            ADD CONSTRAINT chk_idempotency_key_format 
            CHECK (idempotency_key ~ '^[A-Za-z0-9_-]{6,128}$');
    END IF;
END $$;
