-- ==============================================================================
-- CIVICEYE MIGRATION: 20261121000009_phase10_2_security_geo_calibration.sql
-- PHASE 10.2: Staff Authorization, RLS Hardening & Calibration Governance
-- ==============================================================================

-- 1. AUTHORIZED STAFF ROLES TABLE
-- Prevents ordinary authenticated citizens from inheriting municipal staff privileges.
-- Roles can ONLY be provisioned by administrators or backend service-role.
CREATE TABLE IF NOT EXISTS public.authorized_staff_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    staff_role VARCHAR(32) NOT NULL CHECK (staff_role IN ('reviewer', 'staff', 'dispatcher', 'supervisor', 'admin')),
    department_id VARCHAR(64) REFERENCES public.departments(id),
    authorized_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_roles_lookup 
  ON public.authorized_staff_roles(user_id, staff_role, is_active);

-- Enable Row Level Security on authorized_staff_roles
ALTER TABLE public.authorized_staff_roles ENABLE ROW LEVEL SECURITY;

-- 2. SECURE ROLE VALIDATION FUNCTIONS (SECURITY DEFINER)
-- Non-recursive lookup verifying true municipal employee authorization.

CREATE OR REPLACE FUNCTION public.get_authenticated_staff_role()
RETURNS VARCHAR(32)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_role VARCHAR(32);
    v_uid UUID;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN NULL;
    END IF;

    -- 1. Check verified staff roles table
    SELECT staff_role INTO v_role
    FROM public.authorized_staff_roles
    WHERE user_id = v_uid AND is_active = true;

    IF v_role IS NOT NULL THEN
        RETURN v_role;
    END IF;

    -- 2. Fallback to server-signed app_metadata JWT claims
    IF auth.jwt() -> 'app_metadata' ->> 'role' IN ('reviewer', 'staff', 'dispatcher', 'supervisor', 'admin') THEN
        RETURN (auth.jwt() -> 'app_metadata' ->> 'role')::VARCHAR(32);
    END IF;

    -- 3. Check legacy custom claim if signed by service_role
    IF auth.jwt() ->> 'role' IN ('reviewer', 'staff', 'dispatcher', 'supervisor', 'admin') THEN
        RETURN (auth.jwt() ->> 'role')::VARCHAR(32);
    END IF;

    -- Ordinary authenticated citizens return NULL (not staff)
    RETURN NULL;
END;
$$;

-- Helper boolean predicates for clean RLS policy expressions
CREATE OR REPLACE FUNCTION public.is_staff_member()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.get_authenticated_staff_role() IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_supervisor_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.get_authenticated_staff_role() IN ('supervisor', 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.get_authenticated_staff_role() = 'admin';
$$;

-- 3. POLICIES FOR authorized_staff_roles
-- Staff can read their own assignment; only Admins or service_role can manage
DROP POLICY IF EXISTS "Staff view own role record" ON public.authorized_staff_roles;
CREATE POLICY "Staff view own role record"
  ON public.authorized_staff_roles
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins manage staff roles" ON public.authorized_staff_roles;
CREATE POLICY "Admins manage staff roles"
  ON public.authorized_staff_roles
  FOR ALL
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- Revoke mutation privileges from anon and public
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.authorized_staff_roles FROM anon, authenticated, public;
GRANT SELECT ON public.authorized_staff_roles TO authenticated;
GRANT ALL ON public.authorized_staff_roles TO service_role;

-- 4. HARDEN DIGITAL TWIN SCENARIOS RLS
-- Eliminates 'auth.role() = authenticated' vulnerability.
-- Normal citizens CANNOT view unpublished scenarios, even if logged in.
DROP POLICY IF EXISTS "Public read digital twin scenarios" ON public.digital_twin_scenarios;
DROP POLICY IF EXISTS "Public read published digital twin scenarios" ON public.digital_twin_scenarios;
DROP POLICY IF EXISTS "Staff read all digital twin scenarios" ON public.digital_twin_scenarios;
DROP POLICY IF EXISTS "Staff can insert digital twin scenarios" ON public.digital_twin_scenarios;
DROP POLICY IF EXISTS "Staff can update digital twin scenarios" ON public.digital_twin_scenarios;
DROP POLICY IF EXISTS "Staff can delete digital twin scenarios" ON public.digital_twin_scenarios;

-- Rule 1: Citizens and Anonymous can ONLY read published scenarios
CREATE POLICY "Citizens read published digital twin scenarios"
  ON public.digital_twin_scenarios
  FOR SELECT
  USING (is_published = true);

-- Rule 2: Verified Municipal Staff can read all draft/active scenarios
CREATE POLICY "Verified staff read all digital twin scenarios"
  ON public.digital_twin_scenarios
  FOR SELECT
  USING (public.is_staff_member() OR auth.role() = 'service_role');

-- Rule 3: Only Verified Staff can insert new scenario drafts
CREATE POLICY "Verified staff insert digital twin scenarios"
  ON public.digital_twin_scenarios
  FOR INSERT
  WITH CHECK (
    (public.is_staff_member() OR auth.role() = 'service_role')
    AND created_by_role IN ('reviewer', 'staff', 'dispatcher', 'supervisor', 'admin')
  );

-- Rule 4: Only Supervisors or Admins can update/publish scenarios
CREATE POLICY "Supervisors update digital twin scenarios"
  ON public.digital_twin_scenarios
  FOR UPDATE
  USING (public.is_supervisor_or_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_supervisor_or_admin() OR auth.role() = 'service_role');

-- Rule 5: Only Supervisors or Admins can delete scenarios
CREATE POLICY "Supervisors delete digital twin scenarios"
  ON public.digital_twin_scenarios
  FOR DELETE
  USING (public.is_supervisor_or_admin() OR auth.role() = 'service_role');

-- 5. HARDEN SIMULATION RESULTS RLS
DROP POLICY IF EXISTS "Public read simulation results" ON public.digital_twin_simulation_results;
DROP POLICY IF EXISTS "Public read published simulation results" ON public.digital_twin_simulation_results;
DROP POLICY IF EXISTS "Staff read all simulation results" ON public.digital_twin_simulation_results;
DROP POLICY IF EXISTS "Staff can insert digital twin simulation results" ON public.digital_twin_simulation_results;
DROP POLICY IF EXISTS "Staff can update digital twin simulation results" ON public.digital_twin_simulation_results;
DROP POLICY IF EXISTS "Staff can delete digital twin simulation results" ON public.digital_twin_simulation_results;

-- Rule 1: Citizens can ONLY read results of published scenarios
CREATE POLICY "Citizens read published simulation results"
  ON public.digital_twin_simulation_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_twin_scenarios s
      WHERE s.id = scenario_id AND s.is_published = true
    )
  );

-- Rule 2: Verified Staff can read all simulation outputs
CREATE POLICY "Verified staff read all simulation results"
  ON public.digital_twin_simulation_results
  FOR SELECT
  USING (public.is_staff_member() OR auth.role() = 'service_role');

-- Rule 3: Only Verified Staff can insert simulation results
CREATE POLICY "Verified staff insert simulation results"
  ON public.digital_twin_simulation_results
  FOR INSERT
  WITH CHECK (public.is_staff_member() OR auth.role() = 'service_role');

-- Rule 4: Only Supervisors or Admins can modify/delete simulation outputs
CREATE POLICY "Supervisors manage simulation results"
  ON public.digital_twin_simulation_results
  FOR ALL
  USING (public.is_supervisor_or_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_supervisor_or_admin() OR auth.role() = 'service_role');

-- 6. HARDEN CASCADING DEPENDENCIES RLS
DROP POLICY IF EXISTS "Public users can view cascading dependencies" ON public.digital_twin_cascading_dependencies;
DROP POLICY IF EXISTS "Staff can manage cascading dependencies" ON public.digital_twin_cascading_dependencies;

-- Public can read verified/data_supported dependencies only
CREATE POLICY "Public read data-supported cascading dependencies"
  ON public.digital_twin_cascading_dependencies
  FOR SELECT
  USING (
    link_certainty IN ('recorded', 'data_supported')
    OR public.is_staff_member()
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Staff manage cascading dependencies"
  ON public.digital_twin_cascading_dependencies
  FOR ALL
  USING (public.is_staff_member() OR auth.role() = 'service_role')
  WITH CHECK (public.is_staff_member() OR auth.role() = 'service_role');

-- Grant execute permissions on security functions
GRANT EXECUTE ON FUNCTION public.get_authenticated_staff_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff_member() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_supervisor_or_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
