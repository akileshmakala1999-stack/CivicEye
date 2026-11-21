import React, { useState } from 'react';
import { DEMO_HERO_ISSUES } from '../../data/mockData';
import { Badge } from '../common/Badge';
import { AlertCircle, Trash2, Droplets, Lightbulb, CheckCircle2, Users, Compass, Plus, Minus, Layers } from 'lucide-react';

interface HeroMapPreviewProps {
  className?: string;
}

export const HeroMapPreview: React.FC<HeroMapPreviewProps> = ({ className = '' }) => {
  const [selectedIssueId, setSelectedIssueId] = useState<string>('hero-issue-1');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const selectedIssue = DEMO_HERO_ISSUES.find((i) => i.id === selectedIssueId) || DEMO_HERO_ISSUES[0];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Road damage':
        return <AlertCircle size={14} className="text-[#B8463B]" />;
      case 'Garbage':
        return <Trash2 size={14} className="text-[#C58B36]" />;
      case 'Drainage':
        return <Droplets size={14} className="text-[#315C4C]" />;
      case 'Streetlights':
        return <Lightbulb size={14} className="text-[#737773]" />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#B8463B';
      case 'high':
        return '#C58B36';
      default:
        return '#315C4C';
    }
  };

  const filteredIssues = DEMO_HERO_ISSUES.filter((issue) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'road') return issue.category === 'Road damage';
    if (activeFilter === 'garbage') return issue.category === 'Garbage';
    if (activeFilter === 'drainage') return issue.category === 'Drainage';
    return true;
  });

  return (
    <div
      className={`relative rounded-xl border border-[#E4E6E2] bg-white overflow-hidden shadow-[0_4px_24px_rgba(23,25,24,0.04)] ${className}`}
    >
      {/* Map Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E6E2] bg-[#F5F5F2]/80 text-xs text-[#171918]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#315C4C]">
            <span className="w-2 h-2 rounded-full bg-[#315C4C] animate-pulse" />
            <span>DISTRICT 04 • CENTRAL GRID</span>
          </div>
          <span className="text-[#E4E6E2]">|</span>
          <span className="hidden sm:inline font-mono text-[11px] text-[#737773]">
            12°58'23"N 77°35'45"E
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-[#315C4C] text-white'
                : 'text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]'
            }`}
          >
            All (4)
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('road')}
            className={`hidden sm:inline-flex px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeFilter === 'road'
                ? 'bg-[#315C4C] text-white'
                : 'text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]'
            }`}
          >
            Roads
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('garbage')}
            className={`hidden sm:inline-flex px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeFilter === 'garbage'
                ? 'bg-[#315C4C] text-white'
                : 'text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]'
            }`}
          >
            Sanitation
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('drainage')}
            className={`hidden sm:inline-flex px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeFilter === 'drainage'
                ? 'bg-[#315C4C] text-white'
                : 'text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]'
            }`}
          >
            Drainage
          </button>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#F5F5F2] overflow-hidden select-none">
        {/* SVG Urban Grid Map Background */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.25s ease-out' }}
          viewBox="0 0 800 500"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Fine coordinate pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E4E6E2" strokeWidth="0.75" />
            </pattern>
            {/* Dot pattern */}
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.75" fill="#737773" opacity="0.18" />
            </pattern>
          </defs>

          {/* Base background */}
          <rect width="800" height="500" fill="#F5F5F2" />
          <rect width="800" height="500" fill="url(#grid)" />
          <rect width="800" height="500" fill="url(#dots)" />

          {/* Urban Blocks (Geometric City Quarters) */}
          {/* Sector NW */}
          <rect x="50" y="40" width="160" height="110" rx="3" fill="#FFFFFF" stroke="#E4E6E2" strokeWidth="1" />
          <rect x="65" y="55" width="60" height="40" rx="2" fill="#F5F5F2" />
          <rect x="135" y="55" width="60" height="80" rx="2" fill="#F5F5F2" />

          {/* Sector NE */}
          <rect x="250" y="30" width="220" height="120" rx="3" fill="#FFFFFF" stroke="#E4E6E2" strokeWidth="1" />
          <rect x="270" y="45" width="80" height="40" rx="2" fill="#F5F5F2" />
          <rect x="365" y="45" width="90" height="90" rx="2" fill="#F5F5F2" />

          {/* Urban Green Park (Sage Soft Accent) */}
          <path
            d="M 510 40 L 730 40 C 740 40 750 50 750 60 L 750 160 C 750 170 740 180 730 180 L 530 180 C 520 180 510 170 510 160 Z"
            fill="#DDE7DF"
            stroke="#315C4C"
            strokeWidth="0.5"
            strokeOpacity="0.3"
          />
          <text x="630" y="115" textAnchor="middle" fill="#315C4C" fontSize="11" fontFamily="monospace" letterSpacing="2" opacity="0.8">
            CENTRAL MUNICIPAL PARK
          </text>
          {/* Park foliage indicators */}
          <circle cx="560" cy="80" r="14" fill="#315C4C" fillOpacity="0.12" />
          <circle cx="680" cy="140" r="18" fill="#315C4C" fillOpacity="0.12" />
          <circle cx="700" cy="80" r="10" fill="#315C4C" fillOpacity="0.12" />

          {/* Sector Center-West */}
          <rect x="50" y="190" width="180" height="140" rx="3" fill="#FFFFFF" stroke="#E4E6E2" strokeWidth="1" />
          <rect x="65" y="205" width="70" height="50" rx="2" fill="#F5F5F2" />
          <rect x="145" y="205" width="70" height="110" rx="2" fill="#F5F5F2" />

          {/* Sector Center-East */}
          <rect x="510" y="220" width="240" height="110" rx="3" fill="#FFFFFF" stroke="#E4E6E2" strokeWidth="1" />
          <rect x="530" y="235" width="100" height="80" rx="2" fill="#F5F5F2" />
          <rect x="645" y="235" width="90" height="80" rx="2" fill="#F5F5F2" />

          {/* Sector SW */}
          <rect x="50" y="370" width="240" height="100" rx="3" fill="#FFFFFF" stroke="#E4E6E2" strokeWidth="1" />
          <rect x="70" y="385" width="100" height="70" rx="2" fill="#F5F5F2" />
          <rect x="180" y="385" width="90" height="70" rx="2" fill="#F5F5F2" />

          {/* Sector SE (Waterfront / River Canal Buffer) */}
          <rect x="330" y="370" width="220" height="100" rx="3" fill="#FFFFFF" stroke="#E4E6E2" strokeWidth="1" />
          <rect x="590" y="370" width="160" height="100" rx="3" fill="#FFFFFF" stroke="#E4E6E2" strokeWidth="1" />

          {/* Roads & Arterials */}
          {/* Secondary streets */}
          <line x1="0" y1="170" x2="800" y2="170" stroke="#FFFFFF" strokeWidth="14" />
          <line x1="0" y1="170" x2="800" y2="170" stroke="#E4E6E2" strokeWidth="1" />

          <line x1="0" y1="350" x2="800" y2="350" stroke="#FFFFFF" strokeWidth="14" />
          <line x1="0" y1="350" x2="800" y2="350" stroke="#E4E6E2" strokeWidth="1" />

          <line x1="230" y1="0" x2="230" y2="500" stroke="#FFFFFF" strokeWidth="14" />
          <line x1="230" y1="0" x2="230" y2="500" stroke="#E4E6E2" strokeWidth="1" />

          <line x1="490" y1="0" x2="490" y2="500" stroke="#FFFFFF" strokeWidth="14" />
          <line x1="490" y1="0" x2="490" y2="500" stroke="#E4E6E2" strokeWidth="1" />

          {/* Main Diagonal Boulevard (High Priority Arterial) */}
          <path
            d="M 0 420 L 300 280 L 800 120"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="24"
            strokeLinejoin="round"
          />
          <path
            d="M 0 420 L 300 280 L 800 120"
            fill="none"
            stroke="#E4E6E2"
            strokeWidth="20"
            strokeLinejoin="round"
          />
          {/* Arterial Center Dashed Line */}
          <path
            d="M 0 420 L 300 280 L 800 120"
            fill="none"
            stroke="#737773"
            strokeWidth="1"
            strokeDasharray="6 6"
            strokeOpacity="0.4"
          />

          {/* Street Labels */}
          <text x="120" y="166" fill="#737773" fontSize="9" fontFamily="sans-serif" letterSpacing="0.5">
            4TH AVENUE WEST
          </text>
          <text x="610" y="346" fill="#737773" fontSize="9" fontFamily="sans-serif" letterSpacing="0.5">
            EAST METRO BOULEVARD
          </text>
          <text x="236" y="270" fill="#737773" fontSize="9" fontFamily="sans-serif" transform="rotate(90 236 270)">
            PINE STREET
          </text>
        </svg>

        {/* Civic Issue Location Markers (Interactive) */}
        {filteredIssues.map((issue) => {
          const isSelected = issue.id === selectedIssueId;
          const markerColor = getMarkerColor(issue.severity);

          return (
            <div
              key={issue.id}
              onClick={() => setSelectedIssueId(issue.id)}
              className="absolute cursor-pointer transition-transform duration-200 hover:scale-110 z-20"
              style={{
                left: `${issue.coordinates.mapXPercent}%`,
                top: `${issue.coordinates.mapYPercent}%`,
                transform: 'translate(-50%, -100%)',
              }}
              role="button"
              tabIndex={0}
              aria-label={`Inspect issue: ${issue.title}`}
            >
              {/* Outer pulsing ring for critical/high issues */}
              {(issue.severity === 'critical' || issue.severity === 'high') && (
                <span
                  className="absolute -top-1 -left-1 -right-1 -bottom-1 rounded-full animate-ping opacity-30"
                  style={{ backgroundColor: markerColor }}
                />
              )}

              {/* Marker Body */}
              <div
                className={`relative flex items-center justify-center rounded-full shadow-md transition-all ${
                  isSelected
                    ? 'w-9 h-9 ring-4 ring-[#171918]/15 ring-offset-2'
                    : 'w-7 h-7 hover:ring-2 hover:ring-[#171918]/20'
                }`}
                style={{ backgroundColor: markerColor }}
              >
                <div className="text-white">
                  {issue.category === 'Road damage' && <AlertCircle size={isSelected ? 18 : 14} />}
                  {issue.category === 'Garbage' && <Trash2 size={isSelected ? 18 : 14} />}
                  {issue.category === 'Drainage' && <Droplets size={isSelected ? 18 : 14} />}
                  {issue.category === 'Streetlights' && <Lightbulb size={isSelected ? 18 : 14} />}
                </div>

                {/* Pin pointer tip */}
                <div
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px]"
                  style={{ borderTopColor: markerColor }}
                />
              </div>

              {/* Minimal category label pill hovering over marker */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 -top-6 whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold transition-opacity ${
                  isSelected
                    ? 'bg-[#171918] text-white opacity-100 shadow-sm'
                    : 'bg-white text-[#171918] border border-[#E4E6E2] opacity-80'
                }`}
              >
                {issue.category}
              </div>
            </div>
          );
        })}

        {/* Selected Issue Preview Card (Floating overlay on bottom-left) */}
        {selectedIssue && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-white border border-[#E4E6E2] rounded-lg p-3.5 sm:p-4 shadow-lg z-30 transition-all">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-[#F5F5F2] border border-[#E4E6E2]">
                  {getCategoryIcon(selectedIssue.category)}
                </div>
                <div>
                  <div className="text-[11px] font-mono font-medium text-[#737773] uppercase tracking-wide">
                    {selectedIssue.category}
                  </div>
                  <h4 className="text-sm font-semibold text-[#171918] leading-snug line-clamp-1">
                    {selectedIssue.title}
                  </h4>
                </div>
              </div>
              <Badge severity={selectedIssue.severity} dot size="sm" />
            </div>

            <p className="text-xs text-[#737773] line-clamp-2 mb-3">
              {selectedIssue.description}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-[#E4E6E2] text-[11px] text-[#737773]">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 font-mono text-[#315C4C]">
                  <CheckCircle2 size={12} />
                  <span>Confirmed</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={12} />
                  <span>{selectedIssue.confirmationsCount} citizens</span>
                </span>
              </div>
              <span className="font-mono text-[#737773]">
                {selectedIssue.reportedTime}
              </span>
            </div>
          </div>
        )}

        {/* Compass & Zoom UI Controls (Top right interactive) */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-20">
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            title="Reset map orientation & zoom"
            aria-label="Reset map orientation and zoom"
            className="w-8 h-8 rounded-md bg-white border border-[#E4E6E2] shadow-sm flex items-center justify-center text-[#737773] hover:text-[#171918] hover:bg-[#F5F5F2] transition-colors"
          >
            <Compass size={16} />
          </button>
          <div className="flex flex-col rounded-md bg-white border border-[#E4E6E2] shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(Number((z + 0.15).toFixed(2)), 1.6))}
              title="Zoom In"
              aria-label="Zoom In"
              className="w-8 h-8 flex items-center justify-center text-[#737773] hover:text-[#171918] hover:bg-[#F5F5F2] border-b border-[#E4E6E2] transition-colors"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(Number((z - 0.15).toFixed(2)), 0.85))}
              title="Zoom Out"
              aria-label="Zoom Out"
              className="w-8 h-8 flex items-center justify-center text-[#737773] hover:text-[#171918] hover:bg-[#F5F5F2] transition-colors"
            >
              <Minus size={14} />
            </button>
          </div>
        </div>

        {/* Layer badge bottom right */}
        <div className="hidden sm:inline-flex absolute bottom-4 right-4 items-center gap-1.5 px-2.5 py-1 rounded bg-white/90 backdrop-blur-sm border border-[#E4E6E2] text-[10px] font-mono text-[#737773] z-20">
          <Layers size={11} className="text-[#315C4C]" />
          <span>Vector Sector Preview • Non-Live Illustrative</span>
        </div>
      </div>

      {/* Map Footer Note */}
      <div className="px-4 py-2.5 bg-white border-t border-[#E4E6E2] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#737773]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#315C4C]" />
          <span>Click any marker to inspect triage details and civic verification stats.</span>
        </div>
        <span className="font-mono text-[10px] text-[#737773]/80">
          GIS BASELAYER V1.4 • DEMO SECTOR
        </span>
      </div>
    </div>
  );
};
