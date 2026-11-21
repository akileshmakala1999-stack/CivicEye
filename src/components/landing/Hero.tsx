import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Activity, CheckCircle, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { Button } from '../common/Button';
import { HeroMapPreview } from './HeroMapPreview';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-10 sm:pt-16 pb-16 sm:pb-24 overflow-hidden border-b border-[#E4E6E2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Hero Header Content */}
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-12 sm:mb-16">
          {/* Live Activity & Dashboard Entry Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E4E6E2] shadow-sm text-xs text-[#171918]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#315C4C] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#315C4C]"></span>
              </span>
              <span className="font-medium text-[#171918]">Live Civic Activity</span>
              <span className="text-[#E4E6E2]">|</span>
              <span className="text-[#737773] font-mono text-[11px]">
                14 neighborhood updates today
              </span>
            </div>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#DDE7DF]/80 hover:bg-[#DDE7DF] border border-[#315C4C]/25 text-xs font-semibold text-[#315C4C] transition-colors shadow-sm"
            >
              <LayoutDashboard size={13} />
              <span>Enter My Civic Space (Dashboard) &rarr;</span>
            </Link>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#171918] leading-[1.12]">
            Better cities begin with people who care.
          </h1>

          {/* Supporting Subtext */}
          <p className="text-lg sm:text-xl text-[#737773] max-w-2xl mx-auto leading-relaxed font-normal">
            Report problems around you. Bring communities together. Make civic action visible.
          </p>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button
              to="/report"
              variant="primary"
              size="lg"
              icon={<ArrowUpRight size={18} />}
              className="w-full sm:w-auto"
            >
              Report an Issue
            </Button>
            <Button
              to="/explore"
              variant="outline"
              size="lg"
              icon={<MapPin size={17} />}
              iconPosition="left"
              className="w-full sm:w-auto"
            >
              Explore the City
            </Button>
          </div>

          {/* Quick link to Citizen Dashboard */}
          <div className="pt-0.5">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#315C4C] hover:text-[#26483B] hover:underline"
            >
              <span>Looking for your citizen dashboard? Open My Civic Space</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#737773]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle size={13} className="text-[#315C4C]" />
              <span>30-second submission</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#315C4C]" />
              <span>Community-verified triage</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Activity size={13} className="text-[#315C4C]" />
              <span>Public SLA tracking</span>
            </span>
          </div>
        </div>

        {/* Map Composition (Hero Visual Showcase) */}
        <div className="max-w-5xl mx-auto">
          <HeroMapPreview />
        </div>
      </div>
    </section>
  );
};

