import React from 'react';
import { DashboardReport } from '../../types';
import { operationsService, DEPARTMENTS } from '../../services/operationsService';
import { aiOrchestrationService } from '../../services/aiOrchestrationService';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wrench,
  ShieldAlert,
  ArrowUpRight,
  GitMerge,
  Sparkles,
} from 'lucide-react';

interface OperationsOverviewTabProps {
  reports: DashboardReport[];
  onSelectTab: (tab: string) => void;
}

export const OperationsOverviewTab: React.FC<OperationsOverviewTabProps> = ({
  reports,
  onSelectTab,
}) => {
  const metrics = operationsService.getOperationsMetrics();
  const workOrders = operationsService.getWorkOrders();

  const submittedReports = reports.filter((r) => r.status === 'Submitted');
  const assignedReports = reports.filter((r) => r.status === 'Assigned' || r.status === 'Under Review');
  const inProgressReports = reports.filter((r) => r.status === 'In Progress');
  const resolvedReports = reports.filter((r) => r.status === 'Resolved');
  const challengedReports = reports.filter((r) => r.resolutionStatus?.isChallenged);

  return (
    <div className="space-y-6">
      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1 */}
        <div
          onClick={() => onSelectTab('review-queue')}
          className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-xs cursor-pointer hover:border-[#315C4C] transition-all space-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#737773]">Review Queue</span>
            <FileText size={14} className="text-[#315C4C] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#171918]">
            {submittedReports.length}
          </div>
          <span className="text-[10px] text-[#C58B36] font-mono block">Needs Triage</span>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onSelectTab('work-orders')}
          className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-xs cursor-pointer hover:border-[#315C4C] transition-all space-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#737773]">Active Orders</span>
            <Wrench size={14} className="text-[#315C4C] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#171918]">
            {metrics.activeOrders}
          </div>
          <span className="text-[10px] text-[#315C4C] font-mono block">Assigned / Progress</span>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onSelectTab('supervisor-review')}
          className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-xs cursor-pointer hover:border-[#315C4C] transition-all space-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#737773]">Completion Review</span>
            <CheckCircle size={14} className="text-[#315C4C] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#171918]">
            {metrics.pendingReviewOrders}
          </div>
          <span className="text-[10px] text-[#315C4C] font-mono block">Awaiting Sign-off</span>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onSelectTab('work-orders')}
          className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-xs cursor-pointer hover:border-[#B8463B] transition-all space-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#737773]">Blocked Tasks</span>
            <AlertTriangle size={14} className="text-[#B8463B] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#B8463B]">
            {metrics.blockedOrders}
          </div>
          <span className="text-[10px] text-[#B8463B] font-mono block">Site Obstacle</span>
        </div>

        {/* Metric 5 */}
        <div
          onClick={() => onSelectTab('work-orders')}
          className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-xs cursor-pointer hover:border-[#C58B36] transition-all space-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#737773]">Overdue / Risk</span>
            <Clock size={14} className="text-[#C58B36] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#C58B36]">
            {metrics.overdueOrders}
          </div>
          <span className="text-[10px] text-[#737773] font-mono block">Passed Target SLA</span>
        </div>

        {/* Metric 6 */}
        <div
          onClick={() => onSelectTab('priority-queue')}
          className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-xs cursor-pointer hover:border-[#B8463B] transition-all space-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#737773]">Disputes</span>
            <ShieldAlert size={14} className="text-[#B8463B] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#B8463B]">
            {challengedReports.length}
          </div>
          <span className="text-[10px] text-[#B8463B] font-mono block">Challenged by Citizens</span>
        </div>
      </div>

      {/* PHASE 9 AI DECISION SUPPORT & MULTI-AGENCY COORDINATION CALLOUT */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-white to-[#FAFBF9] border border-[#315C4C]/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-[#DDE7DF] text-[#315C4C] shrink-0 mt-0.5 sm:mt-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-[10px] uppercase font-bold text-[#315C4C]">
                Smart Municipal Decision Support
              </span>
              <span className="px-2 py-0.2 rounded-full text-[9px] font-mono bg-[#DDE7DF] text-[#315C4C] font-semibold">
                Phase 9 Active
              </span>
            </div>
            <h4 className="text-sm font-bold text-[#171918]">
              {aiOrchestrationService.getCoordinationPlans().filter(p => p.status === 'AI Proposed' || p.status === 'Awaiting Human Review').length} Multi-Agency Proposal(s) Pending Review
            </h4>
            <p className="text-xs text-[#737773] mt-0.5 max-w-xl">
              Cross-utility hazard analysis detected interdependent road, water, and drainage bottlenecks requiring multi-wing sequencing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab('ai-decision-support')}
            className="px-3 py-2 rounded-lg bg-white border border-[#E4E6E2] text-xs font-semibold text-[#171918] hover:bg-[#FAFBF9] transition-colors"
          >
            Daily Decision Queue
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('coordination')}
            className="px-3.5 py-2 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <GitMerge size={13} />
            <span>Multi-Agency Coordination</span>
          </button>
        </div>
      </div>

      {/* OPERATIONS WORKFLOW PIPELINE HEALTH */}
      <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E6E2]">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[#171918]">
              End-to-End Municipal Resolution Pipeline
            </h3>
            <p className="text-xs text-[#737773]">
              Active distribution of civic issues across the 5 lifecycle phases.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#315C4C] font-semibold">
            {reports.length} Total Registered Tickets
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          {/* Phase 1 */}
          <div className="p-3 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2]">
            <span className="text-[10px] font-mono uppercase text-[#737773] block mb-1">
              1. Intake Queue
            </span>
            <div className="text-xl font-bold text-[#171918]">{submittedReports.length}</div>
            <p className="text-[10px] text-[#737773] mt-1">Pending AI duplicate & triage check.</p>
          </div>

          {/* Phase 2 */}
          <div className="p-3 rounded-lg bg-[#FAF5ED] border border-[#C58B36]/30">
            <span className="text-[10px] font-mono uppercase text-[#C58B36] block mb-1">
              2. Assigned to Dept
            </span>
            <div className="text-xl font-bold text-[#171918]">{assignedReports.length}</div>
            <p className="text-[10px] text-[#737773] mt-1">Work order issued to division squads.</p>
          </div>

          {/* Phase 3 */}
          <div className="p-3 rounded-lg bg-[#FAF0EF] border border-[#B8463B]/20">
            <span className="text-[10px] font-mono uppercase text-[#B8463B] block mb-1">
              3. Field In Progress
            </span>
            <div className="text-xl font-bold text-[#B8463B]">{inProgressReports.length}</div>
            <p className="text-[10px] text-[#737773] mt-1">Field squads executing physical repairs.</p>
          </div>

          {/* Phase 4 */}
          <div className="p-3 rounded-lg bg-[#DDE7DF]/50 border border-[#315C4C]/30">
            <span className="text-[10px] font-mono uppercase text-[#315C4C] block mb-1">
              4. Supervisor Audit
            </span>
            <div className="text-xl font-bold text-[#315C4C]">{metrics.pendingReviewOrders}</div>
            <p className="text-[10px] text-[#737773] mt-1">Completion photos awaiting sign-off.</p>
          </div>

          {/* Phase 5 */}
          <div className="p-3 rounded-lg bg-white border border-[#315C4C]/40">
            <span className="text-[10px] font-mono uppercase text-[#315C4C] block mb-1">
              5. Citizen Verification
            </span>
            <div className="text-xl font-bold text-[#315C4C]">{resolvedReports.length}</div>
            <p className="text-[10px] text-[#737773] mt-1">Official closure open to community audit.</p>
          </div>
        </div>
      </div>

      {/* DEPARTMENT WORKLOAD MATRIX */}
      <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E6E2]">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[#171918]">
              Department Workload & SLA Performance Roster
            </h3>
            <p className="text-xs text-[#737773]">
              Active tasks, resolution rates, and departmental contacts across Hyderabad.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#737773]">
            {DEPARTMENTS.length} Municipal Departments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E4E6E2] text-[10px] font-mono text-[#737773] uppercase bg-[#F5F5F2]">
                <th className="py-2.5 px-3">Department Division</th>
                <th className="py-2.5 px-3">Officer in Charge</th>
                <th className="py-2.5 px-3 text-center">Active Orders</th>
                <th className="py-2.5 px-3 text-center">SLA Compliance</th>
                <th className="py-2.5 px-3">Standard SLA Targets</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E6E2]">
              {DEPARTMENTS.map((dept) => {
                const deptOrders = workOrders.filter((w) => w.departmentId === dept.id);
                const activeCount = deptOrders.filter((w) => w.status !== 'Completed' && w.status !== 'Cancelled').length;

                return (
                  <tr key={dept.id} className="hover:bg-[#FAFBF9] transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#171918]">{dept.name}</div>
                      <div className="text-[10px] font-mono text-[#737773]">{dept.code}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[#171918] font-medium">{dept.headOfficer}</div>
                      <div className="text-[10px] font-mono text-[#737773]">{dept.contactNumber}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#F5F5F2] border border-[#E4E6E2] text-[#171918]">
                        {activeCount} active
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded font-mono font-semibold bg-[#DDE7DF] text-[#315C4C]">
                        {dept.onTimePercentage}% on-time
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px] text-[#737773]">
                      <span>Crit: {dept.defaultSlaHours.critical}h • High: {dept.defaultSlaHours.high}h • Med: {dept.defaultSlaHours.medium}h</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectTab('work-orders')}
                        className="text-[#315C4C] hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <span>Inspect Orders</span>
                        <ArrowUpRight size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-[11px] font-mono text-[#737773] flex items-center justify-between">
          <span>* SLA policies configured for demonstration: Critical (4h), High (24h), Moderate (72h), Low (7d).</span>
          <span className="text-[#315C4C]">DEMO PERFORMANCE AUDITED</span>
        </div>
      </div>
    </div>
  );
};
