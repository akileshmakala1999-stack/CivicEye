import { GeoBounds } from '../types';

/**
 * ==============================================================================
 * CIVICEYE GEOGRAPHIC BOUNDARIES & CARTOGRAPHIC SPECIFICATION
 * Phase 10.2: Maintainable, Configurable Boundary Architecture
 * ==============================================================================
 *
 * IMPORTANT TRANSPARENCY NOTICE:
 * Rectangular coordinates in this configuration are analytical bounding approximations
 * for map projection, viewport management, and regional query scoping.
 * They MUST NOT be described or represented as official legal GHMC cadastral boundaries.
 */

export type GeographicCoverageTier =
  | 'map_viewport'
  | 'pilot_operating_area'
  | 'approximate_metropolitan'
  | 'official_cadastral'
  | 'outside_coverage';

/**
 * Tier A: Standard Map Viewport Bounds (Central Urban Core Pilot Area)
 * Used strictly for 2D SVG canvas percentages and default zoom viewport.
 */
export const DEFAULT_VIEWPORT_BOUNDS: GeoBounds = {
  minLat: 17.405,
  maxLat: 17.465,
  minLng: 78.345,
  maxLng: 78.455,
  label: 'Hyderabad Urban Core (Pilot Viewport)',
  isApproximate: true,
};

/**
 * Tier B: Pilot Operating Area (West Hyderabad Urban Sector)
 * Covers the high-density tech & commercial pilot corridor.
 */
export const PILOT_OPERATING_AREA_BOUNDS: GeoBounds = {
  minLat: 17.380,
  maxLat: 17.480,
  minLng: 78.320,
  maxLng: 78.480,
  label: 'West Hyderabad Pilot Operating Corridor (Approximate)',
  isApproximate: true,
};

/**
 * Tier C: Approximate Greater Hyderabad Metropolitan Coverage Bounds
 * Covers broader metropolitan municipal limits (~17.20° to 17.60°N, 78.15° to 78.70°E).
 * Clearly labeled as an approximate regional bounding envelope.
 */
export const METROPOLITAN_COVERAGE_BOUNDS: GeoBounds = {
  minLat: 17.20,
  maxLat: 17.60,
  minLng: 78.15,
  maxLng: 78.70,
  label: 'Greater Hyderabad Metropolitan Coverage Area (Approximate Bounding Envelope)',
  isApproximate: true,
};

// Backward-compatible alias
export const GREATER_HYDERABAD_BOUNDS = METROPOLITAN_COVERAGE_BOUNDS;

// Backward-compatible legacy bounds
export const HYDERABAD_GEO_BOUNDS = {
  minLat: 17.30,
  maxLat: 17.55,
  minLng: 78.25,
  maxLng: 78.60,
};

export const MAP_PROJECTION_BOUNDS = DEFAULT_VIEWPORT_BOUNDS;

/**
 * Tier D: Authoritative Municipal Cadastral Boundary Specification
 * Clean architecture interface ready for official GeoJSON polygon integration.
 */
export interface AuthoritativeBoundarySpec {
  isDatasetAvailable: boolean;
  datasetTitle: string;
  cadastralAuthority: string;
  lastUpdatedDate?: string;
  disclaimer: string;
  polygonGeoJson?: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export const OFFICIAL_MUNICIPAL_BOUNDARY_SPEC: AuthoritativeBoundarySpec = {
  isDatasetAvailable: false,
  datasetTitle: 'GHMC Statutory Cadastral Polygon (Not Available)',
  cadastralAuthority: 'Greater Hyderabad Municipal Corporation (GHMC) / Survey of India',
  disclaimer:
    'Authoritative GHMC legal boundary polygon dataset not currently ingested in local repository. Current spatial calculations utilize documented approximate bounding envelopes. Reports are never discarded based on rectangular limits.',
};

/**
 * Mathematical Global Coordinate Validation
 * Checks latitude [-90, 90], longitude [-180, 180], not NaN, and rejects Null Island (0,0).
 */
export function isValidGlobalCoordinate(lat?: number, lng?: number): boolean {
  if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat === 0 && lng === 0) return false; // Rejects Null Island GPS sensor fault
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Tests whether valid coordinates fall within a specified geographic boundary.
 */
export function isInGeographicBounds(
  lat: number,
  lng: number,
  bounds: GeoBounds = METROPOLITAN_COVERAGE_BOUNDS
): boolean {
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lng >= bounds.minLng &&
    lng <= bounds.maxLng
  );
}

/**
 * Regional coordinate validation (backward compatible with Phase 10 pilot viewport).
 */
export function isValidCoordinate(
  lat?: number,
  lng?: number,
  bounds: GeoBounds = DEFAULT_VIEWPORT_BOUNDS
): boolean {
  if (!isValidGlobalCoordinate(lat, lng)) return false;
  return isInGeographicBounds(lat!, lng!, bounds);
}

/**
 * Projects real geographic coordinates into SVG percentage coordinate space [8% to 92%].
 */
export function projectCoordinates(
  lat?: number,
  lng?: number,
  fallbackX = 50,
  fallbackY = 50,
  viewport: GeoBounds = DEFAULT_VIEWPORT_BOUNDS
): { x: number; y: number } {
  if (lat === undefined || lat === null || lng === undefined || lng === null || isNaN(lat) || isNaN(lng)) {
    return { x: fallbackX, y: fallbackY };
  }
  const { minLat, maxLat, minLng, maxLng } = viewport;
  const x = Math.min(92, Math.max(8, ((lng - minLng) / (maxLng - minLng)) * 100));
  const y = Math.min(92, Math.max(8, (1 - (lat - minLat) / (maxLat - minLat)) * 100));
  return { x: Math.round(x), y: Math.round(y) };
}
