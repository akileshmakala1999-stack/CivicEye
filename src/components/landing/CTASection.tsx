import React from 'react';
import { ArrowUpRight, MapPin, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';

export const CTASection: React.FC = () => {
  return (
    <section className="bg-[#181C1A] text-white py-20 sm:py-28 relative overflow-hidden">
      {/* Subtle geometric line accents using locked sage / charcoal */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#FFFFFF" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Monospace Kicker */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#315C4C]/30 border border-[#315C4C]/60 text-xs font-mono text-[#DDE7DF] uppercase tracking-wider mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DDE7DF]" />
          Participate in Civic Intelligence
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
          Your neighborhood. Your voice. Your impact.
        </h2>

        {/* Supporting text */}
        <p className="text-base sm:text-xl text-[#737773] max-w-2xl mx-auto mb-10 leading-relaxed">
          Start with one issue. Help make your community better.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button
            to="/report"
            variant="primary"
            size="lg"
            icon={<ArrowUpRight size={18} />}
            className="w-full sm:w-auto bg-[#315C4C] hover:bg-[#26483B] text-white"
          >
            Report an Issue
          </Button>
          <Button
            to="/explore"
            variant="outline"
            size="lg"
            icon={<MapPin size={17} />}
            iconPosition="left"
            className="w-full sm:w-auto bg-transparent border-[#737773]/40 text-white hover:bg-white/10 hover:border-white"
          >
            Explore CivicEye
          </Button>
        </div>

        {/* Trust bullets */}
        <div className="pt-8 border-t border-[#737773]/20 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-[#737773]">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#315C4C]" />
            <span>Open data compliance</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#315C4C]" />
            <span>Zero personal data sold</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#315C4C]" />
            <span>Direct municipal linkage</span>
          </span>
        </div>
      </div>
    </section>
  );
};

