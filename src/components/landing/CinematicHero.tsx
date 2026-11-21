import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CinematicHero: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tilt tracking for 3D card perspective
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for card rotation
  const rotateXSpring = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), {
    damping: 25,
    stiffness: 120,
  });
  const rotateYSpring = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
    damping: 25,
    stiffness: 120,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = (e.clientX - rect.left) / width - 0.5;
    const mouseYPos = (e.clientY - rect.top) / height - 0.5;
    mouseX.set(mouseXPos);
    mouseY.set(mouseYPos);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[calc(100vh-140px)] flex items-center overflow-hidden bg-[#F5F5F2] py-8 sm:py-14 lg:py-16 selection:bg-[#DDE7DF] selection:text-[#315C4C]"
    >
      {/* 1. Subtle Architectural Grid Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(#315C4C 1.2px, transparent 1.2px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* 2. Living Ambient Atmospheric Lighting Orbs */}
      <motion.div
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.15, 1],
                opacity: [0.12, 0.22, 0.12],
                x: [0, 20, 0],
              }
        }
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 -left-20 w-[28rem] h-[28rem] rounded-full bg-[#315C4C]/15 blur-[90px] pointer-events-none"
      />
      <motion.div
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.35, 0.2],
                y: [0, -25, 0],
              }
        }
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-1/4 right-0 w-[34rem] h-[34rem] rounded-full bg-[#72B193]/20 blur-[100px] pointer-events-none"
      />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-[#E5A233]/5 blur-[80px] pointer-events-none" />

      {/* Floating Luminous Motes (Ambient Urban Sunlight Particles) */}
      {!shouldReduceMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { top: '22%', left: '48%', size: 4, dur: 7, delay: 0 },
            { top: '35%', left: '88%', size: 3, dur: 9, delay: 1.5 },
            { top: '65%', left: '52%', size: 3.5, dur: 8, delay: 2.5 },
            { top: '78%', left: '78%', size: 3, dur: 10, delay: 0.8 },
            { top: '18%', left: '25%', size: 2.5, dur: 6.5, delay: 3 },
          ].map((mote, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-[#72B193] pointer-events-none shadow-[0_0_8px_#72B193]"
              style={{
                top: mote.top,
                left: mote.left,
                width: mote.size,
                height: mote.size,
              }}
              animate={{
                y: [0, -28, 0],
                opacity: [0.2, 0.75, 0.2],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: mote.dur,
                repeat: Infinity,
                delay: mote.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Main Content Layout */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center"
        >
          {/* Left Column: Editorial Headline & Actions (6 cols) */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 max-w-2xl">
            {/* Live Civic Space Accent Pill */}
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#E4E6E2] shadow-[0_2px_8px_rgba(23,25,24,0.04)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#315C4C] opacity-75 duration-1000" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#315C4C]" />
                </span>
                <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-[#315C4C] uppercase">
                  Civic Intelligence Platform
                </span>
                <span className="h-3 w-[1px] bg-[#E4E6E2]" />
                <span className="text-[11px] text-[#737773] font-medium flex items-center gap-1">
                  <Sparkles size={11} className="text-[#315C4C]" />
                  <span>Hyderabad Region</span>
                </span>
              </div>
            </motion.div>

            {/* Headline with Organic Underline Flourish */}
            <motion.div variants={itemVariants} className="space-y-2">
              <h1 className="text-4xl sm:text-6xl lg:text-[68px] xl:text-[76px] font-bold tracking-tight text-[#171918] leading-[1.04]">
                Better cities begin{' '}
                <span className="block mt-1 sm:mt-1.5 relative inline-block">
                  with{' '}
                  <span className="relative inline-block text-[#315C4C] font-extrabold bg-gradient-to-r from-[#315C4C] via-[#3D7460] to-[#25473A] bg-clip-text text-transparent">
                    people who care.
                    {/* Animated Hand-Drawn SVG Underline Flourish */}
                    <svg
                      className="absolute -bottom-2 sm:-bottom-3 left-0 w-full h-3 sm:h-3.5 text-[#72B193] pointer-events-none overflow-visible"
                      viewBox="0 0 320 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M 4 12 Q 80 4 160 8 T 316 6"
                        stroke="#72B193"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-90"
                      />
                    </svg>
                  </span>
                </span>
              </h1>
            </motion.div>

            {/* Supporting Editorial Copy */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg lg:text-xl text-[#737773] leading-relaxed max-w-xl font-normal"
            >
              Every improvement begins when someone notices, cares, and takes the first step.
            </motion.p>

            {/* Premium Interactive Action Buttons */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 pt-2">
              {/* Primary Explore CTA with Shimmer & Radiant Glow */}
              <Link
                to="/dashboard"
                className="relative inline-flex items-center gap-3 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-[#315C4C] text-white text-sm sm:text-base font-semibold overflow-hidden transition-all duration-300 shadow-[0_8px_24px_-4px_rgba(49,92,76,0.35)] hover:shadow-[0_12px_32px_-4px_rgba(49,92,76,0.48)] hover:-translate-y-0.5 active:translate-y-0 group"
              >
                {/* Subtle Shimmer Sweep on Hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/18 to-transparent pointer-events-none" />

                <span className="relative z-10">Explore CivicEye</span>
                <ArrowRight
                  size={18}
                  className="relative z-10 transition-transform duration-300 group-hover:translate-x-1.5"
                />
              </Link>

              {/* Secondary Sign In Button */}
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white/95 backdrop-blur-sm text-[#171918] text-sm sm:text-base font-semibold border border-[#E4E6E2] hover:border-[#315C4C]/40 hover:bg-white hover:text-[#315C4C] transition-all duration-300 shadow-[0_2px_8px_rgba(23,25,24,0.04)] hover:shadow-[0_4px_16px_rgba(23,25,24,0.08)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Sign In</span>
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Cinematic City Visual with Interactive 3D Perspective Tilt */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-6 flex justify-center lg:justify-end perspective-[1200px]"
          >
            {/* Interactive 3D Card with Subtle Spring Reaction */}
            <motion.div
              style={
                shouldReduceMotion
                  ? undefined
                  : {
                      rotateX: rotateXSpring,
                      rotateY: rotateYSpring,
                      transformStyle: 'preserve-3d',
                    }
              }
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: [0, -8, 0],
                    }
              }
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative w-full max-w-[620px]"
            >
              {/* Soft Ambient Card Glow Behind Container */}
              <div className="absolute -inset-2 rounded-[38px] bg-gradient-to-tr from-[#315C4C]/15 via-[#72B193]/15 to-transparent blur-xl pointer-events-none -z-10 opacity-70" />

              {/* Outer Atmospheric Glass Frame */}
              <div className="relative rounded-[28px] sm:rounded-[36px] overflow-hidden border border-white/70 bg-[#EAECE6] shadow-[0_20px_60px_-10px_rgba(23,25,24,0.12),0_4px_20px_rgba(49,92,76,0.06)]">
                {/* Atmospheric Hyderabad Panoramic Landscape */}
                <img
                  src="/images/hero_hyderabad_city.png"
                  alt="Atmospheric Hyderabad Cityscape overlooking Hussain Sagar lake and Charminar"
                  className="w-full h-auto object-cover select-none transform scale-[1.01]"
                  loading="eager"
                />

                {/* Soft Morning Light Ambient Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#315C4C]/15 via-transparent to-white/20 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#171918]/25 via-transparent to-transparent pointer-events-none" />

                {/* Top-Left Geographic Coordinate Badge */}
                <div className="absolute top-4 sm:top-5 left-4 sm:left-5 z-20 pointer-events-none">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/25 shadow-sm text-white/90">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#72B193] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#72B193]" />
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-mono tracking-wider">
                      17.3850° N, 78.4867° E
                    </span>
                    <span className="text-[10px] text-white/60 hidden sm:inline">· Hussain Sagar</span>
                  </div>
                </div>

                {/* Bottom-Right Connected Wards Indicator */}
                <div className="absolute bottom-4 sm:bottom-5 right-4 sm:right-5 z-20 pointer-events-none">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.08)] text-[#171918]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#315C4C]" />
                    <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide">
                      150 Municipal Wards Connected
                    </span>
                  </div>
                </div>

                {/* Animated SVG Civic Network Connection Arcs */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  viewBox="0 0 800 480"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Subtle graceful connection arcs */}
                  <path
                    d="M 280 120 Q 390 85 490 150 T 670 330"
                    stroke="rgba(114, 177, 147, 0.55)"
                    strokeWidth="1.75"
                    strokeDasharray="4 6"
                  />
                  <path
                    d="M 190 260 Q 320 220 460 280 T 610 390"
                    stroke="rgba(114, 177, 147, 0.45)"
                    strokeWidth="1.5"
                    strokeDasharray="3 5"
                  />
                  <path
                    d="M 490 150 Q 560 200 610 390"
                    stroke="rgba(114, 177, 147, 0.4)"
                    strokeWidth="1.5"
                    strokeDasharray="4 6"
                  />
                  <path
                    d="M 280 120 Q 230 190 190 260"
                    stroke="rgba(114, 177, 147, 0.35)"
                    strokeWidth="1.25"
                    strokeDasharray="3 5"
                  />
                </svg>

                {/* Subtle Luminous Radar Beacons (4 Pulse Points Across Landmarks) */}
                <div className="absolute inset-0 pointer-events-none z-15">
                  {/* Point 1: Over Central Hussain Sagar Basin */}
                  <div className="absolute top-[30%] left-[62%] -translate-x-1/2 -translate-y-1/2">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#72B193] opacity-75 duration-1000" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#315C4C] shadow-[0_0_12px_#72B193]" />
                    </span>
                  </div>

                  {/* Point 2: Over Charminar Heritage Quarter */}
                  <div className="absolute top-[38%] left-[84%] -translate-x-1/2 -translate-y-1/2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#72B193] opacity-65 duration-1000 delay-300" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#315C4C] shadow-[0_0_10px_#72B193]" />
                    </span>
                  </div>

                  {/* Point 3: Over Financial Towers Skyline */}
                  <div className="absolute top-[24%] left-[34%] -translate-x-1/2 -translate-y-1/2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#72B193] opacity-55 duration-1000 delay-600" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#315C4C] shadow-[0_0_10px_#72B193]" />
                    </span>
                  </div>

                  {/* Point 4: Along Waterfront Boulevard */}
                  <div className="absolute top-[68%] left-[71%] -translate-x-1/2 -translate-y-1/2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#72B193] opacity-60 duration-1000 delay-900" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#315C4C] shadow-[0_0_8px_#72B193]" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CinematicHero;
