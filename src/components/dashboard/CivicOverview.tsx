import React from 'react';
import { DashboardReport } from '../../types';
import { FileText, Clock, CheckCircle2, HeartHandshake } from 'lucide-react';

interface CivicOverviewProps {
  reports: DashboardReport[];
  communityImpactCount: number;
}

export const CivicOverview: React.FC<CivicOverviewProps> = ({
  reports,
  communityImpactCount,
}) => {
  const totalReports = reports.length;
  const activeReports = reports.filter(
    (r) => r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'Assigned' || r.status === 'In Progress'
  ).length;
  const resolvedReports = reports.filter((r) => r.status === 'Resolved').length;

  const stats = [
    {
      id: 'my-reports',
      label: 'My Reports',
      value: totalReports,
      description: 'Submitted across municipal wards',
      icon: <FileText size={16} className="text-[#315C4C]" />,
      detail: 'Personal civic tickets',
    },
    {
      id: 'active-issues',
      label: 'Active Issues',
      value: activeReports,
      description: 'Under review, assigned or field-active',
      icon: <Clock size={16} className="text-[#C58B36]" />,
      detail: 'In department triage',
    },
    {
      id: 'resolved',
      label: 'Resolved',
      value: resolvedReports,
      description: 'Closed with verifiable site proof',
      icon: <CheckCircle2 size={16} className="text-[#315C4C]" />,
      detail: '100% resolution audited',
    },
    {
      id: 'community-impact',
      label: 'Community Impact',
      value: communityImpactCount,
      description: 'Validations & neighborhood verifications',
      icon: <HeartHandshake size={16} className="text-[#315C4C]" />,
      detail: 'Guardian trust level 3',
    },
  ];

  return (
    <div className="bg-white border-b border-[#E4E6E2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E6E2]">
          {stats.map((stat, idx) => (
            <div
              key={stat.id}
              className={`py-4 sm:py-2 ${
                idx === 0
                  ? 'sm:pr-6'
                  : idx === 3
                  ? 'sm:pl-6'
                  : 'sm:px-6'
              } ${idx % 2 !== 0 ? 'pl-4 sm:pl-6' : 'pr-4'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#737773]">
                  {stat.label}
                </span>
                <div className="p-1 rounded bg-[#F5F5F2] border border-[#E4E6E2]">
                  {stat.icon}
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#171918]">
                  {stat.value}
                </span>
                <span className="text-[11px] font-mono text-[#315C4C] font-medium hidden sm:inline">
                  {stat.detail}
                </span>
              </div>

              <p className="mt-1.5 text-xs text-[#737773] leading-relaxed line-clamp-1">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

