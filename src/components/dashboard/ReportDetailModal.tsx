import React, { useEffect, useState } from 'react';
import { DashboardReport, DashboardReportStatus } from '../../types';
import { Badge } from '../common/Badge';
import { getPriorityExplanation } from '../../utils/priorityExplanation';
import { intelligenceEngine, ReportIntelligence } from '../../services/intelligenceEngine';
import { transparencyService } from '../../services/transparencyService';
import { CommunityEvidencePanel } from './CommunityEvidencePanel';
import { CitizenResolutionFeedbackModal } from '../transparency/CitizenResolutionFeedbackModal';
import { SmartReportAnalysisCard } from '../report/SmartReportAnalysisCard';
import {
  X,
  MapPin,
  Calendar,
  Building,
  Users,
  CheckCircle,
  Camera,
  Bookmark,
  BookmarkCheck,
  HelpCircle,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Check,
  Clock,
} from 'lucide-react';

interface ReportDetailModalProps {
  report: DashboardReport | null;
  onClose: () => void;
  isFollowed?: boolean;
  onToggleFollow?: (reportId: string) => void;
  onReportUpdated?: () => void;
}

interface LifecycleStage {
  step: number;
  label: string;
  actor: string;
  timestamp: string;
  detail: string;
  status: 'completed' | 'current' | 'pending';
}

function computeLifecycleStages(report: DashboardReport): LifecycleStage[] {
  const s = report.status as DashboardReportStatus;

  // Status mapping:
  // 'Submitted': step 1 completed, step 2 current, 3-7 pending
  // 'Under Review': step 1-2 completed, step 3 current, 4-7 pending
  // 'Assigned': step 1-3 completed, step 4 current, 5-7 pending
  // 'In Progress': step 1-3 completed, step 4 current, 5-7 pending
  // 'Resolved': step 1-7 all completed

  let completedUpTo = 1;
  let currentStep = 2;

  if (s === 'Submitted') {
    completedUpTo = 1;
    currentStep = 2;
  } else if (s === 'Under Review') {
    completedUpTo = 2;
    currentStep = 3;
  } else if (s === 'Assigned') {
    completedUpTo = 3;
    currentStep = 4;
  } else if (s === 'In Progress') {
    completedUpTo = 3;
    currentStep = 4;
  } else if (s === 'Resolved') {
    completedUpTo = 7;
    currentStep = -1; // all completed
  }

  const getStageStatus = (stageNum: number): 'completed' | 'current' | 'pending' => {
    if (stageNum <= completedUpTo) return 'completed';
    if (stageNum === currentStep) return 'current';
    return 'pending';
  };

  return [
    {
      step: 1,
      label: 'Report Submitted',
      actor: 'Reporting Citizen',
      timestamp: report.reportTimestamp || report.reportDate,
      detail:
        'Citizen filed civic issue with verified GPS coordinates and photographic documentation.',
      status: getStageStatus(1),
    },
    {
      step: 2,
      label: 'Community Validation',
      actor: `${report.confirmationsCount} Ward Residents`,
      timestamp:
        completedUpTo >= 2
          ? 'Validation consensus met'
          : `${report.confirmationsCount} community confirmations`,
      detail:
        report.confirmationsCount > 0
          ? `Ward residents validated the condition on site, boosting municipal prioritization score.`
          : 'Awaiting local resident confirmations via neighborhood Ward Watch.',
      status: getStageStatus(2),
    },
    {
      step: 3,
      label: 'Department Assigned',
      actor: report.departmentAssigned || 'GHMC Municipal Engineering',
      timestamp: completedUpTo >= 3 ? 'Work order issued' : 'Pending department routing',
      detail:
        completedUpTo >= 3
          ? `Routed to ${report.departmentAssigned}. Internal municipal work order created.`
          : 'Triage team reviewing categorization before dispatching to division department.',
      status: getStageStatus(3),
    },
    {
      step: 4,
      label: 'Work In Progress',
      actor: report.handlingOfficer
        ? `Field Unit (${report.handlingOfficer})`
        : 'Dispatched Field Crew',
      timestamp:
        s === 'In Progress'
          ? 'Active crew on site'
          : completedUpTo >= 4
          ? 'Work completed'
          : 'Pending crew dispatch',
      detail:
        s === 'In Progress'
          ? 'Municipal field squad is actively on site executing civil rectification.'
          : completedUpTo >= 4
          ? 'On-site maintenance and repairs successfully completed.'
          : 'Awaiting maintenance slot in municipal field schedule.',
      status: getStageStatus(4),
    },
    {
      step: 5,
      label: 'Resolution Evidence Added',
      actor: 'Field Inspector',
      timestamp: completedUpTo >= 5 ? 'Evidence verified' : 'Pending work completion',
      detail:
        completedUpTo >= 5
          ? 'Field officer uploaded post-resolution photo and structural completion certificate.'
          : 'Resolution evidence will be captured and uploaded upon work completion.',
      status: getStageStatus(5),
    },
    {
      step: 6,
      label: 'Citizen Verification',
      actor: 'Ward Community & Reporter',
      timestamp:
        completedUpTo >= 6 ? 'Citizen sign-off recorded' : 'Awaiting evidence upload',
      detail:
        completedUpTo >= 6
          ? 'Community review period passed with 0 unresolved disputes.'
          : 'Local residents can inspect resolution quality once repair evidence is submitted.',
      status: getStageStatus(6),
    },
    {
      step: 7,
      label: 'Resolved',
      actor: 'Municipal Administration',
      timestamp: completedUpTo >= 7 ? 'Ticket archived' : 'Pending final closure',
      detail:
        completedUpTo >= 7
          ? 'Official resolution record closed and archived in GHMC civic registry.'
          : 'Official closure order executed once citizen verification window completes.',
      status: getStageStatus(7),
    },
  ];
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  isFollowed = false,
  onToggleFollow,
  onReportUpdated,
}) => {
  const [showPriorityExplanation, setShowPriorityExplanation] = useState(false);
  const [citizenVerified, setCitizenVerified] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [intelligence, setIntelligence] = useState<ReportIntelligence | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (report) {
      intelligenceEngine.analyzeReport(report).then((data) => {
        if (isMounted) setIntelligence(data);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [report]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!report) return null;

  const isResolved = report.status === 'Resolved';
  const stages = computeLifecycleStages(report);
  const priorityInfo = getPriorityExplanation({
    severity: report.severity,
    category: report.category,
    confirmationsCount: report.confirmationsCount,
    title: report.title,
    description: report.description,
    location: report.location,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#181C1A]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl bg-white border border-[#E4E6E2] rounded-xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 my-6">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E4E6E2] bg-[#F5F5F2]">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="font-bold text-[#315C4C]">{report.ticketNumber}</span>
            <span className="text-[#E4E6E2]">|</span>
            <span className="text-[#737773]">{report.category}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Follow / Following Action Button */}
            {onToggleFollow && (
              <button
                type="button"
                onClick={() => onToggleFollow(report.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1.5 transition-all ${
                  isFollowed
                    ? 'bg-[#DDE7DF] text-[#315C4C] border-[#315C4C]/40 font-semibold shadow-xs'
                    : 'bg-white border-[#E4E6E2] text-[#171918] hover:bg-[#F5F5F2]'
                }`}
                title={
                  isFollowed
                    ? 'Unfollow this issue'
                    : 'Follow to receive updates without filing a duplicate ticket'
                }
              >
                {isFollowed ? (
                  <>
                    <BookmarkCheck size={13} className="text-[#315C4C]" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <Bookmark size={13} className="text-[#737773]" />
                    <span>Follow Issue</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2] transition-colors focus:outline-none"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Header Row */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <Badge status={report.status} dot size="md" />
              <Badge severity={report.severity} dot size="md" />
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#F5F5F2] border border-[#E4E6E2] text-[#737773]">
                {report.neighborhood}
              </span>

              {/* Priority Explanation Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPriorityExplanation((prev) => !prev)}
                className="ml-auto inline-flex items-center gap-1.5 text-xs font-mono text-[#315C4C] hover:text-[#26483B] px-2 py-0.5 rounded border border-[#315C4C]/20 hover:border-[#315C4C]/40 bg-[#DDE7DF]/30 transition-colors"
              >
                <HelpCircle size={12} />
                <span>Why this priority?</span>
                {showPriorityExplanation ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171918] leading-snug">
              {report.title}
            </h2>
          </div>

          {/* FEATURE 3: PUBLIC REPORT STATUS EXPLANATION */}
          {(() => {
            const explanation = transparencyService.getStatusExplanation(report.status);
            return (
              <div className="p-3.5 rounded-lg border border-[#E4E6E2] bg-[#FAFBF9] space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#315C4C] flex items-center gap-1.5">
                    <Info size={13} />
                    <span>Public Status Assessment: {explanation.title}</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#737773]">{explanation.estimatedWindow}</span>
                </div>
                <p className="text-[#171918] leading-relaxed text-[11px]">{explanation.description}</p>
                <div className="pt-1.5 border-t border-[#E4E6E2]/70 flex items-center gap-1.5 text-[10px] font-mono text-[#737773]">
                  <span className="font-semibold text-[#171918]">Next Municipal Action:</span>
                  <span>{explanation.nextAction}</span>
                </div>
              </div>
            );
          })()}

          {/* Priority Explanation Card (Collapsible) */}
          {showPriorityExplanation && (
            <div className="p-4 rounded-xl border border-[#315C4C]/30 bg-[#FAFBF9] space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#E4E6E2]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#315C4C]" />
                  <span className="text-xs font-mono uppercase tracking-wider text-[#315C4C] font-semibold">
                    Deterministic Priority Audit
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#737773]">
                  MUNICIPAL RULE ENGINE
                </span>
              </div>

              <div className="text-xs text-[#171918] bg-white p-3 rounded-lg border border-[#E4E6E2]">
                <div className="flex items-center gap-1.5 font-semibold text-[#315C4C] mb-1">
                  <Info size={13} />
                  <span>Assessment Rationale</span>
                </div>
                <p className="text-[#737773] leading-relaxed">
                  {priorityInfo.explanation}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded bg-white border border-[#E4E6E2]">
                  <div className="flex items-center gap-1 font-mono text-[10px] uppercase text-[#C58B36] font-semibold mb-1">
                    <AlertTriangle size={11} />
                    <span>Safety Considerations</span>
                  </div>
                  <p className="text-[11px] text-[#737773] leading-snug">
                    {priorityInfo.safetyConsideration}
                  </p>
                </div>

                <div className="p-2.5 rounded bg-white border border-[#E4E6E2]">
                  <div className="flex items-center gap-1 font-mono text-[10px] uppercase text-[#315C4C] font-semibold mb-1">
                    <Users size={11} />
                    <span>Public Transit Impact</span>
                  </div>
                  <p className="text-[11px] text-[#737773] leading-snug">
                    {priorityInfo.publicImpact}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="font-mono text-[10px] uppercase text-[#737773] block">
                  Deterministic Factors Log:
                </span>
                {priorityInfo.factors.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-[11px] text-[#171918]"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#315C4C] mt-1.5 flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#E4E6E2] text-[10px] font-mono text-[#737773]">
                Transparency Rule: Civic dispatch queue is strictly prioritized by safety risk, infrastructure severity, and community validation.
              </div>
            </div>
          )}

          {/* 4 Distinct Evidence Classification Badreadouts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
            <div className="p-2.5 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2]">
              <span className="text-[#737773] block uppercase text-[9px]">1. CITIZEN REPORTED</span>
              <span className="font-bold text-[#171918]">{report.severity.toUpperCase()}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FAF5ED]/70 border border-[#C58B36]/30">
              <span className="text-[#C58B36] block uppercase text-[9px]">2. AI RISK SCORE</span>
              <span className="font-bold text-[#C58B36]">{intelligence ? `${intelligence.riskScore}/100` : 'CALCULATING...'}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#DDE7DF]/50 border border-[#315C4C]/25">
              <span className="text-[#315C4C] block uppercase text-[9px]">3. COMMUNITY CITATIONS</span>
              <span className="font-bold text-[#315C4C]">{report.confirmationsCount} Neighbors</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2]">
              <span className="text-[#737773] block uppercase text-[9px]">4. OFFICIAL STATUS</span>
              <span className="font-bold text-[#171918]">{report.status.toUpperCase()}</span>
            </div>
          </div>

          {/* SMART CIVIC INTELLIGENCE ENGINE & CORRIDOR RELATIONSHIPS (PHASE 9) */}
          {intelligence && (
            <SmartReportAnalysisCard
              report={report}
              intelligence={intelligence}
            />
          )}

          {/* Meta Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-xs">
            <div className="flex items-start gap-2">
              <MapPin size={15} className="text-[#315C4C] mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-mono text-[10px] text-[#737773] block uppercase">
                  Location
                </span>
                <span className="font-medium text-[#171918]">{report.location}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar size={15} className="text-[#315C4C] mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-mono text-[10px] text-[#737773] block uppercase">
                  Reported On
                </span>
                <span className="font-medium text-[#171918]">
                  {report.reportTimestamp || report.reportDate}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:col-span-2">
              <Building size={15} className="text-[#315C4C] mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-mono text-[10px] text-[#737773] block uppercase">
                  Assigned Authority
                </span>
                <span className="font-medium text-[#171918]">
                  {report.departmentAssigned}
                </span>
                {report.handlingOfficer && (
                  <span className="text-[11px] text-[#737773] block font-mono">
                    Officer In Charge: {report.handlingOfficer}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#171918] mb-2">
              Citizen Observation Description
            </h3>
            <p className="text-sm text-[#737773] leading-relaxed bg-white p-4 rounded-lg border border-[#E4E6E2]">
              {report.description}
            </p>
          </div>

          {/* Photographic Evidence Section */}
          <div>
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#171918] mb-2 flex items-center justify-between">
              <span>Attached Citizen Evidence</span>
              <span className="text-[#315C4C] text-[10px] font-mono">GEO-HASH VERIFIED</span>
            </h3>
            <div className="p-4 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-white border border-[#E4E6E2] flex items-center justify-center text-[#315C4C]">
                  <Camera size={18} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#171918]">
                    Municipal Photo Capture #01
                  </div>
                  <div className="text-[11px] text-[#737773] font-mono">
                    {report.evidenceNote || 'High-resolution field photo with GPS metadata'}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-white border border-[#E4E6E2] text-xs font-mono text-[#315C4C] font-semibold">
                Verified
              </span>
            </div>
          </div>

          {/* RESOLUTION EVIDENCE (Only if report is Resolved) */}
          {isResolved ? (
            <div className="p-4 rounded-xl border border-[#315C4C]/40 bg-[#DDE7DF]/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#315C4C]" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#315C4C]">
                    Municipal Resolution Evidence & Inspection
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#315C4C] text-white text-[10px] font-mono font-semibold">
                  OFFICIALLY RESOLVED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Before Photo Box */}
                <div className="p-3 rounded-lg bg-white border border-[#E4E6E2]">
                  <div className="text-[10px] font-mono uppercase text-[#737773] mb-1">
                    Before Repair (Reported)
                  </div>
                  <div className="aspect-video bg-[#F5F5F2] rounded border border-[#E4E6E2] flex flex-col items-center justify-center text-[#737773] p-2">
                    <Camera size={20} className="mb-1 opacity-50" />
                    <span className="text-[10px] font-mono">Initial Hazard Capture</span>
                    <span className="text-[9px] text-[#737773]">{report.reportDate}</span>
                  </div>
                </div>

                {/* After Photo Box */}
                <div className="p-3 rounded-lg bg-white border border-[#315C4C]/30">
                  <div className="text-[10px] font-mono uppercase text-[#315C4C] font-semibold mb-1">
                    After Repair (Completion Proof)
                  </div>
                  <div className="aspect-video bg-[#DDE7DF]/30 rounded border border-[#315C4C]/20 flex flex-col items-center justify-center text-[#315C4C] p-2">
                    <CheckCircle size={20} className="mb-1" />
                    <span className="text-[10px] font-mono font-bold">Field Rectification Verified</span>
                    <span className="text-[9px] font-mono text-[#315C4C]/80">Stamp #GHMC-FIX-982</span>
                  </div>
                </div>
              </div>

              {/* Completion Field Officer Note */}
              <div className="p-3 rounded-lg bg-white border border-[#E4E6E2] text-xs">
                <span className="font-mono text-[10px] uppercase text-[#737773] block mb-0.5">
                  Field Engineer Completion Note
                </span>
                <p className="text-[#171918] leading-relaxed">
                  "Excavation and asphalt patching completed as per municipal grade standards. Drainage crossway cleared and water pressure test verified normal. Site cleaned and reopened for regular public transit."
                </p>
                <div className="mt-2 pt-2 border-t border-[#E4E6E2] flex flex-wrap items-center justify-between text-[10px] font-mono text-[#737773]">
                  <span>Inspected by: {report.handlingOfficer || 'GHMC Senior Field Inspector'}</span>
                  <span className="text-[#315C4C]">GEO-TAGGED & SIGNED</span>
                </div>
              </div>

              {/* FEATURE 7 & 8: CITIZEN RESOLUTION VERIFICATION & FEEDBACK */}
              <div className="p-4 rounded-lg bg-white border border-[#E4E6E2] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-[#171918] block">
                      Citizen Verification & Quality Feedback
                    </span>
                    <span className="text-[11px] text-[#737773]">
                      {citizenVerified
                        ? '✓ Verification recorded in municipal accountability ledger.'
                        : 'Have you visited the site? Rate the fix or submit a challenge if the hazard persists.'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFeedbackModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-md bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] flex items-center justify-center gap-1.5 transition-colors shrink-0"
                  >
                    <Check size={13} />
                    <span>{citizenVerified ? 'Update Feedback' : 'Verify & Rate Resolution'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Phase 5: Community Validation & Collective Intelligence Panel */}
          <CommunityEvidencePanel report={report} onReportUpdated={onReportUpdated} />

          {/* Enhanced 7-Stage Report Lifecycle Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#171918]">
                  7-Stage Civic Resolution Lifecycle
                </h3>
                <p className="text-[11px] text-[#737773]">
                  Transparent municipal workflow tracking each phase from filing to archival.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#315C4C] font-medium flex-shrink-0">
                SLA Tracked
              </span>
            </div>

            <div className="relative border-l-2 border-[#E4E6E2] ml-3 sm:ml-4 pl-4 sm:pl-6 space-y-4 py-1">
              {stages.map((stage) => {
                const isCompleted = stage.status === 'completed';
                const isCurrent = stage.status === 'current';

                return (
                  <div key={stage.step} className="relative group">
                    {/* Step Indicator on vertical line */}
                    <div
                      className={`absolute -left-[25px] sm:-left-[33px] top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                        isCompleted
                          ? 'bg-[#315C4C] text-white'
                          : isCurrent
                          ? 'bg-[#C58B36] text-white ring-4 ring-[#FAF5ED]'
                          : 'bg-[#F5F5F2] text-[#737773] border border-[#E4E6E2]'
                      }`}
                    >
                      {isCompleted ? <Check size={11} strokeWidth={3} /> : stage.step}
                    </div>

                    {/* Step Card Content */}
                    <div
                      className={`p-3.5 rounded-lg border transition-all ${
                        isCurrent
                          ? 'bg-[#FAF5ED] border-[#C58B36]/50 shadow-xs'
                          : isCompleted
                          ? 'bg-white border-[#E4E6E2]'
                          : 'bg-[#F5F5F2]/40 border-dashed border-[#E4E6E2] opacity-60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold ${
                              isCurrent
                                ? 'text-[#C58B36]'
                                : isCompleted
                                ? 'text-[#171918]'
                                : 'text-[#737773]'
                            }`}
                          >
                            {stage.step}. {stage.label}
                          </span>

                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-[#C58B36] text-white font-semibold animate-pulse">
                              Active Stage
                            </span>
                          )}

                          {isCompleted && (
                            <span className="text-[10px] font-mono text-[#315C4C]">
                              ✓ Done
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-[#737773]">
                          {stage.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#737773] leading-relaxed mb-1.5">
                        {stage.detail}
                      </p>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#737773]">
                        <span className="text-[#315C4C]">Responsible:</span>
                        <span>{stage.actor}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Community Activity Summary */}
          <div className="pt-4 border-t border-[#E4E6E2] flex items-center justify-between text-xs text-[#737773]">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#315C4C]" />
              <span className="font-medium text-[#171918]">
                {report.confirmationsCount} Community Confirmations
              </span>
              <span>across {report.neighborhood}</span>
            </div>

            <span className="font-mono text-[10px] text-[#315C4C] flex items-center gap-1">
              <Clock size={11} />
              <span>DETERMINISTIC PRIORITY ACTIVE</span>
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#F5F5F2] border-t border-[#E4E6E2] flex items-center justify-between">
          <div className="text-[11px] text-[#737773] font-mono">
            TICKET: {report.ticketNumber}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#315C4C] text-white text-xs font-medium hover:bg-[#26483B] transition-colors"
          >
            Close Detail
          </button>
        </div>
        {/* Phase 8 Citizen Resolution Feedback Modal */}
        {feedbackModalOpen && (
          <CitizenResolutionFeedbackModal
            report={report}
            isOpen={feedbackModalOpen}
            onClose={() => setFeedbackModalOpen(false)}
            onSubmitted={() => {
              setCitizenVerified(true);
              if (onReportUpdated) onReportUpdated();
            }}
          />
        )}
      </div>
    </div>
  );
};
