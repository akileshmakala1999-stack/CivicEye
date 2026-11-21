import React from 'react';

interface SectionHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  action?: React.ReactNode;
  inverted?: boolean;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  kicker,
  title,
  description,
  align = 'left',
  action,
  inverted = false,
  className = '',
}) => {
  const isCenter = align === 'center';

  return (
    <div
      className={`mb-12 md:mb-16 ${isCenter ? 'text-center mx-auto max-w-2xl' : 'flex flex-col md:flex-row md:items-end md:justify-between gap-6'} ${className}`}
    >
      <div className={isCenter ? '' : 'max-w-2xl'}>
        {kicker && (
          <div className="inline-flex items-center gap-2 mb-3">
            <span
              className={`w-1.5 h-1.5 rounded-full ${inverted ? 'bg-[#DDE7DF]' : 'bg-[#315C4C]'}`}
            />
            <span
              className={`text-xs font-mono font-medium tracking-wider uppercase ${
                inverted ? 'text-[#DDE7DF]' : 'text-[#315C4C]'
              }`}
            >
              {kicker}
            </span>
          </div>
        )}
        <h2
          className={`text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.2] ${
            inverted ? 'text-white' : 'text-[#171918]'
          }`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`mt-3 text-base sm:text-lg leading-relaxed ${
              inverted ? 'text-[#DDE7DF]/80' : 'text-[#737773]'
            }`}
          >
            {description}
          </p>
        )}
      </div>

      {!isCenter && action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

