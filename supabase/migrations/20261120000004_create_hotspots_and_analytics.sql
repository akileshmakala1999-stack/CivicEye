-- CivicEye Phase 7 Migration: Citywide Intelligence, Hotspots & Recurring Trends
-- Provisions tables for persistent spatial clusters, recurring defect registries, and ward-level benchmarks.

-- 1. HOTSPOTS CLUSTERS TABLE
CREATE TABLE IF NOT EXISTS public.hotspot_clusters (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    primary_category TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    center_lat DOUBLE PRECISION NOT NULL,
    center_lng DOUBLE PRECISION NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 500,
    hotspot_score INTEGER NOT NULL CHECK (hotspot_score >= 0 AND hotspot_score <= 100),
    classification TEXT NOT NULL CHECK (classification IN ('Low', 'Moderate', 'High', 'Critical')),
    incident_count INTEGER NOT NULL DEFAULT 1,
    active_count INTEGER NOT NULL DEFAULT 1,
    resolved_count INTEGER NOT NULL DEFAULT 0,
    recurring_count INTEGER NOT NULL DEFAULT 0,
    preventive_recommendation TEXT,
    recommended_department TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. RECURRING PROBLEMS REGISTRY
CREATE TABLE IF NOT EXISTS public.recurring_problems (
    id TEXT PRIMARY KEY,
    location_text TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    category TEXT NOT NULL,
    occurrence_count INTEGER NOT NULL DEFAULT 2,
    first_report_date TIMESTAMPTZ,
    latest_report_date TIMESTAMPTZ,
    avg_interval_days INTEGER DEFAULT 14,
    previous_resolutions INTEGER DEFAULT 1,
    current_status TEXT NOT NULL DEFAULT 'In Progress',
    root_cause_hypothesis TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. EARLY WARNING SIGNALS
CREATE TABLE IF NOT EXISTS public.early_warning_signals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    location_text TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    category TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('Watch', 'Elevated', 'High Risk')),
    incident_count INTEGER NOT NULL DEFAULT 1,
    velocity_increase_percent INTEGER DEFAULT 20,
    timeframe TEXT DEFAULT 'Past 72 Hours',
    reason TEXT NOT NULL,
    confidence_score INTEGER DEFAULT 85,
    preventive_action TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. WARD BENCHMARK SNAPSHOTS
CREATE TABLE IF NOT EXISTS public.ward_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_name TEXT NOT NULL,
    total_reports INTEGER NOT NULL DEFAULT 0,
    active_reports INTEGER NOT NULL DEFAULT 0,
    critical_reports INTEGER NOT NULL DEFAULT 0,
    resolution_rate_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
    avg_turnaround_hours DOUBLE PRECISION DEFAULT 24.0,
    community_engagement_score INTEGER DEFAULT 75,
    dominant_category TEXT,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.hotspot_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.early_warning_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ward_benchmarks ENABLE ROW LEVEL SECURITY;

-- Public read access policies for citywide intelligence (Privacy Safe - Aggregates Only)
CREATE POLICY "Allow public read access to hotspot_clusters"
ON public.hotspot_clusters FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public read access to recurring_problems"
ON public.recurring_problems FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public read access to early_warning_signals"
ON public.early_warning_signals FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public read access to ward_benchmarks"
ON public.ward_benchmarks FOR SELECT
TO anon, authenticated
USING (true);
