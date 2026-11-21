import React, { useState } from 'react';
import { WorkOrder } from '../../types';
import { operationsService } from '../../services/operationsService';
import { EvidenceComparisonModal } from '../ai/EvidenceComparisonModal';
import {
  CheckCircle,
  Camera,
  RotateCcw,
  Check,
  Sparkles,
} from 'lucide-react';

interface SupervisorReviewTabProps {
  onRefresh: () => void;
}

export const SupervisorReviewTab: React.FC<SupervisorReviewTabProps> = ({
  onRefresh,
}) => {
  const workOrders = operationsService.getWorkOrders();
  const pendingReviewOrders = workOrders.filter((w) => w.status === 'Submitted for Review');

  const [reworkModalOrder, setReworkModalOrder] = useState<WorkOrder | null>(null);
  const [comparingOrder, setComparingOrder] = useState<WorkOrder | null>(null);
  const [reworkNotes, setReworkNotes] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  // Approve Completion
  const handleApprove = (wo: WorkOrder) => {
    const res = operationsService.approveCompletion(wo.id, 'Supervisor certified on-site completion proof.');
    if (res.success) {
      setReviewFeedback(`✓ Work Order ${wo.id} certified as completed. Linked report transferred to Citizen Resolution Verification.`);
      setTimeout(() => setReviewFeedback(null), 4000);
      onRefresh();
    }
  };

  // Return for rework
  const handleReturnRework = () => {
    if (!reworkModalOrder || !reworkNotes.trim()) return;
    operationsService.returnForRework(reworkModalOrder.id, reworkNotes.trim());
    setReviewFeedback(`⚠️ Work Order ${reworkModalOrder.id} returned for field rework.`);
    setTimeout(() => setReviewFeedback(null), 4000);
    setReworkModalOrder(null);
    setReworkNotes('');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* HEADER BAR */}
      <div className="p-4 rounded-xl bg-white border border-[#E4E6E2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#315C4C]" />
            <span className="font-mono text-xs uppercase font-bold text-[#315C4C]">
              Supervisor Completion Verification Desk
            </span>
          </div>
          <p className="text-[#737773] max-w-2xl">
            Inspect photographic proof and civil completion descriptions submitted by field squads before certifying official ticket resolution.
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-lg bg-[#DDE7DF]/50 border border-[#315C4C]/30 text-xs font-mono font-bold text-[#315C4C] self-start sm:self-auto">
          {pendingReviewOrders.length} Pending Review
        </span>
      </div>

      {reviewFeedback && (
        <div className="p-3.5 rounded-xl bg-[#DDE7DF] border border-[#315C4C]/40 text-xs font-semibold text-[#315C4C] flex items-center justify-between animate-in fade-in duration-150">
          <span>{reviewFeedback}</span>
          <span className="text-[10px] font-mono uppercase text-[#315C4C]/70">AUDITED</span>
        </div>
      )}

      {/* PENDING REVIEW LIST */}
      <div className="space-y-4">
        {pendingReviewOrders.length === 0 ? (
          <div className="p-12 rounded-xl bg-white border border-dashed border-[#E4E6E2] text-center text-xs text-[#737773]">
            <CheckCircle size={24} className="mx-auto text-[#315C4C] mb-2 opacity-60" />
            <h4 className="font-bold text-[#171918] mb-1">Zero Pending Completion Reviews</h4>
            <p>All submitted field repairs have been inspected and signed off.</p>
          </div>
        ) : (
          pendingReviewOrders.map((wo) => {
            const evidence = wo.completionEvidence;

            return (
              <div
                key={wo.id}
                className="p-5 rounded-xl border border-[#315C4C]/30 bg-white shadow-xs space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E4E6E2]">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="font-bold text-[#315C4C]">{wo.id}</span>
                      <span className="text-[#E4E6E2]">|</span>
                      <span className="font-bold text-[#171918]">Ref: {wo.reportTicketNumber}</span>
                      <span className="text-[#737773]">({wo.departmentName})</span>
                    </div>
                    <h3 className="text-base font-bold text-[#171918] mt-0.5">{wo.title}</h3>
                  </div>

                  <span className="px-2.5 py-1 rounded bg-[#FAF5ED] border border-[#C58B36]/30 font-mono text-[11px] text-[#C58B36] font-semibold self-start sm:self-auto">
                    SUBMITTED FOR REVIEW
                  </span>
                </div>

                {/* BEFORE / AFTER PHOTO PROOF AUDIT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="p-3 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] space-y-1.5 text-xs">
                    <span className="font-mono text-[10px] uppercase text-[#737773] font-bold block">
                      1. Before Repair (Initial Citizen Evidence)
                    </span>
                    <div className="aspect-video bg-white rounded border border-[#E4E6E2] flex flex-col items-center justify-center text-[#737773] p-2">
                      <Camera size={22} className="mb-1 opacity-50" />
                      <span className="text-[11px] font-mono">Citizen Geotagged Capture</span>
                      <span className="text-[10px] text-[#737773]">{wo.createdTimestamp}</span>
                    </div>
                  </div>

                  {/* After */}
                  <div className="p-3 rounded-lg bg-[#FAFBF9] border border-[#315C4C]/30 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase text-[#315C4C] font-bold block">
                        2. After Repair (Completion Proof)
                      </span>
                      <span className="text-[10px] font-mono text-[#315C4C] font-semibold">FIELD VERIFIED</span>
                    </div>
                    <div className="aspect-video bg-[#DDE7DF]/30 rounded border border-[#315C4C]/30 overflow-hidden relative group">
                      <img
                        src={evidence?.afterPhotoUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f0?auto=format&fit=crop&w=600&q=80'}
                        alt="Completed repair proof"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Field Notes & Materials Summary */}
                <div className="p-3.5 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-xs space-y-2">
                  <div>
                    <span className="font-mono text-[10px] uppercase text-[#737773] font-bold block mb-0.5">
                      Field Squad Completion Statement:
                    </span>
                    <p className="text-[#171918] leading-relaxed">
                      "{evidence?.workDescription || 'Repairs completed on site as per municipal civil standards.'}"
                    </p>
                  </div>

                  {evidence?.materialsUsed && (
                    <div className="pt-2 border-t border-[#E4E6E2] flex items-center justify-between text-[11px] font-mono text-[#737773]">
                      <span>Materials Used: {evidence.materialsUsed}</span>
                      <span>Submitted by: {evidence.submittedByStaffName || wo.assignedStaffName}</span>
                    </div>
                  )}
                </div>

                {/* SUPERVISOR APPROVE / RETURN BUTTONS */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E4E6E2]">
                  <button
                    type="button"
                    onClick={() => setComparingOrder(wo)}
                    className="px-3.5 py-2 rounded-lg bg-[#FAFBF9] border border-[#315C4C]/40 text-[#315C4C] text-xs font-semibold hover:bg-[#DDE7DF]/40 flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles size={13} />
                    <span>AI Evidence Comparison</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReworkModalOrder(wo)}
                      className="px-4 py-2 rounded-lg bg-white border border-[#B8463B]/40 text-[#B8463B] text-xs font-semibold hover:bg-[#FAF0EF] flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw size={13} />
                      <span>Return for Rework</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(wo)}
                      className="px-5 py-2 rounded-lg bg-[#315C4C] text-white text-xs font-bold hover:bg-[#26483B] flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Check size={14} />
                      <span>Approve Completion & Hand Off to Citizen Verification</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* REWORK MODAL */}
      {reworkModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-[#181C1A]/60 backdrop-blur-sm" onClick={() => setReworkModalOrder(null)} />

          <div className="relative w-full max-w-md bg-white border border-[#E4E6E2] rounded-xl shadow-2xl p-5 z-10 space-y-3.5 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-[#B8463B] font-bold">
              <RotateCcw size={15} />
              <span>Return Work Order for Rework</span>
            </div>

            <p className="text-[#737773]">
              Specify the deficiencies in the field repair or completion proof that must be rectified.
            </p>

            <textarea
              value={reworkNotes}
              onChange={(e) => setReworkNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Asphalt patch not compacted flush with carriageway, debris still on pedestrian sidewalk, or photograph blurry..."
              className="w-full text-xs p-2.5 rounded-lg border border-[#E4E6E2] focus:border-[#B8463B] outline-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReworkModalOrder(null)}
                className="px-3 py-1.5 rounded text-xs text-[#737773]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReturnRework}
                className="px-4 py-1.5 rounded-lg bg-[#B8463B] text-white text-xs font-semibold hover:bg-[#97362C]"
              >
                Confirm Return for Rework
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI EVIDENCE COMPARISON MODAL */}
      {comparingOrder && (
        <EvidenceComparisonModal
          workOrder={comparingOrder}
          onClose={() => setComparingOrder(null)}
          onApprove={(wo) => handleApprove(wo)}
          onReturnRework={(wo) => setReworkModalOrder(wo)}
          isSupervisor={true}
        />
      )}
    </div>
  );
};
