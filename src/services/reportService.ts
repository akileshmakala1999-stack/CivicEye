import { DashboardReport, IssueCategory, IssueSeverity, HyderabadNeighborhood } from '../types';
import { INITIAL_USER_REPORTS, INITIAL_NEARBY_ISSUES } from '../data/dashboardMockData';
import { supabase, isSupabaseConfigured, REPORT_EVIDENCE_BUCKET } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'civiceye_user_reports';

export interface CreateReportInput {
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  locationText: string;
  neighborhood: HyderabadNeighborhood;
  latitude?: number;
  longitude?: number;
  imageFiles?: File[];
  imagePreviews?: string[];
}

export interface CreateReportResult {
  success: boolean;
  report: DashboardReport;
  isRemotePersisted: boolean;
  error?: string;
}

export interface SimilarityCandidate {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  location: string;
  distanceMeters?: number;
  similarityReason: string;
  confirmationsCount: number;
}

function getInitialReports(): DashboardReport[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read reports from localStorage', e);
  }
  return INITIAL_USER_REPORTS;
}

// In-memory cache synced with localStorage
let cachedReports: DashboardReport[] = getInitialReports();

function saveReportsLocally(reports: DashboardReport[]): void {
  cachedReports = reports;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
    window.dispatchEvent(new CustomEvent('civiceye_reports_updated', { detail: reports }));
  } catch (e) {
    console.error('Failed to save reports locally', e);
  }
}

export const reportService = {
  isRemotePersisted(): boolean {
    return isSupabaseConfigured;
  },

  async getAllReports(): Promise<DashboardReport[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const remoteReports: DashboardReport[] = data.map((row) => ({
            id: row.id,
            ticketNumber: row.ticket_number,
            title: row.title,
            category: row.category as IssueCategory,
            reportDate: new Date(row.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            reportTimestamp: new Date(row.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            location: row.location_text,
            neighborhood: (row.neighborhood as HyderabadNeighborhood) || 'Jubilee Hills',
            severity: row.severity as IssueSeverity,
            status: row.status,
            confirmationsCount: row.confirmations_count || 0,
            description: row.description,
            departmentAssigned: 'GHMC Civic Operations',
            thumbnailUrl: row.images?.[0] || undefined,
            images: row.images || [],
            latitude: row.latitude,
            longitude: row.longitude,
            isRemotePersisted: true,
            timeline: [
              {
                step: 'Submitted',
                label: 'Report Submitted',
                timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                completed: true,
                current: row.status === 'Submitted',
                detail: 'Citizen filed civic issue with verified GPS coordinates and photographic documentation.',
              },
            ],
          }));

          // Merge unique with local cached
          const merged = [...remoteReports];
          for (const local of cachedReports) {
            if (!merged.some((m) => m.id === local.id)) {
              merged.push(local);
            }
          }
          cachedReports = merged;
          return cachedReports;
        }
      } catch (e) {
        console.warn('Supabase fetch failed, falling back to local storage', e);
      }
    }
    return cachedReports;
  },

  async getReportById(id: string): Promise<DashboardReport | undefined> {
    const list = await this.getAllReports();
    return list.find((r) => r.id === id);
  },

  async createReport(input: CreateReportInput): Promise<CreateReportResult> {
    const timestamp = new Date();
    const id = `rep-${Date.now()}`;
    const wardCode = input.neighborhood === 'Jubilee Hills' ? 'JH' : input.neighborhood === 'Banjara Hills' ? 'BH' : input.neighborhood === 'Madhapur' ? 'MD' : 'GB';
    const randNum = Math.floor(100 + Math.random() * 900);
    const ticketNumber = `HYD-${wardCode}-${timestamp.getFullYear()}-${randNum}`;

    let uploadedImageUrls: string[] = input.imagePreviews || [];

    // Attempt remote upload if Supabase is connected
    let isRemote = false;
    const client = supabase;
    if (isSupabaseConfigured && client && input.imageFiles && input.imageFiles.length > 0) {
      try {
        const uploadPromises = input.imageFiles.map(async (file, idx) => {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const filePath = `${id}-${idx}-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await client.storage
            .from(REPORT_EVIDENCE_BUCKET)
            .upload(filePath, file, { contentType: file.type });

          if (!uploadError) {
            const { data } = client.storage.from(REPORT_EVIDENCE_BUCKET).getPublicUrl(filePath);
            return data.publicUrl;
          }
          return input.imagePreviews?.[idx] || '';
        });

        const results = await Promise.all(uploadPromises);
        uploadedImageUrls = results.filter(Boolean);
      } catch (e) {
        console.warn('Image upload to Supabase storage failed, using local previews', e);
      }
    }

    const newReport: DashboardReport = {
      id,
      ticketNumber,
      title: input.title.trim(),
      category: input.category,
      reportDate: 'Today',
      reportTimestamp: timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      location: input.locationText.trim(),
      neighborhood: input.neighborhood,
      severity: input.severity,
      status: 'Submitted', // Strictly initialized in Submitted status as required
      confirmationsCount: 1, // Author's confirmation
      description: input.description.trim(),
      departmentAssigned: getDepartment(input.category),
      handlingOfficer: undefined,
      thumbnailUrl: uploadedImageUrls[0] || undefined,
      images: uploadedImageUrls,
      latitude: input.latitude,
      longitude: input.longitude,
      isRemotePersisted: false,
      evidenceNote: uploadedImageUrls.length > 0 ? `${uploadedImageUrls.length} field photo(s) captured by citizen` : undefined,
      timeline: [
        {
          step: 'Submitted',
          label: 'Report Submitted',
          timestamp: 'Just now',
          completed: true,
          current: true,
          detail: 'Citizen filed civic issue with verified GPS coordinates and photographic documentation.',
        },
        {
          step: 'Under Review',
          label: 'Community Validation',
          timestamp: 'Awaiting Consensus',
          completed: false,
          current: false,
          detail: 'Neighborhood residents can confirm condition presence via Ward Watch.',
        },
        {
          step: 'Assigned',
          label: 'Department Assigned',
          timestamp: 'Pending Routing',
          completed: false,
          current: false,
          detail: `Will be routed to ${getDepartment(input.category)}.`,
        },
        {
          step: 'In Progress',
          label: 'Work In Progress',
          timestamp: 'Pending Dispatch',
          completed: false,
          current: false,
          detail: 'Awaiting field crew dispatch.',
        },
        {
          step: 'Resolved',
          label: 'Resolution Evidence Added',
          timestamp: 'Pending Completion',
          completed: false,
          current: false,
          detail: 'Field repair evidence will be recorded here.',
        },
      ],
    };

    // If Supabase is connected, attempt remote insert
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('reports').insert({
          id: newReport.id,
          ticket_number: newReport.ticketNumber,
          title: newReport.title,
          description: newReport.description,
          category: newReport.category,
          severity: newReport.severity,
          status: newReport.status,
          latitude: newReport.latitude,
          longitude: newReport.longitude,
          location_text: newReport.location,
          neighborhood: newReport.neighborhood,
          images: newReport.images,
          confirmations_count: newReport.confirmationsCount,
          reporter_name: 'Citizen Reporter',
        });

        if (!error) {
          isRemote = true;
          newReport.isRemotePersisted = true;
        } else {
          console.warn('Supabase DB insert error, saved locally:', error.message);
        }
      } catch (e) {
        console.warn('Network exception inserting to Supabase, saved locally:', e);
      }
    }

    // Always persist to local cache and localStorage
    const updated = [newReport, ...cachedReports];
    saveReportsLocally(updated);

    return {
      success: true,
      report: newReport,
      isRemotePersisted: isRemote,
    };
  },

  // Check if an issue with similar category or location exists nearby
  checkSimilarity(
    category: IssueCategory,
    locationText: string,
    lat?: number,
    lng?: number
  ): SimilarityCandidate[] {
    const candidates: SimilarityCandidate[] = [];
    const normalizedLoc = locationText.toLowerCase();

    // Check existing reports
    for (const report of cachedReports) {
      if (report.category === category) {
        let isSimilar = false;
        let reason = '';

        if (normalizedLoc.length > 4 && report.location.toLowerCase().includes(normalizedLoc.slice(0, 8))) {
          isSimilar = true;
          reason = `Similar ${category.toLowerCase()} report nearby on ${report.location}`;
        } else if (lat && lng && report.latitude && report.longitude) {
          const dist = calculateDistance(lat, lng, report.latitude, report.longitude);
          if (dist < 400) {
            isSimilar = true;
            reason = `Reported approximately ${Math.round(dist)} meters away in the same category`;
          }
        }

        if (isSimilar) {
          candidates.push({
            id: report.id,
            ticketNumber: report.ticketNumber,
            title: report.title,
            category: report.category,
            location: report.location,
            similarityReason: reason,
            confirmationsCount: report.confirmationsCount,
          });
        }
      }
    }

    // Check nearby community issues
    for (const issue of INITIAL_NEARBY_ISSUES) {
      if (issue.category === category) {
        if (normalizedLoc.length > 4 && issue.approximateLocation.toLowerCase().includes(normalizedLoc.slice(0, 8))) {
          candidates.push({
            id: issue.id,
            ticketNumber: `HYD-${issue.id.toUpperCase()}`,
            title: issue.title,
            category: issue.category,
            location: issue.approximateLocation,
            similarityReason: `Active neighborhood hazard matching category on ${issue.approximateLocation}`,
            confirmationsCount: issue.confirmationsCount,
          });
        }
      }
    }

    return candidates.slice(0, 2);
  },
};

function getDepartment(category: IssueCategory): string {
  switch (category) {
    case 'Road damage':
      return 'GHMC Engineering (Roads & Bridges)';
    case 'Water leakage':
    case 'Water Supply':
      return 'HMWSSB (Water Supply & Drainage)';
    case 'Garbage':
      return 'GHMC Solid Waste Management (Sanitation)';
    case 'Streetlights':
    case 'Electrical Hazard':
      return 'GHMC Electrical & Public Lighting';
    case 'Damaged footpaths':
    case 'Accessibility':
      return 'GHMC Town Planning & Sidewalk Maintenance';
    case 'Drainage':
      return 'GHMC Stormwater Drainage Wing';
    case 'Fallen Tree':
      return 'GHMC Urban Biodiversity & Disaster Response';
    default:
      return 'GHMC Municipal Engineering Services';
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
