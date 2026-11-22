/**
 * CivicEye — Supabase Backend Configuration & Environment Mode Controller
 * Stage 13 Backend Activation
 *
 * Implements strict environment-based mode control:
 * - CONNECTED MODE: Valid Supabase URL + Anon Key configured -> Real backend active
 * - DEVELOPMENT MODE: Mock/resilient storage permitted for offline local dev/testing
 * - PRODUCTION MODE: When unconfigured, prevents silent mock masquerading and false sync claims
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined;
const supabaseAnonKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined;

export const REPORT_EVIDENCE_BUCKET = 'report-evidence';

export type BackendMode = 'connected' | 'development_mock' | 'unconnected_production';

// Detect whether valid Supabase credentials have been configured
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    supabaseUrl.startsWith('http')
);

// Determine execution environment mode
const isProd = typeof import.meta !== 'undefined' && import.meta.env ? Boolean(import.meta.env.PROD) : false;

export function getBackendMode(): BackendMode {
  if (isSupabaseConfigured) {
    return 'connected';
  }
  return isProd ? 'unconnected_production' : 'development_mock';
}

export function isRealBackendConnected(): boolean {
  return isSupabaseConfigured;
}

export function canUseMockFallback(): boolean {
  return !isSupabaseConfigured && !isProd;
}

// Log safe connection diagnostics without exposing credentials
if (typeof window !== 'undefined') {
  const mode = getBackendMode();
  if (mode === 'connected') {
    console.info('[CivicEye Backend] Connected to active Supabase backend endpoint.');
  } else if (mode === 'unconnected_production') {
    console.warn('[CivicEye Backend] Notice: Supabase endpoint unconfigured in production environment. Mutations will be queued safely without false remote persistence claims.');
  } else {
    console.info('[CivicEye Backend] Development mock / offline resilient storage active.');
  }
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
