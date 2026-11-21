import React from 'react';
import { CommunityActivityItem, HyderabadNeighborhood } from '../../types';
import { Clock, GitCommit, CheckCheck, PlusCircle, ThumbsUp, Camera } from 'lucide-react';

interface CommunityActivityFeedProps {
  currentArea: HyderabadNeighborhood;
  activities: CommunityActivityItem[];
}

export const CommunityActivityFeed: React.FC<CommunityActivityFeedProps> = ({
  currentArea,
  activities,
}) => {
  const filteredActivities = activities.filter(
    (item) => item.neighborhood === currentArea
  );
  const displayActivities =
    filteredActivities.length > 0 ? filteredActivities : activities;
  const getIcon = (type: CommunityActivityItem['activityType']) => {
    switch (type) {
      case 'status_change':
        return <GitCommit size={14} className="text-[#171918]" />;
      case 'confirmation':
        return <ThumbsUp size={14} className="text-[#C58B36]" />;
      case 'resolved':
        return <CheckCheck size={14} className="text-[#315C4C]" />;
      case 'new_report':
        return <PlusCircle size={14} className="text-[#315C4C]" />;
      case 'evidence':
        return <Camera size={14} className="text-[#737773]" />;
      default:
        return <Clock size={14} className="text-[#737773]" />;
    }
  };

  const getTypeLabel = (type: CommunityActivityItem['activityType']) => {
    switch (type) {
      case 'status_change':
        return 'Status Dispatch';
      case 'confirmation':
        return 'Citizen Validated';
      case 'resolved':
        return 'Resolved';
      case 'new_report':
        return 'New Report';
      case 'evidence':
        return 'Field Evidence';
      default:
        return 'Activity';
    }
  };

  return (
    <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E4E6E2]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#315C4C]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#315C4C] font-semibold">
              Live Feed
            </span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-[#171918]">
            Community Activity
          </h3>
          <p className="text-xs text-[#737773]">
            Recent actions and status updates across Hyderabad sectors.
          </p>
        </div>

        <span className="text-[11px] font-mono text-[#737773] hidden sm:inline">
          CHRONOLOGICAL LOG
        </span>
      </div>

      {/* Activity Timeline List */}
      <div className="divide-y divide-[#E4E6E2]">
        {displayActivities.map((item) => (
          <div
            key={item.id}
            className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-3 hover:bg-[#F5F5F2]/40 transition-colors rounded px-2 -mx-2"
          >
            <div className="p-1.5 rounded bg-[#F5F5F2] border border-[#E4E6E2] flex-shrink-0 mt-0.5">
              {getIcon(item.activityType)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#DDE7DF]/60 text-[#315C4C] font-semibold">
                  {getTypeLabel(item.activityType)}
                </span>
                <span className="text-[10px] font-mono text-[#737773] whitespace-nowrap">
                  {item.time}
                </span>
              </div>

              <p className="text-xs text-[#171918] font-medium leading-snug mb-1">
                {item.description}
              </p>

              <div className="flex items-center gap-2 text-[11px] text-[#737773]">
                <span className="truncate text-[#737773]">
                  Re: <span className="text-[#171918]">{item.relatedIssue}</span>
                </span>
                <span className="text-[#E4E6E2]">|</span>
                <span className="font-mono text-[10px] text-[#737773] flex-shrink-0">
                  {item.neighborhood}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-[#E4E6E2] flex items-center justify-between text-[10px] font-mono text-[#737773]">
        <span>ALL COMMUNITY ACTIVITY VERIFIED</span>
        <span>HYDERABAD PILOT</span>
      </div>
    </div>
  );
};
