import React, { useState } from 'react';
import { SectionHeader } from '../common/SectionHeader';
import { DEMO_LIFECYCLE_STAGES } from '../../data/mockData';
import { Check, Shield } from 'lucide-react';

export const TransparencySection: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(3); // "In Progress" active by default

  return (
    <section id="transparency" className="bg-white py-20 sm:py-28 border-b border-[#E4E6E2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="Open Governance Architecture"
          title="Every report deserves a response."
          description="CivicEye is designed to make civic issues visible, trackable, and accountable. From initial resident submission to verified fix, each stage is open to public inspection."
        />

        {/* Minimal Lifecycle Timeline Container */}
        <div className="bg-[#F5F5F2] border border-[#E4E6E2] rounded-xl p-6 sm:p-10 mb-12">
          <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#E4E6E2] flex-wrap gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#737773] mb-1">
                Standard Issue Lifecycle
              </div>
              <h3 className="text-lg font-semibold text-[#171918]">
                End-to-End Civic Audit Trail
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#315C4C]">
              <Shield size={14} />
              <span>Immutable State Machine</span>
            </div>
          </div>

          {/* Lifecycle Steps Horizontal Bar (Desktop) & Responsive Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {DEMO_LIFECYCLE_STAGES.map((stage, index) => {
              const isPassed = index < activeStageIndex;
              const isCurrent = index === activeStageIndex;

              return (
                <div
                  key={stage.step}
                  onClick={() => setActiveStageIndex(index)}
                  className={`cursor-pointer rounded-lg p-4 border transition-all duration-200 flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-white border-[#315C4C] shadow-sm ring-1 ring-[#315C4C]/20'
                      : isPassed
                      ? 'bg-white/80 border-[#DDE7DF]'
                      : 'bg-[#F5F5F2] border-[#E4E6E2] opacity-75'
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  <div>
                    {/* Step Indicator Top */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-[#737773]">
                        {stage.step}
                      </span>
                      {isPassed ? (
                        <span className="w-5 h-5 rounded-full bg-[#DDE7DF] flex items-center justify-center text-[#315C4C]">
                          <Check size={12} />
                        </span>
                      ) : isCurrent ? (
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#315C4C] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#315C4C]"></span>
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#E4E6E2]" />
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-semibold text-[#171918] mb-1">
                      {stage.title}
                    </h4>

                    {/* Subtitle */}
                    <div className="text-[11px] font-mono text-[#315C4C] mb-2 leading-tight">
                      {stage.subtitle}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#737773] leading-relaxed line-clamp-3">
                      {stage.description}
                    </p>
                  </div>

                  {/* SLA Footer */}
                  <div className="mt-4 pt-2 border-t border-[#E4E6E2] text-[10px] font-mono text-[#737773]">
                    SLA: {stage.typicalTime}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Stage Detail Callout */}
          <div className="mt-8 pt-6 border-t border-[#E4E6E2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-[#315C4C] uppercase">
                Active Step Detail:
              </span>
              <span className="text-[#171918] font-medium">
                {DEMO_LIFECYCLE_STAGES[activeStageIndex].title} — {DEMO_LIFECYCLE_STAGES[activeStageIndex].description}
              </span>
            </div>
            <span className="text-[#737773] font-mono text-[11px] whitespace-nowrap">
              Typical turnaround: {DEMO_LIFECYCLE_STAGES[activeStageIndex].typicalTime}
            </span>
          </div>
        </div>

        {/* 3 Pillars of Civic Transparency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border border-[#E4E6E2] bg-white">
            <h4 className="text-base font-semibold text-[#171918] mb-2">
              Zero Black Boxes
            </h4>
            <p className="text-sm text-[#737773] leading-relaxed">
              Every status change is timestamped and signed with the handling official's badge ID. Never wonder if a report was silently ignored.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-[#E4E6E2] bg-white">
            <h4 className="text-base font-semibold text-[#171918] mb-2">
              Democratic Priority Index
            </h4>
            <p className="text-sm text-[#737773] leading-relaxed">
              Repairs are not prioritized based on who has political connections. Computer vision severity scores combine with verified community upvotes.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-[#E4E6E2] bg-white">
            <h4 className="text-base font-semibold text-[#171918] mb-2">
              Mandatory Citizen Sign-off
            </h4>
            <p className="text-sm text-[#737773] leading-relaxed">
              Crews cannot unilaterally mark a job done without providing photographic evidence for local neighborhood review.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
