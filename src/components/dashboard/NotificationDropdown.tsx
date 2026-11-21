import React from 'react';
import { DashboardNotification } from '../../types';
import { Bell, Check, CheckCheck, Clock, ArrowRight, ShieldAlert, Sparkles, Building2, Flame } from 'lucide-react';

interface NotificationDropdownProps {
  notifications: DashboardNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectNotificationReport?: (reportId: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotificationReport,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: DashboardNotification['type']) => {
    switch (type) {
      case 'assignment':
        return <Building2 size={14} className="text-[#315C4C]" />;
      case 'confirmation':
        return <Flame size={14} className="text-[#C58B36]" />;
      case 'resolution':
        return <CheckCheck size={14} className="text-[#315C4C]" />;
      case 'status_update':
        return <Clock size={14} className="text-[#171918]" />;
      case 'advisory':
        return <ShieldAlert size={14} className="text-[#B8463B]" />;
      default:
        return <Sparkles size={14} className="text-[#315C4C]" />;
    }
  };

  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl bg-white border border-[#E4E6E2] shadow-[0_12px_32px_rgba(23,25,24,0.1)] z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E6E2] bg-[#F5F5F2]">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-[#315C4C]" />
          <span className="text-sm font-semibold text-[#171918]">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#315C4C] text-white">
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="text-[11px] font-mono text-[#315C4C] hover:underline transition-colors flex items-center gap-1"
          >
            <Check size={12} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Simulated notice banner */}
      <div className="px-4 py-1.5 bg-[#DDE7DF]/40 border-b border-[#E4E6E2] flex items-center justify-between text-[10px] font-mono text-[#315C4C]">
        <span>SIMULATED CIVIC ALERTS</span>
        <span>DEMO MODE</span>
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-[#E4E6E2]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#737773]">
            <Bell size={24} className="mx-auto mb-2 text-[#737773]/40" />
            <p className="font-medium text-[#171918] mb-1">No notifications yet</p>
            <p>You are all caught up with your neighborhood updates.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onMarkAsRead(item.id);
                if (item.relatedReportId && onSelectNotificationReport) {
                  onSelectNotificationReport(item.relatedReportId);
                  onClose();
                }
              }}
              className={`p-3.5 hover:bg-[#F5F5F2] transition-colors cursor-pointer flex items-start gap-3 ${
                !item.read ? 'bg-[#F5F5F2]/40' : 'bg-white opacity-85'
              }`}
            >
              <div className="p-2 rounded-md bg-white border border-[#E4E6E2] flex-shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-xs font-semibold text-[#171918] truncate">
                    {item.title}
                  </h4>
                  {!item.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#315C4C] flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-[#737773] leading-relaxed line-clamp-2">
                  {item.message}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-[#737773]">
                  <span>{item.time}</span>
                  {item.relatedReportId && (
                    <span className="text-[#315C4C] flex items-center gap-0.5 hover:underline">
                      <span>View report</span>
                      <ArrowRight size={10} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#E4E6E2] bg-[#F5F5F2] text-[11px] text-[#737773] text-center">
        Real-time telemetry simulated for Hyderabad municipal wards
      </div>
    </div>
  );
};

