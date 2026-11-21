import React from 'react';
import { IssueSeverity, IssueStatus, DashboardReportStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  severity?: IssueSeverity;
  status?: IssueStatus | DashboardReportStatus;
  variant?: 'default' | 'accent' | 'critical' | 'warning' | 'muted' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  severity,
  status,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  let resolvedVariant = variant;
  let label = children;
  let dotColor = '#737773';

  if (severity) {
    switch (severity) {
      case 'critical':
        resolvedVariant = 'critical';
        label = label || 'Critical';
        dotColor = '#B8463B';
        break;
      case 'high':
        resolvedVariant = 'warning';
        label = label || 'High Priority';
        dotColor = '#C58B36';
        break;
      case 'medium':
        resolvedVariant = 'muted';
        label = label || 'Medium Priority';
        dotColor = '#737773';
        break;
      case 'low':
        resolvedVariant = 'default';
        label = label || 'Low Priority';
        dotColor = '#315C4C';
        break;
    }
  } else if (status) {
    const s = String(status).toLowerCase();
    if (s === 'submitted' || s === 'reported') {
      resolvedVariant = 'muted';
      label = label || (status === 'Submitted' ? 'Submitted' : 'Reported');
      dotColor = '#737773';
    } else if (s === 'under review' || s === 'reviewed') {
      resolvedVariant = 'outline';
      label = label || (status === 'Under Review' ? 'Under Review' : 'Reviewed');
      dotColor = '#315C4C';
    } else if (s === 'assigned') {
      resolvedVariant = 'default';
      label = label || 'Assigned';
      dotColor = '#315C4C';
    } else if (s === 'in progress' || s === 'in_progress') {
      resolvedVariant = 'warning';
      label = label || 'In Progress';
      dotColor = '#C58B36';
    } else if (s === 'resolved' || s === 'verified') {
      resolvedVariant = 'accent';
      label = label || (s === 'verified' ? 'Verified' : 'Resolved');
      dotColor = '#315C4C';
    }
  }

  const variantStyles = {
    default: 'bg-[#F5F5F2] text-[#171918] border border-[#E4E6E2]',
    accent: 'bg-[#DDE7DF] text-[#315C4C] border border-[#315C4C]/20 font-medium',
    critical: 'bg-[#FAF0EF] text-[#B8463B] border border-[#B8463B]/30 font-medium',
    warning: 'bg-[#FAF5ED] text-[#C58B36] border border-[#C58B36]/30 font-medium',
    muted: 'bg-white text-[#737773] border border-[#E4E6E2]',
    outline: 'border border-[#E4E6E2] text-[#171918] bg-transparent',
  }[resolvedVariant];

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 tracking-wide',
    md: 'text-xs px-2.5 py-1 tracking-normal',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-mono uppercase font-semibold select-none ${variantStyles} ${sizeStyles} ${className}`}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: dotColor }}
        />
      )}
      <span>{label}</span>
    </span>
  );
};
