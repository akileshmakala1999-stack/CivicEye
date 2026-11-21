import React from 'react';
import { TemporalTrendPoint } from '../../types';
import {
  TrendingUp,
} from 'lucide-react';

interface TemporalTrendsSectionProps {
  points: TemporalTrendPoint[];
  incomingGrowthRate: number;
  resolvedGrowthRate: number;
  selectedRangeDays: number;
  onRangeChange: (days: number) => void;
}

export const TemporalTrendsSection: React.FC<TemporalTrendsSectionProps> = ({
  points,
  incomingGrowthRate,
  resolvedGrowthRate,
  selectedRangeDays,
  onRangeChange,
}) => {
  const maxVal = Math.max(...points.map((p) => Math.max(p.incoming, p.resolved, p.backlog)), 1);

  const ranges = [
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 },
    { label: '6 Months', days: 180 },
  ];

  return (
    <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E6E2]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-[#315C4C]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#315C4C] font-semibold">
              TIME-SERIES CADENCE & RESOLUTION MOMENTUM
            </span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-[#171918]">
            Temporal Reporting Trends & Backlog Velocity
          </h3>
          <p className="text-xs text-[#737773] mt-0.5 max-w-xl">
            Mathematical trajectory comparing citizen report intake against municipal resolution throughput across historical intervals.
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2]">
          {ranges.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => onRangeChange(r.days)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                selectedRangeDays === r.days
                  ? 'bg-white text-[#171918] shadow-2xs border border-[#E4E6E2]'
                  : 'text-[#737773] hover:text-[#171918]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period-over-Period Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2]">
          <span className="text-[10px] font-mono uppercase text-[#737773] block mb-1">
            Intake Volume Momentum
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#171918]">
              +{incomingGrowthRate}%
            </span>
            <span className="text-xs text-[#C58B36] font-medium font-mono">vs previous window</span>
          </div>
          <span className="text-[11px] text-[#737773]">Higher reporting frequency in tech hubs</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2]">
          <span className="text-[10px] font-mono uppercase text-[#737773] block mb-1">
            Turnaround Speed Gain
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#315C4C]">
              +{resolvedGrowthRate}%
            </span>
            <span className="text-xs text-[#315C4C] font-medium font-mono">faster closures</span>
          </div>
          <span className="text-[11px] text-[#737773]">Field teams adopting mobile work order desk</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2]">
          <span className="text-[10px] font-mono uppercase text-[#737773] block mb-1">
            Net Backlog Curve
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#171918]">
              -18.4%
            </span>
            <span className="text-xs text-[#315C4C] font-medium font-mono">contracting backlog</span>
          </div>
          <span className="text-[11px] text-[#737773]">Resolutions currently outpacing new submissions</span>
        </div>
      </div>

      {/* Visual Temporal Chart */}
      <div className="p-5 rounded-xl bg-[#F5F5F2]/40 border border-[#E4E6E2] space-y-4">
        <div className="flex items-center justify-between text-xs text-[#737773]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#171918]" />
              <span className="font-medium text-[#171918]">New Reports Influx</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#315C4C]" />
              <span className="font-medium text-[#315C4C]">Municipal Resolutions</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C58B36]" />
              <span className="font-medium text-[#C58B36]">Active Backlog Queue</span>
            </span>
          </div>

          <span className="font-mono text-[11px]">Normalized Daily Cadence</span>
        </div>

        {/* Bar/Column Visualizer */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 items-end h-44 pt-4 border-b border-[#E4E6E2]">
          {points.map((pt, idx) => {
            const incomingHeight = Math.max(12, Math.round((pt.incoming / maxVal) * 100));
            const resolvedHeight = Math.max(10, Math.round((pt.resolved / maxVal) * 100));

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1 h-32">
                  {/* Incoming Bar */}
                  <div
                    style={{ height: `${incomingHeight}%` }}
                    className="w-2.5 bg-[#171918] rounded-t-sm group-hover:bg-black transition-all"
                    title={`Date: ${pt.dateLabel} | Incoming: ${pt.incoming}`}
                  />
                  {/* Resolved Bar */}
                  <div
                    style={{ height: `${resolvedHeight}%` }}
                    className="w-2.5 bg-[#315C4C] rounded-t-sm group-hover:bg-[#26483B] transition-all"
                    title={`Date: ${pt.dateLabel} | Resolved: ${pt.resolved}`}
                  />
                </div>
                <span className="text-[10px] font-mono text-[#737773] mt-2 truncate w-full text-center">
                  {pt.dateLabel.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
