import React from 'react';
import { Link } from 'react-router-dom';
import { OperationalRole } from '../../types';
import { operationsService, OPERATIONAL_STAFF } from '../../services/operationsService';
import {
  Building2,
  Shield,
  UserCheck,
  Wrench,
  Eye,
  Lock,
  ChevronRight,
} from 'lucide-react';

interface OperationsHeaderProps {
  activeRole: OperationalRole;
  onRoleChange: (role: OperationalRole) => void;
  activeStaffId: string;
  onStaffChange: (staffId: string) => void;
}

export const OperationsHeader: React.FC<OperationsHeaderProps> = ({
  activeRole,
  onRoleChange,
  activeStaffId,
  onStaffChange,
}) => {
  const operator = operationsService.getCurrentOperator();

  const roles: { role: OperationalRole; label: string; icon: React.ReactNode; desc: string }[] = [
    { role: 'admin', label: 'Admin', icon: <Shield size={13} />, desc: 'Full System Control' },
    { role: 'supervisor', label: 'Supervisor', icon: <UserCheck size={13} />, desc: 'Assign & Sign-off' },
    { role: 'reviewer', label: 'Reviewer', icon: <Eye size={13} />, desc: 'Triage & Intake' },
    { role: 'staff', label: 'Field Staff', icon: <Wrench size={13} />, desc: 'On-site Execution' },
    { role: 'citizen', label: 'Citizen', icon: <Lock size={13} />, desc: 'Restricted Access' },
  ];

  return (
    <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 shadow-sm space-y-4">
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E4E6E2]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#315C4C] font-semibold">
            <Building2 size={15} />
            <span>GREATER HYDERABAD MUNICIPAL CORPORATION • OPERATIONS PORTAL</span>
            <span className="text-[#E4E6E2]">|</span>
            <span className="text-[#737773] uppercase">PHASE 6 OPERATIONS DESK</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171918]">
            Municipal Resolution & Operations Center
          </h1>
          <p className="text-xs text-[#737773]">
            Operational triage, department work orders, field dispatch execution, and supervisor completion audits.
          </p>
        </div>

        {/* View Switches */}
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="px-3 py-1.5 rounded-lg bg-[#F5F5F2] hover:bg-[#E4E6E2] border border-[#E4E6E2] text-xs font-medium text-[#171918] transition-colors flex items-center gap-1.5"
          >
            <span>Citizen Space</span>
            <ChevronRight size={12} />
          </Link>

          <Link
            to="/explore"
            className="px-3 py-1.5 rounded-lg bg-[#315C4C] text-white hover:bg-[#26483B] text-xs font-semibold transition-colors shadow-xs"
          >
            GIS Map Grid
          </Link>
        </div>
      </div>

      {/* Role Switcher Toolbar (Required for testing Phase 6 RBAC seamlessly) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs bg-[#FAFBF9] p-3 rounded-lg border border-[#315C4C]/20">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-bold text-[#171918] uppercase mr-1">
            Simulate Role:
          </span>

          <div className="flex flex-wrap gap-1.5">
            {roles.map((r) => {
              const isActive = activeRole === r.role;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => onRoleChange(r.role)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-[#315C4C] text-white border-[#315C4C] shadow-xs ring-1 ring-[#315C4C]'
                      : 'bg-white border-[#E4E6E2] text-[#171918] hover:bg-[#F5F5F2]'
                  }`}
                  title={r.desc}
                >
                  {r.icon}
                  <span className="font-semibold">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Operator Badge / Field Staff Switcher */}
        <div className="flex items-center gap-3">
          {activeRole === 'staff' && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#737773] uppercase">Field Crew:</span>
              <select
                value={activeStaffId}
                onChange={(e) => onStaffChange(e.target.value)}
                className="px-2.5 py-1 rounded border border-[#E4E6E2] bg-white text-xs font-medium text-[#171918] focus:border-[#315C4C] outline-none"
              >
                {OPERATIONAL_STAFF.filter((s) => s.role === 'staff').map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.departmentName.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1 rounded bg-white border border-[#E4E6E2] text-xs">
            <span className="w-2 h-2 rounded-full bg-[#315C4C] animate-pulse" />
            <div>
              <span className="font-bold text-[#171918]">{operator.name}</span>
              <span className="text-[10px] text-[#737773] font-mono block">
                {operator.title}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
