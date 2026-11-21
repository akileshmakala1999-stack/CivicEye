import React, { useState } from 'react';
import { WorkOrder } from '../../types';
import { operationsService } from '../../services/operationsService';
import { Badge } from '../common/Badge';
import {
  Wrench,
  MapPin,
  Play,
  AlertTriangle,
  Camera,
  Plus,
  Upload,
  Check,
  X,
} from 'lucide-react';

interface StaffWorkspaceTabProps {
  onRefresh: () => void;
}

export const StaffWorkspaceTab: React.FC<StaffWorkspaceTabProps> = ({
  onRefresh,
}) => {
  const activeStaffId = operationsService.getActiveStaffId();
  const operator = operationsService.getCurrentOperator();

  const [activeFilter, setActiveFilter] = useState<'all' | 'in_progress' | 'blocked' | 'completed'>('all');

  // Note dialog
  const [showNoteModal, setShowNoteModal] = useState<WorkOrder | null>(null);
  const [noteContent, setNoteContent] = useState('');

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState<WorkOrder | null>(null);
  const [completionDescription, setCompletionDescription] = useState('');
  const [completionMaterials, setCompletionMaterials] = useState('');
  const [completionPhotoPreview, setCompletionPhotoPreview] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);

  // Block modal state
  const [showBlockModal, setShowBlockModal] = useState<WorkOrder | null>(null);
  const [blockReason, setBlockReason] = useState('');

  const myOrders = operationsService.getStaffWorkOrders(activeStaffId);

  const filteredOrders = myOrders.filter((w) => {
    if (activeFilter === 'in_progress') return w.status === 'In Progress' || w.status === 'Accepted';
    if (activeFilter === 'blocked') return w.status === 'Blocked';
    if (activeFilter === 'completed') return w.status === 'Completed' || w.status === 'Submitted for Review';
    return true;
  });

  // Handle Photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCompletionError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCompletionPhotoPreview(event.target?.result as string);
      setCompletionError(null);
    };
    reader.readAsDataURL(file);
  };

  // Submit completion proof
  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCompletionModal) return;
    if (!completionDescription.trim()) {
      setCompletionError('Please describe the civil repairs executed on site.');
      return;
    }

    operationsService.submitCompletionEvidence({
      workOrderId: showCompletionModal.id,
      afterPhotoUrl:
        completionPhotoPreview ||
        'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f0?auto=format&fit=crop&w=600&q=80',
      workDescription: completionDescription.trim(),
      materialsUsed: completionMaterials.trim() || undefined,
    });

    setShowCompletionModal(null);
    setCompletionDescription('');
    setCompletionMaterials('');
    setCompletionPhotoPreview(null);
    onRefresh();
  };

  // Submit progress note
  const handleAddNote = () => {
    if (!showNoteModal || !noteContent.trim()) return;
    operationsService.addProgressNote(showNoteModal.id, noteContent.trim());
    setShowNoteModal(null);
    setNoteContent('');
    onRefresh();
  };

  // Submit block
  const handleMarkBlocked = () => {
    if (!showBlockModal || !blockReason.trim()) return;
    operationsService.transitionWorkOrderStatus({
      workOrderId: showBlockModal.id,
      newStatus: 'Blocked',
      reason: blockReason.trim(),
    });
    setShowBlockModal(null);
    setBlockReason('');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* MOBILE STAFF PROFILE HEADER */}
      <div className="p-4 rounded-xl bg-white border border-[#E4E6E2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#315C4C] text-white flex items-center justify-center font-bold">
            <Wrench size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#171918] text-sm">{operator.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#DDE7DF] text-[#315C4C] font-semibold">
                Field Engineer
              </span>
            </div>
            <span className="text-[11px] text-[#737773] font-mono">
              {operator.department} • GHMC Active Field Squad
            </span>
          </div>
        </div>

        {/* Task filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-[#315C4C] text-white border-[#315C4C]'
                : 'bg-white border-[#E4E6E2] text-[#171918]'
            }`}
          >
            All ({myOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors ${
              activeFilter === 'in_progress'
                ? 'bg-[#315C4C] text-white border-[#315C4C]'
                : 'bg-white border-[#E4E6E2] text-[#171918]'
            }`}
          >
            In Progress
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('blocked')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors ${
              activeFilter === 'blocked'
                ? 'bg-[#C58B36] text-white border-[#C58B36]'
                : 'bg-white border-[#E4E6E2] text-[#171918]'
            }`}
          >
            Blocked
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors ${
              activeFilter === 'completed'
                ? 'bg-[#315C4C] text-white border-[#315C4C]'
                : 'bg-white border-[#E4E6E2] text-[#171918]'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* STAFF TASK CARDS GRID (MOBILE RESPONSIVE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full p-12 rounded-xl bg-white border border-[#E4E6E2] text-center text-xs text-[#737773]">
            No assigned tasks found for this view filter.
          </div>
        ) : (
          filteredOrders.map((wo) => {
            const isAssigned = wo.status === 'Assigned';
            const isAccepted = wo.status === 'Accepted';
            const isInProgress = wo.status === 'In Progress';
            const isBlocked = wo.status === 'Blocked';
            const isSubmitted = wo.status === 'Submitted for Review';
            const isCompleted = wo.status === 'Completed';

            return (
              <div
                key={wo.id}
                className="p-4 rounded-xl border border-[#E4E6E2] bg-white hover:border-[#315C4C]/40 transition-all shadow-xs space-y-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-[#315C4C]">{wo.id}</span>
                    <Badge severity={wo.priority} dot size="sm" />
                  </div>

                  <h4 className="text-sm font-bold text-[#171918] leading-snug">{wo.title}</h4>

                  <div className="flex items-center gap-1.5 text-xs text-[#737773] mt-1">
                    <MapPin size={12} className="text-[#315C4C] flex-shrink-0" />
                    <span className="truncate">{wo.location}</span>
                  </div>

                  {/* Civil description */}
                  <div className="mt-2.5 p-2.5 rounded bg-[#F5F5F2] border border-[#E4E6E2] text-xs text-[#171918]">
                    <span className="font-mono text-[9px] uppercase text-[#737773] block mb-0.5">
                      Required Civil Action:
                    </span>
                    <p className="line-clamp-2 leading-relaxed">{wo.workDescription}</p>
                  </div>

                  {wo.blockedReason && (
                    <div className="mt-2 p-2 rounded bg-[#FAF0EF] border border-[#B8463B]/30 text-xs text-[#B8463B] flex items-center gap-1.5">
                      <AlertTriangle size={12} className="flex-shrink-0" />
                      <span>Obstacle: {wo.blockedReason}</span>
                    </div>
                  )}
                </div>

                {/* Status Bar & Action Controls */}
                <div className="space-y-2 pt-2 border-t border-[#E4E6E2]">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#737773]">Status:</span>
                    <span className="font-bold text-[#171918] uppercase">{wo.status}</span>
                  </div>

                  {/* QUICK BUTTONS */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {isAssigned && (
                      <button
                        type="button"
                        onClick={() => {
                          operationsService.transitionWorkOrderStatus({
                            workOrderId: wo.id,
                            newStatus: 'Accepted',
                          });
                          onRefresh();
                        }}
                        className="col-span-2 py-2 rounded-lg bg-[#315C4C] text-white text-xs font-bold hover:bg-[#26483B] flex items-center justify-center gap-1 transition-colors"
                      >
                        <Check size={14} />
                        <span>Accept Task</span>
                      </button>
                    )}

                    {isAccepted && (
                      <button
                        type="button"
                        onClick={() => {
                          operationsService.transitionWorkOrderStatus({
                            workOrderId: wo.id,
                            newStatus: 'In Progress',
                            reason: 'Field squad arrived and deployed tools.',
                          });
                          onRefresh();
                        }}
                        className="col-span-2 py-2 rounded-lg bg-[#315C4C] text-white text-xs font-bold hover:bg-[#26483B] flex items-center justify-center gap-1 transition-colors"
                      >
                        <Play size={14} />
                        <span>Start Work (On Site)</span>
                      </button>
                    )}

                    {isInProgress && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowBlockModal(wo)}
                          className="py-2 rounded-lg bg-[#FAF5ED] border border-[#C58B36]/30 text-[#C58B36] text-xs font-medium hover:bg-[#FAF5ED]/80 flex items-center justify-center gap-1"
                        >
                          <AlertTriangle size={12} />
                          <span>Report Blocked</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowCompletionModal(wo)}
                          className="py-2 rounded-lg bg-[#315C4C] text-white text-xs font-bold hover:bg-[#26483B] flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Camera size={13} />
                          <span>Submit Completion</span>
                        </button>
                      </>
                    )}

                    {isBlocked && (
                      <button
                        type="button"
                        onClick={() => {
                          operationsService.transitionWorkOrderStatus({
                            workOrderId: wo.id,
                            newStatus: 'In Progress',
                            reason: 'Site impediment cleared; resumed repairs.',
                          });
                          onRefresh();
                        }}
                        className="col-span-2 py-2 rounded-lg bg-[#315C4C] text-white text-xs font-bold hover:bg-[#26483B] flex items-center justify-center gap-1"
                      >
                        <Play size={14} />
                        <span>Resume Work (Unblock)</span>
                      </button>
                    )}

                    {isSubmitted && (
                      <div className="col-span-2 py-1.5 rounded-lg bg-[#DDE7DF]/50 border border-[#315C4C]/30 text-center font-mono text-[11px] text-[#315C4C] font-semibold">
                        Awaiting Supervisor Completion Review
                      </div>
                    )}

                    {isCompleted && (
                      <div className="col-span-2 py-1.5 rounded-lg bg-[#DDE7DF] border border-[#315C4C]/40 text-center font-mono text-[11px] text-[#315C4C] font-semibold">
                        ✓ Repair Certified Completed
                      </div>
                    )}

                    {/* Progress note trigger */}
                    <button
                      type="button"
                      onClick={() => setShowNoteModal(wo)}
                      className="col-span-2 py-1.5 rounded border border-[#E4E6E2] bg-[#F5F5F2] hover:bg-white text-xs text-[#737773] hover:text-[#171918] flex items-center justify-center gap-1 transition-colors"
                    >
                      <Plus size={11} />
                      <span>Add On-Site Progress Log</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* COMPLETION EVIDENCE SUBMISSION MODAL */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-[#181C1A]/60 backdrop-blur-sm" onClick={() => setShowCompletionModal(null)} />

          <div className="relative w-full max-w-lg bg-white border border-[#E4E6E2] rounded-xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E4E6E2] bg-[#F5F5F2]">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#315C4C]">
                <Camera size={14} />
                <span>SUBMIT COMPLETION EVIDENCE</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCompletionModal(null)}
                className="p-1 text-[#737773] hover:text-[#171918]"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-5 space-y-4 text-xs">
              {completionError && (
                <div className="p-2.5 rounded bg-[#FAF0EF] text-[#B8463B] font-medium">
                  {completionError}
                </div>
              )}

              <div>
                <span className="font-mono text-[10px] text-[#737773] block mb-0.5">Work Order:</span>
                <span className="font-bold text-[#171918]">{showCompletionModal.title}</span>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                  After-Repair Photographic Proof *
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-3 py-2 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2] hover:bg-white cursor-pointer text-xs flex items-center gap-1.5 transition-colors">
                    <Upload size={13} className="text-[#315C4C]" />
                    <span>Upload Completed Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                  </label>

                  {completionPhotoPreview ? (
                    <div className="relative">
                      <img src={completionPhotoPreview} alt="Preview" className="w-12 h-12 rounded object-cover border" />
                      <button
                        type="button"
                        onClick={() => setCompletionPhotoPreview(null)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#171918] text-white flex items-center justify-center text-[8px]"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-[#737773]">Demo photo will be provided if unselected</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                  Civil Repair Description *
                </label>
                <textarea
                  value={completionDescription}
                  onChange={(e) => setCompletionDescription(e.target.value)}
                  rows={3}
                  placeholder="Detail the repairs completed, leveling, compaction, hydraulic tests or surface cleaning..."
                  className="w-full text-xs p-2.5 rounded-lg border border-[#E4E6E2] focus:border-[#315C4C] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                  Materials Used / Consumables Ledger
                </label>
                <input
                  type="text"
                  value={completionMaterials}
                  onChange={(e) => setCompletionMaterials(e.target.value)}
                  placeholder="e.g. 2 tons bitumen hot mix, 4 bags cement, replacement DI sleeve #12"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#E4E6E2] focus:border-[#315C4C] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E4E6E2]">
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(null)}
                  className="px-3 py-1.5 rounded text-xs text-[#737773] hover:text-[#171918]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] transition-colors"
                >
                  Submit for Supervisor Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BLOCK MODAL */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-[#181C1A]/60 backdrop-blur-sm" onClick={() => setShowBlockModal(null)} />

          <div className="relative w-full max-w-md bg-white border border-[#E4E6E2] rounded-xl shadow-2xl p-5 z-10 space-y-3.5 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-[#C58B36] font-bold">
              <AlertTriangle size={15} />
              <span>Report On-Site Obstacle (Block Task)</span>
            </div>

            <p className="text-[#737773]">
              Specify the impediment preventing safe or immediate civil repair execution.
            </p>

            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={3}
              placeholder="e.g. Heavy monsoon rain waterlogging trench, parked unauthorized vehicles blocking access, awaiting power shutoff..."
              className="w-full text-xs p-2.5 rounded-lg border border-[#E4E6E2] focus:border-[#C58B36] outline-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBlockModal(null)}
                className="px-3 py-1.5 rounded text-xs text-[#737773]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkBlocked}
                className="px-3.5 py-1.5 rounded-lg bg-[#C58B36] text-white text-xs font-semibold hover:bg-[#A8742A]"
              >
                Confirm Blocked
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROGRESS NOTE MODAL */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-[#181C1A]/60 backdrop-blur-sm" onClick={() => setShowNoteModal(null)} />

          <div className="relative w-full max-w-md bg-white border border-[#E4E6E2] rounded-xl shadow-2xl p-5 z-10 space-y-3.5 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-[#315C4C] font-bold">
              <Plus size={15} />
              <span>Add Field Progress Log</span>
            </div>

            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={3}
              placeholder="Log intermediate progress (e.g. Excavation complete to 4ft depth, laying substrate, applying primer coat)..."
              className="w-full text-xs p-2.5 rounded-lg border border-[#E4E6E2] focus:border-[#315C4C] outline-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNoteModal(null)}
                className="px-3 py-1.5 rounded text-xs text-[#737773]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNote}
                className="px-3.5 py-1.5 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B]"
              >
                Add Log Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
