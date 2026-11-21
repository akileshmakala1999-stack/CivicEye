import React from 'react';
import { HotspotData, DashboardReport } from '../../types';
import { Badge } from '../common/Badge';
import {
  X,
  MapPin,
  Flame,
  Info,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface HotspotDetailModalProps {
  hotspot: HotspotData | null;
  onClose: () => void;
  reports: DashboardReport[];
  onSelectReport?: (report: DashboardReport) => void;
}

export const HotspotDetailModal: React.FC<HotspotDetailModalProps> = ({
  hotspot,
  onClose,
  reports,
  onSelectReport,
}) => {
  if (!hotspot) return null;

  const linkedReports = reports.filter((r) => hotspot.reportIds.includes(r.id));

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'Critical':
        return 'bg-[#FAF0EF] text-[#B8463B] border-[#B8463B]/30';
      case 'High':
        return 'bg-[#FAF5ED] text-[#C58B36] border-[#C58B36]/30';
      case 'Moderate':
        return 'bg-[#F5F5F2] text-[#171918] border-[#E4E6E2]';
      default:
        return 'bg-[#DDE7DF]/50 text-[#315C4C] border-[#315C4C]/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#181C1A]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-white border border-[#E4E6E2] rounded-2xl shadow-2xl overflow-hidden z-10 my-6 animate-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#E4E6E2] bg-[#F5F5F2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-white border border-[#E4E6E2]">
              <Flame size={16} className="text-[#B8463B]" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-[#737773] tracking-wider block">
                CORRIDOR CLUSTER INTELLIGENCE • {hotspot.neighborhood.toUpperCase()}
              </span>
              <h2 className="text-base font-bold text-[#171918] leading-tight">
                {hotspot.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border ${getClassificationColor(
                hotspot.classification
              )}`}
            >
              {hotspot.classification} Hotspot ({hotspot.hotspotScore}/100)
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#737773] hover:text-[#171918] hover:bg-white transition-colors"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 text-sm">
          {/* Spatial & Density Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">
                Total Incident Density
              </span>
              <div className="text-xl font-bold font-mono text-[#171918]">
                {hotspot.incidentCount} Reports
              </div>
              <span className="text-[10px] text-[#737773]">~{hotspot.radiusMeters}m Cluster Radius</span>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">
                Active Pending
              </span>
              <div className="text-xl font-bold font-mono text-[#C58B36]">
                {hotspot.activeCount} Unresolved
              </div>
              <span className="text-[10px] text-[#737773]">
                {hotspot.resolvedCount} fixed
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">
                Recurrence Frequency
              </span>
              <div className="text-xl font-bold font-mono text-[#171918]">
                {hotspot.recurringCount} Repeats
              </div>
              <span className="text-[10px] text-[#315C4C]">Corridor fatigue</span>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">
                Community Citations
              </span>
              <div className="text-xl font-bold font-mono text-[#315C4C]">
                {hotspot.communityCitations} Residents
              </div>
              <span className="text-[10px] text-[#737773] font-mono">
                {hotspot.trendText}
              </span>
            </div>
          </div>

          {/* Location & Coordinates */}
          <div className="p-4 rounded-xl bg-white border border-[#E4E6E2] shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs text-[#737773]">
              <span className="flex items-center gap-1.5 font-medium text-[#171918]">
                <MapPin size={14} className="text-[#315C4C]" />
                <span>Geographic Centroid Coordinates</span>
              </span>
              <span className="font-mono text-[11px]">
                {hotspot.centerLat}°N, {hotspot.centerLng}°E
              </span>
            </div>
            <p className="text-xs text-[#737773] leading-relaxed">
              Spatial clustering algorithms determined a geographic center with a{' '}
              <strong className="text-[#171918]">{hotspot.radiusMeters}m</strong> dispersal radius across{' '}
              {hotspot.neighborhood}.
            </p>
          </div>

          {/* Category Breakdown */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#737773] font-semibold mb-2.5">
              Category Density Distribution
            </h4>
            <div className="flex flex-wrap gap-2">
              {hotspot.categories.map((c) => (
                <div
                  key={c.category}
                  className="px-3 py-1.5 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-xs flex items-center gap-2"
                >
                  <span className="font-semibold text-[#171918]">{c.category}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-[#E4E6E2] text-[10px] font-mono font-bold text-[#315C4C]">
                    {c.count} ({Math.round((c.count / hotspot.incidentCount) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Preventive Engineering Recommendation */}
          <div className="p-4 rounded-xl bg-[#FAF5ED] border border-[#C58B36]/30 text-xs text-[#171918] space-y-2">
            <div className="flex items-center gap-1.5 text-[#C58B36] font-mono font-semibold">
              <ShieldAlert size={14} />
              <span>PREVENTIVE ENGINEERING RECOMMENDATION</span>
            </div>
            <p className="leading-relaxed font-medium">
              {hotspot.preventiveRecommendation}
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] text-[#737773]">
              <span>Responsible Municipal Department: <strong className="text-[#171918]">{hotspot.recommendedDepartment}</strong></span>
              <span className="font-mono text-[10px] uppercase">Priority Score: {hotspot.hotspotScore}/100</span>
            </div>
          </div>

          {/* Linked Underlying Reports */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#737773] font-semibold">
                Underlying Ground Reports ({linkedReports.length})
              </h4>
              <span className="text-[11px] text-[#737773]">Click to inspect citizen evidence</span>
            </div>

            <div className="divide-y divide-[#E4E6E2] border border-[#E4E6E2] rounded-xl overflow-hidden bg-white">
              {linkedReports.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => onSelectReport && onSelectReport(rep)}
                  className="p-3.5 hover:bg-[#F5F5F2] transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#315C4C]">
                        {rep.ticketNumber}
                      </span>
                      <Badge severity={rep.severity} size="sm" />
                      <Badge status={rep.status} size="sm" />
                    </div>
                    <div className="font-medium text-[#171918] truncate">
                      {rep.title}
                    </div>
                    <div className="text-[11px] text-[#737773] truncate">
                      {rep.location}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-[#737773] font-mono">
                      {rep.confirmationsCount} citations
                    </span>
                    <ChevronRight size={14} className="text-[#737773]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Limitations Disclaimer */}
          <div className="p-3 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-[11px] text-[#737773] flex items-start gap-2">
            <Info size={14} className="text-[#315C4C] flex-shrink-0 mt-0.5" />
            <span>
              <strong>Data Limitations & Spatial Scope:</strong> Hotspot coordinates and clustering boundaries are derived algorithmically from citizen-reported incidents within the CivicEye database. Clustering scores do not replace certified GHMC geotechnical surveys or official structural stress tests.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#F5F5F2] border-t border-[#E4E6E2] flex items-center justify-between text-xs">
          <span className="text-[#737773] font-mono">
            Cluster Reference: {hotspot.id}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-[#E4E6E2] font-semibold text-[#171918] hover:bg-[#E4E6E2]/40 transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
