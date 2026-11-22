import React, { useState } from 'react';
import {
  DashboardReport,
  HotspotData,
  WorkOrder,
  DigitalTwinLayerConfig,
  DigitalTwinLayerId,
  SpatialDensityCell,
  CascadingDependencyChain,
  InfrastructureRelationship,
  CoordinateAccuracyLevel,
} from '../../types';
import { projectCoordinates } from '../../services/digitalTwinService';
import {
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  X,
  MapPin,
  Flame,
  Info,
} from 'lucide-react';

interface DigitalTwinMapProps {
  reports: (DashboardReport & {
    effectiveLat: number;
    effectiveLng: number;
    x: number;
    y: number;
    accuracyLevel?: CoordinateAccuracyLevel;
  })[];
  nonGeographicCount: number;
  outsideViewportCount?: number;
  layers: DigitalTwinLayerConfig[];
  hotspots: HotspotData[];
  workOrders: WorkOrder[];
  densityGrid: SpatialDensityCell[];
  cascadingChains: CascadingDependencyChain[];
  relationships?: InfrastructureRelationship[];
  simulatedResolvedIds?: string[];
  simulatedDay?: number;
  onSelectReport?: (report: DashboardReport) => void;
}

export const DigitalTwinMap: React.FC<DigitalTwinMapProps> = ({
  reports,
  nonGeographicCount,
  outsideViewportCount = 0,
  layers,
  hotspots,
  workOrders,
  densityGrid,
  cascadingChains,
  relationships: _relationships,
  simulatedResolvedIds = [],
  simulatedDay,
  onSelectReport,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedReport, setSelectedReport] = useState<DashboardReport | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotData | null>(null);
  const [showAccuracyInfo, setShowAccuracyInfo] = useState<boolean>(false);

  const isLayerEnabled = (id: DigitalTwinLayerId): boolean => {
    return layers.find((l) => l.id === id)?.isEnabled ?? false;
  };

  const simulatedResolvedSet = new Set(simulatedResolvedIds);

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '#B8463B';
      case 'high':
        return '#C58B36';
      case 'medium':
        return '#315C4C';
      case 'low':
      default:
        return '#737773';
    }
  };

  return (
    <div className="relative w-full h-[440px] sm:h-[620px] bg-[#F5F5F2] rounded-lg border border-[#E4E6E2] overflow-hidden select-none">
      {/* Top Right Controls & Accuracy Info Button */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end space-y-1.5">
        <div className="flex flex-col space-y-1 bg-white/95 p-1 rounded-md border border-[#E4E6E2] shadow-sm backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.min(2.0, prev + 0.25))}
            className="p-1.5 text-[#171918] hover:bg-[#F5F5F2] rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.max(0.75, prev - 0.25))}
            className="p-1.5 text-[#171918] hover:bg-[#F5F5F2] rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1.5 text-[#737773] hover:bg-[#F5F5F2] rounded transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Map Accuracy & Data Source Indicator */}
        <button
          type="button"
          onClick={() => setShowAccuracyInfo((prev) => !prev)}
          className="px-2.5 py-1 rounded-md bg-white/95 border border-[#E4E6E2] shadow-xs text-[10px] font-medium text-[#315C4C] hover:bg-[#F5F5F2] flex items-center space-x-1.5 backdrop-blur-sm"
          title="Inspect map geographic accuracy, schematic limitations, and spatial data sources"
        >
          <Info className="w-3 h-3 text-[#315C4C]" />
          <span>Schematic Reference Grid</span>
        </button>
      </div>

      {/* Accuracy & Spatial Data Source Dialog */}
      {showAccuracyInfo && (
        <div className="absolute top-16 right-3 z-30 w-80 bg-white rounded-lg shadow-xl border border-[#E4E6E2] p-4 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between border-b border-[#E4E6E2] pb-2">
            <div className="flex items-center space-x-2 text-[#315C4C] font-bold">
              <Info className="w-4 h-4" />
              <span>Map Accuracy & Spatial Data Audit</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAccuracyInfo(false)}
              className="text-[#737773] hover:text-[#171918]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2 text-[11px] text-[#737773]">
            <p>
              <strong className="text-[#171918]">Schematic Reference Grid:</strong> Street corridors,
              neighborhood blocks, and water bodies are visual schematic reference elements for spatial context,
              <strong> not official GIS cadastre or municipal survey boundaries</strong>.
            </p>
            <p>
              <strong className="text-[#171918]">Approximate Metropolitan Coverage:</strong> Regional bounding
              envelope (~17.20°–17.60°N, 78.15°–78.70°E) is an analytical bounding area, not an official GHMC boundary polygon.
            </p>
            <p>
              <strong className="text-[#171918]">Incident Geolocation:</strong> Reports with verified GPS
              appear as solid circular pins. Reports lacking device GPS are placed at approximate administrative ward centroids
              with a dashed border (derived from Telangana Open Data directory).
            </p>
            <p>
              <strong className="text-[#171918]">Spatial Proximity Disclosure:</strong> Spatial co-location
              identifies physical correlation and infrastructure proximity, not verified causal sequence.
            </p>
            <p>
              <strong className="text-[#171918]">Citywide Numerical Integrity:</strong> All reports outside this
              central urban viewport ({outsideViewportCount} reports) or lacking GPS ({nonGeographicCount} reports)
              are fully preserved in numerical citywide totals, backlog accounting, and simulation calculations.
            </p>
          </div>
        </div>
      )}

      {/* Non-Geographic & Viewport Status Banner */}
      {(nonGeographicCount > 0 || outsideViewportCount > 0) && (
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 border border-[#E4E6E2] px-3 py-1.5 rounded-md shadow-sm text-[11px] text-[#737773] flex items-center space-x-2 backdrop-blur-sm">
          <MapPin className="w-3.5 h-3.5 text-[#C58B36]" />
          <span>
            <strong className="text-[#171918] font-mono">{reports.length}</strong> in viewport •{' '}
            <strong className="text-[#171918] font-mono">{outsideViewportCount}</strong> outside viewport •{' '}
            <strong className="text-[#171918] font-mono">{nonGeographicCount}</strong> without GPS (all accounted for in citywide totals).
          </span>
        </div>
      )}

      {/* Active Simulation Day Badge Overlay */}
      {simulatedDay !== undefined && (
        <div className="absolute top-3 left-3 z-20 bg-[#315C4C] text-white px-3 py-1.5 rounded-md shadow-md text-xs font-semibold flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          <span>
            Simulated Timeline: <strong>Day {simulatedDay}</strong> ({simulatedResolvedSet.size} resolved)
          </span>
        </div>
      )}

      {/* Scalable Vector Map Canvas */}
      <div
        className="w-full h-full transition-transform duration-300 ease-out origin-center"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="twin-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E4E6E2" strokeWidth="0.4" />
            </pattern>
          </defs>

          {/* Background Canvas */}
          <rect width="100" height="100" fill="#F5F5F2" />
          <rect width="100" height="100" fill="url(#twin-grid)" />

          {/* Hyderabad Neighborhood Blocks */}
          <g opacity="0.85">
            {/* Jubilee Hills */}
            <rect x="26" y="20" width="26" height="26" rx="2" fill="#FFFFFF" stroke="#DDE7DF" strokeWidth="0.8" />
            <text x="39" y="33" textAnchor="middle" fill="#737773" fontSize="2.4" fontFamily="monospace" fontWeight="bold">
              JUBILEE HILLS
            </text>

            {/* Banjara Hills */}
            <rect x="58" y="38" width="28" height="28" rx="2" fill="#FFFFFF" stroke="#DDE7DF" strokeWidth="0.8" />
            <text x="72" y="52" textAnchor="middle" fill="#737773" fontSize="2.4" fontFamily="monospace" fontWeight="bold">
              BANJARA HILLS
            </text>

            {/* Madhapur / HITEC City */}
            <rect x="14" y="12" width="22" height="18" rx="2" fill="#FFFFFF" stroke="#DDE7DF" strokeWidth="0.8" />
            <text x="25" y="21" textAnchor="middle" fill="#737773" fontSize="2.2" fontFamily="monospace" fontWeight="bold">
              MADHAPUR
            </text>

            {/* Gachibowli */}
            <rect x="10" y="52" width="24" height="32" rx="2" fill="#FFFFFF" stroke="#DDE7DF" strokeWidth="0.8" />
            <text x="22" y="68" textAnchor="middle" fill="#737773" fontSize="2.2" fontFamily="monospace" fontWeight="bold">
              GACHIBOWLI
            </text>

            {/* Begumpet */}
            <rect x="66" y="14" width="24" height="20" rx="2" fill="#FFFFFF" stroke="#DDE7DF" strokeWidth="0.8" />
            <text x="78" y="24" textAnchor="middle" fill="#737773" fontSize="2.2" fontFamily="monospace" fontWeight="bold">
              BEGUMPET
            </text>

            {/* Durgam Cheruvu Lake */}
            <path
              d="M 40 25 Q 47 30 45 38 Q 42 44 36 41 Q 33 30 40 25 Z"
              fill="#DDE7DF"
              stroke="#315C4C"
              strokeWidth="0.5"
            />
            <text x="41" y="35" textAnchor="middle" fill="#315C4C" fontSize="1.6" fontFamily="sans-serif">
              Durgam Cheruvu
            </text>

            {/* Hussain Sagar */}
            <circle cx="85" cy="30" r="7" fill="#DDE7DF" stroke="#315C4C" strokeWidth="0.5" />
            <text x="85" y="31" textAnchor="middle" fill="#315C4C" fontSize="1.5" fontFamily="sans-serif">
              Hussain Sagar
            </text>

            {/* Arterial Road Corridors */}
            <line x1="0" y1="48" x2="100" y2="48" stroke="#FFFFFF" strokeWidth="2.8" />
            <line x1="0" y1="48" x2="100" y2="48" stroke="#DDE7DF" strokeWidth="0.6" />

            <line x1="55" y1="0" x2="55" y2="100" stroke="#FFFFFF" strokeWidth="2.8" />
            <line x1="55" y1="0" x2="55" y2="100" stroke="#DDE7DF" strokeWidth="0.6" />

            <line x1="28" y1="0" x2="28" y2="100" stroke="#FFFFFF" strokeWidth="2.2" />
            <line x1="28" y1="0" x2="28" y2="100" stroke="#DDE7DF" strokeWidth="0.5" />

            <line x1="20" y1="78" x2="72" y2="22" stroke="#FFFFFF" strokeWidth="2.4" />
            <line x1="20" y1="78" x2="72" y2="22" stroke="#DDE7DF" strokeWidth="0.5" />
          </g>

          {/* LAYER 10: RISK DENSITY HEAT GRID */}
          {isLayerEnabled('risk_density') && (
            <g opacity="0.65">
              {densityGrid.map((cell) => {
                const opacity = Math.max(0.1, cell.riskDensity);
                const color = cell.riskDensity > 0.6 ? '#B8463B' : cell.riskDensity > 0.3 ? '#C58B36' : '#315C4C';
                const cellW = 100 / 4;
                const cellH = 100 / 4;
                const cx = cell.gridX * cellW;
                const cy = cell.gridY * cellH;

                return (
                  <g key={cell.id}>
                    <rect
                      x={cx + 1}
                      y={cy + 1}
                      width={cellW - 2}
                      height={cellH - 2}
                      rx="1"
                      fill={color}
                      fillOpacity={opacity * 0.4}
                      stroke={color}
                      strokeWidth="0.4"
                      strokeDasharray="1,1"
                    />
                    {cell.reportCount > 0 && (
                      <text
                        x={cx + cellW / 2}
                        y={cy + cellH / 2 + 1}
                        textAnchor="middle"
                        fill={color}
                        fontSize="2.2"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {cell.reportCount} ({Math.round(cell.riskDensity * 100)}%)
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* LAYER 12: MULTI-AGENCY COORDINATION ZONES */}
          {isLayerEnabled('multi_agency_zones') && (
            <g>
              <rect
                x="32"
                y="24"
                width="28"
                height="22"
                rx="4"
                fill="#7E57C2"
                fillOpacity="0.12"
                stroke="#7E57C2"
                strokeWidth="0.8"
                strokeDasharray="2,2"
              />
              <text x="46" y="28" textAnchor="middle" fill="#7E57C2" fontSize="2.0" fontWeight="bold">
                MULTI-AGENCY ZONE A (GHMC + HMWSSB)
              </text>
            </g>
          )}

          {/* LAYER 8: INFRASTRUCTURE RELATIONSHIPS & DEPENDENCY ARCS */}
          {(isLayerEnabled('infrastructure_relationships') || isLayerEnabled('critical_risk')) && (
            <g>
              {cascadingChains.map((chain) => {
                const rootReport = reports.find((r) => r.id === chain.rootReportId);
                if (!rootReport) return null;

                return chain.nodes.slice(1).map((node) => {
                  const targetReport = reports.find((r) => r.id === node.reportId);
                  if (!targetReport) return null;

                  return (
                    <g key={`arc-${rootReport.id}-${targetReport.id}`}>
                      <line
                        x1={rootReport.x}
                        y1={rootReport.y}
                        x2={targetReport.x}
                        y2={targetReport.y}
                        stroke="#4A6984"
                        strokeWidth="0.8"
                        strokeDasharray="1.5,1.5"
                      />
                      <circle cx={(rootReport.x + targetReport.x) / 2} cy={(rootReport.y + targetReport.y) / 2} r="1" fill="#4A6984" />
                    </g>
                  );
                });
              })}
            </g>
          )}

          {/* LAYER 4: CIVIC HOTSPOTS (HALOS & CLUSTERS) */}
          {isLayerEnabled('civic_hotspots') && (
            <g>
              {hotspots.map((hs, i) => {
                const coords = projectCoordinates(hs.centerLat, hs.centerLng, 35 + (i % 3) * 20, 30 + (i % 3) * 18);
                const isSelected = selectedHotspot?.id === hs.id;
                const haloColor = hs.classification === 'Critical' ? '#B8463B' : '#C58B36';

                return (
                  <g
                    key={hs.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedHotspot(hs);
                      setSelectedReport(null);
                    }}
                  >
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={10}
                      fill={haloColor}
                      fillOpacity={isSelected ? 0.35 : 0.18}
                      stroke={haloColor}
                      strokeWidth={isSelected ? 1.0 : 0.5}
                      strokeDasharray={isSelected ? '2,2' : undefined}
                    />
                    <circle cx={coords.x} cy={coords.y} r={1.8} fill={haloColor} />
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* INTERACTIVE MARKERS (HTML OVERLAY) */}
        {reports.map((report) => {
          const isResolved =
            report.status.toLowerCase() === 'resolved' ||
            report.status.toLowerCase() === 'verified' ||
            simulatedResolvedSet.has(report.id);

          const isSimulatedResolved = simulatedResolvedSet.has(report.id);
          const isCritical = report.severity === 'critical';
          const isRecurring = Boolean(report.isRecurring || report.tags?.includes('recurring'));
          const hasCommunitySignal = (report.confirmationsCount || 0) > 0 || Boolean(report.isChallenged);
          const isWorkOrderActive = workOrders.some((wo) => wo.reportId === report.id);

          // Layer visibility filters
          if (!isLayerEnabled('all_reports')) {
            if (isLayerEnabled('active_issues') && isResolved) return null;
            if (isLayerEnabled('critical_risk') && !isCritical) return null;
            if (isLayerEnabled('recurring_issues') && !isRecurring) return null;
            if (isLayerEnabled('work_orders') && !isWorkOrderActive) return null;
            if (isLayerEnabled('community_signals') && !hasCommunitySignal) return null;
            if (isLayerEnabled('resolved_issues') && !isResolved) return null;
          } else {
            // All reports is on, but hide resolved if resolved layer is off
            if (isResolved && !isLayerEnabled('resolved_issues') && !isSimulatedResolved) {
              return null;
            }
          }

          const color = isSimulatedResolved
            ? '#2E7D32'
            : isResolved
            ? '#737773'
            : getSeverityColor(report.severity);

          return (
            <button
              key={`marker-${report.id}`}
              type="button"
              onClick={() => {
                setSelectedReport(report);
                setSelectedHotspot(null);
                if (onSelectReport) onSelectReport(report);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 focus:outline-none z-10"
              style={{ left: `${report.x}%`, top: `${report.y}%` }}
              title={`${report.ticketNumber || report.id}: ${report.title}`}
            >
              <div className="relative flex items-center justify-center">
                {isCritical && !isResolved && (
                  <span className="absolute w-5 h-5 rounded-full bg-red-400 opacity-75 animate-ping" />
                )}
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center shadow-md border-2 ${
                    isSimulatedResolved
                      ? 'border-emerald-300 bg-emerald-600 text-white'
                      : isResolved
                      ? 'border-gray-300 bg-gray-500 text-white'
                      : (report.accuracyLevel === 'approximate_centroid' || report.accuracyLevel === 'ward_centroid_approximation')
                      ? 'border-dashed border-amber-300 text-white ring-1 ring-amber-400/50'
                      : 'border-white text-white'
                  }`}
                  style={{
                    backgroundColor: isSimulatedResolved ? '#2E7D32' : isResolved ? '#737773' : color,
                  }}
                >
                  {isSimulatedResolved ? (
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  ) : isCritical ? (
                    <AlertTriangle className="w-2.5 h-2.5" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {/* HOTSPOT INTERACTIVE BADGES */}
        {isLayerEnabled('civic_hotspots') &&
          hotspots.map((hs, i) => {
            const coords = projectCoordinates(hs.centerLat, hs.centerLng, 35 + (i % 3) * 20, 30 + (i % 3) * 18);
            return (
              <button
                key={`badge-${hs.id}`}
                type="button"
                onClick={() => {
                  setSelectedHotspot(hs);
                  setSelectedReport(null);
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-15 bg-[#171918] text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-lg flex items-center space-x-1 border border-[#E4E6E2]"
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              >
                <Flame className="w-2.5 h-2.5 text-amber-400" />
                <span>{hs.incidentCount}</span>
              </button>
            );
          })}
      </div>

      {/* SELECTED REPORT DETAIL POPUP */}
      {selectedReport && (
        <div className="absolute top-4 left-4 z-30 w-80 bg-white rounded-lg shadow-xl border border-[#E4E6E2] p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#F5F5F2] text-[#315C4C]">
              {selectedReport.ticketNumber || selectedReport.id}
            </span>
            <button
              type="button"
              onClick={() => setSelectedReport(null)}
              className="text-[#737773] hover:text-[#171918]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-xs font-bold text-[#171918] mt-2 line-clamp-2">
            {selectedReport.title}
          </h4>
          <p className="text-[11px] text-[#737773] mt-1 line-clamp-2">
            {selectedReport.description}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-[#F5F5F2] p-1.5 rounded">
              <span className="text-[#737773] block">Category:</span>
              <span className="font-semibold text-[#171918] truncate block">
                {selectedReport.category}
              </span>
            </div>
            <div className="bg-[#F5F5F2] p-1.5 rounded">
              <span className="text-[#737773] block">Severity:</span>
              <span
                className="font-semibold capitalize block"
                style={{ color: getSeverityColor(selectedReport.severity) }}
              >
                {selectedReport.severity}
              </span>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-[#737773] flex items-center justify-between">
            <span>Ward: {selectedReport.neighborhood}</span>
            {simulatedResolvedSet.has(selectedReport.id) ? (
              <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Simulated Resolved</span>
              </span>
            ) : (
              <span className="font-medium text-[#171918]">Status: {selectedReport.status}</span>
            )}
          </div>

          <div className="mt-1.5 text-[9px] font-mono text-[#737773] bg-[#F5F5F2] px-2 py-1.5 rounded space-y-0.5">
            <div>
              <span className="font-bold text-[#171918]">Location Accuracy: </span>
              {selectedReport.latitude && selectedReport.longitude ? (
                <span className="text-[#315C4C] font-semibold">VERIFIED GPS ({selectedReport.latitude.toFixed(4)}°N, {selectedReport.longitude.toFixed(4)}°E)</span>
              ) : (
                <span className="text-[#C58B36] font-semibold">APPROXIMATE WARD CENTROID</span>
              )}
            </div>
            {!(selectedReport.latitude && selectedReport.longitude) && (
              <div className="text-[8px] text-[#737773] italic">
                Source: Telangana Open Data Sector Centroid • Not exact physical defect location.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SELECTED HOTSPOT POPUP */}
      {selectedHotspot && (
        <div className="absolute top-4 left-4 z-30 w-80 bg-white rounded-lg shadow-xl border border-[#E4E6E2] p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-red-50 text-[#B8463B] flex items-center space-x-1">
              <Flame className="w-3 h-3" />
              <span>Hotspot Cluster: {selectedHotspot.id}</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedHotspot(null)}
              className="text-[#737773] hover:text-[#171918]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-xs font-bold text-[#171918] mt-2">
            {selectedHotspot.title}
          </h4>
          <p className="text-[11px] text-[#737773] mt-1">
            {selectedHotspot.incidentCount} civic reports clustered within ~600m radius.
          </p>
          <div className="mt-3 bg-[#F5F5F2] p-2 rounded text-[10px] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#737773]">Primary Category:</span>
              <span className="font-bold text-[#171918]">{selectedHotspot.primaryCategory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737773]">Classification:</span>
              <span className="font-bold text-[#B8463B]">{selectedHotspot.classification}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
