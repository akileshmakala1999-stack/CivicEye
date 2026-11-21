import React from 'react';
import { RecurringProblem } from '../../types';
import { Badge } from '../common/Badge';
import {
  RotateCcw,
  MapPin,
  ChevronRight,
} from 'lucide-react';

interface RecurringProblemsSectionProps {
  recurringProblems: RecurringProblem[];
  onSelectReportById?: (reportId: string) => void;
}

export const RecurringProblemsSection: React.FC<RecurringProblemsSectionProps> = ({
  recurringProblems,
  onSelectReportById,
}) => {
  return (
    <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E6E2]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C58B36]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#C58B36] font-semibold">
              CORRIDOR FATIGUE • REPEATED DEFECT ANALYSIS
            </span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-[#171918]">
            Recurring Problem Intelligence
          </h3>
          <p className="text-xs text-[#737773] mt-0.5 max-w-xl">
            Detects civic issues resurfacing repeatedly at the same geographic coordinates, indicating root-cause structural failures rather than transient wear.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-[#FAF5ED] border border-[#C58B36]/30 text-xs font-mono text-[#C58B36] font-semibold">
            {recurringProblems.length} Chronic Sites Detected
          </span>
        </div>
      </div>

      {/* Grid of Recurring Problems */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recurringProblems.map((prob) => (
          <div
            key={prob.id}
            className="p-4 rounded-xl bg-[#F5F5F2]/70 border border-[#E4E6E2] hover:border-[#315C4C]/40 transition-all flex flex-col justify-between space-y-3.5"
          >
            <div>
              {/* Top row */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded bg-white border border-[#E4E6E2] font-mono text-[11px] font-bold text-[#B8463B] flex items-center gap-1">
                  <RotateCcw size={11} className="text-[#B8463B]" />
                  <span>{prob.occurrenceCount}x Repeat Failure</span>
                </span>
                <Badge status={prob.currentStatus} size="sm" />
              </div>

              {/* Title & Location */}
              <h4 className="text-sm font-bold text-[#171918] mb-1 line-clamp-1">
                {prob.category} • {prob.location.split(',')[0]}
              </h4>

              <div className="flex items-center gap-1 text-xs text-[#737773] mb-3">
                <MapPin size={12} className="text-[#315C4C] flex-shrink-0" />
                <span className="truncate">{prob.location}</span>
              </div>

              {/* Recurrence Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-white border border-[#E4E6E2] text-xs">
                <div>
                  <span className="text-[10px] font-mono text-[#737773] block uppercase">First Logged</span>
                  <span className="font-mono text-[11px] font-semibold text-[#171918]">
                    {prob.firstReportDate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#737773] block uppercase">Latest Logged</span>
                  <span className="font-mono text-[11px] font-semibold text-[#171918]">
                    {prob.latestReportDate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#737773] block uppercase">Cycle Cadence</span>
                  <span className="font-mono text-[11px] font-semibold text-[#315C4C]">
                    ~{prob.avgRecurrenceIntervalDays}d interval
                  </span>
                </div>
              </div>

              {/* Root cause hypothesis */}
              <div className="mt-3 p-2.5 rounded-lg bg-white/70 border border-[#E4E6E2] text-xs text-[#737773] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#171918] font-bold block">
                  Root Cause Engineering Hypothesis:
                </span>
                <p className="leading-relaxed">
                  {prob.rootCauseHypothesis}
                </p>
              </div>
            </div>

            {/* Bottom Row: Underlying report IDs */}
            <div className="pt-2 border-t border-[#E4E6E2]/70 flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#737773]">
                {prob.previousResolutionsCount} past municipal closures reopened
              </span>

              {prob.reportIds.length > 0 && onSelectReportById && (
                <button
                  type="button"
                  onClick={() => onSelectReportById(prob.reportIds[0])}
                  className="font-semibold text-[#315C4C] hover:text-[#26483B] flex items-center gap-1 text-[11px]"
                >
                  <span>Inspect Incident #{prob.reportIds[0]}</span>
                  <ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
