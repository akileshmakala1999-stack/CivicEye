import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/common/Badge';
import { communityValidationService } from '../services/communityValidationService';
import { operationsService } from '../services/operationsService';
import {
  Users,
  Award,
  CheckCircle2,
  Calendar,
  Check,
} from 'lucide-react';

interface Guardian {
  id: string;
  name: string;
  ward: string;
  trustScore: number;
  rank: number;
  validations: number;
  reportsSubmitted: number;
  badge: string;
  avatarBg: string;
}

const GUARDIANS: Guardian[] = [
  {
    id: 'g-1',
    name: 'Aditya (You)',
    ward: 'Jubilee Hills • Ward 04',
    trustScore: 840,
    rank: 1,
    validations: 42,
    reportsSubmitted: 6,
    badge: 'Civic Sentinel Level 3',
    avatarBg: 'bg-[#315C4C] text-white',
  },
  {
    id: 'g-2',
    name: 'Dr. Priya Varma',
    ward: 'Banjara Hills • Ward 08',
    trustScore: 825,
    rank: 2,
    validations: 38,
    reportsSubmitted: 9,
    badge: 'Sanitation Guardian',
    avatarBg: 'bg-[#DDE7DF] text-[#315C4C]',
  },
  {
    id: 'g-3',
    name: 'K. Sunder Rao',
    ward: 'Madhapur • Ward 12',
    trustScore: 790,
    rank: 3,
    validations: 31,
    reportsSubmitted: 4,
    badge: 'Road Infrastructure Auditor',
    avatarBg: 'bg-[#FAF5ED] text-[#C58B36]',
  },
  {
    id: 'g-4',
    name: 'Sneha Reddy',
    ward: 'Gachibowli • Ward 15',
    trustScore: 765,
    rank: 4,
    validations: 27,
    reportsSubmitted: 5,
    badge: 'Pedestrian Pathways Watch',
    avatarBg: 'bg-[#F5F5F2] text-[#171918]',
  },
];

interface CivicDrive {
  id: string;
  title: string;
  ward: string;
  date: string;
  time: string;
  location: string;
  rsvps: number;
  description: string;
}

const CIVIC_DRIVES: CivicDrive[] = [
  {
    id: 'drive-1',
    title: 'KBR National Park Perimeter Footpath Restoration Drive',
    ward: 'Jubilee Hills',
    date: 'Saturday, Nov 28',
    time: '7:30 AM – 10:00 AM',
    location: 'Gate 2 Main Entrance, KBR National Park',
    rsvps: 34,
    description: 'Community volunteer walk inspecting pavers, logging tripping hazards, and clearing overhanging brush with GHMC tools.',
  },
  {
    id: 'drive-2',
    title: 'Road No. 36 Storm Drain Inflow & Desilting Watch',
    ward: 'Jubilee Hills',
    date: 'Sunday, Dec 06',
    time: '8:00 AM – 10:30 AM',
    location: 'Peddamma Temple Metro Station Underpass',
    rsvps: 28,
    description: 'Pre-monsoon verification of water runoff chambers to prevent intersection waterlogging.',
  },
];

export const CommunityNetworkPage: React.FC = () => {
  const [rsvpedDrives, setRsvpedDrives] = useState<string[]>(['drive-1']);
  const [votedRepairs, setVotedRepairs] = useState<{ [id: string]: 'verified' | 'disputed' }>({});

  const toggleRsvp = (driveId: string) => {
    setRsvpedDrives((prev) =>
      prev.includes(driveId) ? prev.filter((id) => id !== driveId) : [...prev, driveId]
    );
  };

  const handleVoteRepair = (id: string, vote: 'verified' | 'disputed') => {
    setVotedRepairs((prev) => ({ ...prev, [id]: vote }));
    if (vote === 'verified') {
      communityValidationService.verifyResolutionSatisfactory(id, 'usr-aditya', 'Aditya (Citizen Guardian)');
    } else {
      communityValidationService.challengeResolution({
        reportId: id,
        userName: 'Aditya (Citizen Guardian)',
        reason: 'Citizen community audit identified recurring defect requiring municipal re-inspection.',
      });
      operationsService.handleCitizenResolutionChallenge({
        reportId: id,
        citizenName: 'Aditya (Citizen Guardian)',
        citizenId: 'usr-aditya',
        reason: 'Citizen community audit identified recurring defect requiring municipal re-inspection.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-[#171918] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4E6E2]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#315C4C] font-semibold mb-1">
              <Users size={14} />
              <span>COMMUNITY VERIFICATION HUBS & GUARDIAN NETWORK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171918]">
              Neighborhood Civic Consensus
            </h1>
            <p className="text-xs text-[#737773] mt-0.5 max-w-xl">
              Citizens validating ground realities to prevent duplicate complaints, boost genuine municipal emergency priority, and certify completed repairs.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-lg bg-white border border-[#E4E6E2] text-xs font-medium text-[#171918] hover:bg-[#F5F5F2] transition-colors"
            >
              My Civic Space
            </Link>

            <Link
              to="/report"
              className="px-4 py-2 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] transition-colors shadow-xs"
            >
              Report an Issue
            </Link>
          </div>
        </div>

        {/* SECTION 1: GUARDIAN LEADERBOARD */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#315C4C] uppercase font-semibold">
                <Award size={14} />
                <span>Ward Trust Roster</span>
              </div>
              <h2 className="text-lg font-bold text-[#171918]">
                Top Neighborhood Guardians
              </h2>
            </div>
            <span className="text-xs font-mono text-[#737773]">
              BASED ON VERIFIED CITIZEN ACCURACY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GUARDIANS.map((g) => (
              <div
                key={g.id}
                className="p-5 rounded-xl bg-white border border-[#E4E6E2] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#315C4C]/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${g.avatarBg}`}>
                    {g.name[0]}
                  </div>
                  <span className="font-mono text-xs font-bold text-[#737773]">
                    #{g.rank}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[#171918]">{g.name}</h3>
                  <div className="text-[11px] font-mono text-[#737773]">{g.ward}</div>
                  <div className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-[#DDE7DF]/50 text-[#315C4C] font-semibold border border-[#315C4C]/20">
                    {g.badge}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E4E6E2] grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#737773] uppercase block">Trust Score</span>
                    <span className="font-bold text-[#315C4C]">{g.trustScore}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#737773] uppercase block">Validations</span>
                    <span className="font-bold text-[#171918]">{g.validations}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: CITIZEN RESOLUTION AUDITS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#315C4C] uppercase font-semibold">
                <CheckCircle2 size={14} />
                <span>Stage 06 Quality Assurance</span>
              </div>
              <h2 className="text-lg font-bold text-[#171918]">
                Recent Municipal Repairs Awaiting Citizen Sign-off
              </h2>
            </div>
            <span className="text-xs font-mono text-[#737773]">
              COMMUNITY OVERSIGHT
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Audit Card 1 */}
            <div className="p-5 rounded-xl bg-white border border-[#E4E6E2] shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E4E6E2]">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#315C4C]">
                  <span>#HYD-JH-2026-015</span>
                  <span className="text-[#E4E6E2]">|</span>
                  <span className="text-[#737773]">Damaged footpaths</span>
                </div>
                <Badge status="Resolved" size="sm" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#171918]">
                  Pedestrian paver stones relaying & chamber closure
                </h4>
                <p className="text-xs text-[#737773] mt-1">
                  Near Jubilee Hills Checkpost. GHMC completed concrete overlay on Nov 18.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#171918] block">Did the repair hold up?</span>
                  <span className="text-[11px] text-[#737773]">18 neighbors voted satisfactory • 0 disputes</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleVoteRepair('rep-1', 'verified')}
                    className={`px-3 py-1.5 rounded text-xs font-medium border flex items-center gap-1 transition-all ${
                      votedRepairs['rep-1'] === 'verified'
                        ? 'bg-[#315C4C] text-white border-[#315C4C]'
                        : 'bg-white border-[#E4E6E2] text-[#171918] hover:bg-[#F5F5F2]'
                    }`}
                  >
                    <Check size={12} />
                    <span>Satisfactory</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVoteRepair('rep-1', 'disputed')}
                    className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-all ${
                      votedRepairs['rep-1'] === 'disputed'
                        ? 'bg-[#B8463B] text-white border-[#B8463B]'
                        : 'bg-white border-[#E4E6E2] text-[#737773] hover:text-[#B8463B]'
                    }`}
                  >
                    <span>Dispute</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Audit Card 2 */}
            <div className="p-5 rounded-xl bg-white border border-[#E4E6E2] shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E4E6E2]">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#315C4C]">
                  <span>#HYD-BH-2026-092</span>
                  <span className="text-[#E4E6E2]">|</span>
                  <span className="text-[#737773]">Water leakage</span>
                </div>
                <Badge status="Resolved" size="sm" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#171918]">
                  HMWSSB pipeline joint seal on Road No. 12
                </h4>
                <p className="text-xs text-[#737773] mt-1">
                  Pressure pipeline joint clamped and bituminous road re-surfacing applied.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#171918] block">Did the repair hold up?</span>
                  <span className="text-[11px] text-[#737773]">31 neighbors voted satisfactory</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleVoteRepair('rep-2', 'verified')}
                    className={`px-3 py-1.5 rounded text-xs font-medium border flex items-center gap-1 transition-all ${
                      votedRepairs['rep-2'] === 'verified'
                        ? 'bg-[#315C4C] text-white border-[#315C4C]'
                        : 'bg-white border-[#E4E6E2] text-[#171918] hover:bg-[#F5F5F2]'
                    }`}
                  >
                    <Check size={12} />
                    <span>Satisfactory</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVoteRepair('rep-2', 'disputed')}
                    className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-all ${
                      votedRepairs['rep-2'] === 'disputed'
                        ? 'bg-[#B8463B] text-white border-[#B8463B]'
                        : 'bg-white border-[#E4E6E2] text-[#737773] hover:text-[#B8463B]'
                    }`}
                  >
                    <span>Dispute</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: VOLUNTEER DRIVES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#315C4C] uppercase font-semibold">
                <Calendar size={14} />
                <span>On-Site Community Action</span>
              </div>
              <h2 className="text-lg font-bold text-[#171918]">
                Upcoming Volunteer Civic Drives
              </h2>
            </div>
            <span className="text-xs font-mono text-[#737773]">
              NEIGHBORHOOD COLLABORATION
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CIVIC_DRIVES.map((drive) => {
              const isRsvped = rsvpedDrives.includes(drive.id);
              return (
                <div
                  key={drive.id}
                  className="p-5 rounded-xl bg-white border border-[#E4E6E2] shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#DDE7DF]/60 text-[#315C4C] font-semibold">
                        {drive.ward}
                      </span>
                      <span className="text-xs font-mono text-[#737773]">
                        {drive.rsvps + (isRsvped ? 1 : 0)} attending
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#171918] leading-snug">
                      {drive.title}
                    </h4>

                    <p className="text-xs text-[#737773] mt-2 leading-relaxed">
                      {drive.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E4E6E2] flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[#171918]">{drive.date} • {drive.time}</div>
                      <div className="text-[11px] text-[#737773] truncate max-w-[220px]">{drive.location}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleRsvp(drive.id)}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isRsvped
                          ? 'bg-[#315C4C] text-white shadow-xs'
                          : 'bg-[#F5F5F2] hover:bg-[#E4E6E2] text-[#171918]'
                      }`}
                    >
                      {isRsvped ? <Check size={13} /> : null}
                      <span>{isRsvped ? 'Attending' : 'RSVP'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
