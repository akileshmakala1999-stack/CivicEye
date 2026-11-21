import React from 'react';
import { NearbyCommunityIssue, DashboardReport } from '../../types';
import { Badge } from '../common/Badge';
import { Bookmark, MapPin, Clock, Eye, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';

interface FollowedIssuesSectionProps {
  followedIssues: (NearbyCommunityIssue | DashboardReport)[];
  onViewDetails: (issue: NearbyCommunityIssue | DashboardReport) => void;
  onUnfollow: (issueId: string) => void;
  onExploreNearby: () => void;
}

export const FollowedIssuesSection: React.FC<FollowedIssuesSectionProps> = ({
  followedIssues,
  onViewDetails,
  onUnfollow,
  onExploreNearby,
}) => {
  return (
    <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E4E6E2]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#315C4C]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#315C4C] font-semibold">
              Citizen Watchlist
            </span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-[#171918]">
            Followed Issues
          </h3>
          <p className="text-xs text-[#737773]">
            Track progress of neighborhood hazards you've subscribed to without submitting duplicates.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded bg-[#DDE7DF]/50 border border-[#315C4C]/20 text-[11px] font-mono text-[#315C4C] font-semibold">
          {followedIssues.length} monitored
        </span>
      </div>

      {/* List or Empty State */}
      {followedIssues.length === 0 ? (
        <div className="p-8 sm:p-10 rounded-lg bg-[#F5F5F2]/60 border border-dashed border-[#E4E6E2] text-center">
          <Bookmark size={26} className="mx-auto text-[#737773] mb-3 opacity-60" />
          <h4 className="text-sm font-semibold text-[#171918] mb-1">
            You are not following any neighborhood issues yet.
          </h4>
          <p className="text-xs text-[#737773] max-w-sm mx-auto mb-4">
            Follow nearby issues to track updates without creating duplicate reports.
          </p>
          <button
            type="button"
            onClick={onExploreNearby}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#315C4C] hover:bg-[#26483B] text-white text-xs font-medium transition-colors"
          >
            <span>Explore Nearby Issues</span>
            <ArrowRight size={13} />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {followedIssues.map((issue) => {
            const locationText =
              'approximateLocation' in issue
                ? issue.approximateLocation
                : issue.location;
            const timeText =
              'reportedTime' in issue
                ? issue.reportedTime
                : issue.reportDate;

            return (
              <div
                key={issue.id}
                className="p-4 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2]/40 hover:bg-white hover:border-[#315C4C]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left side details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono uppercase text-[#737773]">
                      {issue.category}
                    </span>
                    <span className="text-[#E4E6E2]">|</span>
                    <Badge severity={issue.severity} dot size="sm" />
                    <Badge status={issue.status} size="sm" />
                  </div>

                  <h4 className="text-sm font-semibold text-[#171918] leading-snug line-clamp-1 mb-1.5">
                    {issue.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#737773]">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-[#315C4C] flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{locationText}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock size={11} />
                      <span>Updated: {timeText}</span>
                    </span>
                  </div>
                </div>

                {/* Right side actions: View Details & Unfollow */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E4E6E2] flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onViewDetails(issue)}
                    className="px-3 py-1.5 rounded-md bg-white border border-[#E4E6E2] hover:bg-[#F5F5F2] hover:border-[#737773] text-xs font-medium text-[#171918] flex items-center gap-1.5 transition-colors"
                  >
                    <Eye size={13} className="text-[#315C4C]" />
                    <span>View Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUnfollow(issue.id)}
                    title="Remove from watchlist"
                    className="px-2.5 py-1.5 rounded-md bg-white border border-[#E4E6E2] hover:bg-[#FAF0EF] hover:border-[#B8463B]/40 text-xs font-medium text-[#737773] hover:text-[#B8463B] flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={13} />
                    <span className="hidden sm:inline">Unfollow</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Persistence Note */}
      <div className="mt-4 pt-3 border-t border-[#E4E6E2] flex items-center justify-between text-[10px] font-mono text-[#737773]">
        <span className="flex items-center gap-1">
          <ShieldCheck size={12} className="text-[#315C4C]" />
          <span>SAVED TO LOCAL WATCHLIST PERSISTENCE</span>
        </span>
        <span>HYDERABAD PILOT</span>
      </div>
    </div>
  );
};
