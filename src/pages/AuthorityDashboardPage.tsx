import React, { useState, useEffect } from 'react';
import { DashboardReport, OperationalRole } from '../types';
import { reportService } from '../services/reportService';
import { operationsService } from '../services/operationsService';
import { OperationsHeader } from '../components/operations/OperationsHeader';
import { OperationsOverviewTab } from '../components/operations/OperationsOverviewTab';
import { ReviewQueueTab } from '../components/operations/ReviewQueueTab';
import { PriorityQueueTab } from '../components/operations/PriorityQueueTab';
import { WorkOrdersTab } from '../components/operations/WorkOrdersTab';
import { StaffWorkspaceTab } from '../components/operations/StaffWorkspaceTab';
import { SupervisorReviewTab } from '../components/operations/SupervisorReviewTab';
import { AuditTrailTab } from '../components/operations/AuditTrailTab';
import { CrossDepartmentCoordinationTab } from '../components/operations/CrossDepartmentCoordinationTab';
import { AiDecisionSupportPanel } from '../components/operations/AiDecisionSupportPanel';
import { ReportDetailModal } from '../components/dashboard/ReportDetailModal';
import { aiOrchestrationService } from '../services/aiOrchestrationService';
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Wrench,
  UserCheck,
  Shield,
  Lock,
  GitMerge,
  Sparkles,
} from 'lucide-react';

export const AuthorityDashboardPage: React.FC = () => {
  const [reports, setReports] = useState<DashboardReport[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activeRole, setActiveRole] = useState<OperationalRole>(() => operationsService.getActiveRole());
  const [activeStaffId, setActiveStaffId] = useState<string>(() => operationsService.getActiveStaffId());
  const [inspectingReport, setInspectingReport] = useState<DashboardReport | null>(null);

  const loadReports = async () => {
    const list = await reportService.getAllReports();
    setReports(list);
    aiOrchestrationService.detectMultiAgencyNeeds(list);
    aiOrchestrationService.detectInfrastructureRelationships(list);
  };

  useEffect(() => {
    loadReports();
    const handleUpdate = () => loadReports();
    window.addEventListener('civiceye_reports_updated', handleUpdate);
    window.addEventListener('civiceye_operations_updated', handleUpdate);
    window.addEventListener('civiceye_coordination_updated', handleUpdate);
    return () => {
      window.removeEventListener('civiceye_reports_updated', handleUpdate);
      window.removeEventListener('civiceye_operations_updated', handleUpdate);
      window.removeEventListener('civiceye_coordination_updated', handleUpdate);
    };
  }, []);

  const handleRoleChange = (role: OperationalRole) => {
    setActiveRole(role);
    operationsService.setActiveRole(role);
  };

  const handleStaffChange = (staffId: string) => {
    setActiveStaffId(staffId);
    operationsService.setActiveStaffId(staffId);
  };

  const pendingCoordCount = aiOrchestrationService
    .getCoordinationPlans()
    .filter((p) => p.status === 'AI Proposed' || p.status === 'Awaiting Human Review').length;

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
    {
      id: 'coordination',
      label: 'Multi-Agency Coordination',
      icon: <GitMerge size={14} />,
      badge: pendingCoordCount,
    },
    {
      id: 'ai-decision-support',
      label: 'AI Decision Support',
      icon: <Sparkles size={14} className="text-[#315C4C]" />,
    },
    { id: 'review-queue', label: 'Review Queue', icon: <FileText size={14} />, badge: reports.filter((r) => r.status === 'Submitted').length },
    { id: 'priority-queue', label: 'Priority Queue', icon: <TrendingUp size={14} /> },
    { id: 'work-orders', label: 'Work Orders', icon: <Wrench size={14} /> },
    { id: 'staff-desk', label: 'Field Staff Desk', icon: <Wrench size={14} /> },
    { id: 'supervisor-review', label: 'Supervisor Review', icon: <UserCheck size={14} />, badge: operationsService.getWorkOrders().filter((w) => w.status === 'Submitted for Review').length },
    { id: 'audit-trail', label: 'Audit Trail', icon: <Shield size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-[#171918] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Operations Header with Role Switcher */}
        <OperationsHeader
          activeRole={activeRole}
          onRoleChange={handleRoleChange}
          activeStaffId={activeStaffId}
          onStaffChange={handleStaffChange}
        />

        {/* ROLE-BASED ACCESS CONTROL (RBAC) CHECK */}
        {activeRole === 'citizen' ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-white border border-[#E4E6E2] shadow-sm text-center max-w-2xl mx-auto space-y-4 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-[#FAF0EF] text-[#B8463B] flex items-center justify-center mx-auto border border-[#B8463B]/20">
              <Lock size={26} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#171918]">
                Municipal Operational Controls Restricted
              </h2>
              <p className="text-xs text-[#737773] max-w-md mx-auto leading-relaxed">
                You are currently viewing with the <strong>Citizen</strong> profile. Operational triage queues, work order assignments, and completion reviews are strictly restricted to authorized municipal roles.
              </p>
            </div>

            <div className="pt-4 border-t border-[#E4E6E2]">
              <span className="text-[11px] font-mono uppercase text-[#737773] block mb-3 font-semibold">
                Switch to an Authorized Role to Unlock Municipal Workflows:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleRoleChange('reviewer')}
                  className="p-2.5 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2] hover:bg-white hover:border-[#315C4C] text-[#171918] font-medium transition-all"
                >
                  <span className="font-bold block text-[#315C4C]">Reviewer</span>
                  <span className="text-[10px] text-[#737773]">Triage & Intake</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('staff')}
                  className="p-2.5 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2] hover:bg-white hover:border-[#315C4C] text-[#171918] font-medium transition-all"
                >
                  <span className="font-bold block text-[#315C4C]">Field Staff</span>
                  <span className="text-[10px] text-[#737773]">Execute On Site</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('supervisor')}
                  className="p-2.5 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2] hover:bg-white hover:border-[#315C4C] text-[#171918] font-medium transition-all"
                >
                  <span className="font-bold block text-[#315C4C]">Supervisor</span>
                  <span className="text-[10px] text-[#737773]">Assign & Sign-off</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('admin')}
                  className="p-2.5 rounded-lg border border-[#E4E6E2] bg-[#315C4C] text-white font-medium hover:bg-[#26483B] transition-all shadow-xs"
                >
                  <span className="font-bold block">Administrator</span>
                  <span className="text-[10px] text-white/80">Full Access</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* OPERATIONS WORKSPACE NAVIGATION TABS */}
            <div className="flex border-b border-[#E4E6E2] overflow-x-auto text-xs font-medium space-x-1">
              {navTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-4 border-b-2 font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
                      isActive
                        ? 'border-[#315C4C] text-[#315C4C] font-bold bg-white/70'
                        : 'border-transparent text-[#737773] hover:text-[#171918] hover:border-[#E4E6E2]'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                          isActive
                            ? 'bg-[#315C4C] text-white'
                            : 'bg-[#F5F5F2] text-[#737773] border border-[#E4E6E2]'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENTS */}
            {activeTab === 'overview' && (
              <OperationsOverviewTab
                reports={reports}
                onSelectTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'coordination' && (
              <CrossDepartmentCoordinationTab
                activeRole={activeRole}
                onRefresh={loadReports}
              />
            )}

            {activeTab === 'ai-decision-support' && (
              <AiDecisionSupportPanel
                reports={reports}
                workOrders={operationsService.getWorkOrders()}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onInspectReport={(reportId) => {
                  const r = reports.find((rep) => rep.id === reportId);
                  if (r) setInspectingReport(r);
                }}
              />
            )}

            {activeTab === 'review-queue' && (
              <ReviewQueueTab
                reports={reports}
                onRefresh={loadReports}
              />
            )}

            {activeTab === 'priority-queue' && (
              <PriorityQueueTab
                reports={reports}
                onRefresh={loadReports}
              />
            )}

            {activeTab === 'work-orders' && (
              <WorkOrdersTab
                onRefresh={loadReports}
              />
            )}

            {activeTab === 'staff-desk' && (
              <StaffWorkspaceTab
                onRefresh={loadReports}
              />
            )}

            {activeTab === 'supervisor-review' && (
              <SupervisorReviewTab
                onRefresh={loadReports}
              />
            )}

            {activeTab === 'audit-trail' && (
              <AuditTrailTab />
            )}

            {/* INSPECTED REPORT MODAL */}
            {inspectingReport && (
              <ReportDetailModal
                report={inspectingReport}
                onClose={() => setInspectingReport(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
