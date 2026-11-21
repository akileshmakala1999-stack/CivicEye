import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '../components/common/Button';

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  phase: string;
  plannedFeatures: string[];
  icon?: React.ReactNode;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  subtitle,
  phase,
  plannedFeatures,
  icon,
}) => {
  return (
    <div className="py-20 sm:py-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#737773] hover:text-[#315C4C] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Return to CivicEye Overview</span>
        </Link>
      </div>

      {/* Main card */}
      <div className="bg-white border border-[#E4E6E2] rounded-xl p-8 sm:p-12 shadow-sm">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#E4E6E2] flex-wrap gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDE7DF]/50 border border-[#315C4C]/20 text-xs font-mono text-[#315C4C] font-semibold uppercase">
            <Clock size={13} />
            <span>{phase} Architecture</span>
          </div>

          <div className="text-xs font-mono text-[#737773]">
            SYSTEM ROUTE REGISTERED
          </div>
        </div>

        <div className="flex items-start gap-4 mb-6">
          {icon && (
            <div className="p-3 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-[#315C4C]">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#171918] mb-2">
              {title}
            </h1>
            <p className="text-base text-[#737773] leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Feature roadmap list */}
        <div className="mt-8 pt-8 border-t border-[#E4E6E2]">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#171918] font-semibold mb-4">
            Scheduled Implementation Modules
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plannedFeatures.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-3 rounded-md bg-[#F5F5F2] border border-[#E4E6E2] text-xs text-[#171918]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#315C4C]" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-10 pt-6 border-t border-[#E4E6E2] flex items-center justify-between flex-wrap gap-4">
          <div className="text-xs text-[#737773]">
            Phase 1 & Phase 2 Foundations active. Full module activates in subsequent development phases.
          </div>
          <div className="flex items-center gap-2.5">
            <Button to="/dashboard" variant="primary" size="md">
              Open My Civic Space
            </Button>
            <Button to="/" variant="outline" size="md">
              Overview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
