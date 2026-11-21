import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, MapPin, FileText, ArrowUpRight } from 'lucide-react';

interface QuickActionsProps {
  onViewAllReports: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onViewAllReports,
}) => {
  return (
    <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E4E6E2]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#315C4C]" />
          <h3 className="text-sm font-bold tracking-tight text-[#171918]">
            Quick Actions
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#737773]">FAST ACCESS</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Action 1: Report an Issue */}
        <Link
          to="/report"
          className="group p-4 rounded-lg bg-[#315C4C] hover:bg-[#26483B] text-white transition-all flex flex-col justify-between shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded bg-white/10">
              <PlusCircle size={18} className="text-white" />
            </div>
            <ArrowUpRight size={16} className="text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              Report an Issue
            </h4>
            <p className="text-xs text-white/80 mt-0.5">
              Document a new hazard in 30s
            </p>
          </div>
        </Link>

        {/* Action 2: Explore Civic Map */}
        <Link
          to="/explore"
          className="group p-4 rounded-lg bg-[#F5F5F2] hover:bg-white border border-[#E4E6E2] hover:border-[#315C4C]/40 text-[#171918] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded bg-white border border-[#E4E6E2]">
              <MapPin size={18} className="text-[#315C4C]" />
            </div>
            <ArrowUpRight size={16} className="text-[#737773] group-hover:text-[#171918] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#171918]">
              Explore Civic Map
            </h4>
            <p className="text-xs text-[#737773] mt-0.5">
              Inspect GIS ward clusters
            </p>
          </div>
        </Link>

        {/* Action 3: View All My Reports */}
        <button
          type="button"
          onClick={onViewAllReports}
          className="group p-4 rounded-lg bg-[#F5F5F2] hover:bg-white border border-[#E4E6E2] hover:border-[#315C4C]/40 text-[#171918] transition-all flex flex-col justify-between text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded bg-white border border-[#E4E6E2]">
              <FileText size={18} className="text-[#315C4C]" />
            </div>
            <span className="text-xs font-mono text-[#315C4C] group-hover:underline">
              Scroll
            </span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#171918]">
              View All My Reports
            </h4>
            <p className="text-xs text-[#737773] mt-0.5">
              Reset search & focus tickets
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

