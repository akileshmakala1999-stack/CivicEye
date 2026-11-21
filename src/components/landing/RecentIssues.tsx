import React, { useState } from 'react';
import { DEMO_RECENT_ISSUES } from '../../data/mockData';
import { IssueCategory, CivicIssue } from '../../types';
import { SectionHeader } from '../common/SectionHeader';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { MapPin, Clock, Users, ArrowUpRight, AlertCircle, Droplets, Trash2, Lightbulb, Building } from 'lucide-react';

export const RecentIssues: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories: (IssueCategory | 'All')[] = [
    'All',
    'Road damage',
    'Drainage',
    'Garbage',
    'Streetlights',
  ];

  const filteredIssues = selectedCategory === 'All'
    ? DEMO_RECENT_ISSUES
    : DEMO_RECENT_ISSUES.filter((issue) => issue.category === selectedCategory);

  const getCategoryIcon = (category: IssueCategory) => {
    switch (category) {
      case 'Road damage':
        return <AlertCircle size={15} className="text-[#B8463B]" />;
      case 'Drainage':
        return <Droplets size={15} className="text-[#315C4C]" />;
      case 'Garbage':
        return <Trash2 size={15} className="text-[#C58B36]" />;
      case 'Streetlights':
        return <Lightbulb size={15} className="text-[#737773]" />;
      default:
        return <AlertCircle size={15} />;
    }
  };

  return (
    <section className="bg-white py-20 sm:py-28 border-b border-[#E4E6E2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="Active Urban Feed"
          title="Recent civic issues across the district."
          description="Every reported hazard enters a verified public registry. Review live submissions, track progress, and validate fixes."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                to="/dashboard"
                variant="secondary"
                size="md"
                className="bg-[#DDE7DF] text-[#315C4C] hover:bg-[#c9d9cc] font-semibold"
              >
                My Civic Space
              </Button>
              <Button
                to="/explore"
                variant="outline"
                size="md"
                icon={<ArrowUpRight size={16} />}
              >
                View Incident Map
              </Button>
            </div>
          }
        />

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-tight whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#171918] text-white'
                  : 'bg-[#F5F5F2] text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Compact Issue Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue: CivicIssue) => (
            <div
              key={issue.id}
              className="bg-[#F5F5F2]/50 hover:bg-white border border-[#E4E6E2] hover:border-[#315C4C]/40 rounded-lg p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-sm"
            >
              <div>
                {/* Header row: category & severity */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#171918]">
                    {getCategoryIcon(issue.category)}
                    <span>{issue.category}</span>
                  </div>
                  <Badge severity={issue.severity} dot size="sm" />
                </div>

                {/* Title */}
                <h4 className="text-base font-semibold text-[#171918] mb-2 leading-snug line-clamp-2">
                  {issue.title}
                </h4>

                {/* Description */}
                <p className="text-xs text-[#737773] leading-relaxed line-clamp-2 mb-4">
                  {issue.description}
                </p>

                {/* Location */}
                <div className="flex items-start gap-1.5 text-xs text-[#737773] mb-3">
                  <MapPin size={13} className="text-[#315C4C] mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{issue.location}</span>
                </div>

                {/* Department if assigned */}
                {issue.departmentAssigned && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#737773] mb-3">
                    <Building size={12} className="text-[#737773]" />
                    <span className="truncate">{issue.departmentAssigned}</span>
                  </div>
                )}
              </div>

              {/* Card Footer: Status, Confirmations & Timestamp */}
              <div className="pt-3 border-t border-[#E4E6E2] flex items-center justify-between text-xs text-[#737773]">
                <Badge status={issue.status} size="sm" />

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                    <Users size={12} />
                    <span>{issue.confirmationsCount}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                    <Clock size={12} />
                    <span>{issue.reportedTime}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

