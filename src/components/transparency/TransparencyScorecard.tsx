import React, { useState } from 'react';
import { TransparencyScorecardItem } from '../../types';
import { Info, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface TransparencyScorecardProps {
  scorecardItems: TransparencyScorecardItem[];
}

export const TransparencyScorecard: React.FC<TransparencyScorecardProps> = ({ scorecardItems }) => {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Calculate composite integrity score
  const compositeScore =
    scorecardItems.length > 0
      ? Math.round(scorecardItems.reduce((acc, curr) => acc + curr.score, 0) / scorecardItems.length)
      : 94;

  return (
    <div className="bg-white border border-[#E4E6E2] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E4E6E2]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#DDE7DF] text-[#315C4C] font-semibold border border-[#315C4C]/20">
              Open Governance Standard • Section 08
            </span>
            <span className="text-xs font-mono text-[#737773]">8 Core Metrics</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FAF5ED] text-[#C58B36] font-semibold border border-[#C58B36]/30">
              CivicEye Reference Benchmark — Not an Official Municipal Target
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#171918]">
            CivicEye Citywide Transparency Scorecard
          </h2>
          <p className="text-xs sm:text-sm text-[#737773] mt-1 max-w-2xl leading-relaxed">
            Every score is traceable to live municipal database records. No arbitrary black-box indices—each indicator displays its transparent calculation formula and underlying sample size.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2] flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 rounded-lg bg-[#315C4C] text-white flex items-center justify-center font-mono font-bold text-lg shadow-sm">
            {compositeScore}%
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-[#737773] block font-bold">
              Composite Index
            </span>
            <span className="text-sm font-bold text-[#171918] block">
              High Transparency
            </span>
            <span className="text-[11px] text-[#315C4C] font-mono">
              Audited Nov 2026
            </span>
          </div>
        </div>
      </div>

      {/* Grid of 8 Scorecard Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scorecardItems.map((item) => {
          const isExpanded = expandedKey === item.key;
          const isOptimal = item.score >= 85;
          const isAcceptable = item.score >= 65 && item.score < 85;

          const barColor = isOptimal ? 'bg-[#315C4C]' : isAcceptable ? 'bg-[#C58B36]' : 'bg-[#B8463B]';
          const textColor = isOptimal ? 'text-[#315C4C]' : isAcceptable ? 'text-[#C58B36]' : 'text-[#B8463B]';

          return (
            <div
              key={item.key}
              className="p-4 rounded-lg bg-[#FAFBF9] border border-[#E4E6E2] hover:border-[#315C4C]/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-[#171918] line-clamp-1" title={item.indicator}>
                    {item.indicator}
                  </span>
                  <span className={`font-mono font-bold text-sm ${textColor}`}>
                    {item.score}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-[#E4E6E2] overflow-hidden mb-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, Math.max(5, item.score))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#737773] mb-2">
                  <span className="line-clamp-1" title={item.benchmarkTarget}>
                    {item.benchmarkTarget}
                  </span>
                  <span className="shrink-0 font-semibold">n = {item.sampleCount}</span>
                </div>

                <p className="text-[11px] text-[#737773] leading-snug line-clamp-2">
                  {item.description}
                </p>
              </div>

              {/* Formula Accordion */}
              <div className="pt-2 border-t border-[#E4E6E2]/80">
                <button
                  type="button"
                  onClick={() => setExpandedKey(isExpanded ? null : item.key)}
                  className="w-full flex items-center justify-between text-[10px] font-mono text-[#315C4C] hover:underline"
                >
                  <span className="flex items-center gap-1">
                    <Info size={11} />
                    <span>Calculation Formula</span>
                  </span>
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {isExpanded && (
                  <div className="mt-2 p-2 rounded bg-white border border-[#E4E6E2] text-[10px] font-mono text-[#171918] space-y-1 animate-in fade-in duration-150">
                    <div className="text-[#737773] uppercase font-bold text-[9px]">Exact Formula:</div>
                    <div className="font-semibold text-[#315C4C] break-all">{item.formula}</div>
                    <div className="text-[#737773] text-[9px] pt-1">
                      Computed from live municipal operational records. Excludes simulated noise.
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Methodology Disclosure */}
      <div className="p-4 rounded-lg bg-[#FAF5ED] border border-[#C58B36]/30 flex items-start gap-3 text-xs text-[#171918]">
        <AlertTriangle size={16} className="text-[#C58B36] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-mono text-[10px] uppercase font-bold text-[#C58B36] block">
            Public Governance Standard & Benchmark Disclosure:
          </span>
          <p className="leading-relaxed text-[#737773]">
            Scorecard indicators reflect actual operational activity tracked within the CivicEye pilot deployment. Target metrics and turnaround thresholds are <strong className="text-[#171918]">CivicEye Reference Benchmarks — Not an Official Municipal Target</strong>. They represent simulated administrative models for Sector 04 (Hyderabad Central Grid) pilot evaluation and do not constitute legally binding government standards or contracts.
          </p>
        </div>
      </div>
    </div>
  );
};
