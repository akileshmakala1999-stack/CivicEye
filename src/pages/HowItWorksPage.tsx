import React from 'react';
import { Link } from 'react-router-dom';
import {
  PenTool,
  Search,
  ShieldCheck,
  Star,
  Cog,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { ChallengeAndWorkflow } from '../components/landing/ChallengeAndWorkflow';

export const HowItWorksPage: React.FC = () => {
  const stepsDetail = [
    {
      num: '01',
      title: 'Report with Geo-Context & Media',
      icon: PenTool,
      badge: 'Citizen Entry',
      tagline: 'Pinpoint hazards in under 60 seconds with verified EXIF location & photo proof.',
      description:
        'Citizens or automated civic sensors capture live photos and exact coordinates of road defects, drainage blockages, electrical hazards, or sanitation overflow. The system validates metropolitan Hyderabad coordinate boundaries and tags official municipal wards automatically.',
      features: [
        'Geographic boundary & ward centroid validation',
        'Optional anonymous reporting mode with complete privacy',
        'Duplicate detection against active regional tickets',
      ],
      ctaText: 'Report an Issue',
      ctaLink: '/report',
      color: '#315C4C',
      bgColor: '#DDE7DF',
    },
    {
      num: '02',
      title: 'Understand & AI Pre-Classification',
      icon: Search,
      badge: 'Civic Intelligence',
      tagline: 'Explainable AI analyzes hazard severity, root causes, and safety risks.',
      description:
        'Our transparent AI decision engine analyzes the description, severity level, and infrastructure risk factors. It proposes priority scores, estimates resolution times, and matches the incident with historical recurrence patterns across Hyderabad wards.',
      features: [
        'Deterministic, explainable priority scoring matrix',
        'Cross-department jurisdiction detection (GHMC, TSSPDCL, HMWSSB)',
        'Zero black-box decisions — full mathematical rationale provided',
      ],
      ctaText: 'Explore Civic Intelligence',
      ctaLink: '/insights',
      color: '#26483B',
      bgColor: '#E0E7E2',
    },
    {
      num: '03',
      title: 'Validate & Community Corroboration',
      icon: ShieldCheck,
      badge: 'Decentralized Trust',
      tagline: 'Local residents verify ground reality, confirming urgency and preventing spam.',
      description:
        'Neighbors and commuters confirm whether a problem still exists, has worsened, or has created secondary hazards. Collective community votes elevate critical bottlenecks directly to supervisor attention.',
      features: [
        'Anti-gaming vote validation with Civic Trust scores',
        'Photo-supported community corroboration submissions',
        'Citizen dispute mechanism for prematurely closed issues',
      ],
      ctaText: 'Join Community Validation',
      ctaLink: '/community',
      color: '#315C4C',
      bgColor: '#DDE7DF',
    },
    {
      num: '04',
      title: 'Prioritize with Digital Twin Simulations',
      icon: Star,
      badge: 'Predictive Ops',
      tagline: 'Simulate cascading infrastructure impact before dispatching resources.',
      description:
        'Municipal engineers simulate intervention strategies using our spatial Digital Twin engine. See how unaddressed drainage issues impact road networks or water supply across adjacent wards during seasonal monsoon events.',
      features: [
        'Ward-level spatial vulnerability index modeling',
        'What-if scenario analysis with DCU-budget optimization',
        'Cascade risk evaluation across interconnected utilities',
      ],
      ctaText: 'Launch Digital Twin',
      ctaLink: '/digital-twin',
      color: '#72B193',
      bgColor: '#EAF3EF',
    },
    {
      num: '05',
      title: 'Act: Municipal Multi-Agency Dispatch',
      icon: Cog,
      badge: 'Field Operations',
      tagline: 'Work orders routed to authorized zonal officers with verifiable audit trails.',
      description:
        'Official municipal personnel review AI recommendations, confirm departmental responsibility, and dispatch field crews with clear SLA targets. Every dispatch transition is permanently recorded in the municipal audit ledger.',
      features: [
        'Role-gated Officer Operations Portal with tamper checks',
        'Cross-departmental coordination between road, power, and water agencies',
        'Real-time SLA tracking against public performance benchmarks',
      ],
      ctaText: 'View Operations Portal',
      ctaLink: '/signin',
      color: '#171918',
      bgColor: '#ECEEE9',
    },
    {
      num: '06',
      title: 'Verify: Citizen Sign-Off & Public Ledger',
      icon: CheckCircle2,
      badge: 'Accountability',
      tagline: 'An issue is not closed until the citizen community validates the repair.',
      description:
        'When field teams complete a work order, before-and-after photo evidence is published to the public portal. Original reporters and community guardians rate repair quality and confirm the hazard is genuinely resolved.',
      features: [
        'Public Sanitized Transparency Scorecards & SLA metrics',
        'Citizen resolution quality feedback and dispute reopenings',
        'Permanent public accountability record without exposing private data',
      ],
      ctaText: 'Inspect Transparency Ledger',
      ctaLink: '/transparency',
      color: '#315C4C',
      bgColor: '#DDE7DF',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-[#171918] pb-20">
      {/* 1. Architectural Header */}
      <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-20 border-b border-[#E4E6E2]/80 bg-[#ECEEE9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E4E6E2] shadow-xs mb-5">
              <Sparkles size={13} className="text-[#315C4C]" />
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#315C4C]">
                Civic Lifecycle Architecture
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#171918] leading-[1.08] mb-4">
              How CivicEye turns citizen voices into verified action.
            </h1>

            <p className="text-base sm:text-lg text-[#737773] leading-relaxed max-w-2xl">
              From the moment a hazard is noticed to the final verified repair, explore the
              six-stage transparent lifecycle that keeps municipal agencies accountable and
              communities informed.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/report"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#315C4C] text-white text-sm font-semibold hover:bg-[#26483B] transition-all shadow-sm"
              >
                <span>Report an Issue Now</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-[#E4E6E2] text-sm font-semibold text-[#171918] hover:bg-[#F5F5F2] transition-all shadow-xs"
              >
                <MapPin size={15} className="text-[#315C4C]" />
                <span>Explore City Map</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Embedded Reference Challenge & Workflow Component */}
      <div className="border-b border-[#E4E6E2]/80">
        <ChallengeAndWorkflow />
      </div>

      {/* 3. Deep-Dive Section for Each of the 6 Steps */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-block px-3 py-1 rounded-full bg-[#E0E4DC] text-[11px] font-bold tracking-wider text-[#315C4C] uppercase mb-3">
            In-Depth Stage Breakdown
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#171918]">
            Built on integrity, driven by community consensus.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#737773]">
            Every step is engineered to eliminate lost tickets, reduce agency finger-pointing, and
            guarantee public visibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {stepsDetail.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="rounded-2xl bg-white border border-[#E4E6E2] p-6 sm:p-7 shadow-[0_4px_16px_rgba(23,25,24,0.03)] flex flex-col justify-between hover:border-[#315C4C]/40 hover:shadow-[0_8px_24px_rgba(49,92,76,0.08)] transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-bold text-[#A3A8A0] group-hover:text-[#315C4C] transition-colors">
                      {step.num}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-[#F5F5F2] border border-[#E4E6E2] text-[#315C4C]">
                      {step.badge}
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-[#DDE7DF]/50 flex items-center justify-center text-[#315C4C] mb-4 group-hover:bg-[#DDE7DF] transition-colors">
                    <Icon size={22} className="stroke-[2.25]" />
                  </div>

                  <h3 className="text-lg font-bold text-[#171918] mb-1.5 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#315C4C] mb-3 leading-normal">
                    {step.tagline}
                  </p>
                  <p className="text-xs text-[#737773] leading-relaxed mb-4">
                    {step.description}
                  </p>

                  <ul className="space-y-2 border-t border-[#E4E6E2]/70 pt-3 mb-5">
                    {step.features.map((feat, i) => (
                      <li key={i} className="text-[11px] text-[#171918] flex items-start gap-2">
                        <span className="text-[#315C4C] font-bold mt-0.5">•</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={step.ctaLink}
                  className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-[#F5F5F2] hover:bg-[#DDE7DF] text-[#171918] group-hover:text-[#315C4C] text-xs font-semibold transition-colors border border-[#E4E6E2]"
                >
                  <span>{step.ctaText}</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Bottom Callout Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#171918] text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#315C4C]/20 blur-[100px] pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-[#72B193] font-semibold">
              JOIN THE CIVIC NETWORK
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              A responsive Hyderabad starts with an observant community.
            </h2>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed">
              Whether reporting a single pothole or examining citywide infrastructure trends, your
              participation powers smarter municipal decisions.
            </p>
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#315C4C] hover:bg-[#26483B] text-white text-sm font-semibold transition-all shadow-md"
              >
                <span>Enter CivicEye Dashboard</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/transparency"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all border border-white/20"
              >
                <span>Public Transparency Portal</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
