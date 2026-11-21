import React from 'react';
import { EarlyWarningSignal, EarlyWarningRiskLevel } from '../../types';
import {
  TrendingUp,
  MapPin,
  ArrowUpRight,
  Radio,
} from 'lucide-react';

interface EarlyWarningSectionProps {
  warnings: EarlyWarningSignal[];
  onSelectReportById?: (reportId: string) => void;
}

export const EarlyWarningSection: React.FC<EarlyWarningSectionProps> = ({
  warnings,
  onSelectReportById,
}) => {
  const getBadgeStyle = (level: EarlyWarningRiskLevel) => {
    switch (level) {
      case 'High Risk':
        return 'bg-[#FAF0EF] text-[#B8463B] border-[#B8463B]/30';
      case 'Elevated':
        return 'bg-[#FAF5ED] text-[#C58B36] border-[#C58B36]/30';
      case 'Watch':
        return 'bg-[#F5F5F2] text-[#171918] border-[#E4E6E2]';
      default:
        return 'bg-[#DDE7DF]/50 text-[#315C4C] border-[#315C4C]/20';
    }
  };

  return (
    <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E6E2]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio size={13} className="text-[#B8463B] animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#B8463B] font-semibold">
              PRE-CRISIS RADAR • EARLY WARNING ENGINE
            </span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-[#171918]">
            Emerging Hotspots & Risk Signals
          </h3>
          <p className="text-xs text-[#737773] mt-0.5 max-w-xl">
            Detects acceleration in neighborhood complaints before they manifest as critical municipal failures or transit disruptions.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded bg-[#FAF0EF] border border-[#B8463B]/30 text-xs font-mono text-[#B8463B] font-semibold">
          {warnings.length} Active Radar Signals
        </span>
      </div>

      {/* Grid of Early Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warnings.map((w) => (
          <div
            key={w.id}
            className="p-4 rounded-xl bg-[#F5F5F2]/60 border border-[#E4E6E2] hover:border-[#315C4C]/40 transition-all flex flex-col justify-between space-y-3.5"
          >
            <div>
              {/* Top row */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded font-mono text-[11px] font-bold border uppercase tracking-wider ${getBadgeStyle(
                    w.level
                  )}`}
                >
                  {w.level} Level
                </span>

                <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#B8463B] bg-white px-2 py-0.5 rounded border border-[#E4E6E2]">
                  <TrendingUp size={12} />
                  <span>+{w.velocityIncreasePercent}% Velocity</span>
                </div>
              </div>

              {/* Title & Location */}
              <h4 className="text-sm font-bold text-[#171918] mb-1">
                {w.title}
              </h4>

              <div className="flex items-center gap-1 text-xs text-[#737773] mb-3">
                <MapPin size={12} className="text-[#315C4C] flex-shrink-0" />
                <span className="truncate">{w.location}</span>
                <span className="text-[#E4E6E2]">|</span>
                <span className="font-mono text-[11px]">{w.timeframe}</span>
              </div>

              {/* Rationale & Evidence */}
              <p className="text-xs text-[#737773] leading-relaxed mb-3">
                {w.reason}
              </p>

              {/* Preventive Action */}
              <div className="p-3 rounded-lg bg-[#FAF5ED] border border-[#C58B36]/30 text-xs text-[#171918] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#C58B36] font-bold block">
                  Prescribed Municipal Intervention:
                </span>
                <p className="leading-relaxed">
                  {w.preventiveAction}
                </p>
              </div>
            </div>

            {/* Bottom metadata */}
            <div className="pt-2 border-t border-[#E4E6E2]/70 flex items-center justify-between text-xs text-[#737773]">
              <span className="font-mono text-[11px]">
                Confidence: <strong className="text-[#171918]">{w.confidenceScore}%</strong> (Heuristic Fit)
              </span>

              {w.linkedReportIds.length > 0 && onSelectReportById && (
                <button
                  type="button"
                  onClick={() => onSelectReportById(w.linkedReportIds[0])}
                  className="font-semibold text-[#315C4C] hover:text-[#26483B] flex items-center gap-1 text-[11px]"
                >
                  <span>Review Incident</span>
                  <ArrowUpRight size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
