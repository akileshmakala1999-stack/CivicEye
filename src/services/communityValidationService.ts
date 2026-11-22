import {
  CommunityValidationAction,
  CommunityValidationRecord,
  AdditionalEvidenceRecord,
  CommunityActivityEvent,
  ResolutionVerificationInfo,
  IssueConditionType,
  ValidationRetrievalState,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from './authService';
import { durableStorage } from '../lib/durableStorage';

const VALIDATIONS_STORAGE_KEY = 'civiceye_community_validations';
const EVIDENCE_STORAGE_KEY = 'civiceye_additional_evidence';
const EVENTS_STORAGE_KEY = 'civiceye_report_events';
const RESOLUTIONS_STORAGE_KEY = 'civiceye_resolution_verifications';
const IDEMPOTENCY_STORAGE_KEY = 'civiceye_idempotency_registry';

export interface DurableIdempotencyEntry {
  idempotencyKey: string;
  userId: string;
  reportId: string;
  action: CommunityValidationAction;
  userAction: CommunityValidationAction | null;
  timestamp: number;
  message: string;
}

// Initial seed validations for demo reports
const INITIAL_VALIDATIONS: CommunityValidationRecord[] = [
  {
    id: 'val-101',
    reportId: 'rep-1',
    userId: 'usr-kavitha',
    userName: 'Kavitha R.',
    userRole: 'citizen',
    action: 'getting_worse',
    timestamp: 'Today, 10:15 AM',
    createdAt: Date.now() - 3600000 * 2,
    note: 'Crater widening after morning water tanker transit. Heavy skid marks visible.',
  },
  {
    id: 'val-102',
    reportId: 'rep-1',
    userId: 'usr-tarun',
    userName: 'Tarun V.',
    userRole: 'citizen',
    action: 'still_exists',
    timestamp: 'Today, 08:30 AM',
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'val-103',
    reportId: 'rep-1',
    userId: 'usr-suresh',
    userName: 'Suresh Rao',
    userRole: 'citizen',
    action: 'still_exists',
    timestamp: 'Yesterday, 06:40 PM',
    createdAt: Date.now() - 3600000 * 14,
  },
  {
    id: 'val-201',
    reportId: 'rep-2',
    userId: 'usr-deepak',
    userName: 'Deepak M.',
    userRole: 'citizen',
    action: 'getting_worse',
    timestamp: 'Today, 07:10 AM',
    createdAt: Date.now() - 3600000 * 5,
    note: 'Stray animals spreading garbage onto vehicular lane.',
  },
  {
    id: 'val-301',
    reportId: 'rep-3',
    userId: 'usr-priya',
    userName: 'Priya K.',
    userRole: 'citizen',
    action: 'still_exists',
    timestamp: 'Today, 09:00 AM',
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'val-501',
    reportId: 'rep-5',
    userId: 'usr-neha',
    userName: 'Neha S.',
    userRole: 'citizen',
    action: 'appears_fixed',
    timestamp: '05 Nov 2026',
    createdAt: Date.now() - 3600000 * 120,
    note: 'Pavers re-aligned and manhole cover securely seated.',
  },
];

// Initial seed extra evidence submissions
const INITIAL_EVIDENCE: AdditionalEvidenceRecord[] = [
  {
    id: 'evi-1',
    reportId: 'rep-1',
    userId: 'usr-kavitha',
    userName: 'Kavitha R.',
    description: 'Crater edge has sheared off by another 4 inches; water pooled inside obscuring true depth.',
    condition: 'Deteriorated',
    locationNote: 'Directly in line with bus stop pull-in bay',
    timestamp: 'Today, 10:20 AM',
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'evi-2',
    reportId: 'rep-2',
    userId: 'usr-deepak',
    userName: 'Deepak M.',
    description: 'Overflow perimeter has expanded to 20 meters, obstructing clinic ramp.',
    condition: 'Deteriorated',
    locationNote: 'Opposite gate 3',
    timestamp: 'Today, 07:15 AM',
    createdAt: Date.now() - 3600000 * 5,
  },
];

// Initial report activity events
const INITIAL_EVENTS: CommunityActivityEvent[] = [
  {
    id: 'evt-101',
    reportId: 'rep-1',
    eventType: 'report_submitted',
    actorType: 'citizen',
    actorName: 'Aditya (Citizen Guardian)',
    title: 'Report Filed with GPS Coordinates',
    description: 'Initial report logged with photographic evidence and critical severity rating.',
    timestamp: '18 Nov 2026, 09:30 AM',
    createdAt: Date.now() - 3600000 * 48,
  },
  {
    id: 'evt-102',
    reportId: 'rep-1',
    eventType: 'community_confirmation',
    actorType: 'community',
    actorName: 'Ward 93 Residents',
    title: 'Community Consensus Threshold Met',
    description: '18 local residents validated the hazard, triggering automated priority escalation.',
    timestamp: '18 Nov 2026, 11:15 AM',
    createdAt: Date.now() - 3600000 * 46,
  },
  {
    id: 'evt-103',
    reportId: 'rep-1',
    eventType: 'issue_worsening',
    actorType: 'citizen',
    actorName: 'Kavitha R.',
    title: 'Hazard Condition Worsened',
    description: 'Citizen reported accelerated surface erosion following heavy rainfall.',
    timestamp: 'Today, 10:15 AM',
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'evt-104',
    reportId: 'rep-1',
    eventType: 'evidence_added',
    actorType: 'citizen',
    actorName: 'Kavitha R.',
    title: 'Follow-up Ground Evidence Uploaded',
    description: 'High-resolution photo attached showing sub-base damage.',
    timestamp: 'Today, 10:20 AM',
    createdAt: Date.now() - 3600000 * 2,
  },
  // rep-5 (Resolved report)
  {
    id: 'evt-501',
    reportId: 'rep-5',
    eventType: 'report_submitted',
    actorType: 'citizen',
    actorName: 'Aditya (Citizen Guardian)',
    title: 'Pavement Damage Logged',
    description: 'Broken pedestrian pavers and missing utility covers logged at Jubilee Checkpost.',
    timestamp: '02 Nov 2026, 10:15 AM',
    createdAt: Date.now() - 3600000 * 200,
  },
  {
    id: 'evt-502',
    reportId: 'rep-5',
    eventType: 'report_resolved',
    actorType: 'official',
    actorName: 'AE Ramesh Chandra (GHMC)',
    title: 'Work Completed & Evidence Uploaded',
    description: 'Pre-cast concrete slab installed and paving blocks leveled.',
    timestamp: '05 Nov 2026, 04:30 PM',
    createdAt: Date.now() - 3600000 * 120,
  },
];

// Initial resolution info
const INITIAL_RESOLUTIONS: Record<string, ResolutionVerificationInfo> = {
  'rep-5': {
    reportId: 'rep-5',
    isChallenged: false,
    confirmedFixedCount: 14,
    challengeCount: 0,
    reopenedForReview: false,
  },
};

class CommunityValidationService {
  private validations: CommunityValidationRecord[] = [];
  private evidenceList: AdditionalEvidenceRecord[] = [];
  private eventsList: CommunityActivityEvent[] = [];
  private resolutions: Record<string, ResolutionVerificationInfo> = {};
  private processedIdempotencyKeys: Set<string> = new Set();
  private durableIdempotencyMap: Map<string, DurableIdempotencyEntry> = new Map();
  private validationStates: Record<string, ValidationRetrievalState> = {};

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedVals = localStorage.getItem(VALIDATIONS_STORAGE_KEY);
      this.validations = savedVals ? JSON.parse(savedVals) : INITIAL_VALIDATIONS;

      const savedEvi = localStorage.getItem(EVIDENCE_STORAGE_KEY);
      this.evidenceList = savedEvi ? JSON.parse(savedEvi) : INITIAL_EVIDENCE;

      const savedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
      this.eventsList = savedEvents ? JSON.parse(savedEvents) : INITIAL_EVENTS;

      const savedRes = localStorage.getItem(RESOLUTIONS_STORAGE_KEY);
      this.resolutions = savedRes ? JSON.parse(savedRes) : INITIAL_RESOLUTIONS;

      const savedIdem = localStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
      if (savedIdem) {
        const parsed = JSON.parse(savedIdem);
        if (typeof parsed === 'object' && parsed !== null) {
          Object.values(parsed).forEach((entry: any) => {
            if (entry && entry.idempotencyKey) {
              this.durableIdempotencyMap.set(entry.idempotencyKey, entry);
              this.processedIdempotencyKeys.add(entry.idempotencyKey);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load community validation data from localStorage', e);
      this.validations = INITIAL_VALIDATIONS;
      this.evidenceList = INITIAL_EVIDENCE;
      this.eventsList = INITIAL_EVENTS;
      this.resolutions = INITIAL_RESOLUTIONS;
    }

    // Default seed reports to loaded state
    ['rep-1', 'rep-2', 'rep-3', 'rep-4', 'rep-5'].forEach((id) => {
      if (!this.validationStates[id]) {
        this.validationStates[id] = 'loaded';
      }
    });

    // Asynchronously load durable operations from IndexedDB where available
    durableStorage.getAllIdempotentOps().then((ops) => {
      if (ops && typeof ops === 'object') {
        Object.values(ops).forEach((entry: any) => {
          if (entry && entry.idempotencyKey) {
            this.durableIdempotencyMap.set(entry.idempotencyKey, entry);
            this.processedIdempotencyKeys.add(entry.idempotencyKey);
          }
        });
      }
    }).catch(() => {});
  }

  private saveToStorage() {
    try {
      localStorage.setItem(VALIDATIONS_STORAGE_KEY, JSON.stringify(this.validations));
      localStorage.setItem(EVIDENCE_STORAGE_KEY, JSON.stringify(this.evidenceList));
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(this.eventsList));
      localStorage.setItem(RESOLUTIONS_STORAGE_KEY, JSON.stringify(this.resolutions));

      const idemObj: Record<string, DurableIdempotencyEntry> = {};
      this.durableIdempotencyMap.forEach((val, key) => {
        idemObj[key] = val;
      });
      localStorage.setItem(IDEMPOTENCY_STORAGE_KEY, JSON.stringify(idemObj));

      // Broadcast update event
      window.dispatchEvent(new CustomEvent('civiceye_community_updated'));
    } catch (e) {
      console.error('Failed to save community validation data to localStorage', e);
    }
  }

  // 1. Get validations for report
  getValidations(reportId: string): CommunityValidationRecord[] {
    return this.validations.filter((v) => v.reportId === reportId);
  }

  // 2. Get active user's validation for report
  getUserValidation(reportId: string, userId: string = 'usr-aditya'): CommunityValidationRecord | undefined {
    return this.validations.find((v) => v.reportId === reportId && v.userId === userId);
  }

  // 3. Submit or toggle community action (Still Exists, Getting Worse, Appears Fixed, Incorrect Report)
  submitValidationAction(params: {
    reportId: string;
    action: CommunityValidationAction;
    userId?: string;
    userName?: string;
    userRole?: 'citizen' | 'authority';
    note?: string;
    idempotencyKey?: string;
    isRetry?: boolean;
    allowToggle?: boolean;
  }): { success: boolean; userAction: CommunityValidationAction | null; message: string } {
    const {
      reportId,
      action,
      note,
      idempotencyKey,
      isRetry = false,
      allowToggle = true,
    } = params;

    // Authenticated identity validation
    const currentSession = authService.getCurrentSessionSync();
    let effectiveUserId = params.userId || 'usr-aditya';
    let effectiveUserName = params.userName || 'Aditya (Citizen Guardian)';
    let effectiveUserRole: 'citizen' | 'authority' = params.userRole || 'citizen';

    if (currentSession && currentSession.user) {
      // Disallow cross-account spoofing
      if (params.userId && params.userId !== currentSession.user.id && currentSession.user.user_metadata?.role === 'citizen') {
        throw new Error('Security Violation: Citizens cannot submit validation votes under another user identity.');
      }
      effectiveUserId = currentSession.user.id;
      effectiveUserName = currentSession.user.user_metadata?.full_name || effectiveUserName;
      effectiveUserRole = currentSession.user.user_metadata?.role === 'authority' ? 'authority' : 'citizen';
    }

    // Strict action enumeration validation
    const VALID_ACTIONS: CommunityValidationAction[] = ['still_exists', 'getting_worse', 'appears_fixed', 'incorrect_report'];
    if (!VALID_ACTIONS.includes(action)) {
      throw new Error(`Validation Error: Invalid community validation action "${action}".`);
    }

    // Durable idempotency check
    if (idempotencyKey) {
      const existingEntry = this.durableIdempotencyMap.get(idempotencyKey);
      if (existingEntry) {
        // Identity binding check
        if (existingEntry.userId !== effectiveUserId) {
          throw new Error(`Security Policy Violation: Idempotency key "${idempotencyKey}" is bound to user "${existingEntry.userId}", not "${effectiveUserId}".`);
        }
        // Payload consistency check
        if (existingEntry.reportId !== reportId || existingEntry.action !== action) {
          throw new Error(`Idempotency Conflict: Reusing idempotency key "${idempotencyKey}" with different payload is rejected.`);
        }
        return {
          success: true,
          userAction: existingEntry.userAction,
          message: 'Idempotent acknowledgement: Validation already processed.',
        };
      }
    }

    const userId = effectiveUserId;
    const userName = effectiveUserName;

    const existingIndex = this.validations.findIndex(
      (v) => v.reportId === reportId && v.userId === effectiveUserId
    );

    const nowStr = 'Just now';
    const nowTime = Date.now();
    let resultingAction: CommunityValidationAction | null = action;
    let message = '';

    if (existingIndex >= 0) {
      const existing = this.validations[existingIndex];
      if (existing.action === action) {
        // If it's a retry or idempotency replay, DO NOT toggle off! Preserve existing vote!
        if (isRetry || idempotencyKey || !allowToggle) {
          const res = {
            success: true,
            userAction: existing.action,
            message: `Validation "${action.replace('_', ' ').toUpperCase()}" is already active.`,
          };
          if (idempotencyKey) {
            this.processedIdempotencyKeys.add(idempotencyKey);
            const entry: DurableIdempotencyEntry = {
              idempotencyKey,
              userId: effectiveUserId,
              reportId,
              action,
              userAction: existing.action,
              timestamp: Date.now(),
              message: res.message,
            };
            this.durableIdempotencyMap.set(idempotencyKey, entry);
            this.saveToStorage();
            durableStorage.saveIdempotentOp(entry).catch(() => {});
          }
          return res;
        }
        // User explicitly clicks the same button to toggle OFF
        this.validations.splice(existingIndex, 1);
        resultingAction = null;
        message = 'Your validation has been removed.';
      } else {
        // Update existing vote to a new action (e.g. changing from still_exists to appears_fixed)
        this.validations[existingIndex] = {
          ...existing,
          action,
          timestamp: nowStr,
          createdAt: nowTime,
          note: note || existing.note,
          idempotencyKey,
        };
        message = `Updated validation to "${action.replace('_', ' ').toUpperCase()}".`;
      }
    } else {
      // Create new validation record
      const newRecord: CommunityValidationRecord = {
        id: `val-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        reportId,
        userId: effectiveUserId,
        userName: effectiveUserName,
        userRole: effectiveUserRole,
        action,
        timestamp: nowStr,
        createdAt: nowTime,
        note,
        idempotencyKey,
      };
      this.validations.push(newRecord);
      message = `Validation "${action.replace('_', ' ').toUpperCase()}" recorded.`;
    }

    if (idempotencyKey) {
      this.processedIdempotencyKeys.add(idempotencyKey);
      const entry: DurableIdempotencyEntry = {
        idempotencyKey,
        userId: effectiveUserId,
        reportId,
        action,
        userAction: resultingAction,
        timestamp: nowTime,
        message,
      };
      this.durableIdempotencyMap.set(idempotencyKey, entry);
      durableStorage.saveIdempotentOp(entry).catch(() => {});
    }

    // Add activity event for timeline
    if (resultingAction) {
      let eventType: CommunityActivityEvent['eventType'] = 'community_confirmation';
      let title = 'Community Validation Recorded';
      let desc = `${userName} marked issue as "${resultingAction.replace('_', ' ')}".`;

      if (resultingAction === 'getting_worse') {
        eventType = 'issue_worsening';
        title = 'Alert: Condition Reported Worsening';
        desc = `${userName} flagged accelerated degradation requiring expedited intervention.`;
        // Send notification to followers
        this.notifyFollowers(
          reportId,
          'advisory',
          'Issue Condition Escalated',
          `A neighbor flagged this issue as worsening. Municipal priority score has adjusted.`
        );
        window.dispatchEvent(
          new CustomEvent('civiceye_issue_worsening', {
            detail: { reportId, userName, note },
          })
        );
      } else if (resultingAction === 'appears_fixed') {
        title = 'Neighbor Reported Hazard Appears Fixed';
        desc = `${userName} reported that on-site conditions appear resolved.`;
      } else if (resultingAction === 'incorrect_report') {
        title = 'Report Accuracy Challenged';
        desc = `${userName} reported this issue as potentially inaccurate or duplicate.`;
      }

      this.eventsList.unshift({
        id: `evt-${Date.now()}`,
        reportId,
        eventType,
        actorType: 'citizen',
        actorName: userName,
        title,
        description: desc,
        timestamp: nowStr,
        createdAt: nowTime,
      });
    }

    this.saveToStorage();

    // Async persist to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      void Promise.resolve(
        supabase.from('community_validations').upsert({
          report_id: reportId,
          user_id: userId,
          user_name: userName,
          action,
          note,
        })
      ).catch((err: unknown) => console.warn('Supabase validation sync error:', err));
    }

    return { success: true, userAction: resultingAction, message };
  }

  // 4. Submit additional evidence (photo, description, condition)
  addAdditionalEvidence(params: {
    reportId: string;
    userId?: string;
    userName?: string;
    photoUrl?: string;
    description: string;
    condition: IssueConditionType;
    locationNote?: string;
  }): { success: boolean; evidence: AdditionalEvidenceRecord } {
    const {
      reportId,
      userId = 'usr-aditya',
      userName = 'Aditya (Citizen Guardian)',
      photoUrl,
      description,
      condition,
      locationNote,
    } = params;

    const newEvidence: AdditionalEvidenceRecord = {
      id: `evi-${Date.now()}`,
      reportId,
      userId,
      userName,
      photoUrl,
      description,
      condition,
      locationNote,
      timestamp: 'Just now',
      createdAt: Date.now(),
    };

    this.evidenceList.unshift(newEvidence);

    // Record activity timeline event
    this.eventsList.unshift({
      id: `evt-${Date.now()}`,
      reportId,
      eventType: 'evidence_added',
      actorType: 'citizen',
      actorName: userName,
      title: 'Additional Field Evidence Submitted',
      description: `${userName} attached photo evidence confirming condition: ${condition}.`,
      timestamp: 'Just now',
      createdAt: Date.now(),
    });

    // Notify issue followers
    this.notifyFollowers(
      reportId,
      'confirmation',
      'New Community Evidence Attached',
      `${userName} added updated ground evidence and condition assessment (${condition}).`
    );

    this.saveToStorage();

    // Async persist to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      void Promise.resolve(
        supabase.from('community_evidence').insert({
          report_id: reportId,
          user_id: userId,
          user_name: userName,
          photo_url: photoUrl,
          description,
          condition,
          location_note: locationNote,
        })
      ).catch((err: unknown) => console.warn('Supabase evidence sync error:', err));
    }

    return { success: true, evidence: newEvidence };
  }

  // 5. Get additional evidence list for report
  getAdditionalEvidence(reportId: string): AdditionalEvidenceRecord[] {
    return this.evidenceList.filter((e) => e.reportId === reportId);
  }

  // 6. Get timeline events for report (chronological)
  getTimelineEvents(reportId: string): CommunityActivityEvent[] {
    return this.eventsList
      .filter((e) => e.reportId === reportId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  // 7. Get resolution status
  getResolutionInfo(reportId: string): ResolutionVerificationInfo {
    if (!this.resolutions[reportId]) {
      this.resolutions[reportId] = {
        reportId,
        isChallenged: false,
        confirmedFixedCount: 0,
        challengeCount: 0,
        reopenedForReview: false,
      };
    }
    return this.resolutions[reportId];
  }

  // 8. Citizen verifies resolution as satisfactory
  verifyResolutionSatisfactory(
    reportId: string,
    _userId: string = 'usr-aditya',
    userName: string = 'Aditya (Citizen Guardian)'
  ): { success: boolean; info: ResolutionVerificationInfo } {
    const info = this.getResolutionInfo(reportId);
    info.confirmedFixedCount += 1;

    this.eventsList.unshift({
      id: `evt-${Date.now()}`,
      reportId,
      eventType: 'report_resolved',
      actorType: 'citizen',
      actorName: userName,
      title: 'Citizen Sign-off Recorded',
      description: `${userName} confirmed the repair has been inspected and meets satisfaction.`,
      timestamp: 'Just now',
      createdAt: Date.now(),
    });

    this.saveToStorage();
    return { success: true, info };
  }

  // 9. Citizen challenges resolution ("Issue Still Exists" / "Substandard Repair")
  challengeResolution(params: {
    reportId: string;
    userId?: string;
    userName?: string;
    reason: string;
    photoUrl?: string;
  }): { success: boolean; info: ResolutionVerificationInfo } {
    const {
      reportId,
      userId = 'usr-aditya',
      userName = 'Aditya (Citizen Guardian)',
      reason,
      photoUrl,
    } = params;

    const info = this.getResolutionInfo(reportId);
    info.isChallenged = true;
    info.challengeCount += 1;
    info.challengedAt = 'Just now';
    info.challengeReason = reason;
    info.challengePhotoUrl = photoUrl;
    info.challengedBy = userName;
    info.reopenedForReview = true;

    // Record resolution challenge event in timeline
    this.eventsList.unshift({
      id: `evt-${Date.now()}-ch`,
      reportId,
      eventType: 'resolution_challenged',
      actorType: 'citizen',
      actorName: userName,
      title: 'Resolution Challenged by Community',
      description: `Citizen filed dispute: "${reason}". Photographic proof provided.`,
      timestamp: 'Just now',
      createdAt: Date.now(),
    });

    // Record reopening event
    this.eventsList.unshift({
      id: `evt-${Date.now()}-ro`,
      reportId,
      eventType: 'reopened_verification',
      actorType: 'official',
      actorName: 'CivicEye Dispatch Protocol',
      title: 'Ticket Reopened for Field Verification',
      description: 'Dispute threshold reached. Ticket reopened and flagged for re-inspection.',
      timestamp: 'Just now',
      createdAt: Date.now() + 10,
    });

    // Notify followers
    this.notifyFollowers(
      reportId,
      'resolution',
      'Resolution Challenged & Reopened',
      `${userName} disputed the official resolution with new evidence. Report reopened for review.`
    );

    // Cross-module trigger: notify Operations Service to reopen work order & return for rework
    window.dispatchEvent(
      new CustomEvent('civiceye_resolution_challenged', {
        detail: {
          reportId,
          citizenName: userName,
          citizenId: userId,
          reason,
          photoUrl,
        },
      })
    );

    this.saveToStorage();
    return { success: true, info };
  }

  // 10. Get community summary statistics
  getCommunitySummary(reportId: string, currentUserId: string = 'usr-aditya') {
    const reportValidations = this.getValidations(reportId);
    const evidenceList = this.getAdditionalEvidence(reportId);

    const stillExists = reportValidations.filter((v) => v.action === 'still_exists').length;
    const gettingWorse = reportValidations.filter((v) => v.action === 'getting_worse').length;
    const appearsFixed = reportValidations.filter((v) => v.action === 'appears_fixed').length;
    const incorrect = reportValidations.filter((v) => v.action === 'incorrect_report').length;
    const total = reportValidations.length;

    const userVal = reportValidations.find((v) => v.userId === currentUserId);

    let lastUpdated = 'No community updates yet';
    if (reportValidations.length > 0) {
      lastUpdated = reportValidations[reportValidations.length - 1].timestamp;
    }

    // Confidence calculation based on community consensus
    let confidence: 'High' | 'Medium' | 'Low' = 'Low';
    if (total >= 10 || evidenceList.length >= 2) {
      confidence = 'High';
    } else if (total >= 3 || evidenceList.length >= 1) {
      confidence = 'Medium';
    }

    return {
      stillExists,
      gettingWorse,
      appearsFixed,
      incorrect,
      total,
      lastUpdated,
      confidence,
      userAction: userVal ? userVal.action : null,
      userNote: userVal?.note,
      evidenceCount: evidenceList.length,
    };
  }

  // Helper: notify followers via custom window event
  private notifyFollowers(
    reportId: string,
    type: 'status_update' | 'assignment' | 'confirmation' | 'resolution' | 'advisory',
    title: string,
    message: string
  ) {
    const notificationPayload = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      message,
      time: 'Just now',
      read: false,
      type,
      relatedReportId: reportId,
    };

    window.dispatchEvent(
      new CustomEvent('civiceye_new_notification', { detail: notificationPayload })
    );
  }

  // Phase 12.3.2: Validation state tracking
  getValidationState(reportId: string): ValidationRetrievalState {
    if (this.validationStates[reportId]) {
      return this.validationStates[reportId];
    }
    const hasRecords = this.validations.some((v) => v.reportId === reportId);
    if (hasRecords) {
      return 'loaded';
    }
    return 'uninitialized';
  }

  setValidationState(reportId: string, state: ValidationRetrievalState): void {
    this.validationStates[reportId] = state;
  }

  hasDurableIdempotencyKey(key: string): boolean {
    return this.durableIdempotencyMap.has(key);
  }

  getDurableIdempotencyRecord(key: string): DurableIdempotencyEntry | undefined {
    return this.durableIdempotencyMap.get(key);
  }

  /**
   * Non-destructive removal of validations and evidence for a specific report (used for demo scenario resets)
   */
  removeValidationsForReport(reportId: string): boolean {
    const beforeVal = this.validations.length;
    this.validations = this.validations.filter((v) => v.reportId !== reportId);
    this.evidenceList = this.evidenceList.filter((e) => e.reportId !== reportId);
    this.eventsList = this.eventsList.filter((ev) => ev.reportId !== reportId);
    delete this.resolutions[reportId];
    delete this.validationStates[reportId];

    // Clear idempotency keys associated with this report so repeat scenario runs re-validate
    const keysToRemove: string[] = [];
    this.durableIdempotencyMap.forEach((entry, key) => {
      if (entry.reportId === reportId) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach((key) => {
      this.durableIdempotencyMap.delete(key);
      this.processedIdempotencyKeys.delete(key);
    });

    if (this.validations.length !== beforeVal || keysToRemove.length > 0) {
      this.saveToStorage();
      window.dispatchEvent(new CustomEvent('civiceye_community_updated'));
      return true;
    }
    return false;
  }
}

export const communityValidationService = new CommunityValidationService();
