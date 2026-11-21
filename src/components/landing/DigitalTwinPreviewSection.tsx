import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

export const DigitalTwinPreviewSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const capabilities = [
    'Spatial Issue View',
    'Simulation Engine',
    'Infrastructure Links',
    'Risk Prevention',
  ];

  return (
    <section id="digital-twin" className="relative bg-[#F5F5F2] py-14 sm:py-20 lg:py-24 overflow-hidden border-t border-[#E4E6E2]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: 3D Digital Twin Visualization Card (6-7 cols) */}
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 relative"
          >
            <div className="relative rounded-3xl overflow-hidden border border-[#E4E6E2] bg-[#EAECE6] shadow-[0_12px_40px_rgba(23,25,24,0.06)]">
              {/* 3D City Visualization Image */}
              <div className="relative w-full h-[260px] sm:h-[320px] lg:h-[350px] overflow-hidden">
                <img
                  src="/images/digital_twin_preview.png"
                  alt="CivicEye 3D Digital Twin City Model with Spatial Wireframes and Hazard Pins"
                  className="w-full h-full object-cover select-none"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>

          {/* Right Column: Editorial Copy & Capability Checklist (5 cols) */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-6"
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#E8EAE5] border border-[#E4E6E2] text-[11px] font-bold tracking-wider text-[#315C4C] uppercase">
                CIVIC DIGITAL TWIN
              </span>
              <span className="h-[1px] w-12 bg-[#E4E6E2]"></span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[#171918] leading-[1.12]">
              Understand the city{' '}
              <span className="block mt-1">
                before problems <span className="text-[#315C4C]">escalate.</span>
              </span>
            </h2>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-[#737773] leading-relaxed font-normal">
              Run simulations, explore scenarios, and plan smarter interventions.
            </p>

            {/* Action Button & Checklist */}
            <div className="pt-2 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-start xl:items-center justify-between gap-6">
              <Link
                to="/digital-twin"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base font-semibold text-white bg-[#315C4C] hover:bg-[#26483B] rounded-full shadow-[0_4px_14px_rgba(49,92,76,0.22)] hover:shadow-[0_6px_20px_rgba(49,92,76,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0 group"
              >
                <span>Try Digital Twin</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Checklist on the right */}
              <div className="space-y-2">
                {capabilities.map((cap) => (
                  <div key={cap} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-[#171918]">
                    <div className="w-4 h-4 rounded-full bg-[#DDE7DF] flex items-center justify-center text-[#315C4C] flex-shrink-0">
                      <Check size={11} strokeWidth={3} />
                    </div>
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
