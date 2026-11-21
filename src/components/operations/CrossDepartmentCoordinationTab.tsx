import React, { useState } from 'react';
import {
  MultiAgencyCoordinationPlan,
  OperationalRole,
  MultiAgencyProposalStatus,
} from '../../types';
import { aiOrchestrationService } from '../../services/aiOrchestrationService';
import { operationsService } from '../../services/operationsService';
import { AiTransparencyPanel } from '../ai/AiTransparencyPanel';
import {
  GitMerge,
  CheckCircle,
  Layers,
  History,
  Sparkles,
} from 'lucide-react';

interface CrossDepartmentCoordinationTabProps {
  activeRole: OperationalRole;
  onRefresh: () => void;
}

export const CrossDepartmentCoordinationTab: React.FC<CrossDepartmentCoordinationTabProps> = ({
  activeRole,
  onRefresh,
}) => {
  const plans = aiOrchestrationService.getCoordinationPlans();

  const [selectedPlan, setSelectedPlan] = useState<MultiAgencyCoordinationPlan | null>(
    plans.length > 0 ? plans[0] : null
  );

  // Review & Rejection modal states
  const [rejectModalPlan, setRejectModalPlan] = useState<MultiAgencyCoordinationPlan | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pendingProposals = plans.filter(
    (p) => p.status === 'AI Proposed' || p.status === 'Awaiting Human Review'
  );
  const activePlans = plans.filter(
    (p) => p.status === 'Approved' || p.status === 'Planning' || p.status === 'In Progress'
  );
  const completedPlans = plans.filter((p) => p.status === 'Completed');

  const canManage = activeRole === 'supervisor' || activeRole === 'admin';

  // Approve AI proposal
  const handleApprove = (planId: string) => {
    setActionError(null);
    const actorName = operationsService.getActiveStaff()?.name || 'Chief Municipal Operations Supervisor';
    const res = aiOrchestrationService.approveCoordinationProposal(
      planId,
      actorName,
      activeRole,
      'Supervisor certified inter-agency operational alignment and sequencing.'
    );

    if (res.success && res.plan) {
      setApprovalFeedback(`✓ Cross-Agency Plan "${res.plan.title}" approved and authorized for inter-department dispatch.`);
      setSelectedPlan(res.plan);
      setTimeout(() => setApprovalFeedback(null), 4500);
      onRefresh();
    } else {
      setActionError(res.error || 'Failed to approve plan.');
    }
  };

  // Reject AI proposal
  const handleRejectConfirm = () => {
    if (!rejectModalPlan || !rejectReason.trim()) return;
    setActionError(null);
    const actorName = operationsService.getActiveStaff()?.name || 'Municipal Reviewer';
    const res = aiOrchestrationService.rejectCoordinationProposal(
      rejectModalPlan.id,
      actorName,
      activeRole,
      rejectReason.trim()
    );

    if (res.success && res.plan) {
      setApprovalFeedback(`⚠️ Cross-Agency Proposal "${res.plan.title}" rejected: ${rejectReason.trim()}`);
      setSelectedPlan(res.plan);
      setRejectModalPlan(null);
      setRejectReason('');
      setTimeout(() => setApprovalFeedback(null), 4500);
      onRefresh();
    } else {
      setActionError(res.error || 'Failed to reject proposal.');
    }
  };

  // Transition operational status
  const handleStatusChange = (planId: string, newStatus: MultiAgencyProposalStatus) => {
    const actorName = operationsService.getActiveStaff()?.name || 'Field Coordinator';
    const res = aiOrchestrationService.updateCoordinationStatus(
      planId,
      newStatus,
      actorName,
      activeRole,
      `Operational status transitioned to ${newStatus}`
    );
    if (res.success && res.plan) {
      setSelectedPlan(res.plan);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. COORDINATION OVERVIEW HEADER & METRIC TILES */}
      <div className="p-5 rounded-2xl bg-white border border-[#E4E6E2] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E6E2]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-md bg-[#DDE7DF] text-[#315C4C]">
                <GitMerge size={14} />
              </span>
              <span className="font-mono text-xs uppercase font-bold text-[#315C4C] tracking-wider">
                Multi-Agency Coordination & Decision Support
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#171918] tracking-tight">
              Cross-Department Infrastructure Orchestration
            </h2>
            <p className="text-xs text-[#737773] mt-1 max-w-2xl leading-relaxed">
              Detects composite civic hazards spanning multiple civic departments (Roads, Water, Stormwater Drainage, Electrical). Proposes dependency sequences and isolates delay risks for human supervisor sign-off.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FAFBF9] border border-[#E4E6E2] text-[#171918]">
              Role: <span className="capitalize text-[#315C4C]">{activeRole}</span>
            </span>
          </div>
        </div>

        {/* 4 SUMMARY METRIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
            <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">
              Total Cross-Wing Plans
            </span>
            <span className="text-xl font-bold text-[#171918]">{plans.length}</span>
            <span className="text-[10px] font-mono text-[#315C4C] block mt-0.5">100% Tracked</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
            <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">
              Pending AI Proposals
            </span>
            <span className="text-xl font-bold text-[#C58B36]">{pendingProposals.length}</span>
            <span className="text-[10px] font-mono text-[#C58B36] block mt-0.5">Awaiting Supervisor</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
            <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">
              Active Multi-Wing Ops
            </span>
            <span className="text-xl font-bold text-[#315C4C]">{activePlans.length}</span>
            <span className="text-[10px] font-mono text-[#315C4C] block mt-0.5">In Sequencing</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
            <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">
              Resolved & Signed Off
            </span>
            <span className="text-xl font-bold text-[#171918]">{completedPlans.length}</span>
            <span className="text-[10px] font-mono text-[#737773] block mt-0.5">Audited</span>
          </div>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {approvalFeedback && (
        <div className="p-3.5 rounded-xl bg-[#DDE7DF] border border-[#315C4C]/40 text-xs font-semibold text-[#315C4C] flex items-center justify-between animate-in fade-in duration-150">
          <span>{approvalFeedback}</span>
          <span className="text-[10px] font-mono uppercase text-[#315C4C]/70">AUDITED ACTION</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-[#FAF0EF] border border-[#B8463B]/40 text-xs font-semibold text-[#B8463B] flex items-center justify-between animate-in fade-in duration-150">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="text-[#B8463B] hover:underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PROPOSAL LIST (5 COLS) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase font-bold text-[#737773]">
              Coordination Plans & Proposals ({plans.length})
            </span>
            <span className="text-[11px] text-[#737773]">Select to inspect details</span>
          </div>

          {plans.length === 0 ? (
            <div className="p-8 rounded-xl bg-white border border-dashed border-[#E4E6E2] text-center text-xs text-[#737773]">
              <Layers size={24} className="mx-auto mb-2 opacity-50" />
              <p>Zero cross-department coordination plans registered.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {plans.map((p) => {
                const isSelected = selectedPlan?.id === p.id;
                const isPending = p.status === 'AI Proposed' || p.status === 'Awaiting Human Review';
                const isApproved = p.status === 'Approved' || p.status === 'In Progress';

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all text-xs ${
                      isSelected
                        ? 'border-[#315C4C] bg-white shadow-sm ring-1 ring-[#315C4C]/20'
                        : 'border-[#E4E6E2] bg-white hover:border-[#315C4C]/40 hover:bg-[#FAFBF9]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[10px] text-[#737773]">
                        {p.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                        isPending
                          ? 'bg-[#FAF5ED] text-[#C58B36] border border-[#C58B36]/30'
                          : isApproved
                          ? 'bg-[#DDE7DF] text-[#315C4C] border border-[#315C4C]/30'
                          : p.status === 'Rejected'
                          ? 'bg-[#FAF0EF] text-[#B8463B] border border-[#B8463B]/30'
                          : 'bg-[#E4E6E2]/50 text-[#737773]'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-[#171918] text-xs leading-snug mb-2 line-clamp-2">
                      {p.title}
                    </h4>

                    <div className="space-y-1 text-[11px] text-[#737773]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#171918]">Lead:</span>
                        <span className="truncate">{p.primaryDepartmentName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#171918]">Supporting:</span>
                        <span className="truncate">
                          {p.supportingDepartments.map((d) => d.departmentName.split(' ')[0]).join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-[#E4E6E2]/70 text-[10px] font-mono">
                      <span className="text-[#315C4C]">
                        {Math.round(p.aiConfidence * 100)}% Confidence
                      </span>
                      <span className="text-[#737773]">
                        Target: {p.targetTimelineHours}h SLA
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAILED PROPOSAL INSPECTION & CONTROLS (7 COLS) */}
        <div className="lg:col-span-7">
          {selectedPlan ? (
            <div className="p-5 rounded-2xl bg-white border border-[#E4E6E2] shadow-xs space-y-5 text-xs">
              {/* HEADER INFO */}
              <div className="pb-4 border-b border-[#E4E6E2] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#DDE7DF] text-[#315C4C]">
                      Ticket {selectedPlan.primaryReportTicket}
                    </span>
                    <span className="font-mono text-[10px] text-[#737773]">
                      {selectedPlan.id}
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold ${
                    selectedPlan.status === 'Approved'
                      ? 'bg-[#DDE7DF] text-[#315C4C]'
                      : selectedPlan.status === 'AI Proposed'
                      ? 'bg-[#FAF5ED] text-[#C58B36]'
                      : 'bg-[#E4E6E2]/50 text-[#737773]'
                  }`}>
                    Status: {selectedPlan.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#171918] leading-tight">
                  {selectedPlan.title}
                </h3>
              </div>

              {/* HUMAN SUPERVISOR ACTION BANNER (WHEN AI PROPOSED) */}
              {(selectedPlan.status === 'AI Proposed' || selectedPlan.status === 'Awaiting Human Review') && (
                <div className="p-4 rounded-xl bg-[#FAF5ED] border border-[#C58B36]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#C58B36] flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>Action Required: Supervisor Decision</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#737773]">
                      Decision Support Gate
                    </span>
                  </div>

                  <p className="text-xs text-[#171918] leading-relaxed">
                    CivicEye AI has formulated this cross-agency coordination sequence based on utility hazard rules. As authorized supervisor, you must review and certify before crews are mobilized.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {canManage ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(selectedPlan.id)}
                          className="px-4 py-2 rounded-lg bg-[#315C4C] text-white font-semibold text-xs hover:bg-[#26483B] flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <CheckCircle size={13} />
                          <span>Approve Coordination Plan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectModalPlan(selectedPlan)}
                          className="px-3.5 py-2 rounded-lg bg-white border border-[#B8463B]/40 text-[#B8463B] font-semibold text-xs hover:bg-[#FAF0EF] transition-colors"
                        >
                          Reject with Reason
                        </button>
                      </>
                    ) : (
                      <div className="text-[11px] text-[#737773] italic">
                        Switch to <strong>Supervisor</strong> or <strong>Admin</strong> profile above to approve or reject cross-department plans.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* OPERATIONAL STATUS CHANGER (WHEN APPROVED) */}
              {selectedPlan.status !== 'AI Proposed' && selectedPlan.status !== 'Rejected' && canManage && (
                <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2] flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#737773]">
                    Advance Coordination Lifecycle:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {['Planning', 'In Progress', 'Completed'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusChange(selectedPlan.id, st as any)}
                        disabled={selectedPlan.status === st}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          selectedPlan.status === st
                            ? 'bg-[#171918] text-white'
                            : 'bg-white border border-[#E4E6E2] text-[#737773] hover:text-[#171918]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* RECOMMENDED DEPENDENCY SEQUENCE FLOW */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase font-bold text-[#737773] block">
                  Mandatory Inter-Departmental Execution Order:
                </span>
                <div className="space-y-2 bg-[#FAFBF9] p-3.5 rounded-xl border border-[#E4E6E2]">
                  {selectedPlan.recommendedSequence.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#171918]">
                      <span className="w-5 h-5 rounded-full bg-[#315C4C] text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SUPPORTING DEPARTMENTS & DELAY RISKS */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase font-bold text-[#737773] block">
                  Department Roles & Risk If Delayed:
                </span>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-lg border border-[#E4E6E2] bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#171918] text-xs">
                        Lead: {selectedPlan.primaryDepartmentName}
                      </span>
                      <span className="text-[10px] font-mono text-[#315C4C] uppercase font-bold">
                        Primary Execution
                      </span>
                    </div>
                    <p className="text-[11px] text-[#737773]">
                      Responsible for overall site handover, contractor supervision, and final wearing surface restoration.
                    </p>
                  </div>

                  {selectedPlan.supportingDepartments.map((supp, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-[#E4E6E2] bg-white space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#171918] text-xs">
                          Supporting: {supp.departmentName}
                        </span>
                        <span className="text-[10px] font-mono text-[#C58B36] uppercase font-bold">
                          Step #{supp.dependencyOrder} Dependency
                        </span>
                      </div>
                      <p className="text-[11px] text-[#737773]">
                        <span className="font-semibold text-[#171918]">Why Involved: </span>
                        {supp.reason}
                      </p>
                      <div className="p-2 rounded bg-[#FAF0EF] text-[10px] text-[#B8463B] border border-[#B8463B]/20">
                        <span className="font-bold">Risk if delayed: </span>
                        {supp.riskIfDelayed}
                      </div>
                      <div className="text-[10px] text-[#737773] font-mono">
                        <span>Required Sign-off Evidence: </span>
                        <span className="text-[#171918]">{supp.requiredEvidence}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AUDIT TRAIL */}
              <div className="space-y-2 pt-2 border-t border-[#E4E6E2]">
                <span className="font-mono text-[10px] uppercase font-bold text-[#737773] block flex items-center gap-1">
                  <History size={12} />
                  <span>Coordination Audit Ledger (Immutable)</span>
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedPlan.auditTrail.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#FAFBF9] border border-[#E4E6E2] flex items-center justify-between text-[10px] font-mono"
                    >
                      <div>
                        <span className="font-bold text-[#171918]">{ev.actorName}</span>
                        <span className="text-[#737773]"> ({ev.actorRole}): </span>
                        <span className="text-[#315C4C]">{ev.notes || ev.action}</span>
                      </div>
                      <span className="text-[#737773] shrink-0 ml-2">{ev.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI TRANSPARENCY PANEL */}
              <AiTransparencyPanel
                confidenceScore={selectedPlan.aiConfidence}
                dataSource="Cross-Wing Municipal Charter & Multi-Utility Asset Model"
                recordsAnalyzedCount={23}
                humanReviewStatus={selectedPlan.status === 'Approved' ? 'human_verified' : 'advisory_only'}
              />
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white border border-[#E4E6E2] text-center text-[#737773]">
              <Layers size={24} className="mx-auto mb-2 opacity-50" />
              <p>Select a coordination proposal to inspect dependency sequence and risks.</p>
            </div>
          )}
        </div>
      </div>

      {/* REJECT PROPOSAL MODAL */}
      {rejectModalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#E4E6E2] p-5 max-w-md w-full space-y-4 text-xs">
            <h3 className="text-sm font-bold text-[#171918]">
              Reject Cross-Department Proposal
            </h3>
            <p className="text-[#737773]">
              Please state why this multi-agency proposal is rejected (e.g. "Primary cause was inspected on-site and confirmed single-wing road repair only").
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter official supervisor justification..."
              rows={3}
              className="w-full p-2.5 rounded-lg border border-[#E4E6E2] text-xs text-[#171918] focus:outline-hidden focus:border-[#315C4C]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalPlan(null)}
                className="px-3 py-1.5 rounded-lg border border-[#E4E6E2] text-[#737773] hover:text-[#171918]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim()}
                className="px-4 py-1.5 rounded-lg bg-[#B8463B] text-white font-semibold hover:bg-[#96372E] disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
