import React from 'react';
import { DEMO_STATISTICS } from '../../data/mockData';
import { Info } from 'lucide-react';

export const Statistics: React.FC = () => {
  return (
    <section className="bg-white py-16 sm:py-20 border-b border-[#E4E6E2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Context Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-8 border-b border-[#E4E6E2] gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#315C4C] uppercase tracking-wider mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#315C4C]" />
              Civic Telemetry
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#171918]">
              Public Resolution Performance
            </h3>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#F5F5F2] border border-[#E4E6E2] text-xs text-[#737773]">
            <Info size={13} className="text-[#315C4C]" />
            <span>Sample benchmark data from urban test ward</span>
          </div>
        </div>

        {/* Minimal Editorial Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E6E2]">
          {DEMO_STATISTICS.map((stat, index) => (
            <div
              key={stat.id}
              className={`py-6 sm:py-2 ${
                index === 0
                  ? 'sm:pr-8'
                  : index === 3
                  ? 'sm:pl-8'
                  : 'sm:px-8'
              }`}
            >
              <div className="text-xs font-mono uppercase tracking-wider text-[#737773] mb-2">
                {stat.label}
              </div>
              <div className="text-4xl sm:text-5xl font-bold tracking-tight text-[#171918] font-sans">
                {stat.value}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-[#DDE7DF]/70 text-[#315C4C]">
                  {stat.changeRate}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#737773] leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Disclaimer label below statistics */}
        <div className="mt-10 pt-4 border-t border-[#E4E6E2] flex items-center justify-between text-[11px] text-[#737773]">
          <span>Source: CivicEye Telemetry Kernel (Simulated benchmark dataset)</span>
          <span className="font-mono">UPDATE CYCLE: 15 MIN INTERVAL</span>
        </div>
      </div>
    </section>
  );
};

