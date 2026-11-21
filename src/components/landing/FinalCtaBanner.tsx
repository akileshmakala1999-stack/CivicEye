import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Megaphone } from 'lucide-react';

export const FinalCtaBanner: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative bg-[#F5F5F2] pt-4 pb-16 sm:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl lg:rounded-[36px] bg-[#1E3A2F] border border-[#2A4D3F] px-6 sm:px-10 lg:px-12 py-10 sm:py-12 lg:py-14 overflow-hidden shadow-[0_16px_48px_rgba(23,25,24,0.12)]"
        >
          {/* Hyderabad Landmark Skyline Silhouette (Clean Vector Artwork - Zero Ghost Text) */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-30">
            <svg
              className="w-full h-full object-cover object-right"
              viewBox="0 0 1200 240"
              fill="none"
              preserveAspectRatio="xMaxYMid slice"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Soft atmospheric gradient */}
              <defs>
                <linearGradient id="skylineGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1E3A2F" stopOpacity="1" />
                  <stop offset="40%" stopColor="#1E3A2F" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#2D5846" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="charminarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#72B193" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#1E3A2F" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Background Hitec City Skyscraper Silhouettes */}
              <path
                d="M 680 240 L 680 120 L 710 120 L 710 80 L 740 80 L 740 140 L 770 140 L 770 65 L 810 65 L 810 130 L 840 130 L 840 90 L 870 90 L 870 150 L 900 150 L 900 240 Z"
                fill="url(#charminarGrad)"
                opacity="0.5"
              />
              <path
                d="M 520 240 L 520 160 L 550 160 L 550 110 L 580 110 L 580 140 L 620 140 L 620 100 L 660 100 L 660 170 L 680 170 L 680 240 Z"
                fill="url(#charminarGrad)"
                opacity="0.35"
              />

              {/* Foreground Charminar Iconic Silhouette (Right) */}
              <g transform="translate(980, 20)" fill="#72B193" opacity="0.4">
                {/* 4 Minarets with Domes & Finials */}
                {/* Left Minaret 1 */}
                <rect x="10" y="30" width="14" height="190" rx="3" />
                <path d="M 8 30 C 8 18 26 18 26 30 Z" />
                <line x1="17" y1="18" x2="17" y2="6" stroke="#72B193" strokeWidth="2" />
                <circle cx="17" cy="5" r="2" />

                {/* Left Inner Pillar 2 */}
                <rect x="52" y="55" width="10" height="165" rx="2" />
                <path d="M 50 55 C 50 45 64 45 64 55 Z" />

                {/* Main Arch Structure */}
                <rect x="24" y="65" width="132" height="155" rx="4" opacity="0.6" />
                {/* Grand Islamic Archway Cutout */}
                <path
                  d="M 58 220 L 58 140 C 58 100 122 100 122 140 L 122 220 Z"
                  fill="#1E3A2F"
                />

                {/* Upper Balcony & Gallery */}
                <rect x="18" y="75" width="144" height="12" rx="2" />
                <rect x="22" y="95" width="136" height="6" rx="1" />
                {/* Small upper arches */}
                <circle cx="65" cy="115" r="8" fill="#1E3A2F" />
                <circle cx="90" cy="115" r="8" fill="#1E3A2F" />
                <circle cx="115" cy="115" r="8" fill="#1E3A2F" />

                {/* Right Inner Pillar 3 */}
                <rect x="118" y="55" width="10" height="165" rx="2" />
                <path d="M 116 55 C 116 45 130 45 130 55 Z" />

                {/* Right Minaret 4 */}
                <rect x="156" y="30" width="14" height="190" rx="3" />
                <path d="M 154 30 C 154 18 172 18 172 30 Z" />
                <line x1="163" y1="18" x2="163" y2="6" stroke="#72B193" strokeWidth="2" />
                <circle cx="163" cy="5" r="2" />
              </g>

              {/* Foliage / Hussain Sagar Garden Canopy along bottom */}
              <path
                d="M 400 240 Q 460 215 520 230 T 640 220 T 760 225 T 880 215 T 1000 225 T 1120 220 T 1200 230 L 1200 240 Z"
                fill="#152B22"
                opacity="0.8"
              />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-10">
            {/* Left Headline */}
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-white tracking-tight leading-[1.1]">
                Your city.{' '}
                <span className="block mt-1">
                  Your voice. <span className="text-[#72B193]">Your impact.</span>
                </span>
              </h2>
            </div>

            {/* Middle Supporting Text with Vertical Divider */}
            <div className="flex items-center gap-6 lg:gap-8 max-w-md">
              <span className="hidden lg:block h-14 w-[1px] bg-white/20 flex-shrink-0"></span>
              <p className="text-sm sm:text-base text-[#DDE7DF]/90 leading-relaxed font-normal">
                Every meaningful improvement begins when someone decides a problem deserves attention.
              </p>
            </div>

            {/* Right Action CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 flex-shrink-0 w-full sm:w-auto">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base font-semibold text-[#1E3A2F] bg-white hover:bg-[#F5F5F2] rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 active:translate-y-0 group w-full sm:w-auto"
              >
                <span>Explore CivicEye</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/report"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base font-medium text-white hover:text-white bg-transparent hover:bg-white/10 border border-white/40 hover:border-white rounded-full transition-all hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
              >
                <Megaphone size={16} className="text-[#72B193]" />
                <span>Report an Issue</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
