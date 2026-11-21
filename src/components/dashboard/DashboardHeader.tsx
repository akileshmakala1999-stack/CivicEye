import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HyderabadNeighborhood, DashboardNotification } from '../../types';
import { HYDERABAD_NEIGHBORHOODS } from '../../data/dashboardMockData';
import { NotificationDropdown } from './NotificationDropdown';
import { MapPin, Navigation, Bell, Shield, ChevronDown, AlertCircle, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DashboardHeaderProps {
  currentArea: HyderabadNeighborhood;
  onAreaChange: (area: HyderabadNeighborhood) => void;
  notifications: DashboardNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectNotificationReport?: (reportId: string) => void;
  onToggleMobileSidebar?: () => void;
  notificationOpen?: boolean;
  onToggleNotificationOpen?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentArea,
  onAreaChange,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotificationReport,
  onToggleMobileSidebar,
  notificationOpen: externalNotifOpen,
  onToggleNotificationOpen,
}) => {
  const [internalNotifOpen, setInternalNotifOpen] = useState(false);
  const notificationOpen = externalNotifOpen !== undefined ? externalNotifOpen : internalNotifOpen;
  const toggleNotification = onToggleNotificationOpen || (() => setInternalNotifOpen(!internalNotifOpen));

  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const notifContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Aditya';
  const displayRole = user?.user_metadata?.title || (role === 'authority' ? 'Municipal Officer' : 'Citizen Guardian');
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'CE';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target as Node)) {
        if (externalNotifOpen !== undefined && onToggleNotificationOpen && externalNotifOpen) {
          onToggleNotificationOpen();
        } else {
          setInternalNotifOpen(false);
        }
      }
    };
    if (notificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationOpen, externalNotifOpen, onToggleNotificationOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const currentAreaInfo = HYDERABAD_NEIGHBORHOODS.find((a) => a.id === currentArea) || HYDERABAD_NEIGHBORHOODS[0];

  const handleDetectLocation = () => {
    setDetectingLocation(true);
    setLocationNotice(null);

    if (!navigator.geolocation) {
      setDetectingLocation(false);
      setLocationNotice('GPS sensor unavailable on device. Maintaining selected area.');
      setTimeout(() => setLocationNotice(null), 4000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDetectingLocation(false);
        const { latitude } = position.coords;
        // Map rough coordinates to Hyderabad zones if nearby, otherwise keep active area
        if (latitude > 17.43) {
          onAreaChange('Madhapur');
          setLocationNotice('Approximate location resolved: Hitech Corridor (Madhapur)');
        } else {
          onAreaChange('Jubilee Hills');
          setLocationNotice('Approximate location resolved: Central West Zone (Jubilee Hills)');
        }
        setTimeout(() => setLocationNotice(null), 4000);
      },
      (error) => {
        setDetectingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationNotice('Location permission not granted. Maintaining selected neighborhood.');
        } else {
          setLocationNotice('Unable to acquire accurate fix. Defaulting to selected ward.');
        }
        setTimeout(() => setLocationNotice(null), 4000);
      },
      { timeout: 6000 }
    );
  };

  return (
    <div className="bg-white border-b border-[#E4E6E2]">
      {/* Top subtle bar: Demo banner & Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 border-b border-[#E4E6E2]/70 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#737773] gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#315C4C]" />
          <span className="text-[#315C4C] font-semibold">CIVICSPACE V2.4</span>
          <span>•</span>
          <span>{currentAreaInfo.ward}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#FAF5ED] border border-[#C58B36]/30 text-[#C58B36] font-medium">
            DEMO DATA — Simulated civic reports
          </span>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Title & Subtitle + Mobile Sidebar Toggle */}
          <div className="flex items-start gap-3">
            {onToggleMobileSidebar && (
              <button
                type="button"
                onClick={onToggleMobileSidebar}
                className="lg:hidden p-2 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-[#171918] hover:bg-[#E4E6E2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315C4C] mt-0.5"
                aria-label="Toggle Dashboard Navigation Sidebar"
              >
                <Menu size={18} />
              </button>
            )}
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#315C4C] uppercase tracking-wider mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#315C4C]" />
                Citizen Operations Center
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#171918]">
                My Civic Space
              </h1>
              <p className="mt-1 text-sm sm:text-base text-[#737773]">
                Your neighborhood. Your reports. Your impact.
              </p>
            </div>
          </div>

          {/* Controls: Area Selector, GPS Button, Notifications, Avatar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Area Selector Dropdown */}
            <div className="relative">
              <div className="flex items-center bg-[#F5F5F2] border border-[#E4E6E2] rounded-lg px-3 py-2 text-xs hover:border-[#737773] transition-colors focus-within:ring-2 focus-within:ring-[#315C4C]">
                <MapPin size={14} className="text-[#315C4C] mr-2 flex-shrink-0" />
                <div className="flex flex-col text-left mr-2">
                  <span className="text-[10px] font-mono text-[#737773] uppercase leading-none mb-0.5">
                    Active Sector
                  </span>
                  <select
                    value={currentArea}
                    onChange={(e) => onAreaChange(e.target.value as HyderabadNeighborhood)}
                    className="bg-transparent font-semibold text-[#171918] focus:outline-none cursor-pointer pr-4 text-xs sm:text-sm"
                  >
                    {HYDERABAD_NEIGHBORHOODS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <ChevronDown size={14} className="text-[#737773] pointer-events-none -ml-3" />
              </div>
            </div>

            {/* Location Detect Button */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              title="Detect neighborhood from browser location"
              className="p-2.5 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-[#171918] hover:bg-[#E4E6E2] transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315C4C]"
              aria-label="Detect my location"
            >
              <Navigation
                size={16}
                className={`text-[#315C4C] ${detectingLocation ? 'animate-spin' : ''}`}
              />
            </button>

            {/* Notification Button & Dropdown */}
            <div ref={notifContainerRef} className="relative">
              <button
                type="button"
                onClick={toggleNotification}
                className="relative p-2.5 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-[#171918] hover:bg-[#E4E6E2] transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315C4C]"
                aria-label="View notifications"
              >
                <Bell size={16} className="text-[#171918]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#315C4C] text-[10px] font-bold text-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              <NotificationDropdown
                notifications={notifications}
                isOpen={notificationOpen}
                onClose={() => {
                  if (externalNotifOpen !== undefined && onToggleNotificationOpen) {
                    onToggleNotificationOpen();
                  } else {
                    setInternalNotifOpen(false);
                  }
                }}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
                onSelectNotificationReport={onSelectNotificationReport}
              />
            </div>

            {/* User Profile Area */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-[#E4E6E2]">
              <div className="w-8 h-8 rounded-full bg-[#DDE7DF] border border-[#315C4C]/20 flex items-center justify-center font-semibold text-xs text-[#315C4C]">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-semibold text-[#171918] leading-tight truncate max-w-[120px]">
                  {displayName}
                </span>
                <span className="text-[10px] font-mono text-[#315C4C] flex items-center gap-1">
                  <Shield size={10} />
                  <span>{displayRole}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  navigate('/signin');
                }}
                className="p-1.5 rounded-lg text-[#737773] hover:text-[#B8463B] hover:bg-[#FCE8E6] transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Location Notice Callout if triggered */}
        {locationNotice && (
          <div className="mt-4 p-2.5 rounded-md bg-[#F5F5F2] border border-[#E4E6E2] text-xs text-[#737773] flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle size={14} className="text-[#315C4C] flex-shrink-0" />
            <span>{locationNotice}</span>
          </div>
        )}
      </div>
    </div>
  );
};
