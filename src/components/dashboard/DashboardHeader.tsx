import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HyderabadNeighborhood, DashboardNotification } from '../../types';
import { HYDERABAD_NEIGHBORHOODS } from '../../data/dashboardMockData';
import { NotificationDropdown } from './NotificationDropdown';
import { MapPin, Navigation, Bell, Shield, ChevronDown, AlertCircle, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  INDIA_STATES,
  getAllIndianStates,
  getPlacesForState,
  reverseGeocodeLocation,
  IndiaPlace,
} from '../../config/indiaLocations';

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

  const allStates = getAllIndianStates();

  const [selectedState, setSelectedState] = useState<string>(() => {
    for (const st of INDIA_STATES) {
      if (
        st.places.some(
          (p) =>
            p.name.toLowerCase() === currentArea.toLowerCase() ||
            currentArea.toLowerCase().includes(p.name.toLowerCase())
        )
      ) {
        return st.name;
      }
    }
    return 'Telangana';
  });

  const [availablePlaces, setAvailablePlaces] = useState<IndiaPlace[]>(() => {
    return getPlacesForState(selectedState || 'Telangana');
  });

  // Sync available places when currentArea changes
  useEffect(() => {
    for (const st of INDIA_STATES) {
      if (
        st.places.some(
          (p) =>
            p.name.toLowerCase() === currentArea.toLowerCase() ||
            currentArea.toLowerCase().includes(p.name.toLowerCase())
        )
      ) {
        if (st.name !== selectedState) {
          setSelectedState(st.name);
          setAvailablePlaces(getPlacesForState(st.name));
        }
        break;
      }
    }
  }, [currentArea]);

  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    const places = getPlacesForState(stateName);
    setAvailablePlaces(places);
    if (places.length > 0) {
      onAreaChange(places[0].name as HyderabadNeighborhood);
      setLocationNotice(`Active State: ${stateName} • Showing ${places.length} sectors`);
      setTimeout(() => setLocationNotice(null), 3500);
    }
  };

  const handleAreaSelect = (value: string) => {
    if (value.startsWith('STATE_SWITCH:')) {
      const targetState = value.replace('STATE_SWITCH:', '');
      handleStateChange(targetState);
      return;
    }
    onAreaChange(value as HyderabadNeighborhood);
  };

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

  const currentAreaInfo = HYDERABAD_NEIGHBORHOODS.find((a) => a.id === currentArea);
  const wardDisplay = currentAreaInfo ? currentAreaInfo.ward : `${selectedState} • ${currentArea}`;

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
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const resolved = await reverseGeocodeLocation(latitude, longitude);
          setSelectedState(resolved.state);
          const places = getPlacesForState(resolved.state);
          setAvailablePlaces(places);

          const match = places.find(
            (p) =>
              p.name.toLowerCase() === resolved.locality.toLowerCase() ||
              resolved.locality.toLowerCase().includes(p.name.toLowerCase()) ||
              p.name.toLowerCase().includes(resolved.city.toLowerCase())
          );

          const chosenPlace = match ? match.name : (places[0]?.name || resolved.locality);
          onAreaChange(chosenPlace as HyderabadNeighborhood);
          setLocationNotice(`📍 Detected GPS: ${chosenPlace}, ${resolved.state} (${resolved.city})`);
        } catch (_err) {
          setLocationNotice('Unable to acquire accurate GPS fix. Defaulting to selected ward.');
        } finally {
          setDetectingLocation(false);
          setTimeout(() => setLocationNotice(null), 4500);
        }
      },
      (error) => {
        setDetectingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationNotice('Location permission not granted. Maintaining selected sector.');
        } else {
          setLocationNotice('Unable to acquire accurate fix. Maintaining selected sector.');
        }
        setTimeout(() => setLocationNotice(null), 4000);
      },
      { timeout: 8000, enableHighAccuracy: true }
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
          <span>{wardDisplay}</span>
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

          {/* Controls: State Selector, Sector Selector, GPS Button, Notifications, Avatar */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* State / UT Selector */}
            <div className="relative">
              <div className="flex items-center bg-[#F5F5F2] border border-[#E4E6E2] rounded-lg px-3 py-2 text-xs hover:border-[#737773] transition-colors focus-within:ring-2 focus-within:ring-[#315C4C]">
                <div className="flex flex-col text-left mr-2">
                  <span className="text-[10px] font-mono text-[#737773] uppercase leading-none mb-0.5">
                    State / UT
                  </span>
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="bg-transparent font-semibold text-[#171918] focus:outline-none cursor-pointer pr-4 text-xs sm:text-sm max-w-[130px] sm:max-w-[160px] truncate"
                    aria-label="Select Indian State or Union Territory"
                  >
                    {allStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <ChevronDown size={14} className="text-[#737773] pointer-events-none -ml-3" />
              </div>
            </div>

            {/* Active Sector Selector Dropdown */}
            <div className="relative">
              <div className="flex items-center bg-[#F5F5F2] border border-[#E4E6E2] rounded-lg px-3 py-2 text-xs hover:border-[#737773] transition-colors focus-within:ring-2 focus-within:ring-[#315C4C]">
                <MapPin size={14} className="text-[#315C4C] mr-2 flex-shrink-0" />
                <div className="flex flex-col text-left mr-2">
                  <span className="text-[10px] font-mono text-[#737773] uppercase leading-none mb-0.5">
                    Active Sector
                  </span>
                  <select
                    value={currentArea}
                    onChange={(e) => handleAreaSelect(e.target.value)}
                    className="bg-transparent font-semibold text-[#171918] focus:outline-none cursor-pointer pr-4 text-xs sm:text-sm max-w-[140px] sm:max-w-[180px] truncate"
                    aria-label="Select Active Sector or Place"
                  >
                    <optgroup label={`${selectedState} Sectors (${availablePlaces.length})`}>
                      {availablePlaces.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="── Switch State / UT ──">
                      {allStates
                        .filter((st) => st !== selectedState)
                        .map((st) => (
                          <option key={st} value={`STATE_SWITCH:${st}`}>
                            ➡️ Switch to {st}
                          </option>
                        ))}
                    </optgroup>
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
