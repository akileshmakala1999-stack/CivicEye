import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, FileText, Search, Users, Wrench, CheckCircle } from 'lucide-react';

export const TransparencyAndCommunitySection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const timelineSteps = [
    { icon: FileText, label: 'Reported' },
    { icon: Search, label: 'Under Review' },
    { icon: Users, label: 'Assigned' },
    { icon: Wrench, label: 'In Progress' },
    { icon: CheckCircle, label: 'Resolved', isFinal: true },
  ];

  return (
    <section id="transparency" className="relative bg-[#F5F5F2] py-14 sm:py-20 overflow-hidden border-t border-[#E4E6E2]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Card: Transparency & Lifecycle Timeline (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 rounded-3xl bg-[#ECEEE9] border border-[#E4E6E2] p-7 sm:p-9 flex flex-col justify-between shadow-[0_8px_30px_rgba(23,25,24,0.03)] relative overflow-hidden"
          >
            {/* Subtle Hyderabad Skyline Watermark */}
            <div className="absolute -bottom-4 right-0 opacity-10 pointer-events-none w-72 h-36">
              <svg viewBox="0 0 300 120" fill="currentColor" className="w-full h-full text-[#315C4C]">
                {/* Charminar silhouette contour */}
                <rect x="180" y="30" width="12" height="90" />
                <rect x="230" y="30" width="12" height="90" />
                <path d="M180 50 C180 30 242 30 242 50 Z" />
                <rect x="192" y="60" width="38" height="60" />
                {/* High-rise blocks */}
                <rect x="20" y="40" width="28" height="80" />
                <rect x="52" y="20" width="34" height="100" />
                <rect x="90" y="50" width="24" height="70" />
                <rect x="118" y="35" width="30" height="85" />
              </svg>
            </div>

            <div className="space-y-4 max-w-lg z-10">
              {/* Eyebrow */}
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-[#E0E4DC] text-[11px] font-bold tracking-wider text-[#315C4C] uppercase">
                  TRANSPARENCY
                </span>
              </div>

              {/* Headline */}
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-[#171918] leading-[1.15]">
                Trust is built when{' '}
                <span className="block mt-0.5">
                  progress is <span className="text-[#315C4C]">visible.</span>
                </span>
              </h2>

              {/* Subtext */}
              <p className="text-sm sm:text-base text-[#737773] leading-relaxed font-normal">
                Track resolutions, view audit trails, and see the real impact of civic action.
              </p>

              {/* Button */}
              <div className="pt-1">
                <Link
                  to="/transparency"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#315C4C] hover:bg-[#26483B] rounded-full shadow-sm hover:shadow transition-all"
                >
                  <span>View Transparency</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* 5-Step Process Timeline */}
            <div className="mt-8 pt-6 border-t border-[#E4E6E2]/80 z-10">
              <div className="flex items-center justify-between relative">
                {/* Continuous Connecting Line */}
                <div className="absolute top-5 left-6 right-6 h-[1.5px] bg-[#D8DCD5] -z-0"></div>

                {timelineSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="flex flex-col items-center text-center relative z-10">
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-sm border transition-transform hover:scale-105 ${
                          step.isFinal
                            ? 'bg-[#315C4C] border-[#315C4C] text-white'
                            : 'bg-white border-[#E4E6E2] text-[#315C4C]'
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="mt-2 text-[10px] sm:text-[11px] font-semibold text-[#171918] whitespace-nowrap">
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Right Card: Community Participation (5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.65, delay: shouldReduceMotion ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 rounded-3xl bg-[#ECEEE9] border border-[#E4E6E2] p-7 sm:p-9 flex flex-col justify-between shadow-[0_8px_30px_rgba(23,25,24,0.03)] relative overflow-hidden"
          >
            {/* Real Community Family Image Cropped on the Right */}
            <div className="absolute right-0 bottom-0 top-12 w-44 sm:w-52 h-full pointer-events-none select-none overflow-hidden">
              <img
                src="/images/community_family.png"
                alt="Smiling Hyderabad family participating in civic neighborhood improvement"
                className="w-full h-full object-cover object-top opacity-90"
                loading="lazy"
              />
            </div>

            <div className="space-y-4 max-w-[260px] sm:max-w-xs z-10">
              {/* Eyebrow */}
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-[#E0E4DC] text-[11px] font-bold tracking-wider text-[#315C4C] uppercase">
                  COMMUNITY
                </span>
              </div>

              {/* Headline */}
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-[#171918] leading-[1.15]">
                A better city is{' '}
                <span className="block mt-0.5 text-[#315C4C]">a collective effort.</span>
              </h2>

              {/* Subtext */}
              <p className="text-sm sm:text-base text-[#737773] leading-relaxed font-normal">
                Report, validate, and help build a more responsive Hyderabad.
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-8 z-10">
              <Link
                to="/community"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#315C4C] hover:bg-[#26483B] rounded-full shadow-sm hover:shadow transition-all"
              >
                <span>Join the Community</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
