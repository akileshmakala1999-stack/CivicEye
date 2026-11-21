import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  inverted?: boolean;
  className?: string;
  linkToHome?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  inverted = false,
  className = '',
  linkToHome = true,
}) => {
  const iconDimensions = {
    sm: { box: 24, stroke: 1.75 },
    md: { box: 32, stroke: 2 },
    lg: { box: 40, stroke: 2.25 },
    xl: { box: 48, stroke: 2.5 },
  }[size];

  const textSizes = {
    sm: 'text-base tracking-tight',
    md: 'text-lg tracking-tight',
    lg: 'text-xl tracking-tight',
    xl: 'text-2xl tracking-tight',
  }[size];

  const iconMarkup = (
    <svg
      width={iconDimensions.box}
      height={iconDimensions.box}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
      aria-label="CivicEye Icon"
    >
      {/* Outer Eye Almond Contour */}
      <path
        d="M2.5 16C6 8.5 26 8.5 29.5 16C26 23.5 6 23.5 2.5 16Z"
        stroke={inverted ? '#DDE7DF' : '#27473A'}
        strokeWidth="2.75"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Iris */}
      <circle
        cx="16"
        cy="16"
        r="5.5"
        fill={inverted ? '#DDE7DF' : '#27473A'}
      />
      {/* Pupil Highlight */}
      <circle
        cx="14.5"
        cy="14.5"
        r="1.75"
        fill={inverted ? '#181C1A' : '#FFFFFF'}
      />
    </svg>
  );

  const content = (
    <div className={`inline-flex items-center gap-2.5 font-medium select-none ${className}`}>
      {iconMarkup}
      {showWordmark && (
        <span className={`font-semibold ${textSizes} ${inverted ? 'text-white' : 'text-[#171918]'}`}>
          Civic<span className={inverted ? 'text-[#DDE7DF]' : 'text-[#315C4C]'}>Eye</span>
        </span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315C4C] rounded-md">
        {content}
      </Link>
    );
  }

  return content;
};

