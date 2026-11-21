import React from 'react';
import { WardComparisonMetric } from '../../types';
import {
  Building2,
  Clock,
  Info,
} from 'lucide-react';

interface WardComparisonSectionProps {
  wardMetrics: WardComparisonMetric[];
  onSelectWardFilter?: (ward: string) => void;
}

export const WardComparisonSection: React.FC<WardComparisonSectionProps> = ({
  wardMetrics,
  onSelectWardFilter,
}) => {
  return (
    <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E6E2]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={14} className="text-[#315C4C]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#315C4C] font-semibold">
              CROSS-JURISDICTIONAL BENCHMARKING
            </span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-[#171918]">
            Hyderabad Ward Performance Comparison
          </h3>
          <p className="text-xs text-[#737773] mt-0.5 max-w-xl">
            Side-by-side comparative matrix of municipal response speed, resolution efficiency, and recurring defect concentration across 6 zones.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded bg-[#DDE7DF]/60 border border-[#315C4C]/20 text-xs font-mono text-[#315C4C] font-semibold">
          6 Municipal Wards Audited
        </span>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto border border-[#E4E6E2] rounded-xl">
        <table className="w-full text-left text-xs divide-y divide-[#E4E6E2]">
          <thead className="bg-[#F5F5F2] font-mono text-[10px] uppercase text-[#737773] tracking-wider select-none">
            <tr>
              <th className="py-3 px-4">Municipal Ward</th>
              <th className="py-3 px-3">Total Volume</th>
              <th className="py-3 px-3">Active Backlog</th>
              <th className="py-3 px-3">Resolution Rate</th>
              <th className="py-3 px-3">Avg SLA Turnaround</th>
              <th className="py-3 px-3">Dominant Hazard</th>
              <th className="py-3 px-3">Citizen Engagement</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E6E2] bg-white">
            {wardMetrics.map((wm) => (
              <tr key={wm.ward} className="hover:bg-[#F5F5F2]/50 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-[#171918]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#315C4C]" />
                    <span>{wm.ward}</span>
                  </div>
                </td>

                <td className="py-3.5 px-3 font-mono font-bold text-[#171918]">
                  {wm.totalReports}
                </td>

                <td className="py-3.5 px-3 font-mono">
                  <span
                    className={`font-semibold ${
                      wm.activeReports > 0 ? 'text-[#C58B36]' : 'text-[#737773]'
                    }`}
                  >
                    {wm.activeReports} active
                  </span>
                  {wm.criticalReports > 0 && (
                    <span className="text-[10px] text-[#B8463B] block">
                      ({wm.criticalReports} critical)
                    </span>
                  )}
                </td>

                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-[#E4E6E2] rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className="h-full bg-[#315C4C] rounded-full"
                        style={{ width: `${wm.resolutionRate}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[#171918]">
                      {wm.resolutionRate}%
                    </span>
                  </div>
                </td>

                <td className="py-3.5 px-3 font-mono text-[11px] text-[#171918]">
                  <div className="flex items-center gap-1">
                    <Clock size={11} className="text-[#737773]" />
                    <span>{wm.avgResolutionHours} hrs</span>
                  </div>
                </td>

                <td className="py-3.5 px-3">
                  <span className="inline-block px-2 py-0.5 rounded bg-[#F5F5F2] border border-[#E4E6E2] font-mono text-[10px] text-[#171918]">
                    {wm.dominantCategory}
                  </span>
                </td>

                <td className="py-3.5 px-3 font-mono text-[11px]">
                  <span className="text-[#315C4C] font-semibold">{wm.communityEngagementScore} / 100</span>
                </td>

                <td className="py-3.5 px-3 text-right">
                  {onSelectWardFilter && (
                    <button
                      type="button"
                      onClick={() => onSelectWardFilter(wm.ward)}
                      className="px-2.5 py-1 rounded bg-[#F5F5F2] hover:bg-[#DDE7DF] border border-[#E4E6E2] text-[11px] font-semibold text-[#315C4C] transition-colors"
                    >
                      Filter Ward
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explanatory Context */}
      <div className="p-3.5 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-[11px] text-[#737773] flex items-start gap-2">
        <Info size={14} className="text-[#315C4C] flex-shrink-0 mt-0.5" />
        <span>
          <strong>Analytical Caveat:</strong> High complaint counts in corridors like Jubilee Hills and Madhapur reflect active tech-corridor commuter reporting and dense smartphone adoption, rather than simply higher defect frequencies than peripheral zones.
        </span>
      </div>
    </div>
  );
};
