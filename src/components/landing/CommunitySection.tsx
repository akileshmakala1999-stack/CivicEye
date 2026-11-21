import React from 'react';
import { SectionHeader } from '../common/SectionHeader';
import { Eye, ThumbsUp, GitCommit, CheckCheck } from 'lucide-react';

export const CommunitySection: React.FC = () => {
  const pillars = [
    {
      icon: <Eye size={20} className="text-[#315C4C]" />,
      title: 'Identify Problems',
      description:
        'Notice an issue on your daily commute? Document it before minor potholes become vehicle hazards or small leaks become major sinkholes.',
      metric: 'Average submission takes 45 seconds',
    },
    {
      icon: <ThumbsUp size={20} className="text-[#315C4C]" />,
      title: 'Confirm Existing Reports',
      description:
        'Upvote hazards already submitted by fellow residents. Multiple confirmations raise the issue priority without creating duplicate reports.',
      metric: 'Over 4,800 community confirmations',
    },
    {
      icon: <GitCommit size={20} className="text-[#315C4C]" />,
      title: 'Track Civic Work',
      description:
        'Subscribe to updates on problems affecting your street. Follow inspection visits, material requisitions, and scheduled maintenance windows.',
      metric: 'Real-time department dispatch feeds',
    },
    {
      icon: <CheckCheck size={20} className="text-[#315C4C]" />,
      title: 'Verify Resolutions',
      description:
        'Municipal repairs require resident verification. Review post-completion evidence photos and confirm the job was done properly before closure.',
      metric: '100% resolution transparency',
    },
  ];

  return (
    <section className="py-20 sm:py-28 border-b border-[#E4E6E2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="Civic Collaboration"
          title="Small actions. Visible impact."
          description="Transforming passive complaints into constructive, collaborative urban stewardship. CivicEye bridges the gap between everyday residents and municipal responders."
        />

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E4E6E2] rounded-lg p-6 flex flex-col justify-between hover:border-[#315C4C]/40 transition-colors"
            >
              <div>
                <div className="w-10 h-10 rounded-md bg-[#DDE7DF]/50 border border-[#315C4C]/20 flex items-center justify-center mb-5">
                  {pillar.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#171918] mb-2 tracking-tight">
                  {pillar.title}
                </h3>
                <p className="text-sm text-[#737773] leading-relaxed mb-6">
                  {pillar.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E4E6E2] text-xs font-mono text-[#315C4C] font-medium">
                {pillar.metric}
              </div>
            </div>
          ))}
        </div>

        {/* Community Stewardship Note */}
        <div className="mt-12 bg-white border border-[#E4E6E2] rounded-lg p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-base font-semibold text-[#171918]">
              Neighborhood Guardians Program
            </h4>
            <p className="text-sm text-[#737773] max-w-2xl">
              Active residents who consistently verify municipal fixes and report high-accuracy civic hazards earn neighborhood trust verification badges in Phase 2.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono bg-[#DDE7DF] text-[#315C4C] font-medium border border-[#315C4C]/20">
              Trust Score Architecture
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

