import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Megaphone, Users, Landmark } from 'lucide-react';

export const ReferenceHero: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section className="relative overflow-hidden bg-[#F5F5F2] pt-6 sm:pt-10 lg:pt-12 pb-16 sm:pb-24 lg:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center"
        >
          {/* Left Column: Editorial Headline & Actions (5-6 cols) */}
          <div className="lg:col-span-6 z-10 space-y-6 sm:space-y-7 max-w-2xl">
            {/* Eyebrow Badge */}
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8EAE5] border border-[#E4E6E2] text-xs font-semibold tracking-wider text-[#315C4C] uppercase shadow-sm">
                <Landmark size={14} className="text-[#315C4C]" />
                <span>CIVICEYE · CIVIC INTELLIGENCE PLATFORM</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div variants={itemVariants}>
              <h1 className="text-4xl sm:text-5xl lg:text-[52px] xl:text-[60px] font-bold tracking-tight text-[#171918] leading-[1.08]">
                Better cities begin{' '}
                <span className="block mt-1 sm:mt-1.5 whitespace-nowrap">
                  with <span className="text-[#315C4C]">people who care.</span>
                </span>
              </h1>
            </motion.div>

            {/* Description Copy */}
            <motion.div variants={itemVariants}>
              <p className="text-base sm:text-lg text-[#737773] leading-relaxed max-w-xl font-normal">
                Turn everyday civic concerns into meaningful action. Report problems, understand your city's needs, and see how communities move toward better infrastructure.
              </p>
            </motion.div>

            {/* Action CTA Buttons */}
            <motion.div variants={itemVariants} className="pt-1 flex flex-wrap items-center gap-3.5">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base font-semibold text-white bg-[#315C4C] hover:bg-[#26483B] rounded-full shadow-[0_4px_14px_rgba(49,92,76,0.25)] hover:shadow-[0_6px_20px_rgba(49,92,76,0.32)] transition-all hover:-translate-y-0.5 active:translate-y-0 group"
              >
                <span>Explore CivicEye</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/report"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base font-medium text-[#171918] bg-white hover:bg-[#F9F9F7] border border-[#E4E6E2] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#D1D5CB] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <Megaphone size={16} className="text-[#315C4C]" />
                <span>Report an Issue</span>
              </Link>
            </motion.div>

            {/* Understated Trust Statement */}
            <motion.div variants={itemVariants} className="pt-1">
              <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#737773]">
                <Users size={16} className="text-[#315C4C]" />
                <span>Community-driven. Data-informed. Transparent.</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Panoramic Hyderabad City Visual with Civic Network Overlay */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[660px]"
            >
              {/* City Visual with Integrated Civic Network Graphic */}
              <div className="relative rounded-3xl overflow-hidden shadow-[0_12px_44px_rgba(23,25,24,0.06)]">
                <img
                  src="/images/hero_hyderabad_city.png"
                  alt="Hyderabad Civic Landscape overlooking Hussain Sagar Lake with Charminar and Modern Skyline"
                  className="w-full h-auto object-cover select-none"
                  loading="eager"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Organic Wave Transition into the Challenge Section */}
      <div className="w-full overflow-hidden leading-none mt-8 sm:mt-12 text-[#F5F5F2]">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block"
        >
          <path
            d="M0,0 C320,50 620,10 960,35 C1200,52 1360,20 1440,0 L1440,60 L0,60 Z"
            fill="#F5F5F2"
          />
        </svg>
      </div>
    </section>
  );
};
