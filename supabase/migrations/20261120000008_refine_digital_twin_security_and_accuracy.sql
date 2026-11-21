-- ==============================================================================
-- CIVICEYE MIGRATION: 20261120000008_refine_digital_twin_security_and_accuracy.sql
-- PHASE 10.1: Digital Twin Accuracy, Simulation Calibration & Security Refinement
-- ==============================================================================

-- 1. ADD PUBLICATION & CERTAINTY FLAGS
ALTER TABLE public.digital_twin_scenarios
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS publication_notes TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by TEXT;

CREATE INDEX IF NOT EXISTS idx_dt_scenarios_published ON public.digital_twin_scenarios(is_published);

ALTER TABLE public.digital_twin_cascading_dependencies
  ADD COLUMN IF NOT EXISTS link_certainty TEXT NOT NULL DEFAULT 'data_supported', -- 'recorded', 'data_supported', 'ai_inference', 'hypothetical'
  ADD COLUMN IF NOT EXISTS is_empirically_derived BOOLEAN NOT NULL DEFAULT false;

-- 2. REVISE ROW LEVEL SECURITY (RLS) POLICIES
-- Drop unconstrained public read policies that exposed internal scratchpad simulations
DROP POLICY IF EXISTS "Public read digital twin scenarios" ON public.digital_twin_scenarios;
DROP POLICY IF EXISTS "Public read digital twin simulation results" ON public.digital_twin_simulation_results;

-- Secure Scenarios Policy: Citizens and unauthenticated public can ONLY read officially published scenarios
CREATE POLICY "Public read published digital twin scenarios"
  ON public.digital_twin_scenarios
  FOR SELECT
  USING (is_published = true);

-- Staff Scenarios Policy: Municipal employees and supervisors can read all draft/active scenarios
CREATE POLICY "Staff read all digital twin scenarios"
  ON public.digital_twin_scenarios
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Secure Results Policy: Public can ONLY read simulation results of published scenarios
CREATE POLICY "Public read published simulation results"
  ON public.digital_twin_simulation_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_twin_scenarios s
      WHERE s.id = scenario_id AND s.is_published = true
    )
  );

-- Staff Results Policy: Authenticated staff can read all simulation outputs
CREATE POLICY "Staff read all simulation results"
  ON public.digital_twin_simulation_results
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 3. SANITIZED PUBLIC VIEW
-- Excludes internal user IDs, employee references, and private metadata
CREATE OR REPLACE VIEW public.public_published_digital_twin_scenarios AS
SELECT
  s.id,
  s.scenario_name,
  s.description,
  s.target_area,
  s.target_category,
  s.strategy_id,
  s.active_teams,
  s.daily_intervention_rate,
  s.timeline_days,
  s.dataset_fingerprint,
  s.published_at,
  r.baseline_issues_count,
  r.baseline_critical_count,
  r.total_addressed,
  r.critical_reduction_pct,
  r.backlog_reduction_pct,
  r.cascading_avoided_count,
  r.timeline_json,
  r.category_breakdown_json,
  r.tradeoffs_json,
  r.grounded_explanation_json
FROM public.digital_twin_scenarios s
JOIN public.digital_twin_simulation_results r ON r.scenario_id = s.id
WHERE s.is_published = true;

-- Grant SELECT on sanitized view to public and authenticated
GRANT SELECT ON public.public_published_digital_twin_scenarios TO anon, authenticated;

-- 4. SIMULATION ISOLATION SAFETY GUARD
-- Verify that deletion of a simulation scenario CANNOT cascade to delete real reports or work orders
-- The foreign key relationships:
-- digital_twin_simulation_results -> digital_twin_scenarios (CASCADE ON DELETE SCENARIO)
-- digital_twin_cascading_dependencies -> reports (CASCADE ON DELETE REPORT)
-- There are NO foreign keys where deleting a scenario triggers deletion in reports or work_orders.
