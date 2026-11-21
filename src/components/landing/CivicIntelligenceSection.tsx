import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export const CivicIntelligenceSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="intelligence" className="relative bg-[#F5F5F2] py-14 sm:py-20 lg:py-24 overflow-hidden border-t border-[#E4E6E2]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Intelligence Editorial Copy (5 cols) */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-6"
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#E8EAE5] border border-[#E4E6E2] text-[11px] font-bold tracking-wider text-[#315C4C] uppercase">
                CIVIC INTELLIGENCE
              </span>
              <span className="h-[1px] w-12 bg-[#E4E6E2]"></span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-bold tracking-tight text-[#171918] leading-[1.12]">
              From individual reports{' '}
              <span className="block mt-1">
                to a <span className="text-[#315C4C]">bigger picture.</span>
              </span>
            </h2>

            {/* Body */}
            <p className="text-base sm:text-lg text-[#737773] leading-relaxed max-w-lg font-normal">
              Discover patterns, prevent problems, and build a safer, cleaner, and more connected Hyderabad.
            </p>

            {/* Action Button */}
            <div className="pt-2">
              <Link
                to="/insights"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base font-semibold text-white bg-[#315C4C] hover:bg-[#26483B] rounded-full shadow-[0_4px_14px_rgba(49,92,76,0.22)] hover:shadow-[0_6px_20px_rgba(49,92,76,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0 group"
              >
                <span>Explore Insights</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Spatial Map Visualization Card (7 cols) */}
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 relative"
          >
            {/* Map Card Container */}
            <div className="relative rounded-3xl overflow-hidden border border-[#E4E6E2] bg-[#EAECE6] shadow-[0_12px_40px_rgba(23,25,24,0.06)]">
              {/* GIS Map Image */}
              <div className="relative w-full h-[280px] sm:h-[340px] lg:h-[360px] overflow-hidden">
                <img
                  src="/images/civic_intelligence_map.png"
                  alt="Citywide Civic Intelligence Map of Hyderabad with Hotspots and Issue Clusters"
                  className="w-full h-full object-cover select-none"
                  loading="lazy"
                />

                {/* Concentric Subtle Pulsing Heat Rings */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Central Hotspot Pulse */}
                  <div className="absolute top-[48%] left-[55%] -translate-x-1/2 -translate-y-1/2">
                    <span className="animate-ping absolute -inset-2 rounded-full bg-[#B8463B] opacity-20"></span>
                  </div>

                  {/* Secondary Hotspot Pulse */}
                  <div className="absolute top-[32%] left-[68%] -translate-x-1/2 -translate-y-1/2">
                    <span className="animate-ping absolute -inset-2 rounded-full bg-[#E06D3B] opacity-20"></span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
