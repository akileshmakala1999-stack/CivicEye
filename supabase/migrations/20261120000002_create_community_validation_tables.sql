-- ==============================================================================
-- CIVICEYE MIGRATION: Phase 5 - Community Validation & Collective Intelligence
-- Tables for community validations, extra photographic evidence, activity events,
-- and resolution verification/challenges.
-- ==============================================================================

-- 1. COMMUNITY VALIDATIONS TABLE (Still Exists, Getting Worse, Appears Fixed, Incorrect)
CREATE TABLE IF NOT EXISTS public.community_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(128) NOT NULL,
    user_name VARCHAR(128) NOT NULL,
    user_role VARCHAR(32) DEFAULT 'citizen',
    action VARCHAR(32) NOT NULL CHECK (action IN ('still_exists', 'getting_worse', 'appears_fixed', 'incorrect_report')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_report_action UNIQUE (report_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_validations_report ON public.community_validations(report_id);
CREATE INDEX IF NOT EXISTS idx_community_validations_action ON public.community_validations(action);

-- 2. ADDITIONAL EVIDENCE TABLE (Photos, condition evaluations, observer notes)
CREATE TABLE IF NOT EXISTS public.community_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(128) NOT NULL,
    user_name VARCHAR(128) NOT NULL,
    photo_url TEXT,
    description TEXT NOT NULL,
    condition VARCHAR(64) NOT NULL CHECK (condition IN ('Unchanged', 'Deteriorated', 'Partially Repaired', 'Hazard Cleared')),
    location_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_evidence_report ON public.community_evidence(report_id);

-- 3. REPORT ACTIVITY EVENTS TABLE (Chronological event timeline)
CREATE TABLE IF NOT EXISTS public.report_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL CHECK (event_type IN (
        'report_submitted',
        'community_confirmation',
        'issue_worsening',
        'evidence_added',
        'report_resolved',
        'resolution_challenged',
        'reopened_verification'
    )),
    actor_type VARCHAR(32) NOT NULL CHECK (actor_type IN ('citizen', 'community', 'official', 'ai')),
    actor_name VARCHAR(128) NOT NULL,
    title VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_events_report ON public.report_events(report_id);
CREATE INDEX IF NOT EXISTS idx_report_events_created ON public.report_events(created_at);

-- 4. RESOLUTION VERIFICATIONS & CHALLENGES TABLE
CREATE TABLE IF NOT EXISTS public.resolution_verifications (
    report_id VARCHAR(64) PRIMARY KEY,
    is_challenged BOOLEAN DEFAULT FALSE,
    challenged_at TIMESTAMPTZ,
    challenge_reason TEXT,
    challenge_photo_url TEXT,
    challenged_by VARCHAR(128),
    confirmed_fixed_count INT DEFAULT 0,
    challenge_count INT DEFAULT 0,
    reopened_for_review BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.community_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolution_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read community validations"
    ON public.community_validations FOR SELECT USING (true);

CREATE POLICY "Public insert/update community validations"
    ON public.community_validations FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read community evidence"
    ON public.community_evidence FOR SELECT USING (true);

CREATE POLICY "Public insert community evidence"
    ON public.community_evidence FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read report events"
    ON public.report_events FOR SELECT USING (true);

CREATE POLICY "Public insert report events"
    ON public.report_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read resolution verifications"
    ON public.resolution_verifications FOR SELECT USING (true);

CREATE POLICY "Public manage resolution verifications"
    ON public.resolution_verifications FOR ALL USING (true) WITH CHECK (true);
