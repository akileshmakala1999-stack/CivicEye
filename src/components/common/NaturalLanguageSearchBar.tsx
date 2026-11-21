import React, { useState } from 'react';
import { DashboardReport, NaturalLanguageFilterResult } from '../../types';
import { aiOrchestrationService } from '../../services/aiOrchestrationService';
import { Search, Sparkles, X, Filter, CornerDownLeft } from 'lucide-react';

interface NaturalLanguageSearchBarProps {
  allReports: DashboardReport[];
  onFilterChanged: (filtered: DashboardReport[], result?: NaturalLanguageFilterResult) => void;
  placeholder?: string;
  className?: string;
}

export const NaturalLanguageSearchBar: React.FC<NaturalLanguageSearchBarProps> = ({
  allReports,
  onFilterChanged,
  placeholder = 'Ask in natural language: e.g. "Unresolved drainage issues in Jubilee Hills" or "Critical road hazards"...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [activeResult, setActiveResult] = useState<NaturalLanguageFilterResult | null>(null);

  const samplePrompts = [
    'Unresolved drainage issues',
    'Recurring potholes in Jubilee Hills',
    'Critical public safety hazards',
    'Challenged repairs needing rework',
    'Water leaks in Banjara Hills',
  ];

  const handleExecuteSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setActiveResult(null);
      onFilterChanged(allReports);
      return;
    }

    const result = aiOrchestrationService.searchCivicReports(searchQuery, allReports);
    setActiveResult(result);
    onFilterChanged(result.matchedReports, result);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleExecuteSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    setActiveResult(null);
    onFilterChanged(allReports);
  };

  const handlePromptClick = (prompt: string) => {
    setQuery(prompt);
    handleExecuteSearch(prompt);
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* SEARCH INPUT BAR */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 flex items-center pointer-events-none text-[#737773]">
          <Search size={15} />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-[#E4E6E2] bg-white text-xs text-[#171918] placeholder-[#737773]/70 focus:outline-hidden focus:border-[#315C4C] focus:ring-2 focus:ring-[#315C4C]/15 transition-all shadow-2xs"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]/40 transition-colors"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleExecuteSearch(query)}
            className="px-2.5 py-1 rounded-lg bg-[#315C4C] text-white text-[11px] font-semibold hover:bg-[#26483B] flex items-center gap-1 shadow-2xs transition-colors"
          >
            <span>Search</span>
            <CornerDownLeft size={10} className="opacity-70" />
          </button>
        </div>
      </div>

      {/* SAMPLE QUICK PROMPTS (WHEN EMPTY) */}
      {!activeResult && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <span className="text-[#737773] text-[10px] font-mono shrink-0 flex items-center gap-1">
            <Sparkles size={11} className="text-[#315C4C]" /> Try:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePromptClick(p)}
              className="px-2.5 py-0.5 rounded-full bg-[#FAFBF9] border border-[#E4E6E2] text-[#737773] hover:text-[#315C4C] hover:border-[#315C4C]/40 hover:bg-[#DDE7DF]/30 whitespace-nowrap transition-colors shrink-0"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ACTIVE INTERPRETED FILTERS CHIPS */}
      {activeResult && (
        <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#315C4C]/25 text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase font-bold text-[#315C4C] flex items-center gap-1">
                <Filter size={11} />
                <span>Interpreted Safe Query Filters:</span>
              </span>
              <span className="font-mono text-[10px] text-[#737773]">
                ({activeResult.matchedReports.length} records matched)
              </span>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="text-[10px] font-mono text-[#B8463B] hover:underline"
            >
              Reset to All Reports
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {activeResult.appliedFilterLabels.length > 0 ? (
              activeResult.appliedFilterLabels.map((label, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white border border-[#315C4C]/30 text-[#315C4C] font-semibold shadow-2xs"
                >
                  ✓ {label}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-[#737773] font-mono">
                No strict categories extracted; matching report descriptions and titles.
              </span>
            )}
          </div>

          <p className="text-[11px] text-[#737773] leading-relaxed pt-0.5 border-t border-[#E4E6E2]/60">
            {activeResult.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
