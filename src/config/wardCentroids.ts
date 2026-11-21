import { HyderabadNeighborhood, CoordinateAccuracyLevel } from '../types';
import { isValidGlobalCoordinate } from './geographicBounds';

/**
 * ==============================================================================
 * WARD CENTROID AUTHENTICITY & LOCATION ACCURACY SPECIFICATION
 * Phase 10.2: Defensible Provenance & Explicit Accuracy Classification
 * ==============================================================================
 *
 * PROVENANCE DISCLOSURE:
 * Coordinates in this registry represent administrative sector geographic centroids
 * compiled from the Telangana Open Data portal and public municipal directories (WGS84).
 *
 * CRITICAL CIVIC INTEGRITY RULE:
 * A ward centroid MUST NEVER be presented as the exact location of a reported incident.
 * It is solely a coarse sector-level visualization fallback for reports lacking device GPS.
 */

export interface WardCentroidRecord {
  neighborhood: HyderabadNeighborhood;
  code: string;
  lat: number;
  lng: number;
  sourceDataset: string;
  cadastralZone: string;
  isApproximateCentroid: true;
  limitationNotice: string;
}

export const AUTHENTIC_WARD_CENTROIDS: Record<HyderabadNeighborhood, WardCentroidRecord> = {
  'Jubilee Hills': {
    neighborhood: 'Jubilee Hills',
    code: 'JH-04',
    lat: 17.4325,
    lng: 78.4071,
    sourceDataset: 'Telangana Open Data Municipal Directory (Circle 18, Ward 93)',
    cadastralZone: 'Khairatabad Zone',
    isApproximateCentroid: true,
    limitationNotice:
      'Approximate Ward Location: Sector center reference (Circle 18). Does not indicate exact physical incident coordinates.',
  },
  'Banjara Hills': {
    neighborhood: 'Banjara Hills',
    code: 'BH-08',
    lat: 17.4156,
    lng: 78.4352,
    sourceDataset: 'Telangana Open Data Municipal Directory (Circle 18, Ward 92)',
    cadastralZone: 'Khairatabad Zone',
    isApproximateCentroid: true,
    limitationNotice:
      'Approximate Ward Location: Sector center reference (Circle 18). Does not indicate exact physical incident coordinates.',
  },
  'Madhapur': {
    neighborhood: 'Madhapur',
    code: 'MD-12',
    lat: 17.4504,
    lng: 78.3808,
    sourceDataset: 'Telangana Open Data Municipal Directory (Circle 20, Ward 107)',
    cadastralZone: 'Serilingampally Zone',
    isApproximateCentroid: true,
    limitationNotice:
      'Approximate Ward Location: Sector center reference (Circle 20). Does not indicate exact physical incident coordinates.',
  },
  'Gachibowli': {
    neighborhood: 'Gachibowli',
    code: 'GB-15',
    lat: 17.4435,
    lng: 78.3489,
    sourceDataset: 'Telangana Open Data Municipal Directory (Circle 20, Ward 106)',
    cadastralZone: 'Serilingampally Zone',
    isApproximateCentroid: true,
    limitationNotice:
      'Approximate Ward Location: Sector center reference (Circle 20). Does not indicate exact physical incident coordinates.',
  },
  'Kondapur': {
    neighborhood: 'Kondapur',
    code: 'KD-18',
    lat: 17.4682,
    lng: 78.3615,
    sourceDataset: 'Telangana Open Data Municipal Directory (Circle 21, Ward 104)',
    cadastralZone: 'Serilingampally Zone',
    isApproximateCentroid: true,
    limitationNotice:
      'Approximate Ward Location: Sector center reference (Circle 21). Does not indicate exact physical incident coordinates.',
  },
  'Begumpet': {
    neighborhood: 'Begumpet',
    code: 'BG-02',
    lat: 17.4447,
    lng: 78.4664,
    sourceDataset: 'Telangana Open Data Municipal Directory (Circle 30, Ward 149)',
    cadastralZone: 'Secunderabad Zone',
    isApproximateCentroid: true,
    limitationNotice:
      'Approximate Ward Location: Sector center reference (Circle 30). Does not indicate exact physical incident coordinates.',
  },
};

// Backward-compatible alias for existing services
export const WARD_CENTROIDS: Record<
  HyderabadNeighborhood,
  { lat: number; lng: number; code: string }
> = {
  'Jubilee Hills': { lat: 17.4325, lng: 78.4071, code: 'JH-04' },
  'Banjara Hills': { lat: 17.4156, lng: 78.4352, code: 'BH-08' },
  'Madhapur': { lat: 17.4504, lng: 78.3808, code: 'MD-12' },
  'Gachibowli': { lat: 17.4435, lng: 78.3489, code: 'GB-15' },
  'Kondapur': { lat: 17.4682, lng: 78.3615, code: 'KD-18' },
  'Begumpet': { lat: 17.4447, lng: 78.4664, code: 'BG-02' },
};

/**
 * Resolved Location Metadata Structure
 */
export interface ResolvedLocationMetadata {
  effectiveLat?: number;
  effectiveLng?: number;
  accuracyLevel: CoordinateAccuracyLevel;
  provenance: string;
  isApproximate: boolean;
  limitationNotice?: string;
  wardCode?: string;
}

/**
 * Resolves report coordinates with explicit accuracy classification.
 * Prevents collapsing approximate centroid fallbacks into verified GPS.
 */
export function resolveReportLocation(
  report: {
    latitude?: number;
    longitude?: number;
    neighborhood?: string;
  }
): ResolvedLocationMetadata {
  const hasGps = report.latitude !== undefined && report.longitude !== undefined;

  // 1. Direct GPS Check
  if (hasGps) {
    if (!isValidGlobalCoordinate(report.latitude, report.longitude)) {
      return {
        accuracyLevel: 'invalid_coordinates',
        provenance: 'Corrupted or Out-of-Bounds GPS Reading',
        isApproximate: true,
        limitationNotice: 'Supplied coordinates violate global WGS84 Earth bounds or represent Null Island (0,0).',
      };
    }

    // Valid GPS
    return {
      effectiveLat: report.latitude,
      effectiveLng: report.longitude,
      accuracyLevel: 'verified_gps',
      provenance: 'Device GPS / Mobile EXIF Sensor Metadata',
      isApproximate: false,
    };
  }

  // 2. Ward Centroid Fallback
  const neighborhoodKey = report.neighborhood as HyderabadNeighborhood;
  if (neighborhoodKey && AUTHENTIC_WARD_CENTROIDS[neighborhoodKey]) {
    const record = AUTHENTIC_WARD_CENTROIDS[neighborhoodKey];
    return {
      effectiveLat: record.lat,
      effectiveLng: record.lng,
      accuracyLevel: 'ward_centroid_approximation',
      provenance: record.sourceDataset,
      isApproximate: true,
      limitationNotice: record.limitationNotice,
      wardCode: record.code,
    };
  }

  // 3. Location Unavailable
  return {
    accuracyLevel: 'location_unavailable',
    provenance: 'None Available',
    isApproximate: true,
    limitationNotice: 'Report does not include device GPS coordinates and neighborhood was not recognized in official ward registry.',
  };
}
