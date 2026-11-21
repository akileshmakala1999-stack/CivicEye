import React, { useState } from 'react';
import { operationsService } from '../../services/operationsService';
import {
  Shield,
  Search,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export const AuditTrailTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  const logs = operationsService.getAuditLogs();

  const filteredLogs = logs.filter((l) => {
    if (selectedRole !== 'all' && l.actorRole !== selectedRole) return false;
    if (selectedAction !== 'all' && l.action !== selectedAction) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        l.id.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q) ||
        (l.reason && l.reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* HEADER BAR */}
      <div className="p-4 rounded-xl bg-white border border-[#E4E6E2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className="text-[#315C4C]" />
            <span className="font-mono text-xs uppercase font-bold text-[#315C4C]">
              Immutable Operations Audit Trail
            </span>
          </div>
          <p className="text-[#737773] max-w-2xl">
            Append-only historical ledger capturing every intake review, department assignment, state transition, and supervisor sign-off.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded bg-[#DDE7DF]/50 border border-[#315C4C]/20 text-[11px] font-mono text-[#315C4C] font-semibold self-start sm:self-auto">
          {logs.length} Logged Audit Events
        </span>
      </div>

      {/* FILTER BAR */}
      <div className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-60">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#737773]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actor, entity ID, reason..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2]/50 text-xs text-[#171918] focus:border-[#315C4C] outline-none"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none"
          >
            <option value="all">All Actor Roles</option>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="reviewer">Reviewer</option>
            <option value="staff">Field Staff</option>
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none"
          >
            <option value="all">All Event Actions</option>
            <option value="report_approved">Report Approved</option>
            <option value="report_rejected">Report Rejected</option>
            <option value="work_order_created">Work Order Created</option>
            <option value="work_order_started">Work Started</option>
            <option value="work_order_blocked">Work Blocked</option>
            <option value="completion_approved">Completion Certified</option>
            <option value="rework_returned">Rework Returned</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-[#737773]">
          <span>Showing {filteredLogs.length} events</span>
          {(searchQuery || selectedRole !== 'all' || selectedAction !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedRole('all');
                setSelectedAction('all');
              }}
              className="text-[#315C4C] hover:underline flex items-center gap-1"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white border border-[#E4E6E2] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E4E6E2] text-[10px] font-mono text-[#737773] uppercase bg-[#F5F5F2]">
                <th className="py-2.5 px-3">Timestamp / Log ID</th>
                <th className="py-2.5 px-3">Actor & Role</th>
                <th className="py-2.5 px-3">Action Event</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">State Transition</th>
                <th className="py-2.5 px-3">Reason / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E6E2]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#737773] text-xs">
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAFBF9] transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono text-[#171918] font-bold block">{log.timestamp}</span>
                      <span className="text-[10px] font-mono text-[#737773]">{log.id}</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-[#171918]">{log.actorName}</div>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-[#F5F5F2] border border-[#E4E6E2] text-[#737773]">
                        {log.actorRole}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-[#315C4C] block uppercase text-[10px]">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <span className="text-[10px] text-[#737773] uppercase block">{log.entityType}</span>
                      <span className="font-bold text-[#171918]">{log.entityId}</span>
                    </td>

                    <td className="py-3 px-3">
                      {log.previousState && log.newState ? (
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          <span className="text-[#737773]">{log.previousState}</span>
                          <ArrowRight size={10} className="text-[#315C4C]" />
                          <span className="font-bold text-[#171918]">{log.newState}</span>
                        </div>
                      ) : log.newState ? (
                        <span className="font-mono text-[10px] font-bold text-[#315C4C]">
                          Initial: {log.newState}
                        </span>
                      ) : (
                        <span className="text-[#737773]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-[#171918] max-w-[260px]">
                      <p className="line-clamp-2 leading-relaxed">{log.reason || '—'}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
