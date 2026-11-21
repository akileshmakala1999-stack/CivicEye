import React, { useState } from 'react';
import { DepartmentPerformanceMetric } from '../../types';
import { Building2 } from 'lucide-react';

interface DepartmentPerformanceSectionProps {
  departments: DepartmentPerformanceMetric[];
}

export const DepartmentPerformanceSection: React.FC<DepartmentPerformanceSectionProps> = ({ departments }) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'received' | 'resolution' | 'on_time' | 'verification'>('on_time');

  const filteredDepts = departments
    .filter((d) => selectedDeptId === 'all' || d.departmentId === selectedDeptId)
    .sort((a, b) => {
      if (sortBy === 'on_time') return b.onTimePercentage - a.onTimePercentage;
      if (sortBy === 'received') return b.reportsReceived - a.reportsReceived;
      if (sortBy === 'resolution') return a.avgResolutionHours - b.avgResolutionHours; // faster is better
      if (sortBy === 'verification') return b.citizenVerificationRate - a.citizenVerificationRate;
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-white border border-[#E4E6E2] rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E4E6E2]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#DDE7DF] text-[#315C4C] font-semibold border border-[#315C4C]/20">
                Departmental Accountability • Feature 04
              </span>
              <span className="text-xs font-mono text-[#737773]">{departments.length} Municipal Wings</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#171918]">
              Department Performance & Workload Distribution
            </h2>
            <p className="text-xs sm:text-sm text-[#737773] mt-1 max-w-2xl leading-relaxed">
              Transparent review of municipal divisions handling civic rectification. Comparative metrics account for incident severity and sample sufficiency to prevent unfair comparisons.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E4E6E2] bg-[#FAFBF9] text-xs font-medium text-[#171918] focus:border-[#315C4C] outline-none"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.departmentName}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-[#E4E6E2] bg-[#FAFBF9] text-xs font-medium text-[#171918] focus:border-[#315C4C] outline-none"
            >
              <option value="on_time">Sort by: SLA On-Time %</option>
              <option value="received">Sort by: Reports Received</option>
              <option value="resolution">Sort by: Fastest Resolution</option>
              <option value="verification">Sort by: Citizen Verification %</option>
            </select>
          </div>
        </div>

        {/* Benchmarking Table */}
        <div className="overflow-x-auto pt-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E4E6E2] text-[10px] font-mono uppercase text-[#737773]">
                <th className="pb-3 font-semibold">Department Division</th>
                <th className="pb-3 font-semibold text-center">Intake / Active</th>
                <th className="pb-3 font-semibold text-center">Avg Triage Review</th>
                <th className="pb-3 font-semibold text-center">Avg Resolution</th>
                <th className="pb-3 font-semibold text-center">SLA On-Time</th>
                <th className="pb-3 font-semibold text-center">Citizen Verified</th>
                <th className="pb-3 font-semibold text-center">Rework Rate</th>
                <th className="pb-3 font-semibold text-right">Data Sufficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E6E2]/70 font-mono">
              {filteredDepts.map((d) => (
                <tr key={d.departmentId} className="hover:bg-[#FAFBF9] transition-colors">
                  <td className="py-3.5 pr-4 font-sans">
                    <div className="font-bold text-[#171918] text-xs sm:text-sm">{d.departmentName}</div>
                    <div className="text-[11px] font-mono text-[#737773] flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-[#315C4C]">{d.departmentCode}</span>
                      <span>• Top Hazard: {d.topCategory}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <div className="font-bold text-[#171918]">{d.reportsReceived} received</div>
                    <div className="text-[11px] text-[#737773]">{d.activeWorkOrders} in progress</div>
                  </td>
                  <td className="py-3.5 px-2 text-center text-[#171918]">
                    {d.avgReviewHours} hrs
                  </td>
                  <td className="py-3.5 px-2 text-center font-bold text-[#315C4C]">
                    {d.avgResolutionHours} hrs
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                        d.onTimePercentage >= 90
                          ? 'bg-[#DDE7DF] text-[#315C4C]'
                          : 'bg-[#FAF5ED] text-[#C58B36]'
                      }`}
                    >
                      {d.onTimePercentage}%
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-center font-bold text-[#171918]">
                    {d.citizenVerificationRate}%
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <span className={d.reworkRate > 10 ? 'text-[#B8463B] font-bold' : 'text-[#737773]'}>
                      {d.reworkRate}% ({d.reopenedCount} reopened)
                    </span>
                  </td>
                  <td className="py-3.5 pl-2 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
                        d.dataSufficiency === 'High'
                          ? 'bg-[#DDE7DF] text-[#315C4C] font-semibold'
                          : d.dataSufficiency === 'Moderate'
                          ? 'bg-[#FAF5ED] text-[#C58B36]'
                          : 'bg-[#F5F5F2] text-[#737773]'
                      }`}
                    >
                      {d.dataSufficiency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Department Workload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepts.map((d) => (
          <div
            key={`card-${d.departmentId}`}
            className="bg-white border border-[#E4E6E2] rounded-xl p-5 shadow-xs space-y-4 hover:border-[#315C4C]/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E6E2]">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-[#315C4C]" />
                  <span className="font-mono text-xs font-bold text-[#315C4C]">
                    {d.departmentCode}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F5F5F2] text-[#737773]">
                  {d.dataSufficiency}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="font-bold text-[#171918] text-sm leading-snug">
                  {d.departmentName}
                </h3>
                <p className="text-[11px] text-[#737773] mt-1">
                  Primary Domain: {d.topCategory} infrastructure & municipal compliance.
                </p>
              </div>

              {/* Key Indicators Mini-Grid */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#E4E6E2]/70 text-xs font-mono">
                <div className="p-2 rounded bg-[#FAFBF9] border border-[#E4E6E2]">
                  <span className="text-[10px] text-[#737773] block uppercase">Avg Turnaround</span>
                  <span className="font-bold text-[#315C4C] text-sm">{d.avgResolutionHours} hrs</span>
                </div>
                <div className="p-2 rounded bg-[#FAFBF9] border border-[#E4E6E2]">
                  <span className="text-[10px] text-[#737773] block uppercase">On-Time Rate</span>
                  <span className="font-bold text-[#171918] text-sm">{d.onTimePercentage}%</span>
                </div>
                <div className="p-2 rounded bg-[#FAFBF9] border border-[#E4E6E2]">
                  <span className="text-[10px] text-[#737773] block uppercase">Citizen Verified</span>
                  <span className="font-bold text-[#171918] text-sm">{d.citizenVerificationRate}%</span>
                </div>
                <div className="p-2 rounded bg-[#FAFBF9] border border-[#E4E6E2]">
                  <span className="text-[10px] text-[#737773] block uppercase">Overdue Active</span>
                  <span className={`font-bold text-sm ${d.overdueCount > 0 ? 'text-[#B8463B]' : 'text-[#315C4C]'}`}>
                    {d.overdueCount} orders
                  </span>
                </div>
              </div>
            </div>

            {/* Fair Comparison Note */}
            <div className="pt-2 border-t border-[#E4E6E2] flex items-center justify-between text-[10px] font-mono text-[#737773]">
              <span>Rework Rate: {d.reworkRate}%</span>
              <span>Sample: n={d.reportsReceived}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
