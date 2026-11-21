import React, { useState } from 'react';
import { Logo } from '../common/Logo';
import {
  FileText,
  Search,
  SlidersHorizontal,
  MapPin,
  Check,
  Flame,
  Bell,
  ChevronDown,
  ChevronRight,
  X,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export type SidebarNavItem =
  | 'my-reports'
  | 'search'
  | 'filters'
  | 'nearby-issues'
  | 'still-exists'
  | 'getting-worse'
  | 'notifications';

interface DashboardSidebarProps {
  activeItem: SidebarNavItem;
  onNavigate: (item: SidebarNavItem) => void;
  unreadNotificationsCount: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeItem,
  onNavigate,
  unreadNotificationsCount,
  mobileOpen,
  onMobileClose,
}) => {
  const [nearbySubmenuOpen, setNearbySubmenuOpen] = useState(true);

  const handleItemClick = (item: SidebarNavItem) => {
    if (item === 'nearby-issues') {
      setNearbySubmenuOpen((prev) => !prev);
    }
    onNavigate(item);
    if (window.innerWidth < 1024) {
      onMobileClose();
    }
  };

  const isNearbyActive =
    activeItem === 'nearby-issues' ||
    activeItem === 'still-exists' ||
    activeItem === 'getting-worse';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#F5F5F2] border-r border-[#E4E6E2] select-none">
      {/* 1. Brand / Logo Area */}
      <div className="p-5 border-b border-[#E4E6E2] flex items-center justify-between">
        <div>
          <Logo size="md" />
          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#315C4C]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#315C4C]" />
            <span>Citizen Workspace</span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-md text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* 2. Navigation Items (ONLY the 5 requested items in exact order) */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {/* Item 1: My Reports */}
        <button
          type="button"
          onClick={() => handleItemClick('my-reports')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
            activeItem === 'my-reports'
              ? 'bg-[#DDE7DF] text-[#315C4C] font-semibold shadow-xs'
              : 'text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]/50'
          }`}
        >
          <FileText size={17} className={activeItem === 'my-reports' ? 'text-[#315C4C]' : 'text-[#737773]'} />
          <span className="flex-1">My Reports</span>
        </button>

        {/* Item 2: Search */}
        <button
          type="button"
          onClick={() => handleItemClick('search')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
            activeItem === 'search'
              ? 'bg-[#DDE7DF] text-[#315C4C] font-semibold shadow-xs'
              : 'text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]/50'
          }`}
        >
          <Search size={17} className={activeItem === 'search' ? 'text-[#315C4C]' : 'text-[#737773]'} />
          <span className="flex-1">Search</span>
        </button>

        {/* Item 3: Filters */}
        <button
          type="button"
          onClick={() => handleItemClick('filters')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
            activeItem === 'filters'
              ? 'bg-[#DDE7DF] text-[#315C4C] font-semibold shadow-xs'
              : 'text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]/50'
          }`}
        >
          <SlidersHorizontal size={17} className={activeItem === 'filters' ? 'text-[#315C4C]' : 'text-[#737773]'} />
          <span className="flex-1">Filters</span>
        </button>

        {/* Item 4: Nearby Issues (with expandable submenu) */}
        <div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleItemClick('nearby-issues')}
              className={`flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                isNearbyActive
                  ? 'bg-[#DDE7DF]/60 text-[#315C4C] font-semibold'
                  : 'text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]/50'
              }`}
            >
              <MapPin size={17} className={isNearbyActive ? 'text-[#315C4C]' : 'text-[#737773]'} />
              <span>Nearby Issues</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setNearbySubmenuOpen(!nearbySubmenuOpen);
              }}
              aria-label={nearbySubmenuOpen ? 'Collapse Nearby Submenu' : 'Expand Nearby Submenu'}
              className="p-2 rounded-lg hover:bg-[#E4E6E2]/60 text-[#737773] transition-colors"
            >
              {nearbySubmenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>

          {/* Submenu: Still Exists & Getting Worse */}
          {nearbySubmenuOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-[#E4E6E2] space-y-1">
              {/* Sub-item: Still Exists */}
              <button
                type="button"
                onClick={() => handleItemClick('still-exists')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-all text-left ${
                  activeItem === 'still-exists'
                    ? 'bg-[#315C4C] text-white font-semibold shadow-xs'
                    : 'text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]/60'
                }`}
              >
                <Check size={14} className={activeItem === 'still-exists' ? 'text-white' : 'text-[#315C4C]'} />
                <span>Still Exists</span>
              </button>

              {/* Sub-item: Getting Worse */}
              <button
                type="button"
                onClick={() => handleItemClick('getting-worse')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-all text-left ${
                  activeItem === 'getting-worse'
                    ? 'bg-[#B8463B] text-white font-semibold shadow-xs'
                    : 'text-[#737773] hover:text-[#B8463B] hover:bg-[#FAF0EF]'
                }`}
              >
                <Flame size={14} className={activeItem === 'getting-worse' ? 'text-white' : 'text-[#B8463B]'} />
                <span>Getting Worse</span>
              </button>
            </div>
          )}
        </div>

        {/* Item 5: Notifications */}
        <button
          type="button"
          onClick={() => handleItemClick('notifications')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
            activeItem === 'notifications'
              ? 'bg-[#DDE7DF] text-[#315C4C] font-semibold shadow-xs'
              : 'text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Bell size={17} className={activeItem === 'notifications' ? 'text-[#315C4C]' : 'text-[#737773]'} />
            <span>Notifications</span>
          </div>
          {unreadNotificationsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#315C4C] text-white">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
      </nav>

      {/* 3. Sidebar Footer */}
      <div className="p-3.5 border-t border-[#E4E6E2] text-xs space-y-2">
        <Link
          to="/digital-twin"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[#315C4C] font-semibold hover:bg-[#DDE7DF]/50 transition-colors"
        >
          <Layers size={14} className="text-[#315C4C]" />
          <span>City Digital Twin</span>
        </Link>
        <Link
          to="/"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]/60 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Exit to Overview</span>
        </Link>
        <div className="px-2.5 text-[10px] font-mono text-[#737773]/80">
          HYDERABAD CIVIC PILOT
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 flex-shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#181C1A]/50 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

