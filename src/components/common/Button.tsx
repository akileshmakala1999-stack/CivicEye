import React from 'react';
import { Link } from 'react-router-dom';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark' | 'critical';
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  to,
  type = 'button',
  icon,
  iconPosition = 'right',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium tracking-tight transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-md select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  }[size];

  const variantStyles = {
    primary: 'bg-[#315C4C] text-white hover:bg-[#26483B] focus-visible:ring-[#315C4C] shadow-sm',
    secondary: 'bg-[#DDE7DF] text-[#315C4C] hover:bg-[#ccd9cf] focus-visible:ring-[#315C4C]',
    outline: 'border border-[#E4E6E2] bg-white text-[#171918] hover:bg-[#F5F5F2] hover:border-[#737773] focus-visible:ring-[#315C4C]',
    ghost: 'text-[#171918] hover:bg-[#E4E6E2]/40 focus-visible:ring-[#315C4C]',
    dark: 'bg-[#181C1A] text-white hover:bg-[#2A302D] focus-visible:ring-[#181C1A]',
    critical: 'bg-[#B8463B] text-white hover:bg-[#9B372E] focus-visible:ring-[#B8463B]',
  }[variant];

  const widthStyle = fullWidth ? 'w-full' : '';

  const classes = `${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${className}`.trim();

  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} {...props}>
      {content}
    </button>
  );
};

