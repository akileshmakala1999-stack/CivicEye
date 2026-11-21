import React, { useState } from 'react';
import { DashboardReport } from '../../types';
import { Badge } from '../common/Badge';
import { ReportReviewModal } from './ReportReviewModal';
import {
  Search,
  Eye,
  MapPin,
  Flame,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface ReviewQueueTabProps {
  reports: DashboardReport[];
  onRefresh: () => void;
}

export const ReviewQueueTab: React.FC<ReviewQueueTabProps> = ({
  reports,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [reviewingReport, setReviewingReport] = useState<DashboardReport | null>(null);

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
    if (selectedSeverity !== 'all' && r.severity !== selectedSeverity) return false;
    if (selectedWard !== 'all' && r.neighborhood !== selectedWard) return false;
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        r.ticketNumber.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
              placeholder="Search ticket, title, street..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2]/50 text-xs text-[#171918] focus:border-[#315C4C] outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted (Needs Intake)</option>
            <option value="Under Review">Under Review</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Road damage">Road damage</option>
            <option value="Garbage">Garbage</option>
            <option value="Water leakage">Water leakage</option>
            <option value="Drainage">Drainage</option>
            <option value="Streetlights">Streetlights</option>
            <option value="Damaged footpaths">Damaged footpaths</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Ward Filter */}
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none"
          >
            <option value="all">All Wards</option>
            <option value="Jubilee Hills">Jubilee Hills</option>
            <option value="Banjara Hills">Banjara Hills</option>
            <option value="Madhapur">Madhapur</option>
            <option value="Gachibowli">Gachibowli</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-[#737773]">
          <span>Showing {filteredReports.length} of {reports.length} reports</span>
          {(searchQuery || selectedCategory !== 'all' || selectedSeverity !== 'all' || selectedWard !== 'all' || selectedStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedSeverity('all');
                setSelectedWard('all');
                setSelectedStatus('all');
              }}
              className="text-[#315C4C] hover:underline flex items-center gap-1"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* REPORTS TABLE */}
      <div className="bg-white border border-[#E4E6E2] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E4E6E2] text-[10px] font-mono text-[#737773] uppercase bg-[#F5F5F2]">
                <th className="py-2.5 px-3">Ticket / Time</th>
                <th className="py-2.5 px-3">Citizen Title & Ward</th>
                <th className="py-2.5 px-3">Severity & Risk</th>
                <th className="py-2.5 px-3">Community Signals</th>
                <th className="py-2.5 px-3">Status / Assigned</th>
                <th className="py-2.5 px-3 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E6E2]">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#737773] text-xs">
                    No reports match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((rep) => {
                  const isSubmitted = rep.status === 'Submitted';

                  return (
                    <tr key={rep.id} className="hover:bg-[#FAFBF9] transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-[#315C4C] block">
                          {rep.ticketNumber}
                        </span>
                        <span className="text-[10px] font-mono text-[#737773]">
                          {rep.reportTimestamp || rep.reportDate}
                        </span>
                      </td>

                      <td className="py-3 px-3 max-w-[280px]">
                        <div className="font-bold text-[#171918] line-clamp-1">{rep.title}</div>
                        <div className="text-[10px] text-[#737773] flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-[#315C4C] flex-shrink-0" />
                          <span className="truncate">{rep.location}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Badge severity={rep.severity} dot size="sm" />
                        </div>
                        <span className="text-[10px] font-mono text-[#737773] block mt-0.5">
                          Cat: {rep.category}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-[#171918]">{rep.confirmationsCount} votes</span>
                          {rep.gettingWorseCount && rep.gettingWorseCount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-[#FAF0EF] text-[#B8463B] text-[9px] font-bold flex items-center gap-0.5">
                              <Flame size={10} />
                              <span>WORSENING</span>
                            </span>
                          ) : null}
                          {rep.resolutionStatus?.isChallenged && (
                            <span className="px-1.5 py-0.5 rounded bg-[#FAF0EF] text-[#B8463B] text-[9px] font-bold flex items-center gap-0.5">
                              <AlertTriangle size={10} />
                              <span>DISPUTED</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <Badge status={rep.status} size="sm" />
                        <span className="text-[10px] font-mono text-[#737773] block mt-0.5 truncate max-w-[150px]">
                          {rep.departmentAssigned}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setReviewingReport(rep)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ml-auto transition-colors ${
                            isSubmitted
                              ? 'bg-[#315C4C] text-white hover:bg-[#26483B] font-bold shadow-xs'
                              : 'bg-white border border-[#E4E6E2] text-[#171918] hover:bg-[#F5F5F2]'
                          }`}
                        >
                          <Eye size={12} />
                          <span>{isSubmitted ? 'Triage & Assign' : 'Inspect Review'}</span>
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

      {/* REPORT REVIEW & ASSIGNMENT MODAL */}
      <ReportReviewModal
        report={reviewingReport}
        onClose={() => setReviewingReport(null)}
        onActionCompleted={() => {
          onRefresh();
          setReviewingReport(null);
        }}
      />
    </div>
  );
};
