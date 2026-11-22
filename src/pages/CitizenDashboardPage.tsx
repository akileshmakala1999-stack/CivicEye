import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HyderabadNeighborhood,
  DashboardReport,
  NearbyCommunityIssue,
  DashboardNotification,
  CommunityActivityItem,
  IssueCategory,
} from '../types';
import {
  INITIAL_USER_REPORTS,
  INITIAL_NEARBY_ISSUES,
  INITIAL_COMMUNITY_ACTIVITIES,
  INITIAL_NOTIFICATIONS,
} from '../data/dashboardMockData';
import { DashboardSidebar, SidebarNavItem } from '../components/dashboard/DashboardSidebar';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { CivicOverview } from '../components/dashboard/CivicOverview';
import { MyReportsSection } from '../components/dashboard/MyReportsSection';
import { NearbyIssuesSection } from '../components/dashboard/NearbyIssuesSection';
import { FollowedIssuesSection } from '../components/dashboard/FollowedIssuesSection';
import { CommunityActivityFeed } from '../components/dashboard/CommunityActivityFeed';
import { QuickActions } from '../components/dashboard/QuickActions';
import { ReportDetailModal } from '../components/dashboard/ReportDetailModal';
import { PriorityExplanationModal } from '../components/dashboard/PriorityExplanationModal';
import { reportService } from '../services/reportService';
import { communityValidationService } from '../services/communityValidationService';

function getDepartmentForCategory(category: IssueCategory): string {
  switch (category) {
    case 'Road damage':
      return 'GHMC Engineering (Roads & Pavements)';
    case 'Water leakage':
      return 'HMWSSB (Water Supply & Sewerage Board)';
    case 'Garbage':
      return 'GHMC Solid Waste Management (Sanitation)';
    case 'Streetlights':
      return 'GHMC Electrical & Public Lighting Wing';
    case 'Damaged footpaths':
      return 'GHMC Town Planning & Pedestrian Pathways';
    case 'Drainage':
      return 'GHMC Stormwater Drain & Flood Control';
    default:
      return 'GHMC Municipal Engineering Services';
  }
}

export const CitizenDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Navigation refs
  const reportsSectionRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const nearbyIssuesRef = useRef<HTMLDivElement>(null);

  // Core state
  const [activeNav, setActiveNav] = useState<SidebarNavItem>('my-reports');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [highlightTarget, setHighlightTarget] = useState<'search' | 'filters' | null>(null);
  const [nearbyActionFeedback, setNearbyActionFeedback] = useState<string | null>(null);

  const [currentArea, setCurrentArea] = useState<HyderabadNeighborhood>('Jubilee Hills');
  const [userReports, setUserReports] = useState<DashboardReport[]>(INITIAL_USER_REPORTS);

  useEffect(() => {
    let isMounted = true;
    const loadReports = async () => {
      const reports = await reportService.getAllReports();
      if (isMounted) {
        setUserReports(reports);
      }
    };
    loadReports();

    const handleUpdate = () => {
      loadReports();
    };
    window.addEventListener('civiceye_reports_updated', handleUpdate);
    window.addEventListener('civiceye_community_updated', handleUpdate);
    window.addEventListener('civiceye_operations_updated', handleUpdate);

    // Listen for new follower notifications dispatched by community validation service
    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent<DashboardNotification>;
      if (customEvent.detail) {
        setNotifications((prev) => [customEvent.detail, ...prev]);
      }
    };
    window.addEventListener('civiceye_new_notification', handleNewNotification);

    const handleWatchlistUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      if (customEvent.detail) {
        setFollowedIssueIds(customEvent.detail);
      } else {
        setFollowedIssueIds(reportService.getFollowedIssueIds());
      }
    };
    window.addEventListener('civiceye_watchlist_updated', handleWatchlistUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('civiceye_reports_updated', handleUpdate);
      window.removeEventListener('civiceye_community_updated', handleUpdate);
      window.removeEventListener('civiceye_operations_updated', handleUpdate);
      window.removeEventListener('civiceye_new_notification', handleNewNotification);
      window.removeEventListener('civiceye_watchlist_updated', handleWatchlistUpdate);
    };
  }, []);
  const [nearbyIssues, setNearbyIssues] = useState<NearbyCommunityIssue[]>(INITIAL_NEARBY_ISSUES);
  const [activities] = useState<CommunityActivityItem[]>(INITIAL_COMMUNITY_ACTIVITIES);
  const [notifications, setNotifications] = useState<DashboardNotification[]>(INITIAL_NOTIFICATIONS);
  const [selectedReport, setSelectedReport] = useState<DashboardReport | null>(null);
  const [communityImpactCount, setCommunityImpactCount] = useState<number>(48);

  // Feature 1: Watchlist / Followed Issues with unified reportService persistence
  const [followedIssueIds, setFollowedIssueIds] = useState<string[]>(() => {
    return reportService.getFollowedIssueIds();
  });

  const handleToggleFollow = (issueId: string) => {
    reportService.toggleFollowReport(issueId);
    setFollowedIssueIds(reportService.getFollowedIssueIds());
  };

  // Feature 2: Priority Explanation Modal State
  const [explainingIssue, setExplainingIssue] = useState<NearbyCommunityIssue | DashboardReport | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Handle area change
  const handleAreaChange = (area: HyderabadNeighborhood) => {
    setCurrentArea(area);
  };

  // Handle community action (Still exists / Getting worse) with toggle and counter sync
  const handleCommunityAction = (
    issueId: string,
    action: 'still_exists' | 'getting_worse'
  ) => {
    // Record in central community validation service
    communityValidationService.submitValidationAction({
      reportId: issueId,
      action,
      userId: 'usr-aditya',
      userName: 'Aditya (Citizen Guardian)',
      userRole: 'citizen',
    });

    setNearbyIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== issueId) return issue;

        const currentAction = issue.actionTaken;

        if (currentAction === action) {
          // Toggle off
          setCommunityImpactCount((c) => Math.max(0, c - 1));
          return {
            ...issue,
            actionTaken: null,
            confirmationsCount: Math.max(0, issue.confirmationsCount - 1),
          };
        } else if (currentAction) {
          // Switching from one action to the other
          return {
            ...issue,
            actionTaken: action,
          };
        } else {
          // New action
          setCommunityImpactCount((c) => c + 1);
          return {
            ...issue,
            actionTaken: action,
            confirmationsCount: issue.confirmationsCount + 1,
          };
        }
      })
    );
  };

  // Normalize issue or report for the detail modal
  const handleViewDetail = (item: NearbyCommunityIssue | DashboardReport) => {
    if ('ticketNumber' in item) {
      setSelectedReport(item as DashboardReport);
    } else {
      const nearby = item as NearbyCommunityIssue;
      const normalized: DashboardReport = {
        id: nearby.id,
        ticketNumber: `HYD-${nearby.id.toUpperCase()}`,
        title: nearby.title,
        category: nearby.category,
        reportDate: 'Today',
        reportTimestamp: nearby.reportedTime,
        location: nearby.approximateLocation,
        neighborhood: nearby.neighborhood,
        severity: nearby.severity,
        status: nearby.status,
        confirmationsCount: nearby.confirmationsCount,
        description: nearby.description,
        departmentAssigned: getDepartmentForCategory(nearby.category),
        handlingOfficer: 'Field Operations Assigned',
        evidenceNote: 'Geotagged community incident photo',
        timeline: [],
      };
      setSelectedReport(normalized);
    }
  };

  // Sidebar navigation handler
  const handleSidebarNavigate = (item: SidebarNavItem) => {
    setActiveNav(item);

    switch (item) {
      case 'my-reports':
        reportsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;

      case 'search':
        setHighlightTarget('search');
        if (searchInputRef.current) {
          searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 300);
        }
        setTimeout(() => setHighlightTarget(null), 3000);
        break;

      case 'filters':
        setHighlightTarget('filters');
        filtersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => setHighlightTarget(null), 3000);
        break;

      case 'nearby-issues':
        nearbyIssuesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;

      case 'still-exists': {
        nearbyIssuesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const areaIssues = nearbyIssues.filter((i) => i.neighborhood === currentArea);
        if (areaIssues.length > 0) {
          const targetIssue = areaIssues[0];
          handleCommunityAction(targetIssue.id, 'still_exists');
          setNearbyActionFeedback(`✓ Still exists recorded for "${targetIssue.title}"`);
          setTimeout(() => setNearbyActionFeedback(null), 4000);
        }
        break;
      }

      case 'getting-worse': {
        nearbyIssuesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const areaIssues = nearbyIssues.filter((i) => i.neighborhood === currentArea);
        if (areaIssues.length > 0) {
          const targetIssue = areaIssues[0];
          handleCommunityAction(targetIssue.id, 'getting_worse');
          setNearbyActionFeedback(`⚠ Getting worse flagged for "${targetIssue.title}"`);
          setTimeout(() => setNearbyActionFeedback(null), 4000);
        }
        break;
      }

      case 'notifications':
        setNotificationOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
    }
  };

  // Notifications management
  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSelectNotificationReport = (reportId: string) => {
    const report = userReports.find((r) => r.id === reportId);
    if (report) {
      setSelectedReport(report);
    }
  };

  const handleViewAllReports = () => {
    setActiveNav('my-reports');
    reportsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleScrollToNearby = () => {
    setActiveNav('nearby-issues');
    nearbyIssuesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Compile list of followed issues across nearby and user reports
  const allAvailableIssues: (NearbyCommunityIssue | DashboardReport)[] = [
    ...nearbyIssues,
    ...userReports,
  ];
  const followedIssuesList = allAvailableIssues.filter((issue) =>
    followedIssueIds.includes(issue.id)
  );

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-[#171918] flex">
      {/* 1. Persistent Fixed Left Sidebar Navigation */}
      <DashboardSidebar
        activeItem={activeNav}
        onNavigate={handleSidebarNavigate}
        unreadNotificationsCount={unreadCount}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main Dashboard Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Dashboard Top Header */}
        <DashboardHeader
          currentArea={currentArea}
          onAreaChange={handleAreaChange}
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onSelectNotificationReport={handleSelectNotificationReport}
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
          notificationOpen={notificationOpen}
          onToggleNotificationOpen={() => setNotificationOpen(!notificationOpen)}
        />

        {/* Civic Overview Statistics */}
        <CivicOverview
          reports={userReports}
          communityImpactCount={communityImpactCount}
        />

        {/* Main Content Workspace */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Primary Column (Left 8 Cols on Desktop): Quick Actions, My Reports, Followed Issues */}
            <div className="lg:col-span-8 space-y-8">
              {/* Quick Actions */}
              <QuickActions onViewAllReports={handleViewAllReports} />

              {/* My Reports */}
              <div ref={reportsSectionRef}>
                <MyReportsSection
                  reports={userReports}
                  onSelectReport={(report) => setSelectedReport(report)}
                  onNewReportClick={() => navigate('/report')}
                  searchInputRef={searchInputRef}
                  filtersRef={filtersRef}
                  highlightTarget={highlightTarget}
                />
              </div>

              {/* Feature 1: Followed Issues Watchlist Section */}
              <FollowedIssuesSection
                followedIssues={followedIssuesList}
                onViewDetails={handleViewDetail}
                onUnfollow={handleToggleFollow}
                onExploreNearby={handleScrollToNearby}
              />
            </div>

            {/* Secondary Column (Right 4 Cols on Desktop): Nearby Issues & Live Community Activity */}
            <div className="lg:col-span-4 space-y-8">
              {/* Nearby Community Issues */}
              <NearbyIssuesSection
                sectionRef={nearbyIssuesRef}
                currentArea={currentArea}
                issues={nearbyIssues}
                onCommunityAction={handleCommunityAction}
                actionFeedback={nearbyActionFeedback}
                followedIssueIds={followedIssueIds}
                onToggleFollow={handleToggleFollow}
                onExplainPriority={(issue) => setExplainingIssue(issue)}
                onViewDetails={handleViewDetail}
              />

              {/* Live Community Activity Feed */}
              <CommunityActivityFeed
                currentArea={currentArea}
                activities={activities}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Feature 2: Priority Explanation Modal */}
      <PriorityExplanationModal
        isOpen={!!explainingIssue}
        onClose={() => setExplainingIssue(null)}
        issue={
          explainingIssue
            ? {
                title: explainingIssue.title,
                category: explainingIssue.category,
                severity: explainingIssue.severity,
                confirmationsCount: explainingIssue.confirmationsCount,
                location:
                  'approximateLocation' in explainingIssue
                    ? explainingIssue.approximateLocation
                    : explainingIssue.location,
                description: explainingIssue.description,
              }
            : null
        }
      />

      {/* Feature 3: Detail Modal with 7-Stage Timeline & Follow action */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        isFollowed={selectedReport ? followedIssueIds.includes(selectedReport.id) : false}
        onToggleFollow={handleToggleFollow}
      />
    </div>
  );
};
