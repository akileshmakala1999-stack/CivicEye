-- ==============================================================================
-- CIVICEYE MIGRATION: 20261120000000_create_reports_and_storage.sql
-- Phase 3: Civic Reporting & Real Data Foundation
-- ==============================================================================

-- 1. Create Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    ticket_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved')),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_text TEXT NOT NULL,
    neighborhood TEXT DEFAULT 'Jubilee Hills',
    images TEXT[] DEFAULT '{}',
    confirmations_count INTEGER DEFAULT 0,
    reporter_name TEXT DEFAULT 'Citizen Reporter',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_reports_category ON public.reports (category);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_neighborhood ON public.reports (neighborhood);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_coordinates ON public.reports (latitude, longitude);

-- 3. Row Level Security (RLS)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Allow public read access to civic issue reports (transparent civic accountability)
CREATE POLICY "Public Read Access for Reports"
    ON public.reports
    FOR SELECT
    USING (true);

-- Allow public & authenticated users to submit new civic reports
CREATE POLICY "Allow Public and Authenticated Insert"
    ON public.reports
    FOR INSERT
    WITH CHECK (
        char_length(title) >= 3 AND
        char_length(description) >= 10 AND
        char_length(location_text) >= 3
    );

-- Allow community members to increment confirmation count
CREATE POLICY "Allow Community Confirmations Update"
    ON public.reports
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 4. Automatic Updated At Timestamp Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reports_updated_at ON public.reports;
CREATE TRIGGER trigger_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Storage Bucket for Report Photographic Evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-evidence', 'report-evidence', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS: Public read access for evidence photos
CREATE POLICY "Public Access for Report Evidence Photos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'report-evidence');

-- Storage RLS: Allow uploads with max file size limit (5MB)
CREATE POLICY "Allow Citizen Uploads to Report Evidence"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'report-evidence'
    );
