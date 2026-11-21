import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Users, Eye, PenTool, Search, ShieldCheck, Star, Cog, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ChallengeAndWorkflow: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const workflowSteps = [
    { icon: PenTool, label: 'Report' },
    { icon: Search, label: 'Understand' },
    { icon: ShieldCheck, label: 'Validate' },
    { icon: Star, label: 'Prioritize' },
    { icon: Cog, label: 'Act' },
    { icon: CheckCircle2, label: 'Verify' },
  ];

  return (
    <section id="how-it-works" className="relative bg-[#F5F5F2] pt-4 pb-16 sm:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-start">
          {/* Left: The Challenge (5-6 cols) */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 xl:col-span-6 flex flex-col justify-between h-full pt-2"
          >
            <div>
              {/* Eyebrow with flanking horizontal lines */}
              <div className="flex items-center gap-3 mb-4">
                <span className="h-[1px] w-8 bg-[#E4E6E2]"></span>
                <span className="text-[11px] font-bold tracking-widest text-[#737773] uppercase">
                  THE CHALLENGE
                </span>
                <span className="h-[1px] w-8 bg-[#E4E6E2]"></span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#171918] leading-[1.14] mb-8 sm:mb-10">
                Cities don't improve{' '}
                <span className="block mt-1">
                  when problems go <span className="text-[#315C4C]">unnoticed.</span>
                </span>
              </h2>
            </div>

            {/* 3 Challenge Points with Vertical Dividers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-2 pt-2 border-t border-[#E4E6E2]/80 sm:border-t-0">
              {/* Point 1 */}
              <div className="flex flex-col items-start sm:items-center text-left sm:text-center sm:px-3">
                <div className="mb-3 p-2.5 rounded-full bg-[#E8EAE5] text-[#315C4C]">
                  <AlertTriangle size={22} className="stroke-[2.25]" />
                </div>
                <p className="text-xs sm:text-sm text-[#171918] font-medium leading-snug">
                  Civic issues are difficult to track.
                </p>
              </div>

              {/* Divider 1 & Point 2 */}
              <div className="flex flex-col items-start sm:items-center text-left sm:text-center sm:px-3 sm:border-l sm:border-[#E4E6E2]">
                <div className="mb-3 p-2.5 rounded-full bg-[#E8EAE5] text-[#315C4C]">
                  <Users size={22} className="stroke-[2.25]" />
                </div>
                <p className="text-xs sm:text-sm text-[#171918] font-medium leading-snug">
                  Community signals are often disconnected from action.
                </p>
              </div>

              {/* Divider 2 & Point 3 */}
              <div className="flex flex-col items-start sm:items-center text-left sm:text-center sm:px-3 sm:border-l sm:border-[#E4E6E2]">
                <div className="mb-3 p-2.5 rounded-full bg-[#E8EAE5] text-[#315C4C]">
                  <Eye size={22} className="stroke-[2.25]" />
                </div>
                <p className="text-xs sm:text-sm text-[#171918] font-medium leading-snug">
                  Citizens rarely have clear visibility into what happens next.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: How CivicEye Works (6-7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.65, delay: shouldReduceMotion ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 xl:col-span-6 rounded-3xl bg-[#ECEEE9] border border-[#E4E6E2] p-6 sm:p-8 lg:p-9 shadow-[0_8px_32px_rgba(23,25,24,0.03)]"
          >
            {/* Eyebrow */}
            <div className="text-center mb-3">
              <span className="inline-block px-3 py-1 rounded-full bg-[#E0E4DC] text-[11px] font-bold tracking-wider text-[#315C4C] uppercase">
                HOW CIVICEYE WORKS
              </span>
            </div>

            {/* Headline */}
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171918] text-center leading-snug mb-8 sm:mb-9">
              From report to resolution <span className="block text-[#171918]">— with transparency.</span>
            </h3>

            {/* 6-Step Workflow Chain */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-none">
              {workflowSteps.map((step, idx) => {
                const Icon = step.icon;
                const isLast = idx === workflowSteps.length - 1;
                return (
                  <React.Fragment key={step.label}>
                    <div className="flex flex-col items-center min-w-[50px] sm:min-w-[62px] text-center group">
                      <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white border border-[#E4E6E2] flex items-center justify-center text-[#315C4C] shadow-[0_2px_8px_rgba(23,25,24,0.06)] group-hover:scale-105 group-hover:border-[#315C4C]/40 transition-all duration-200">
                        <Icon size={18} className="stroke-[2.25]" />
                      </div>
                      <span className="mt-2 text-[11px] sm:text-xs font-semibold text-[#171918]">
                        {step.label}
                      </span>
                    </div>

                    {!isLast && (
                      <div className="text-[#A3A8A0] font-mono text-xs select-none">
                        &rarr;
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Learn More Link */}
            <div className="mt-6 sm:mt-7 text-center">
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#315C4C] hover:text-[#26483B] hover:underline transition-colors"
              >
                <span>Learn More</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
