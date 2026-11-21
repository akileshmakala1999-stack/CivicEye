import React, { useState, useEffect, useRef } from 'react';
import {
  DashboardReport,
  CommunityValidationAction,
  IssueConditionType,
  AdditionalEvidenceRecord,
  CommunityActivityEvent,
  ResolutionVerificationInfo,
} from '../../types';
import { communityValidationService } from '../../services/communityValidationService';
import {
  Users,
  CheckCircle2,
  Flame,
  AlertTriangle,
  Flag,
  Camera,
  Plus,
  ShieldCheck,
  Check,
  X,
  Upload,
} from 'lucide-react';

interface CommunityEvidencePanelProps {
  report: DashboardReport;
  onReportUpdated?: () => void;
}

export const CommunityEvidencePanel: React.FC<CommunityEvidencePanelProps> = ({
  report,
  onReportUpdated,
}) => {
  // Summary & validation states
  const [summary, setSummary] = useState(() =>
    communityValidationService.getCommunitySummary(report.id)
  );
  const [evidenceList, setEvidenceList] = useState<AdditionalEvidenceRecord[]>(() =>
    communityValidationService.getAdditionalEvidence(report.id)
  );
  const [timelineEvents, setTimelineEvents] = useState<CommunityActivityEvent[]>(() =>
    communityValidationService.getTimelineEvents(report.id)
  );
  const [resolutionInfo, setResolutionInfo] = useState<ResolutionVerificationInfo>(() =>
    communityValidationService.getResolutionInfo(report.id)
  );

  // Interaction states
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Evidence submission form state
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceCondition, setEvidenceCondition] = useState<IssueConditionType>('Deteriorated');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceLocationNote, setEvidenceLocationNote] = useState('');
  const [evidencePhotoPreview, setEvidencePhotoPreview] = useState<string | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);

  // Challenge resolution form state
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeReason, setChallengeReason] = useState('');
  const [challengePhotoPreview, setChallengePhotoPreview] = useState<string | null>(null);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const challengeFileInputRef = useRef<HTMLInputElement>(null);

  const isResolved = report.status === 'Resolved';

  // Refresh data function
  const refreshData = () => {
    setSummary(communityValidationService.getCommunitySummary(report.id));
    setEvidenceList(communityValidationService.getAdditionalEvidence(report.id));
    setTimelineEvents(communityValidationService.getTimelineEvents(report.id));
    setResolutionInfo(communityValidationService.getResolutionInfo(report.id));
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener('civiceye_community_updated', handleUpdate);
    return () => window.removeEventListener('civiceye_community_updated', handleUpdate);
  }, [report.id]);

  // Handle community validation click
  const handleActionClick = (action: CommunityValidationAction) => {
    if (isSubmittingAction) return;
    setIsSubmittingAction(true);

    const result = communityValidationService.submitValidationAction({
      reportId: report.id,
      action,
      userId: 'usr-aditya',
      userName: 'Aditya (Citizen Guardian)',
      userRole: 'citizen',
    });

    setActiveFeedback(result.message);
    setTimeout(() => setActiveFeedback(null), 3500);

    refreshData();
    if (onReportUpdated) onReportUpdated();
    setIsSubmittingAction(false);
  };

  // Handle file preview
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, isChallenge = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (isChallenge) setChallengeError('Please select a valid image file (JPEG, PNG, WebP).');
      else setEvidenceError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      if (isChallenge) setChallengeError('Image size exceeds 5MB limit.');
      else setEvidenceError('Image size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (isChallenge) {
        setChallengePhotoPreview(url);
        setChallengeError(null);
      } else {
        setEvidencePhotoPreview(url);
        setEvidenceError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit additional evidence
  const handleSubmitEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceDescription.trim()) {
      setEvidenceError('Please provide a brief description of what you observed.');
      return;
    }

    setIsSubmittingEvidence(true);
    setEvidenceError(null);

    communityValidationService.addAdditionalEvidence({
      reportId: report.id,
      userId: 'usr-aditya',
      userName: 'Aditya (Citizen Guardian)',
      description: evidenceDescription.trim(),
      condition: evidenceCondition,
      locationNote: evidenceLocationNote.trim() || undefined,
      photoUrl: evidencePhotoPreview || undefined,
    });

    // Reset form
    setEvidenceDescription('');
    setEvidenceLocationNote('');
    setEvidencePhotoPreview(null);
    setShowEvidenceForm(false);
    setIsSubmittingEvidence(false);
    setActiveFeedback('✓ Additional ground evidence successfully submitted and linked.');
    setTimeout(() => setActiveFeedback(null), 3500);

    refreshData();
    if (onReportUpdated) onReportUpdated();
  };

  // Handle resolution verification sign-off
  const handleConfirmFixed = () => {
    communityValidationService.verifyResolutionSatisfactory(
      report.id,
      'usr-aditya',
      'Aditya (Citizen Guardian)'
    );
    setActiveFeedback('✓ You verified this repair as satisfactory. +20 Civic Trust points earned!');
    setTimeout(() => setActiveFeedback(null), 3500);
    refreshData();
    if (onReportUpdated) onReportUpdated();
  };

  // Submit resolution challenge
  const handleSubmitChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeReason.trim()) {
      setChallengeError('Please detail why this issue is not satisfactorily resolved.');
      return;
    }

    setIsSubmittingChallenge(true);
    setChallengeError(null);

    communityValidationService.challengeResolution({
      reportId: report.id,
      userId: 'usr-aditya',
      userName: 'Aditya (Citizen Guardian)',
      reason: challengeReason.trim(),
      photoUrl: challengePhotoPreview || undefined,
    });

    setShowChallengeForm(false);
    setChallengeReason('');
    setChallengePhotoPreview(null);
    setIsSubmittingChallenge(false);

    setActiveFeedback('⚠️ Resolution successfully challenged! Ticket reopened for re-inspection.');
    setTimeout(() => setActiveFeedback(null), 4000);

    refreshData();
    if (onReportUpdated) onReportUpdated();
  };

  return (
    <div className="space-y-6 pt-3">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E4E6E2]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#DDE7DF] border border-[#315C4C]/20 flex items-center justify-center text-[#315C4C]">
            <Users size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[#171918]">
              Community Evidence & Collective Intelligence
            </h3>
            <p className="text-[11px] text-[#737773]">
              Decentralized citizen verification, status tracking, and ground observations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FAF5ED] border border-[#C58B36]/30 text-[#C58B36] font-semibold">
            Consensus: {summary.confidence}
          </span>
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {activeFeedback && (
        <div className="p-3 rounded-lg bg-[#DDE7DF] border border-[#315C4C]/40 text-xs font-semibold text-[#315C4C] flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-150">
          <span>{activeFeedback}</span>
          <span className="text-[10px] font-mono uppercase text-[#315C4C]/70">Audited</span>
        </div>
      )}

      {/* 4 COMMUNITY ACTION BUTTONS */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#171918]">
            Vote / Confirm Condition
          </span>
          <span className="text-[10px] text-[#737773] font-mono">
            {summary.userAction ? 'Click active vote to withdraw' : '1 vote per verified citizen'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Action 1: Still Exists */}
          <button
            type="button"
            onClick={() => handleActionClick('still_exists')}
            className={`p-3 rounded-lg border text-left transition-all duration-150 flex flex-col justify-between ${
              summary.userAction === 'still_exists'
                ? 'bg-[#DDE7DF] border-[#315C4C] shadow-xs ring-1 ring-[#315C4C]'
                : 'bg-white border-[#E4E6E2] hover:border-[#315C4C]/40 hover:bg-[#F5F5F2]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-1.5 rounded bg-[#F5F5F2] text-[#315C4C]">
                <CheckCircle2 size={14} />
              </span>
              <span className="font-mono text-xs font-bold text-[#171918]">
                {summary.stillExists}
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-[#171918]">Still Exists</div>
              <div className="text-[10px] text-[#737773] leading-tight">Hazard active</div>
            </div>
          </button>

          {/* Action 2: Getting Worse */}
          <button
            type="button"
            onClick={() => handleActionClick('getting_worse')}
            className={`p-3 rounded-lg border text-left transition-all duration-150 flex flex-col justify-between ${
              summary.userAction === 'getting_worse'
                ? 'bg-[#FAF0EF] border-[#B8463B] shadow-xs ring-1 ring-[#B8463B]'
                : 'bg-white border-[#E4E6E2] hover:border-[#B8463B]/40 hover:bg-[#FAF0EF]/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-1.5 rounded bg-[#FAF0EF] text-[#B8463B]">
                <Flame size={14} />
              </span>
              <span className="font-mono text-xs font-bold text-[#B8463B]">
                {summary.gettingWorse}
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-[#B8463B]">Getting Worse</div>
              <div className="text-[10px] text-[#737773] leading-tight">Escalate priority</div>
            </div>
          </button>

          {/* Action 3: Appears Fixed */}
          <button
            type="button"
            onClick={() => handleActionClick('appears_fixed')}
            className={`p-3 rounded-lg border text-left transition-all duration-150 flex flex-col justify-between ${
              summary.userAction === 'appears_fixed'
                ? 'bg-[#DDE7DF] border-[#315C4C] shadow-xs ring-1 ring-[#315C4C]'
                : 'bg-white border-[#E4E6E2] hover:border-[#315C4C]/40 hover:bg-[#F5F5F2]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-1.5 rounded bg-[#DDE7DF]/50 text-[#315C4C]">
                <Check size={14} />
              </span>
              <span className="font-mono text-xs font-bold text-[#315C4C]">
                {summary.appearsFixed}
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-[#171918]">Appears Fixed</div>
              <div className="text-[10px] text-[#737773] leading-tight">Work observed</div>
            </div>
          </button>

          {/* Action 4: Incorrect Report */}
          <button
            type="button"
            onClick={() => handleActionClick('incorrect_report')}
            className={`p-3 rounded-lg border text-left transition-all duration-150 flex flex-col justify-between ${
              summary.userAction === 'incorrect_report'
                ? 'bg-[#FAF5ED] border-[#C58B36] shadow-xs ring-1 ring-[#C58B36]'
                : 'bg-white border-[#E4E6E2] hover:border-[#C58B36]/40 hover:bg-[#FAF5ED]/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-1.5 rounded bg-[#FAF5ED] text-[#C58B36]">
                <Flag size={14} />
              </span>
              <span className="font-mono text-xs font-bold text-[#C58B36]">
                {summary.incorrect}
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-[#171918]">Incorrect Report</div>
              <div className="text-[10px] text-[#737773] leading-tight">Spam / wrong spot</div>
            </div>
          </button>
        </div>
      </div>

      {/* RESOLUTION VERIFICATION & CHALLENGE WORKFLOW (IF REPORT IS RESOLVED) */}
      {isResolved && (
        <div className="p-4 rounded-xl border border-[#315C4C]/40 bg-[#FAFBF9] space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#E4E6E2]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#315C4C]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#315C4C]">
                Resolution Verification Consensus
              </span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                resolutionInfo.isChallenged
                  ? 'bg-[#FAF0EF] text-[#B8463B] border border-[#B8463B]/30'
                  : 'bg-[#DDE7DF] text-[#315C4C] border border-[#315C4C]/30'
              }`}
            >
              {resolutionInfo.isChallenged
                ? 'RESOLUTION CHALLENGED'
                : 'OFFICIAL REPAIR SIGN-OFF'}
            </span>
          </div>

          {/* If resolution is challenged banner */}
          {resolutionInfo.isChallenged ? (
            <div className="p-3.5 rounded-lg bg-[#FAF0EF] border border-[#B8463B]/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#B8463B]">
                <AlertTriangle size={15} />
                <span>Ticket Reopened: Community Dispute Registered</span>
              </div>
              <p className="text-xs text-[#171918] leading-relaxed">
                "{resolutionInfo.challengeReason}"
              </p>
              <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-[#737773] pt-1 border-t border-[#B8463B]/20">
                <span>Challenged by: {resolutionInfo.challengedBy || 'Citizen Observer'}</span>
                <span>Timestamp: {resolutionInfo.challengedAt || 'Recent'}</span>
              </div>
              {resolutionInfo.challengePhotoUrl && (
                <div className="pt-2">
                  <span className="text-[10px] font-mono text-[#737773] block mb-1">
                    Dispute Photographic Proof:
                  </span>
                  <img
                    src={resolutionInfo.challengePhotoUrl}
                    alt="Dispute evidence"
                    className="max-h-36 rounded border border-[#E4E6E2] object-cover"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-white border border-[#E4E6E2] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-semibold text-[#171918] block">
                    Have you personally inspected this location?
                  </span>
                  <span className="text-[11px] text-[#737773]">
                    {resolutionInfo.confirmedFixedCount} citizens have verified satisfactory repair.
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleConfirmFixed}
                    className="px-3 py-1.5 rounded-md bg-[#315C4C] text-white text-xs font-medium hover:bg-[#26483B] flex items-center gap-1.5 transition-colors"
                  >
                    <Check size={13} />
                    <span>Confirm Fixed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowChallengeForm((p) => !p)}
                    className="px-3 py-1.5 rounded-md bg-white border border-[#B8463B]/40 text-[#B8463B] text-xs font-medium hover:bg-[#FAF0EF] flex items-center gap-1.5 transition-colors"
                  >
                    <AlertTriangle size={13} />
                    <span>Challenge Resolution</span>
                  </button>
                </div>
              </div>

              {/* Challenge Dispute Form */}
              {showChallengeForm && (
                <form
                  onSubmit={handleSubmitChallenge}
                  className="mt-3 pt-3 border-t border-[#E4E6E2] space-y-3 animate-in fade-in duration-150"
                >
                  <div className="text-xs font-semibold text-[#B8463B] flex items-center gap-1.5">
                    <AlertTriangle size={13} />
                    <span>File Resolution Challenge Dispute</span>
                  </div>

                  {challengeError && (
                    <div className="p-2 rounded bg-[#FAF0EF] text-[#B8463B] text-xs">
                      {challengeError}
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                      Reason for Dispute / Hazard Persisting *
                    </label>
                    <textarea
                      value={challengeReason}
                      onChange={(e) => setChallengeReason(e.target.value)}
                      rows={2}
                      placeholder="Explain what is still broken, substandard patch work, debris left behind, or recurring hazard..."
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E4E6E2] focus:border-[#B8463B] focus:ring-1 focus:ring-[#B8463B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                      Optional Photo Proof of Unresolved Hazard
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => challengeFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded border border-[#E4E6E2] bg-[#F5F5F2] hover:bg-white text-xs text-[#171918] flex items-center gap-1.5 transition-colors"
                      >
                        <Camera size={13} />
                        <span>Select Photo</span>
                      </button>
                      <input
                        type="file"
                        ref={challengeFileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoSelect(e, true)}
                      />
                      {challengePhotoPreview && (
                        <div className="flex items-center gap-2">
                          <img
                            src={challengePhotoPreview}
                            alt="Preview"
                            className="w-8 h-8 rounded object-cover border border-[#E4E6E2]"
                          />
                          <button
                            type="button"
                            onClick={() => setChallengePhotoPreview(null)}
                            className="text-[#737773] hover:text-[#B8463B]"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowChallengeForm(false)}
                      className="px-3 py-1.5 rounded text-xs text-[#737773] hover:text-[#171918]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingChallenge}
                      className="px-3.5 py-1.5 rounded bg-[#B8463B] text-white text-xs font-semibold hover:bg-[#97362C] transition-colors"
                    >
                      {isSubmittingChallenge ? 'Filing Challenge...' : 'Submit Dispute'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* ADDITIONAL EVIDENCE SECTION */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#171918]">
              Ground Evidence & Photo Updates ({evidenceList.length})
            </h4>
            <p className="text-[11px] text-[#737773]">
              Supplementary observations filed by neighborhood residents. Original report remains preserved.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowEvidenceForm((p) => !p)}
            className="px-2.5 py-1.5 rounded-md border border-[#315C4C]/30 bg-[#DDE7DF]/40 hover:bg-[#DDE7DF] text-xs font-medium text-[#315C4C] flex items-center gap-1.5 transition-colors"
          >
            {showEvidenceForm ? <X size={12} /> : <Plus size={12} />}
            <span>{showEvidenceForm ? 'Close Form' : 'Add Ground Evidence'}</span>
          </button>
        </div>

        {/* Evidence Submission Form Accordion */}
        {showEvidenceForm && (
          <form
            onSubmit={handleSubmitEvidence}
            className="mb-4 p-4 rounded-xl border border-[#315C4C]/30 bg-white space-y-3.5 shadow-xs animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E6E2]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#315C4C]">
                <Camera size={14} />
                <span>Upload Ground Verification Evidence</span>
              </div>
              <span className="text-[10px] font-mono text-[#737773]">
                SEPARATE RECORD • SAFEGUARDS ORIGINAL
              </span>
            </div>

            {evidenceError && (
              <div className="p-2.5 rounded-md bg-[#FAF0EF] border border-[#B8463B]/30 text-xs text-[#B8463B]">
                {evidenceError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                  Observed Condition *
                </label>
                <select
                  value={evidenceCondition}
                  onChange={(e) => setEvidenceCondition(e.target.value as IssueConditionType)}
                  className="w-full text-xs p-2 rounded-lg border border-[#E4E6E2] bg-white text-[#171918] focus:border-[#315C4C] outline-none"
                >
                  <option value="Deteriorated">Deteriorated / Worsened</option>
                  <option value="Unchanged">Unchanged / Still Active</option>
                  <option value="Partially Repaired">Partially Repaired</option>
                  <option value="Hazard Cleared">Hazard Cleared / Fixed</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                  Location Note (Optional)
                </label>
                <input
                  type="text"
                  value={evidenceLocationNote}
                  onChange={(e) => setEvidenceLocationNote(e.target.value)}
                  placeholder="e.g. Near bus stop, north pavement"
                  className="w-full text-xs p-2 rounded-lg border border-[#E4E6E2] text-[#171918] focus:border-[#315C4C] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                Detailed Observation Notes *
              </label>
              <textarea
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                rows={2}
                placeholder="Describe current on-site changes, measurements, vehicle hazards, or maintenance crew activities..."
                className="w-full text-xs p-2.5 rounded-lg border border-[#E4E6E2] focus:border-[#315C4C] focus:ring-1 focus:ring-[#315C4C] outline-none text-[#171918]"
              />
            </div>

            {/* Photo upload input */}
            <div>
              <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                Attach High-Resolution Photo (Optional)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2] hover:bg-white text-xs font-medium text-[#171918] flex items-center gap-1.5 transition-colors"
                >
                  <Upload size={14} className="text-[#315C4C]" />
                  <span>Choose Photo File</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoSelect(e, false)}
                />

                {evidencePhotoPreview ? (
                  <div className="relative group">
                    <img
                      src={evidencePhotoPreview}
                      alt="Uploaded preview"
                      className="w-14 h-14 rounded-lg object-cover border border-[#315C4C]"
                    />
                    <button
                      type="button"
                      onClick={() => setEvidencePhotoPreview(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#171918] text-white flex items-center justify-center text-[10px]"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-[#737773]">
                    Max 5MB • JPG, PNG or WebP
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E4E6E2]">
              <button
                type="button"
                onClick={() => setShowEvidenceForm(false)}
                className="px-3 py-1.5 rounded text-xs text-[#737773] hover:text-[#171918]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingEvidence}
                className="px-4 py-1.5 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] transition-colors"
              >
                {isSubmittingEvidence ? 'Submitting Evidence...' : 'Submit Ground Evidence'}
              </button>
            </div>
          </form>
        )}

        {/* List of Attached Community Evidence */}
        {evidenceList.length === 0 ? (
          <div className="p-4 rounded-lg bg-[#F5F5F2] border border-dashed border-[#E4E6E2] text-center text-xs text-[#737773]">
            No supplementary citizen photos added yet. Click "+ Add Ground Evidence" to contribute.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {evidenceList.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-[#E4E6E2] bg-white space-y-2 hover:border-[#315C4C]/30 transition-all text-xs"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                      item.condition === 'Deteriorated'
                        ? 'bg-[#FAF0EF] text-[#B8463B]'
                        : item.condition === 'Hazard Cleared'
                        ? 'bg-[#DDE7DF] text-[#315C4C]'
                        : 'bg-[#F5F5F2] text-[#737773]'
                    }`}
                  >
                    {item.condition}
                  </span>
                  <span className="text-[10px] font-mono text-[#737773]">{item.timestamp}</span>
                </div>

                <p className="text-[11px] text-[#171918] leading-relaxed">{item.description}</p>

                {item.photoUrl && (
                  <div className="pt-1">
                    <img
                      src={item.photoUrl}
                      alt="Citizen evidence"
                      className="w-full h-28 rounded object-cover border border-[#E4E6E2]"
                    />
                  </div>
                )}

                <div className="pt-1 border-t border-[#E4E6E2]/70 flex items-center justify-between text-[10px] font-mono text-[#737773]">
                  <span>Witness: {item.userName}</span>
                  {item.locationNote && <span className="truncate max-w-[140px]">{item.locationNote}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CHRONOLOGICAL COMMUNITY ACTIVITY TIMELINE */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#171918]">
              Community Activity Stream ({timelineEvents.length})
            </h4>
            <p className="text-[11px] text-[#737773]">
              Chronological log of submissions, confirmations, worsening flags, and resolution checks.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#315C4C]">IMMUTABLE AUDIT LOG</span>
        </div>

        <div className="relative border-l-2 border-[#E4E6E2] ml-3 sm:ml-4 pl-4 sm:pl-6 space-y-3.5 py-1">
          {timelineEvents.map((evt) => {
            const isAlert = evt.eventType === 'issue_worsening' || evt.eventType === 'resolution_challenged';
            const isOfficial = evt.actorType === 'official';

            return (
              <div key={evt.id} className="relative group">
                {/* Event Marker */}
                <div
                  className={`absolute -left-[23px] sm:-left-[31px] top-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold transition-all ${
                    isAlert
                      ? 'bg-[#B8463B] text-white ring-2 ring-[#FAF0EF]'
                      : isOfficial
                      ? 'bg-[#181C1A] text-white'
                      : 'bg-[#315C4C] text-white'
                  }`}
                >
                  {isAlert ? '!' : '✓'}
                </div>

                <div
                  className={`p-3 rounded-lg border text-xs transition-all ${
                    isAlert
                      ? 'bg-[#FAF0EF]/70 border-[#B8463B]/30'
                      : 'bg-white border-[#E4E6E2]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <span
                      className={`font-semibold ${
                        isAlert ? 'text-[#B8463B]' : 'text-[#171918]'
                      }`}
                    >
                      {evt.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#737773]">
                      {evt.timestamp}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#737773] leading-relaxed mb-1.5">
                    {evt.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#737773]">
                    <span className="uppercase text-[#315C4C] font-semibold">
                      [{evt.actorType}]:
                    </span>
                    <span>{evt.actorName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
