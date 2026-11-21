-- ==============================================================================
-- CIVICEYE MIGRATION: 20261120000001_add_intelligence_fields.sql
-- Phase 4: Civic Intelligence Engine Schema
-- ==============================================================================

-- 1. Extend reports table with explainable intelligence attributes
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'moderate',
ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}'::jsonb;

-- 2. Indexes for Intelligence Querying
CREATE INDEX IF NOT EXISTS idx_reports_risk_level ON public.reports (risk_level);
CREATE INDEX IF NOT EXISTS idx_reports_priority_score ON public.reports (priority_score DESC);

-- 3. Comment Documentation
COMMENT ON COLUMN public.reports.risk_score IS 'Deterministic physical hazard risk score (0-100)';
COMMENT ON COLUMN public.reports.priority_score IS 'Deterministic municipal queue priority score (0-100)';
COMMENT ON COLUMN public.reports.ai_analysis IS 'Structured civic intelligence report containing safety factors, confidence, department recommendations and evidence limitations';
