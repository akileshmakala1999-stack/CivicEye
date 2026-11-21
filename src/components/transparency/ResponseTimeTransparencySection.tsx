import React from 'react';
import { ResponseTimeIntervalMetric } from '../../types';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface ResponseTimeTransparencySectionProps {
  intervals: ResponseTimeIntervalMetric[];
}

export const ResponseTimeTransparencySection: React.FC<ResponseTimeTransparencySectionProps> = ({ intervals }) => {
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white border border-[#E4E6E2] rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E4E6E2]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#DDE7DF] text-[#315C4C] font-semibold border border-[#315C4C]/20">
                Response Time Intelligence • Features 05 & 06
              </span>
              <span className="text-xs font-mono text-[#737773]">Stage-by-Stage Interval Telemetry</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#171918]">
              Civic Response Intervals & Lifecycle Turnaround
            </h2>
            <p className="text-xs sm:text-sm text-[#737773] mt-1 max-w-2xl leading-relaxed">
              Transparent tracking of actual operational durations between workflow milestones. Calculates Mean, Median, Fastest, and Slowest intervals while excluding incomplete ongoing transitions from completed averages.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2] text-xs font-mono text-right shrink-0">
            <span className="text-[#737773] block text-[10px] uppercase font-bold">End-to-End Turnaround</span>
            <span className="text-lg font-bold text-[#315C4C]">~36.0 hrs (Median)</span>
            <span className="text-[11px] text-[#737773] block">Fastest: 9.3 hrs • Slowest: 112 hrs</span>
          </div>
        </div>

        {/* Intervals Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
          {intervals.map((item, index) => {
            const isTotal = item.stageKey === 'total_lifecycle';

            return (
              <div
                key={item.stageKey}
                className={`p-5 rounded-xl border transition-all ${
                  isTotal
                    ? 'md:col-span-2 bg-[#DDE7DF]/20 border-[#315C4C]/40 shadow-xs'
                    : 'bg-[#FAFBF9] border-[#E4E6E2] hover:border-[#315C4C]/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E4E6E2]/70">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white border border-[#E4E6E2] flex items-center justify-center font-mono text-xs font-bold text-[#315C4C]">
                      {index + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#171918] flex items-center gap-1.5">
                        <span>{item.fromStage}</span>
                        <ArrowRight size={12} className="text-[#737773]" />
                        <span>{item.toStage}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-white border border-[#E4E6E2] text-[#737773]">
                      Samples: n={item.completedSamplesCount}
                    </span>
                    {item.ongoingCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-[#FAF5ED] text-[#C58B36] font-semibold border border-[#C58B36]/30">
                        {item.ongoingCount} ongoing
                      </span>
                    )}
                  </div>
                </div>

                {/* 4 Metric Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 font-mono text-xs">
                  <div className="p-2 rounded bg-white border border-[#E4E6E2]">
                    <span className="text-[10px] text-[#737773] block uppercase">Average</span>
                    <span className="font-bold text-[#171918] text-sm">{item.avgHours} hrs</span>
                  </div>

                  <div className="p-2 rounded bg-white border border-[#E4E6E2]">
                    <span className="text-[10px] text-[#737773] block uppercase">Median</span>
                    <span className="font-bold text-[#315C4C] text-sm">{item.medianHours} hrs</span>
                  </div>

                  <div className="p-2 rounded bg-white border border-[#E4E6E2]">
                    <span className="text-[10px] text-[#737773] block uppercase">Fastest</span>
                    <span className="font-bold text-[#315C4C] text-sm">{item.fastestHours} hrs</span>
                  </div>

                  <div className="p-2 rounded bg-white border border-[#E4E6E2]">
                    <span className="text-[10px] text-[#737773] block uppercase">Slowest</span>
                    <span className="font-bold text-[#B8463B] text-sm">{item.slowestHours} hrs</span>
                  </div>
                </div>

                {/* Context & Data Sufficiency Note */}
                <p className="text-[11px] text-[#737773] mt-3 leading-relaxed">
                  {item.dataSufficiencyNote}
                </p>
              </div>
            );
          })}
        </div>

        {/* SLA & Delay Transparency Guidelines */}
        <div className="mt-6 p-4 rounded-xl bg-[#FAF5ED] border border-[#C58B36]/30 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[#C58B36] font-bold text-xs uppercase font-mono">
            <AlertCircle size={14} />
            <span>SLA Transparency & Configurable Target Protocol</span>
          </div>
          <p className="text-[#171918] leading-relaxed">
            All SLA target thresholds displayed in CivicEye (Critical: 4h, High: 24h, Medium: 48h, Low: 96h) represent <strong>configurable demonstration benchmarks</strong> for municipal evaluation rather than legally binding statutory guarantees.
          </p>
          <div className="pt-2 border-t border-[#C58B36]/20 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#737773]">
            <span>Active Delay Reason Protocol: Verified public explanation only. Unspecified delays displayed as "Delay reason not provided".</span>
            <span className="text-[#315C4C] font-semibold">Zero Unverified Excuses</span>
          </div>
        </div>
      </div>
    </div>
  );
};
