import React, { useState } from 'react';
import { WorkOrder, WorkOrderStatus } from '../../types';
import { operationsService, DEPARTMENTS } from '../../services/operationsService';
import { EvidenceComparisonModal } from '../ai/EvidenceComparisonModal';
import {
  MapPin,
  RotateCcw,
  Search,
  Eye,
  X,
  User,
  Sparkles,
} from 'lucide-react';

interface WorkOrdersTabProps {
  onRefresh: () => void;
  onOpenWorkOrderModal?: (wo: WorkOrder) => void;
}

export const WorkOrdersTab: React.FC<WorkOrdersTabProps> = ({
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Selected work order for inspector modal
  const [activeWorkOrder, setActiveWorkOrder] = useState<WorkOrder | null>(null);
  const [comparingOrder, setComparingOrder] = useState<WorkOrder | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const workOrders = operationsService.getWorkOrders();

  const filteredOrders = workOrders.filter((w) => {
    if (selectedStatus !== 'all' && w.status !== selectedStatus) return false;
    if (selectedDept !== 'all' && w.departmentId !== selectedDept) return false;
    if (selectedPriority !== 'all' && w.priority !== selectedPriority) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        w.id.toLowerCase().includes(q) ||
        w.reportTicketNumber.toLowerCase().includes(q) ||
        w.title.toLowerCase().includes(q) ||
        w.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle transition
  const handleTransition = (newStatus: WorkOrderStatus) => {
    if (!activeWorkOrder) return;
    setIsTransitioning(true);
    setTransitionError(null);

    const res = operationsService.transitionWorkOrderStatus({
      workOrderId: activeWorkOrder.id,
      newStatus,
      reason: actionReason.trim() || undefined,
    });

    if (!res.success) {
      setTransitionError(res.error || 'Transition failed.');
      setIsTransitioning(false);
      return;
    }

    setActiveWorkOrder(res.workOrder || null);
    setActionReason('');
    setIsTransitioning(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* FILTER CONTROLS BAR */}
      <div className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-48 sm:w-64">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#737773]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search WO ID, ticket, location..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2]/50 text-xs text-[#171918] focus:border-[#315C4C] outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none"
          >
            <option value="all">All States (9)</option>
            <option value="Pending Assignment">Pending Assignment</option>
            <option value="Assigned">Assigned</option>
            <option value="Accepted">Accepted</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Submitted for Review">Submitted for Review</option>
            <option value="Returned for Rework">Returned for Rework</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-[#737773]">
          <span>Showing {filteredOrders.length} of {workOrders.length} orders</span>
          {(searchQuery || selectedStatus !== 'all' || selectedDept !== 'all' || selectedPriority !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
                setSelectedDept('all');
                setSelectedPriority('all');
              }}
              className="text-[#315C4C] hover:underline flex items-center gap-1"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* WORK ORDERS TABLE */}
      <div className="bg-white border border-[#E4E6E2] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E4E6E2] text-[10px] font-mono text-[#737773] uppercase bg-[#F5F5F2]">
                <th className="py-2.5 px-3">Order ID / Ticket</th>
                <th className="py-2.5 px-3">Task Details & Location</th>
                <th className="py-2.5 px-3">Department & Crew</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">SLA Health</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E6E2]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#737773] text-xs">
                    No work orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((wo) => {
                  const sla = operationsService.calculateSlaStatus(wo);

                  let statusBadgeStyle = 'bg-[#F5F5F2] text-[#737773] border-[#E4E6E2]';
                  if (wo.status === 'In Progress') statusBadgeStyle = 'bg-[#FAF0EF] text-[#B8463B] border-[#B8463B]/30';
                  else if (wo.status === 'Completed') statusBadgeStyle = 'bg-[#DDE7DF] text-[#315C4C] border-[#315C4C]/40';
                  else if (wo.status === 'Blocked') statusBadgeStyle = 'bg-[#FAF5ED] text-[#C58B36] border-[#C58B36]/40';
                  else if (wo.status === 'Submitted for Review') statusBadgeStyle = 'bg-[#FAF5ED] text-[#315C4C] border-[#315C4C]/40';

                  return (
                    <tr key={wo.id} className="hover:bg-[#FAFBF9] transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-[#171918] block">{wo.id}</span>
                        <span className="text-[10px] font-mono text-[#315C4C]">
                          Ref: {wo.reportTicketNumber}
                        </span>
                      </td>

                      <td className="py-3 px-3 max-w-[280px]">
                        <div className="font-bold text-[#171918] truncate">{wo.title}</div>
                        <div className="text-[10px] text-[#737773] flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-[#315C4C] flex-shrink-0" />
                          <span className="truncate">{wo.location}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-[#171918] truncate max-w-[180px]">
                          {wo.departmentName}
                        </div>
                        <div className="text-[10px] font-mono text-[#737773] flex items-center gap-1 mt-0.5">
                          <User size={10} className="text-[#315C4C]" />
                          <span>{wo.assignedStaffName || 'Pending Crew Slot'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${statusBadgeStyle}`}
                        >
                          {wo.status}
                        </span>
                        {wo.blockedReason && (
                          <div className="text-[9px] text-[#B8463B] font-mono truncate max-w-[140px] mt-0.5">
                            Obstacle: {wo.blockedReason}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              sla.status === 'overdue'
                                ? 'bg-[#B8463B]'
                                : sla.status === 'approaching'
                                ? 'bg-[#C58B36]'
                                : 'bg-[#315C4C]'
                            }`}
                          />
                          <span
                            className={`font-semibold ${
                              sla.status === 'overdue'
                                ? 'text-[#B8463B]'
                                : sla.status === 'approaching'
                                ? 'text-[#C58B36]'
                                : 'text-[#315C4C]'
                            }`}
                          >
                            {sla.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#737773] block mt-0.5">
                          Target: {wo.targetCompletionDate}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setActiveWorkOrder(wo)}
                          className="px-3 py-1.5 rounded-md bg-white border border-[#E4E6E2] hover:bg-[#F5F5F2] hover:border-[#315C4C] text-xs font-medium text-[#171918] inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye size={12} className="text-[#315C4C]" />
                          <span>Inspect Lifecycle</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WORK ORDER LIFECYCLE MODAL */}
      {activeWorkOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-[#181C1A]/60 backdrop-blur-sm" onClick={() => setActiveWorkOrder(null)} />

          <div className="relative w-full max-w-2xl bg-white border border-[#E4E6E2] rounded-xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 my-6">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E4E6E2] bg-[#F5F5F2]">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="font-bold text-[#315C4C]">{activeWorkOrder.id}</span>
                <span className="text-[#E4E6E2]">|</span>
                <span>Ref: {activeWorkOrder.reportTicketNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveWorkOrder(null)}
                className="p-1 rounded text-[#737773] hover:text-[#171918]"
                aria-label="Close work order dialog"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
              {transitionError && (
                <div className="p-2.5 rounded bg-[#FAF0EF] border border-[#B8463B]/30 text-[#B8463B] font-medium">
                  {transitionError}
                </div>
              )}

              <div>
                <span className="text-[10px] font-mono uppercase text-[#737773] block mb-1">
                  {activeWorkOrder.departmentName} • {activeWorkOrder.neighborhood}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#171918]">{activeWorkOrder.title}</h3>
                <div className="flex items-center gap-1.5 text-[#737773] mt-1">
                  <MapPin size={12} className="text-[#315C4C]" />
                  <span>{activeWorkOrder.location}</span>
                </div>
              </div>

              {/* Status & Crew info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] font-mono text-[10px]">
                <div>
                  <span className="text-[#737773] block uppercase text-[8px]">Current Status</span>
                  <span className="font-bold text-[#171918]">{activeWorkOrder.status}</span>
                </div>
                <div>
                  <span className="text-[#737773] block uppercase text-[8px]">Priority</span>
                  <span className="font-bold text-[#B8463B]">{activeWorkOrder.priority.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-[#737773] block uppercase text-[8px]">Assigned Engineer</span>
                  <span className="font-bold text-[#171918] truncate block">
                    {activeWorkOrder.assignedStaffName || 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-[#737773] block uppercase text-[8px]">SLA Target</span>
                  <span className="font-bold text-[#315C4C]">{activeWorkOrder.targetCompletionDate}</span>
                </div>
              </div>

              {/* Work Scope Description */}
              <div>
                <span className="font-mono text-[10px] uppercase text-[#737773] font-bold block mb-1">
                  Civil Scope & Work Instructions
                </span>
                <p className="p-3 rounded-lg bg-white border border-[#E4E6E2] text-[#171918] leading-relaxed">
                  {activeWorkOrder.workDescription}
                </p>
              </div>

              {/* Action Reason Input */}
              <div>
                <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                  State Transition Reason / Field Note (Required for Block / Rework / Cancel)
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Awaiting water tanker diversion, weather hold, or field progress update..."
                  className="w-full text-xs p-2.5 rounded-lg border border-[#E4E6E2] focus:border-[#315C4C] outline-none"
                />
              </div>

              {/* ALLOWED STATE TRANSITION ACTIONS */}
              <div className="space-y-2 pt-2 border-t border-[#E4E6E2]">
                <span className="font-mono text-[10px] uppercase text-[#737773] block font-bold">
                  Execute Valid Lifecycle Transition:
                </span>

                <div className="flex flex-wrap gap-2">
                  {activeWorkOrder.status === 'Assigned' && (
                    <button
                      type="button"
                      disabled={isTransitioning}
                      onClick={() => handleTransition('Accepted')}
                      className="px-3 py-1.5 rounded-md bg-[#315C4C] text-white hover:bg-[#26483B] font-medium"
                    >
                      Accept Task
                    </button>
                  )}

                  {(activeWorkOrder.status === 'Accepted' || activeWorkOrder.status === 'Returned for Rework') && (
                    <button
                      type="button"
                      disabled={isTransitioning}
                      onClick={() => handleTransition('In Progress')}
                      className="px-3 py-1.5 rounded-md bg-[#315C4C] text-white hover:bg-[#26483B] font-medium"
                    >
                      Start Work (In Progress)
                    </button>
                  )}

                  {activeWorkOrder.status === 'In Progress' && (
                    <>
                      <button
                        type="button"
                        disabled={isTransitioning}
                        onClick={() => handleTransition('Blocked')}
                        className="px-3 py-1.5 rounded-md bg-[#FAF5ED] border border-[#C58B36]/40 text-[#C58B36] font-medium hover:bg-[#FAF5ED]/80"
                      >
                        Mark Blocked (Site Obstacle)
                      </button>

                      <button
                        type="button"
                        disabled={isTransitioning}
                        onClick={() => handleTransition('Submitted for Review')}
                        className="px-3 py-1.5 rounded-md bg-[#315C4C] text-white hover:bg-[#26483B] font-medium"
                      >
                        Submit for Completion Review
                      </button>
                    </>
                  )}

                  {activeWorkOrder.status === 'Blocked' && (
                    <button
                      type="button"
                      disabled={isTransitioning}
                      onClick={() => handleTransition('In Progress')}
                      className="px-3 py-1.5 rounded-md bg-[#315C4C] text-white hover:bg-[#26483B] font-medium"
                    >
                      Resume Work (Unblock)
                    </button>
                  )}

                  {activeWorkOrder.status === 'Submitted for Review' && (
                    <>
                      <button
                        type="button"
                        disabled={isTransitioning}
                        onClick={() => handleTransition('Completed')}
                        className="px-3 py-1.5 rounded-md bg-[#315C4C] text-white hover:bg-[#26483B] font-medium"
                      >
                        Approve Completion (Certify Fixed)
                      </button>

                      <button
                        type="button"
                        disabled={isTransitioning}
                        onClick={() => handleTransition('Returned for Rework')}
                        className="px-3 py-1.5 rounded-md bg-[#FAF0EF] border border-[#B8463B]/40 text-[#B8463B] font-medium"
                      >
                        Return for Rework
                      </button>
                    </>
                  )}

                  {activeWorkOrder.completionEvidence && (
                    <button
                      type="button"
                      onClick={() => setComparingOrder(activeWorkOrder)}
                      className="px-3 py-1.5 rounded-md bg-[#FAFBF9] border border-[#315C4C]/40 text-[#315C4C] font-semibold text-xs hover:bg-[#DDE7DF]/40 flex items-center gap-1.5"
                    >
                      <Sparkles size={12} />
                      <span>AI Evidence Comparison</span>
                    </button>
                  )}

                  {activeWorkOrder.status !== 'Completed' && activeWorkOrder.status !== 'Cancelled' && (
                    <button
                      type="button"
                      disabled={isTransitioning}
                      onClick={() => handleTransition('Cancelled')}
                      className="px-3 py-1.5 rounded-md bg-white border border-[#E4E6E2] text-[#737773] hover:text-[#B8463B] hover:border-[#B8463B]/40 ml-auto"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Notes Timeline */}
              {activeWorkOrder.progressNotes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#E4E6E2]">
                  <span className="font-mono text-[10px] uppercase text-[#737773] block font-bold">
                    Operational Field Log & Audit Notes ({activeWorkOrder.progressNotes.length})
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {activeWorkOrder.progressNotes.map((pn) => (
                      <div key={pn.id} className="p-2.5 rounded bg-[#F5F5F2] border border-[#E4E6E2] text-[11px]">
                        <div className="flex items-center justify-between font-mono text-[10px] text-[#737773] mb-0.5">
                          <span className="font-bold text-[#171918]">{pn.author}</span>
                          <span>{pn.timestamp}</span>
                        </div>
                        <p className="text-[#171918]">{pn.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI EVIDENCE COMPARISON MODAL */}
      {comparingOrder && (
        <EvidenceComparisonModal
          workOrder={comparingOrder}
          onClose={() => setComparingOrder(null)}
          isSupervisor={false}
        />
      )}
    </div>
  );
};
