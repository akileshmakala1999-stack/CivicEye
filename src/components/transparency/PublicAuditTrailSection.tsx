import React, { useState } from 'react';
import { PublicAuditRecord } from '../../types';
import { Search, Lock, Eye, ArrowRight } from 'lucide-react';

interface PublicAuditTrailSectionProps {
  auditRecords: PublicAuditRecord[];
}

export const PublicAuditTrailSection: React.FC<PublicAuditTrailSectionProps> = ({ auditRecords }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredRecords = auditRecords.filter((rec) => {
    if (roleFilter !== 'all' && rec.actorRole !== roleFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTicket = rec.entityTicket.toLowerCase().includes(q);
      const matchAction = rec.actionLabel.toLowerCase().includes(q);
      const matchDept = (rec.departmentName || '').toLowerCase().includes(q);
      return matchTicket || matchAction || matchDept;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E4E6E2] rounded-xl p-6 sm:p-8 shadow-xs">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E4E6E2]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#DDE7DF] text-[#315C4C] font-semibold border border-[#315C4C]/20">
                Append-Only Audit Ledger • Features 09 & 10
              </span>
              <span className="text-xs font-mono text-[#737773]">{auditRecords.length} Verified Entries</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#171918]">
              Public Accountability Audit Trail
            </h2>
            <p className="text-xs sm:text-sm text-[#737773] mt-1 max-w-2xl leading-relaxed">
              Every status advancement, department dispatch, rework order, and citizen sign-off is committed to an immutable append-only ledger. Personal identities and internal staff numbers are safely redacted in the public view.
            </p>
          </div>

          {/* Privacy Boundary Badge */}
          <div className="p-3 rounded-lg bg-[#FAFBF9] border border-[#E4E6E2] flex items-center gap-2.5 text-xs font-mono shrink-0">
            <Lock size={14} className="text-[#315C4C]" />
            <div>
              <span className="text-[#171918] font-bold block">Privacy Redaction Active</span>
              <span className="text-[10px] text-[#737773]">Zero PII / Internal Notes Excluded</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737773]" />
              <input
                type="text"
                placeholder="Search ticket or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-[#E4E6E2] bg-[#FAFBF9] text-xs text-[#171918] focus:border-[#315C4C] outline-none w-56 font-mono"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E4E6E2] bg-[#FAFBF9] text-xs font-medium text-[#171918] focus:border-[#315C4C] outline-none"
            >
              <option value="all">All Actor Roles</option>
              <option value="reviewer">Triage Reviewers</option>
              <option value="staff">Field Engineering Squads</option>
              <option value="supervisor">Section Supervisors</option>
              <option value="citizen">Ward Citizens</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div className="text-xs font-mono text-[#737773]">
            Showing {filteredRecords.length} of {auditRecords.length} records
          </div>
        </div>

        {/* Audit Log Timeline */}
        <div className="space-y-3 pt-2">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[#737773] bg-[#FAFBF9] rounded-lg border border-[#E4E6E2]">
              No audit records matching your search criteria.
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className="p-4 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2] hover:border-[#315C4C]/40 transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#315C4C]" />
                    <span className="font-mono text-xs font-bold text-[#171918]">
                      {record.entityTicket}
                    </span>
                    <span className="text-[#E4E6E2]">|</span>
                    <span className="text-xs font-semibold text-[#171918]">
                      {record.actionLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#737773]">
                    <span className="px-2 py-0.5 rounded bg-white border border-[#E4E6E2]">
                      {record.actorDisplayTitle}
                    </span>
                    <span>{record.timestamp}</span>
                  </div>
                </div>

                {/* State Transition Badge */}
                {(record.previousState || record.newState) && (
                  <div className="flex items-center gap-2 text-xs font-mono pt-1">
                    <span className="text-[10px] text-[#737773] uppercase">State Transition:</span>
                    {record.previousState && (
                      <>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#E4E6E2] text-[#737773]">
                          {record.previousState}
                        </span>
                        <ArrowRight size={11} className="text-[#737773]" />
                      </>
                    )}
                    <span className="px-2 py-0.5 rounded bg-[#DDE7DF] text-[#315C4C] font-semibold border border-[#315C4C]/20">
                      {record.newState || 'Logged'}
                    </span>
                  </div>
                )}

                {/* Explanation */}
                <p className="text-xs text-[#737773] leading-relaxed pt-1">
                  {record.publicExplanation}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Public vs Internal Segregation Summary */}
        <div className="mt-6 p-4 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase font-bold text-[#315C4C] block flex items-center gap-1.5">
              <Eye size={12} />
              <span>Public Information Disclosure Scope</span>
            </span>
            <p className="text-[#737773] leading-relaxed">
              Report ticket number, corridor neighborhood, category, public status, timestamp, responsible department, and approved supervisory explanations.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase font-bold text-[#B8463B] block flex items-center gap-1.5">
              <Lock size={12} />
              <span>Protected Internal Operational Information</span>
            </span>
            <p className="text-[#737773] leading-relaxed">
              Staff direct phone numbers, personal citizen identifiers, internal dispatch chat logs, contractor vendor pricing, and raw security telemetry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
