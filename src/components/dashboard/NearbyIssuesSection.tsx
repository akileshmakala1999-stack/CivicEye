import React from 'react';
import { NearbyCommunityIssue, HyderabadNeighborhood } from '../../types';
import { Badge } from '../common/Badge';
import {
  MapPin,
  Users,
  Clock,
  Check,
  Flame,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  HelpCircle,
  Eye,
} from 'lucide-react';

interface NearbyIssuesSectionProps {
  currentArea: HyderabadNeighborhood;
  issues: NearbyCommunityIssue[];
  onCommunityAction: (
    issueId: string,
    action: 'still_exists' | 'getting_worse'
  ) => void;
  sectionRef?: React.RefObject<HTMLDivElement>;
  actionFeedback?: string | null;
  followedIssueIds?: string[];
  onToggleFollow?: (issueId: string) => void;
  onExplainPriority?: (issue: NearbyCommunityIssue) => void;
  onViewDetails?: (issue: NearbyCommunityIssue) => void;
}

export const NearbyIssuesSection: React.FC<NearbyIssuesSectionProps> = ({
  currentArea,
  issues,
  onCommunityAction,
  sectionRef,
  actionFeedback,
  followedIssueIds = [],
  onToggleFollow,
  onExplainPriority,
  onViewDetails,
}) => {
  const areaIssues = issues.filter((i) => i.neighborhood === currentArea);

  return (
    <div
      ref={sectionRef}
      className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E4E6E2]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#315C4C]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#315C4C] font-semibold">
              Ward Watch
            </span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-[#171918]">
            Nearby Issues
          </h3>
          <p className="text-xs text-[#737773]">
            Active community hazards within {currentArea}.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded bg-[#DDE7DF]/50 border border-[#315C4C]/20 text-[11px] font-mono text-[#315C4C] font-semibold">
          {areaIssues.length} active in ward
        </span>
      </div>

      {/* Action feedback notification from sidebar interaction */}
      {actionFeedback && (
        <div className="mb-4 p-2.5 rounded-lg bg-[#DDE7DF] border border-[#315C4C]/30 text-xs font-medium text-[#315C4C] flex items-center justify-between animate-in fade-in duration-150">
          <span>{actionFeedback}</span>
          <span className="text-[10px] font-mono uppercase text-[#315C4C]/70">Verified</span>
        </div>
      )}

      {/* Issues List */}
      <div className="space-y-4">
        {areaIssues.length === 0 ? (
          <div className="p-8 rounded-lg bg-[#F5F5F2] border border-dashed border-[#E4E6E2] text-center">
            <Sparkles size={24} className="mx-auto text-[#315C4C] mb-2 opacity-70" />
            <h4 className="text-xs font-semibold text-[#171918] mb-1">
              No open reports in {currentArea}
            </h4>
            <p className="text-xs text-[#737773]">
              Your neighborhood currently has zero active unresolved hazards reported.
            </p>
          </div>
        ) : (
          areaIssues.map((issue) => {
            const isStillExists = issue.actionTaken === 'still_exists';
            const isGettingWorse = issue.actionTaken === 'getting_worse';
            const isFollowed = followedIssueIds.includes(issue.id);

            return (
              <div
                key={issue.id}
                className="p-4 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2]/40 hover:bg-white hover:border-[#315C4C]/40 transition-all duration-150"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#737773] block mb-0.5">
                      {issue.category}
                    </span>
                    <h4 className="text-sm font-semibold text-[#171918] leading-snug line-clamp-1">
                      {issue.title}
                    </h4>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge severity={issue.severity} dot size="sm" />
                    {onExplainPriority && (
                      <button
                        type="button"
                        onClick={() => onExplainPriority(issue)}
                        className="text-[10px] font-mono text-[#315C4C] hover:text-[#26483B] flex items-center gap-1 hover:underline focus:outline-none"
                        title="Explain why this issue received its priority"
                      >
                        <HelpCircle size={10} />
                        <span>Why this priority?</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Location & Time */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#737773] mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-[#315C4C] flex-shrink-0" />
                    <span className="truncate max-w-[200px]">{issue.approximateLocation}</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock size={11} />
                    <span>{issue.reportedTime}</span>
                  </span>
                </div>

                {/* Confirmations count & Current status */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E4E6E2] text-xs">
                  <Badge status={issue.status} size="sm" />
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#171918] font-medium">
                    <Users size={12} className="text-[#315C4C]" />
                    <span>{issue.confirmationsCount} confirmations</span>
                  </div>
                </div>

                {/* Action Feedback notice if active */}
                {issue.actionTaken && (
                  <div
                    className={`mb-2.5 px-2.5 py-1 rounded text-[11px] font-mono flex items-center justify-between animate-in fade-in duration-150 ${
                      isStillExists
                        ? 'bg-[#DDE7DF]/80 text-[#315C4C] border border-[#315C4C]/20'
                        : 'bg-[#FAF0EF] text-[#B8463B] border border-[#B8463B]/20'
                    }`}
                  >
                    <span>
                      {isStillExists
                        ? '✓ You validated: Still exists'
                        : '⚠ You reported: Escalating & getting worse'}
                    </span>
                    <span className="text-[10px] opacity-75">Click to toggle off</span>
                  </div>
                )}

                {/* Two Working Community Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {/* Action 1: Still exists */}
                  <button
                    type="button"
                    onClick={() => onCommunityAction(issue.id, 'still_exists')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                      isStillExists
                        ? 'bg-[#315C4C] text-white border-[#315C4C] shadow-sm'
                        : 'bg-white border-[#E4E6E2] text-[#171918] hover:bg-[#F5F5F2] hover:border-[#737773]'
                    }`}
                    aria-pressed={isStillExists}
                  >
                    <Check size={13} className={isStillExists ? 'text-white' : 'text-[#315C4C]'} />
                    <span>Still exists</span>
                  </button>

                  {/* Action 2: Getting worse */}
                  <button
                    type="button"
                    onClick={() => onCommunityAction(issue.id, 'getting_worse')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                      isGettingWorse
                        ? 'bg-[#B8463B] text-white border-[#B8463B] shadow-sm'
                        : 'bg-white border-[#E4E6E2] text-[#171918] hover:bg-[#FAF0EF] hover:border-[#B8463B]/40'
                    }`}
                    aria-pressed={isGettingWorse}
                  >
                    <Flame
                      size={13}
                      className={isGettingWorse ? 'text-white' : 'text-[#B8463B]'}
                    />
                    <span>Getting worse</span>
                  </button>
                </div>

                {/* Follow Issue & View Details Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E4E6E2]/70">
                  {/* Follow / Following Toggle Button */}
                  {onToggleFollow && (
                    <button
                      type="button"
                      onClick={() => onToggleFollow(issue.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                        isFollowed
                          ? 'bg-[#DDE7DF] text-[#315C4C] border-[#315C4C]/40 font-semibold shadow-xs'
                          : 'bg-white border-[#E4E6E2] text-[#171918] hover:bg-[#F5F5F2] hover:border-[#737773]'
                      }`}
                      aria-pressed={isFollowed}
                      title={isFollowed ? 'Unfollow this issue' : 'Follow to track updates without filing duplicate report'}
                    >
                      {isFollowed ? (
                        <>
                          <BookmarkCheck size={13} className="text-[#315C4C]" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <Bookmark size={13} className="text-[#737773]" />
                          <span>Follow Issue</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* View Details */}
                  {onViewDetails && (
                    <button
                      type="button"
                      onClick={() => onViewDetails(issue)}
                      className="px-3 py-1.5 rounded-md bg-white border border-[#E4E6E2] hover:bg-[#F5F5F2] hover:border-[#737773] text-xs font-medium text-[#171918] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye size={13} className="text-[#315C4C]" />
                      <span>View Details</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#E4E6E2] text-[10px] font-mono text-[#737773] text-center">
        COMMUNITY VALIDATION INCREASES MUNICIPAL DISPATCH PRIORITY
      </div>
    </div>
  );
};
