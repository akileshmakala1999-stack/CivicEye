import React from 'react';
import { SectionHeader } from '../common/SectionHeader';
import { DEMO_RESOLVED_ISSUES } from '../../data/mockData';
import { ResolutionStory } from '../../types';
import { Badge } from '../common/Badge';
import { Clock, MapPin, Users, ShieldCheck } from 'lucide-react';

export const ResolvedIssues: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 border-b border-[#E4E6E2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="Verified Outcomes"
          title="Accountability you can actually see."
          description="Closed tickets do not vanish into bureaucracy. Explore verified resolutions where municipal crews completed repairs and neighbors validated the quality."
        />

        {/* Resolved Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEMO_RESOLVED_ISSUES.map((item: ResolutionStory) => (
            <div
              key={item.id}
              className="bg-white border border-[#E4E6E2] rounded-lg p-6 flex flex-col justify-between hover:border-[#315C4C]/40 transition-colors"
            >
              <div>
                {/* Header: Category & Resolution Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono uppercase text-[#737773]">
                    {item.category}
                  </span>
                  <Badge variant="accent" size="sm" dot>
                    Resolved & Verified
                  </Badge>
                </div>

                {/* Title */}
                <h4 className="text-base font-semibold text-[#171918] mb-2 leading-snug">
                  {item.title}
                </h4>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-[#737773] mb-4">
                  <MapPin size={13} className="text-[#315C4C] flex-shrink-0" />
                  <span>{item.location}</span>
                </div>

                {/* Before / After Inspection Comparison Block */}
                <div className="mb-4 rounded-md border border-[#E4E6E2] bg-[#F5F5F2]/70 p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#E4E6E2]/70">
                    <span className="font-mono text-[10px] text-[#737773] uppercase">
                      Site Verification
                    </span>
                    <span className="font-mono text-[10px] text-[#315C4C] font-semibold">
                      DUAL PHOTOGRAPHY FILED
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                    <div className="bg-white rounded py-2 px-1 border border-[#E4E6E2] text-[#737773]">
                      <span className="font-mono text-[10px] block text-[#B8463B] font-medium">BEFORE</span>
                      Hazard Verified
                    </div>
                    <div className="bg-[#DDE7DF]/50 rounded py-2 px-1 border border-[#315C4C]/20 text-[#315C4C]">
                      <span className="font-mono text-[10px] block text-[#315C4C] font-semibold">AFTER</span>
                      Repair Completed
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-[#737773] leading-relaxed mb-4">
                  {item.summary}
                </p>
              </div>

              {/* Card Footer: Turnaround & Community Verification */}
              <div className="pt-3 border-t border-[#E4E6E2] flex items-center justify-between text-xs text-[#737773]">
                <div className="flex items-center gap-1 font-mono text-[11px] text-[#315C4C]">
                  <Clock size={12} />
                  <span>{item.duration}</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px] text-[#171918]">
                  <Users size={12} className="text-[#315C4C]" />
                  <span>{item.verifiedByCount} resident sign-offs</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Audit Assurance Banner */}
        <div className="mt-8 py-3 px-4 rounded-md bg-[#F5F5F2] border border-[#E4E6E2] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#737773]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-[#315C4C]" />
            <span>
              All resolution logs include cryptographic municipal sign-off and geo-verified photographs.
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#315C4C] font-medium">
            100% PUBLIC VERIFIABILITY
          </span>
        </div>
      </div>
    </section>
  );
};
