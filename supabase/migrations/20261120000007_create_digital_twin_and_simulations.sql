-- ==============================================================================
-- CIVICEYE MIGRATION: 20261120000007_create_digital_twin_and_simulations.sql
-- PHASE 10: Civic Digital Twin & City Simulation Engine
-- ==============================================================================

-- 1. DIGITAL TWIN SIMULATION SCENARIOS
CREATE TABLE IF NOT EXISTS public.digital_twin_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_name TEXT NOT NULL,
  description TEXT,
  created_by_user_id UUID,
  created_by_role TEXT NOT NULL DEFAULT 'supervisor',
  target_area TEXT NOT NULL DEFAULT 'citywide',
  target_category TEXT NOT NULL DEFAULT 'all',
  strategy_id TEXT NOT NULL,
  active_teams INTEGER NOT NULL DEFAULT 6,
  daily_intervention_rate NUMERIC NOT NULL DEFAULT 2.5,
  timeline_days INTEGER NOT NULL DEFAULT 30,
  weights_json JSONB,
  dataset_fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Index for lookup and filtering
CREATE INDEX IF NOT EXISTS idx_dt_scenarios_strategy ON public.digital_twin_scenarios(strategy_id);
CREATE INDEX IF NOT EXISTS idx_dt_scenarios_created_at ON public.digital_twin_scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dt_scenarios_fingerprint ON public.digital_twin_scenarios(dataset_fingerprint);

-- 2. DIGITAL TWIN SIMULATION RESULTS
CREATE TABLE IF NOT EXISTS public.digital_twin_simulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES public.digital_twin_scenarios(id) ON DELETE CASCADE,
  baseline_issues_count INTEGER NOT NULL,
  baseline_critical_count INTEGER NOT NULL,
  total_addressed INTEGER NOT NULL,
  critical_reduction_pct NUMERIC NOT NULL,
  backlog_reduction_pct NUMERIC NOT NULL,
  cascading_avoided_count INTEGER NOT NULL,
  timeline_json JSONB NOT NULL,
  category_breakdown_json JSONB NOT NULL,
  tradeoffs_json JSONB NOT NULL,
  grounded_explanation_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_dt_results_scenario_id ON public.digital_twin_simulation_results(scenario_id);

-- 3. CASCADING INFRASTRUCTURE DEPENDENCIES
CREATE TABLE IF NOT EXISTS public.digital_twin_cascading_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  secondary_report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  dependency_type TEXT NOT NULL, -- e.g. 'water_causes_road_erosion', 'drainage_causes_flooding'
  risk_escalation_score NUMERIC NOT NULL DEFAULT 3.0,
  mitigation_window_days INTEGER NOT NULL DEFAULT 7,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'mitigated', 'broken'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_dt_cascade_root ON public.digital_twin_cascading_dependencies(root_report_id);
CREATE INDEX IF NOT EXISTS idx_dt_cascade_secondary ON public.digital_twin_cascading_dependencies(secondary_report_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.digital_twin_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_twin_simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_twin_cascading_dependencies ENABLE ROW LEVEL SECURITY;

-- Scenarios: Public can read to view transparency simulations
CREATE POLICY "Public read digital twin scenarios"
  ON public.digital_twin_scenarios
  FOR SELECT
  USING (true);

-- Scenarios: Authenticated municipal staff/supervisors/admins can insert
CREATE POLICY "Authorized insert digital twin scenarios"
  ON public.digital_twin_scenarios
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' OR
    created_by_role IN ('supervisor', 'admin', 'reviewer')
  );

-- Scenarios: Creators and admins can update
CREATE POLICY "Authorized update digital twin scenarios"
  ON public.digital_twin_scenarios
  FOR UPDATE
  USING (
    auth.uid() = created_by_user_id OR
    created_by_role IN ('supervisor', 'admin')
  );

-- Scenarios: Creators and admins can delete
CREATE POLICY "Authorized delete digital twin scenarios"
  ON public.digital_twin_scenarios
  FOR DELETE
  USING (
    auth.uid() = created_by_user_id OR
    created_by_role IN ('supervisor', 'admin')
  );

-- Results: Public read
CREATE POLICY "Public read digital twin simulation results"
  ON public.digital_twin_simulation_results
  FOR SELECT
  USING (true);

-- Results: Insert by system or authenticated users
CREATE POLICY "Authorized insert digital twin simulation results"
  ON public.digital_twin_simulation_results
  FOR INSERT
  WITH CHECK (true);

-- Dependencies: Public read
CREATE POLICY "Public read digital twin cascading dependencies"
  ON public.digital_twin_cascading_dependencies
  FOR SELECT
  USING (true);

-- Dependencies: Staff and Supervisor manage
CREATE POLICY "Authorized manage cascading dependencies"
  ON public.digital_twin_cascading_dependencies
  FOR ALL
  USING (auth.role() = 'authenticated');
