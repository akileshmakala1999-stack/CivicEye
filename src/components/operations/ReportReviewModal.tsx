import React, { useState, useEffect } from 'react';
import { DashboardReport, IssueSeverity } from '../../types';
import { Badge } from '../common/Badge';
import { DEPARTMENTS, OPERATIONAL_STAFF, operationsService } from '../../services/operationsService';
import { intelligenceEngine, ReportIntelligence } from '../../services/intelligenceEngine';
import { communityValidationService } from '../../services/communityValidationService';
import { SmartReportAnalysisCard } from '../report/SmartReportAnalysisCard';
import {
  X,
  MapPin,
  Camera,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Flag,
  Copy,
} from 'lucide-react';

interface ReportReviewModalProps {
  report: DashboardReport | null;
  onClose: () => void;
  onActionCompleted: () => void;
}

export const ReportReviewModal: React.FC<ReportReviewModalProps> = ({
  report,
  onClose,
  onActionCompleted,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-roads');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<IssueSeverity>('high');
  const [targetHours, setTargetHours] = useState<number>(24);
  const [assignmentNotes, setAssignmentNotes] = useState<string>('');
  const [actionTab, setActionTab] = useState<'assign' | 'request_info' | 'duplicate' | 'reject'>('assign');

  // Request info / duplicate / reject input states
  const [duplicateTicket, setDuplicateTicket] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Intelligence & Community Summary
  const [intelligence, setIntelligence] = useState<ReportIntelligence | null>(null);

  useEffect(() => {
    if (report) {
      setSelectedPriority(report.severity);
      // Determine department recommendation
      if (report.category === 'Road damage') setSelectedDeptId('dept-roads');
      else if (report.category === 'Garbage') setSelectedDeptId('dept-sanitation');
      else if (report.category === 'Water leakage') setSelectedDeptId('dept-water');
      else if (report.category === 'Drainage') setSelectedDeptId('dept-drainage');
      else if (report.category === 'Streetlights') setSelectedDeptId('dept-electrical');
      else if (report.category === 'Damaged footpaths') setSelectedDeptId('dept-planning');
      else setSelectedDeptId('dept-roads');

      intelligenceEngine.analyzeReport(report).then((data) => {
        setIntelligence(data);
        if (data.duplicateMatches.length > 0) {
          setDuplicateTicket(data.duplicateMatches[0].ticketNumber);
        }
      });
    }
  }, [report]);

  // Update target hours based on department & priority
  useEffect(() => {
    const dept = DEPARTMENTS.find((d) => d.id === selectedDeptId);
    if (dept) {
      setTargetHours(dept.defaultSlaHours[selectedPriority] || 24);
    }
  }, [selectedDeptId, selectedPriority]);

  if (!report) return null;

  const communitySummary = communityValidationService.getCommunitySummary(report.id);
  const deptStaff = OPERATIONAL_STAFF.filter((s) => s.departmentId === selectedDeptId && s.role === 'staff');

  // Handle Approve & Assign
  const handleApprove = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await operationsService.approveReportForAssignment({
        reportId: report.id,
        departmentId: selectedDeptId,
        assignedStaffId: selectedStaffId || undefined,
        priority: selectedPriority,
        targetHours,
        assignmentNotes: assignmentNotes.trim() || undefined,
      });
      onActionCompleted();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Approval failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setErrorMsg('Rejection requires a documented administrative reason.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await operationsService.rejectReport({
        reportId: report.id,
        reason: rejectionReason.trim(),
      });
      onActionCompleted();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Rejection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Duplicate
  const handleDuplicate = async () => {
    if (!duplicateTicket.trim()) {
      setErrorMsg('Please specify the canonical ticket number.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await operationsService.rejectReport({
        reportId: report.id,
        reason: `Marked as duplicate of primary incident ${duplicateTicket.trim()}.`,
      });
      onActionCompleted();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#181C1A]/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-3xl bg-white border border-[#E4E6E2] rounded-xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 my-6">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E4E6E2] bg-[#F5F5F2]">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="font-bold text-[#315C4C]">OPERATIONS INTAKE REVIEW</span>
            <span className="text-[#E4E6E2]">|</span>
            <span className="text-[#171918] font-bold">{report.ticketNumber}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2] transition-colors"
            aria-label="Close review dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-[#FAF0EF] border border-[#B8463B]/30 text-xs font-medium text-[#B8463B]">
              {errorMsg}
            </div>
          )}

          {/* Issue Header */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge status={report.status} dot size="sm" />
              <Badge severity={report.severity} dot size="sm" />
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F5F5F2] border border-[#E4E6E2] text-[#737773]">
                {report.neighborhood}
              </span>
              <span className="text-[10px] font-mono text-[#737773] ml-auto">
                Logged: {report.reportTimestamp || report.reportDate}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-[#171918]">{report.title}</h2>
            <div className="flex items-center gap-1.5 text-xs text-[#737773]">
              <MapPin size={13} className="text-[#315C4C]" />
              <span>{report.location}</span>
            </div>
          </div>

          {/* 4 Classification Readouts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
            <div className="p-2.5 rounded bg-[#F5F5F2] border border-[#E4E6E2]">
              <span className="text-[#737773] block uppercase text-[9px]">Citizen Severity</span>
              <span className="font-bold text-[#171918]">{report.severity.toUpperCase()}</span>
            </div>
            <div className="p-2.5 rounded bg-[#FAF5ED] border border-[#C58B36]/30">
              <span className="text-[#C58B36] block uppercase text-[9px]">AI Risk Score</span>
              <span className="font-bold text-[#C58B36]">
                {intelligence ? `${intelligence.riskScore}/100 (${intelligence.aiAssessedRisk})` : 'Calculating...'}
              </span>
            </div>
            <div className="p-2.5 rounded bg-[#DDE7DF]/50 border border-[#315C4C]/30">
              <span className="text-[#315C4C] block uppercase text-[9px]">Community Consensus</span>
              <span className="font-bold text-[#315C4C]">
                {report.confirmationsCount} confirmations {communitySummary.gettingWorse > 0 ? `(🔥 ${communitySummary.gettingWorse} worse)` : ''}
              </span>
            </div>
            <div className="p-2.5 rounded bg-[#F5F5F2] border border-[#E4E6E2]">
              <span className="text-[#737773] block uppercase text-[9px]">Calculated Priority</span>
              <span className="font-bold text-[#315C4C]">
                {intelligence ? `${intelligence.civicPriorityScore}/100` : 'Calculating...'}
              </span>
            </div>
          </div>

          {/* Citizen Description & Attached Ground Evidence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-white border border-[#E4E6E2] space-y-1.5">
              <span className="font-mono text-[10px] uppercase text-[#737773] font-bold block">
                Citizen Ground Observation
              </span>
              <p className="text-[#171918] leading-relaxed">{report.description}</p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#737773] font-bold block mb-1">
                  Photographic Evidence Attached
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded bg-white border border-[#E4E6E2] flex items-center justify-center text-[#315C4C]">
                    <Camera size={18} />
                  </div>
                  <div>
                    <span className="font-semibold text-[#171918] block text-xs">Citizen Photo #01</span>
                    <span className="text-[10px] font-mono text-[#315C4C]">Geo-Tagged & Verified</span>
                  </div>
                </div>
              </div>

              {intelligence && intelligence.duplicateMatches.length > 0 && (
                <div className="mt-2 p-2 rounded bg-[#FAF5ED] border border-[#C58B36]/30 text-[10px] text-[#C58B36] flex items-center gap-1.5">
                  <AlertTriangle size={12} className="flex-shrink-0" />
                  <span>Potential duplicate: {intelligence.duplicateMatches[0].ticketNumber} ({intelligence.duplicateMatches[0].similarityPercent}% match)</span>
                </div>
              )}
            </div>
          </div>

          {/* SMART CIVIC INTELLIGENCE ENGINE & CORRIDOR RELATIONSHIPS (PHASE 9) */}
          {intelligence && (
            <SmartReportAnalysisCard
              report={report}
              intelligence={intelligence}
            />
          )}

          {/* REVIEW ACTIONS TAB SELECTOR */}
          <div className="pt-2 border-t border-[#E4E6E2]">
            <div className="flex border-b border-[#E4E6E2] text-xs font-medium">
              <button
                type="button"
                onClick={() => setActionTab('assign')}
                className={`px-4 py-2 border-b-2 transition-all flex items-center gap-1.5 ${
                  actionTab === 'assign'
                    ? 'border-[#315C4C] text-[#315C4C] font-bold'
                    : 'border-transparent text-[#737773] hover:text-[#171918]'
                }`}
              >
                <Wrench size={13} />
                <span>Approve & Issue Work Order</span>
              </button>

              <button
                type="button"
                onClick={() => setActionTab('duplicate')}
                className={`px-4 py-2 border-b-2 transition-all flex items-center gap-1.5 ${
                  actionTab === 'duplicate'
                    ? 'border-[#C58B36] text-[#C58B36] font-bold'
                    : 'border-transparent text-[#737773] hover:text-[#171918]'
                }`}
              >
                <Copy size={13} />
                <span>Link Duplicate</span>
              </button>

              <button
                type="button"
                onClick={() => setActionTab('reject')}
                className={`px-4 py-2 border-b-2 transition-all flex items-center gap-1.5 ${
                  actionTab === 'reject'
                    ? 'border-[#B8463B] text-[#B8463B] font-bold'
                    : 'border-transparent text-[#737773] hover:text-[#171918]'
                }`}
              >
                <Flag size={13} />
                <span>Reject Report</span>
              </button>
            </div>

            {/* TAB 1: APPROVE & ISSUE WORK ORDER */}
            {actionTab === 'assign' && (
              <div className="pt-4 space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                      Assigned Department Division *
                    </label>
                    <select
                      value={selectedDeptId}
                      onChange={(e) => {
                        setSelectedDeptId(e.target.value);
                        setSelectedStaffId('');
                      }}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E4E6E2] bg-white text-[#171918] focus:border-[#315C4C] outline-none"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                      Designate Field Squad / Engineer
                    </label>
                    <select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E4E6E2] bg-white text-[#171918] focus:border-[#315C4C] outline-none"
                    >
                      <option value="">Auto-Assign to Next Available Division Crew</option>
                      {deptStaff.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} ({staff.activeWorkload} active orders)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                      Operational Severity Override
                    </label>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value as IssueSeverity)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E4E6E2] bg-white text-[#171918] focus:border-[#315C4C] outline-none"
                    >
                      <option value="critical">Critical (4h Emergency SLA)</option>
                      <option value="high">High (24h Expedited SLA)</option>
                      <option value="medium">Moderate (72h Standard SLA)</option>
                      <option value="low">Low (7d Routine Maintenance)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                      SLA Target Completion Window
                    </label>
                    <input
                      type="number"
                      value={targetHours}
                      onChange={(e) => setTargetHours(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E4E6E2] bg-white text-[#171918] focus:border-[#315C4C] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                    Specific Dispatch Instructions & Materials Note
                  </label>
                  <textarea
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    rows={2}
                    placeholder="Provide guidance for field squads (e.g., coordinate with traffic police, use 80mm paver blocks, isolate north feeder valve)..."
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E4E6E2] focus:border-[#315C4C] outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded text-xs text-[#737773] hover:text-[#171918]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <CheckCircle size={14} />
                    <span>{isSubmitting ? 'Issuing Work Order...' : 'Approve & Issue Work Order'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: LINK DUPLICATE */}
            {actionTab === 'duplicate' && (
              <div className="pt-4 space-y-3.5 animate-in fade-in duration-150">
                <p className="text-xs text-[#737773]">
                  Link this incident to an existing open ticket. The citizen will be redirected to follow the canonical ticket.
                </p>

                <div>
                  <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                    Canonical Ticket Number *
                  </label>
                  <input
                    type="text"
                    value={duplicateTicket}
                    onChange={(e) => setDuplicateTicket(e.target.value)}
                    placeholder="e.g. HYD-JH-2026-081"
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E4E6E2] focus:border-[#C58B36] outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded text-xs text-[#737773] hover:text-[#171918]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDuplicate}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-[#C58B36] text-white text-xs font-semibold hover:bg-[#A8742A] transition-colors"
                  >
                    {isSubmitting ? 'Linking...' : 'Confirm Duplicate Link'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: REJECT REPORT */}
            {actionTab === 'reject' && (
              <div className="pt-4 space-y-3.5 animate-in fade-in duration-150">
                <p className="text-xs text-[#737773]">
                  Reject this report if it falls outside municipal scope, is private property, or lacks verifiable evidence.
                </p>

                <div>
                  <label className="text-[11px] font-mono text-[#737773] uppercase block mb-1">
                    Documented Administrative Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. Gated community private driveway out of municipal jurisdiction; referred to RWA management..."
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E4E6E2] focus:border-[#B8463B] outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded text-xs text-[#737773] hover:text-[#171918]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-[#B8463B] text-white text-xs font-semibold hover:bg-[#97362C] transition-colors"
                  >
                    {isSubmitting ? 'Rejecting...' : 'Reject Report'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
