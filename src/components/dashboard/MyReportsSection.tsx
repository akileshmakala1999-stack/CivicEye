import React, { useState, useMemo } from 'react';
import { DashboardReport, DashboardReportStatus } from '../../types';
import { Badge } from '../common/Badge';
import { NaturalLanguageSearchBar } from '../common/NaturalLanguageSearchBar';
import { Search, MapPin, Calendar, Users, ChevronRight, XCircle, AlertCircle, Sparkles } from 'lucide-react';

interface MyReportsSectionProps {
  reports: DashboardReport[];
  onSelectReport: (report: DashboardReport) => void;
  onNewReportClick: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  filtersRef?: React.RefObject<HTMLDivElement>;
  highlightTarget?: 'search' | 'filters' | null;
}

export const MyReportsSection: React.FC<MyReportsSectionProps> = ({
  reports,
  onSelectReport,
  onNewReportClick,
  searchInputRef,
  filtersRef,
  highlightTarget,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [nlFilteredReports, setNlFilteredReports] = useState<DashboardReport[] | null>(null);
  const [isNlActive, setIsNlActive] = useState(false);

  const statusOptions: (DashboardReportStatus | 'All')[] = [
    'All',
    'Submitted',
    'Under Review',
    'Assigned',
    'In Progress',
    'Resolved',
  ];

  const categoryOptions = [
    'All',
    'Road damage',
    'Garbage',
    'Water leakage',
    'Streetlights',
    'Damaged footpaths',
    'Drainage',
  ];

  // Filtering and sorting logic
  const filteredReports = useMemo(() => {
    if (isNlActive && nlFilteredReports !== null) {
      return nlFilteredReports;
    }

    return reports
      .filter((report) => {
        // Status match
        if (selectedStatus !== 'All' && report.status !== selectedStatus) {
          return false;
        }
        // Category match
        if (selectedCategory !== 'All' && report.category !== selectedCategory) {
          return false;
        }
        // Search query match (title, location, ticketNumber, description)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = report.title.toLowerCase().includes(q);
          const matchLoc = report.location.toLowerCase().includes(q);
          const matchTicket = report.ticketNumber.toLowerCase().includes(q);
          const matchDesc = report.description.toLowerCase().includes(q);
          if (!matchTitle && !matchLoc && !matchTicket && !matchDesc) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return b.id.localeCompare(a.id);
        } else {
          return a.id.localeCompare(b.id);
        }
      });
  }, [reports, searchQuery, selectedStatus, selectedCategory, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('All');
    setSelectedCategory('All');
    setSortBy('newest');
  };

  const isFiltered = searchQuery !== '' || selectedStatus !== 'All' || selectedCategory !== 'All';

  return (
    <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-6 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-[#E4E6E2] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#315C4C]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#315C4C] font-semibold">
              Personal Civic Registry
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171918]">
            My Reports
          </h2>
          <p className="text-xs text-[#737773] mt-0.5">
            Track real-time status updates and municipal actions on your submissions.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewReportClick}
          className="self-start sm:self-auto px-4 py-2 rounded-md bg-[#315C4C] hover:bg-[#26483B] text-white text-xs font-medium tracking-tight transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315C4C]"
        >
          + Submit New Report
        </button>
      </div>

      {/* NATURAL LANGUAGE SEARCH TOGGLE */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase font-bold text-[#737773] flex items-center gap-1">
            <Sparkles size={11} className="text-[#315C4C]" />
            <span>Search Experience:</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setIsNlActive(!isNlActive);
              if (isNlActive) setNlFilteredReports(null);
            }}
            className="text-[11px] font-mono text-[#315C4C] hover:underline flex items-center gap-1 font-semibold"
          >
            {isNlActive ? '← Switch to Standard Keyword Box' : 'Switch to Natural Language Civic Search ✨'}
          </button>
        </div>

        {isNlActive && (
          <NaturalLanguageSearchBar
            allReports={reports}
            onFilterChanged={(matched) => setNlFilteredReports(matched)}
            className="mb-3"
          />
        )}
      </div>

      {/* Working Controls Bar */}
      <div
        ref={filtersRef}
        className={`space-y-3 mb-6 p-2 rounded-lg transition-all ${
          highlightTarget === 'filters'
            ? 'ring-2 ring-[#315C4C] bg-[#DDE7DF]/20'
            : ''
        }`}
      >
        {/* Top Controls Row: Search & Sorter */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div
            className={`relative flex-1 rounded-lg transition-all ${
              highlightTarget === 'search'
                ? 'ring-2 ring-[#315C4C]'
                : ''
            }`}
          >
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737773]"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by issue title, location, or ticket number..."
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-xs text-[#171918] placeholder:text-[#737773] focus:outline-none focus:border-[#315C4C] focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737773] hover:text-[#171918]"
                aria-label="Clear search input"
              >
                <XCircle size={14} />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-xs font-medium text-[#171918] focus:outline-none focus:border-[#315C4C] cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categoryOptions.filter((c) => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Sort Toggle */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="px-3 py-2 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-xs font-medium text-[#171918] focus:outline-none focus:border-[#315C4C] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[11px] font-mono uppercase text-[#737773] mr-1 hidden sm:inline">
            Status:
          </span>
          {statusOptions.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                selectedStatus === st
                  ? 'bg-[#171918] text-white'
                  : 'bg-[#F5F5F2] text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]'
              }`}
            >
              {st}
            </button>
          ))}

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-auto text-[11px] font-mono text-[#315C4C] hover:underline whitespace-nowrap pl-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          /* Empty State */
          <div className="p-10 rounded-xl bg-[#F5F5F2]/60 border border-dashed border-[#E4E6E2] text-center">
            <AlertCircle size={28} className="mx-auto text-[#737773] mb-3 opacity-60" />
            <h3 className="text-sm font-semibold text-[#171918] mb-1">
              {isFiltered ? 'No matching reports found' : 'No personal reports submitted yet'}
            </h3>
            <p className="text-xs text-[#737773] max-w-sm mx-auto mb-4">
              {isFiltered
                ? 'Try adjusting your search query, status or category filters.'
                : 'Help your neighborhood by submitting your first civic report.'}
            </p>
            {isFiltered ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 rounded-md bg-white border border-[#E4E6E2] text-xs font-medium text-[#171918] hover:bg-[#F5F5F2]"
              >
                Clear all filters
              </button>
            ) : (
              <button
                type="button"
                onClick={onNewReportClick}
                className="px-4 py-2 rounded-md bg-[#315C4C] text-white text-xs font-medium hover:bg-[#26483B]"
              >
                Report an Issue
              </button>
            )}
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => onSelectReport(report)}
              className="group p-4 sm:p-5 rounded-lg border border-[#E4E6E2] bg-white hover:border-[#315C4C]/50 hover:shadow-sm transition-all duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              role="button"
              tabIndex={0}
              aria-label={`View details for ${report.title}`}
            >
              {/* Left Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-mono text-[11px] font-bold text-[#315C4C]">
                    {report.ticketNumber}
                  </span>
                  <span className="text-[#E4E6E2]">|</span>
                  <span className="text-xs font-mono uppercase text-[#737773]">
                    {report.category}
                  </span>
                  <Badge severity={report.severity} dot size="sm" />
                </div>

                <h3 className="text-base font-semibold text-[#171918] group-hover:text-[#315C4C] transition-colors leading-snug line-clamp-1 mb-2">
                  {report.title}
                </h3>

                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-[#737773]">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-[#315C4C] flex-shrink-0" />
                    <span className="truncate max-w-[220px]">{report.location}</span>
                  </span>

                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Calendar size={13} />
                    <span>{report.reportDate}</span>
                  </span>

                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Users size={13} className="text-[#315C4C]" />
                    <span>{report.confirmationsCount} confirmations</span>
                  </span>
                </div>
              </div>

              {/* Right: Status badge & Arrow */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E4E6E2]">
                <Badge status={report.status} dot size="md" />
                <div className="w-8 h-8 rounded-full bg-[#F5F5F2] group-hover:bg-[#DDE7DF]/50 flex items-center justify-center text-[#737773] group-hover:text-[#315C4C] transition-colors">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* List Footer Count */}
      <div className="mt-4 pt-3 border-t border-[#E4E6E2] flex items-center justify-between text-[11px] font-mono text-[#737773]">
        <span>
          Showing {filteredReports.length} of {reports.length} personal reports
        </span>
        <span>CLICK ANY TICKET TO INSPECT LIFECYCLE</span>
      </div>
    </div>
  );
};
