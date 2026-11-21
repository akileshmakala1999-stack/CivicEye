import React from 'react';
import { SectionHeader } from '../common/SectionHeader';
import { Camera, Cpu, Users2, CheckCheck } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Report',
      subtitle: 'Capture an issue and its location.',
      description:
        'Citizens snap a photo of the civic defect. Location coordinates, timestamp, and visual context are packaged automatically in seconds.',
      icon: <Camera size={20} className="text-[#315C4C]" />,
      detail: 'Zero friction • No lengthy forms',
    },
    {
      step: '02',
      title: 'Understand',
      subtitle: 'AI helps identify and prioritize the problem.',
      description:
        'Intelligent models evaluate severity, detect duplicate submissions, and categorize hazards to prevent municipal backlog.',
      icon: <Cpu size={20} className="text-[#315C4C]" />,
      detail: 'Severity scoring & deduplication',
    },
    {
      step: '03',
      title: 'Connect',
      subtitle: 'Citizens and authorities work together.',
      description:
        'The report routes to the appropriate municipal department with open tracking for neighbors to upvote and validate urgency.',
      icon: <Users2 size={20} className="text-[#315C4C]" />,
      detail: 'Public accountability & SLAs',
    },
    {
      step: '04',
      title: 'Resolve',
      subtitle: 'Track progress and verify the outcome.',
      description:
        'Field crews deploy, fix the issue, and submit post-repair imagery. Tickets remain open until neighborhood residents verify resolution.',
      icon: <CheckCheck size={20} className="text-[#315C4C]" />,
      detail: 'Community verified sign-off',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 border-b border-[#E4E6E2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="How CivicEye Operates"
          title="From a small report to a meaningful change."
          description="A structured, transparent pathway that turns everyday citizen observations into prioritized municipal action."
        />

        {/* 4 Steps Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step) => (
            <div
              key={step.step}
              className="group relative bg-white border border-[#E4E6E2] rounded-lg p-6 flex flex-col justify-between hover:border-[#315C4C]/40 transition-all duration-200"
            >
              <div>
                {/* Step Top Bar */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E4E6E2]">
                  <span className="font-mono text-xs font-bold text-[#315C4C] tracking-wider">
                    {step.step}
                  </span>
                  <div className="p-2 rounded bg-[#F5F5F2] group-hover:bg-[#DDE7DF]/50 transition-colors">
                    {step.icon}
                  </div>
                </div>

                {/* Step Title & Subtitle */}
                <h3 className="text-xl font-semibold text-[#171918] tracking-tight mb-2">
                  {step.title}
                </h3>
                <h4 className="text-sm font-medium text-[#171918] mb-3 leading-snug">
                  {step.subtitle}
                </h4>

                {/* Description */}
                <p className="text-sm text-[#737773] leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Step Detail Footer */}
              <div className="mt-6 pt-4 border-t border-[#E4E6E2] text-xs font-mono text-[#315C4C]">
                {step.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

