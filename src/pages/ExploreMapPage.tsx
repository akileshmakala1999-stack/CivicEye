import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DashboardReport,
  HyderabadNeighborhood,
  IssueCategory,
  IssueSeverity,
  HotspotData,
} from '../types';
import { reportService } from '../services/reportService';
import { INITIAL_NEARBY_ISSUES } from '../data/dashboardMockData';
import { Badge } from '../components/common/Badge';
import { ReportDetailModal } from '../components/dashboard/ReportDetailModal';
import { HotspotDetailModal } from '../components/insights/HotspotDetailModal';
import { communityValidationService } from '../services/communityValidationService';
import { citywideIntelligenceService } from '../services/citywideIntelligenceService';
import {
  MapPin,
  Search,
  Users,
  Eye,
  RotateCcw,
  Flame,
  AlertTriangle,
  Layers,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface MapIncident {
  id: string;
  ticketNumber: string;
  title: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: string;
  location: string;
  neighborhood: HyderabadNeighborhood;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
  confirmationsCount: number;
  reportDate: string;
  originalReport?: DashboardReport;
  isNew?: boolean;
  gettingWorseCount: number;
  stillExistsCount: number;
  appearsFixedCount: number;
  evidenceCount: number;
  isChallenged: boolean;
}

export type MapLayer =
  | 'all'
  | 'hotspots'
  | 'density'
  | 'critical'
  | 'recurring'
  | 'unresolved'
  | 'resolved';

// Convert Hyderabad lat/lng to percentage coordinates on the map view
function projectCoordinates(
  lat: number,
  lng: number,
  fallbackX?: number,
  fallbackY?: number
): { x: number; y: number } {
  if (fallbackX !== undefined && fallbackY !== undefined) {
    return { x: fallbackX, y: fallbackY };
  }
  const minLat = 17.405;
  const maxLat = 17.465;
  const minLng = 78.345;
  const maxLng = 78.455;

  const x = Math.min(92, Math.max(8, ((lng - minLng) / (maxLng - minLng)) * 100));
  const y = Math.min(92, Math.max(8, (1 - (lat - minLat) / (maxLat - minLat)) * 100));
  return { x: Math.round(x), y: Math.round(y) };
}

export const ExploreMapPage: React.FC = () => {
  const [reports, setReports] = useState<DashboardReport[]>([]);
  const [incidents, setIncidents] = useState<MapIncident[]>([]);
  const [hotspots, setHotspots] = useState<HotspotData[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<MapIncident | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotData | null>(null);
  const [detailModalReport, setDetailModalReport] = useState<DashboardReport | null>(null);
  const [inspectingHotspotModal, setInspectingHotspotModal] = useState<HotspotData | null>(null);

  // Phase 7 Map Layer
  const [activeLayer, setActiveLayer] = useState<MapLayer>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Filters
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSignal, setSelectedSignal] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load and merge all reports with spatial coordinates
  const loadReports = async () => {
    const rawReports = await reportService.getAllReports();
    setReports(rawReports);

    const hsList = citywideIntelligenceService.detectHotspots(rawReports);
    setHotspots(hsList);

    const mapped: MapIncident[] = [];

    // 1. Map dashboard user & newly submitted reports
    rawReports.forEach((rep, index) => {
      let lat = rep.latitude || 17.4325;
      let lng = rep.longitude || 78.4071;

      if (!rep.latitude) {
        if (rep.neighborhood === 'Banjara Hills') {
          lat = 17.4156;
          lng = 78.4352;
        } else if (rep.neighborhood === 'Madhapur') {
          lat = 17.4504;
          lng = 78.3808;
        } else if (rep.neighborhood === 'Gachibowli') {
          lat = 17.4435;
          lng = 78.3489;
        }
      }

      const coords = projectCoordinates(lat, lng, 35 + (index % 4) * 15, 30 + ((index * 2) % 5) * 12);
      const comm = communityValidationService.getCommunitySummary(rep.id);
      const res = communityValidationService.getResolutionInfo(rep.id);

      mapped.push({
        id: rep.id,
        ticketNumber: rep.ticketNumber,
        title: rep.title,
        category: rep.category,
        severity: rep.severity,
        status: rep.status,
        location: rep.location,
        neighborhood: rep.neighborhood,
        lat,
        lng,
        mapX: coords.x,
        mapY: coords.y,
        confirmationsCount: rep.confirmationsCount,
        reportDate: rep.reportDate,
        originalReport: rep,
        isNew: rep.status === 'Submitted' && rep.reportDate === 'Today',
        gettingWorseCount: comm.gettingWorse,
        stillExistsCount: comm.stillExists,
        appearsFixedCount: comm.appearsFixed,
        evidenceCount: comm.evidenceCount,
        isChallenged: res.isChallenged,
      });
    });

    // 2. Map nearby community issues
    INITIAL_NEARBY_ISSUES.forEach((nearby, i) => {
      if (!mapped.some((m) => m.id === nearby.id)) {
        const defaultCoords =
          nearby.neighborhood === 'Jubilee Hills'
            ? { lat: 17.4345, lng: 78.4085, x: 44 + i * 5, y: 39 + i * 6 }
            : nearby.neighborhood === 'Banjara Hills'
            ? { lat: 17.418, lng: 78.432, x: 62 + i * 4, y: 56 + i * 5 }
            : { lat: 17.448, lng: 78.385, x: 28 + i * 5, y: 28 + i * 6 };

        const comm = communityValidationService.getCommunitySummary(nearby.id);
        const res = communityValidationService.getResolutionInfo(nearby.id);

        mapped.push({
          id: nearby.id,
          ticketNumber: `HYD-${nearby.id.toUpperCase()}`,
          title: nearby.title,
          category: nearby.category,
          severity: nearby.severity,
          status: nearby.status,
          location: nearby.approximateLocation,
          neighborhood: nearby.neighborhood,
          lat: defaultCoords.lat,
          lng: defaultCoords.lng,
          mapX: defaultCoords.x,
          mapY: defaultCoords.y,
          confirmationsCount: nearby.confirmationsCount,
          reportDate: nearby.reportedTime,
          gettingWorseCount: comm.gettingWorse,
          stillExistsCount: comm.stillExists,
          appearsFixedCount: comm.appearsFixed,
          evidenceCount: comm.evidenceCount,
          isChallenged: res.isChallenged,
        });
      }
    });

    setIncidents(mapped);
    if (mapped.length > 0 && !selectedIncident) {
      setSelectedIncident(mapped[0]);
    }
  };

  useEffect(() => {
    loadReports();

    const handleUpdate = () => loadReports();
    window.addEventListener('civiceye_reports_updated', handleUpdate);
    window.addEventListener('civiceye_community_updated', handleUpdate);
    window.addEventListener('civiceye_operations_updated', handleUpdate);
    return () => {
      window.removeEventListener('civiceye_reports_updated', handleUpdate);
      window.removeEventListener('civiceye_community_updated', handleUpdate);
      window.removeEventListener('civiceye_operations_updated', handleUpdate);
    };
  }, []);

  // Filter incidents according to active layer + filter selections
  const filteredIncidents = incidents.filter((inc) => {
    // 1. Layer filtering
    if (activeLayer === 'critical') {
      if (inc.severity !== 'critical' && inc.severity !== 'high') return false;
    } else if (activeLayer === 'recurring') {
      // Show recurring candidate reports
      if (!inc.title.toLowerCase().includes('pothole') && !inc.title.toLowerCase().includes('waste') && !inc.title.toLowerCase().includes('leakage')) {
        return false;
      }
    } else if (activeLayer === 'unresolved') {
      if (inc.status === 'Resolved') return false;
    } else if (activeLayer === 'resolved') {
      if (inc.status !== 'Resolved') return false;
    }

    // 2. Ward filter
    if (selectedWard !== 'all' && inc.neighborhood !== selectedWard) return false;

    // 3. Category filter
    if (selectedCategory !== 'all' && inc.category !== selectedCategory) return false;

    // 4. Status filter
    if (selectedStatus !== 'all' && inc.status !== selectedStatus) return false;

    // 5. Community signal filter
    if (selectedSignal === 'getting_worse' && inc.gettingWorseCount === 0) return false;
    if (selectedSignal === 'challenged' && !inc.isChallenged) return false;
    if (selectedSignal === 'has_evidence' && inc.evidenceCount === 0) return false;

    // 6. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = inc.title.toLowerCase().includes(q);
      const matchLoc = inc.location.toLowerCase().includes(q);
      const matchTicket = inc.ticketNumber.toLowerCase().includes(q);
      if (!matchTitle && !matchLoc && !matchTicket) return false;
    }

    return true;
  });

  const handleOpenDetailModal = (incident: MapIncident) => {
    if (incident.originalReport) {
      setDetailModalReport(incident.originalReport);
    } else {
      const normalized: DashboardReport = {
        id: incident.id,
        ticketNumber: incident.ticketNumber,
        title: incident.title,
        category: incident.category,
        reportDate: incident.reportDate,
        reportTimestamp: incident.reportDate,
        location: incident.location,
        neighborhood: incident.neighborhood,
        severity: incident.severity,
        status: incident.status as any,
        confirmationsCount: incident.confirmationsCount,
        description: `${incident.title} located at ${incident.location}. Verified on civic observation map.`,
        departmentAssigned: 'GHMC Municipal Engineering Services',
        timeline: [],
      };
      setDetailModalReport(normalized);
    }
  };

  const getHotspotColor = (classification: string) => {
    switch (classification) {
      case 'Critical':
        return '#B8463B';
      case 'High':
        return '#C58B36';
      default:
        return '#315C4C';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-[#171918] py-6 sm:py-10 px-4 sm:px-6 lg:px-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full space-y-6 flex-1 flex flex-col">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E6E2]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#315C4C] font-semibold mb-1">
              <MapPin size={14} />
              <span>GEOGRAPHIC INFORMATION SYSTEM • SPATIAL RADAR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171918]">
              Explore Urban Incidents & Spatial Hotspots
            </h1>
            <p className="text-xs text-[#737773] mt-0.5 max-w-xl">
              Real-time map plotting citizen reports, corridor clusters, recurring defects, and decentralized community verification signals.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/insights"
              className="px-3.5 py-2 rounded-lg bg-white border border-[#E4E6E2] text-xs font-medium text-[#171918] hover:bg-[#F5F5F2] transition-colors shadow-2xs"
            >
              Citywide Analytics
            </Link>
            <Link
              to="/report"
              className="px-4 py-2 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] transition-colors shadow-xs"
            >
              Report an Issue
            </Link>
          </div>
        </div>

        {/* FEATURE 3: INTERACTIVE MAP LAYER SELECTOR */}
        <div className="flex items-center gap-2 border-b border-[#E4E6E2] overflow-x-auto pb-2 text-xs">
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#737773] uppercase mr-1">
            <Layers size={13} className="text-[#315C4C]" />
            <span>Map Layer:</span>
          </span>

          {[
            { id: 'all', label: 'All Incidents', count: incidents.length },
            { id: 'hotspots', label: 'Hotspots & Clusters', count: hotspots.length },
            { id: 'density', label: 'Report Density Halo', count: incidents.length },
            { id: 'critical', label: 'Critical & High Risk', count: incidents.filter((i) => i.severity === 'critical' || i.severity === 'high').length },
            { id: 'recurring', label: 'Recurring Defect Nodes', count: 4 },
            { id: 'unresolved', label: 'Active Backlog Queue', count: incidents.filter((i) => i.status !== 'Resolved').length },
            { id: 'resolved', label: 'Resolved & Verified', count: incidents.filter((i) => i.status === 'Resolved').length },
          ].map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setActiveLayer(l.id as MapLayer)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeLayer === l.id
                  ? 'bg-[#315C4C] text-white shadow-xs'
                  : 'bg-white text-[#737773] hover:text-[#171918] border border-[#E4E6E2]'
              }`}
            >
              <span>{l.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                  activeLayer === l.id ? 'bg-white/20 text-white' : 'bg-[#F5F5F2] text-[#737773]'
                }`}
              >
                {l.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div className="p-3.5 bg-white border border-[#E4E6E2] rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-[#737773]" />
              <input
                type="text"
                placeholder="Search ticket, road, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2] text-xs text-[#171918] placeholder-[#737773] focus:border-[#315C4C] outline-none w-48 sm:w-56"
              />
            </div>

            {/* Ward Filter */}
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none"
            >
              <option value="all">All Wards</option>
              <option value="Jubilee Hills">Jubilee Hills</option>
              <option value="Banjara Hills">Banjara Hills</option>
              <option value="Madhapur">Madhapur</option>
              <option value="Gachibowli">Gachibowli</option>
              <option value="Kondapur">Kondapur</option>
              <option value="Begumpet">Begumpet</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none"
            >
              <option value="all">All Categories</option>
              <option value="Road damage">Road damage</option>
              <option value="Garbage">Garbage / Waste</option>
              <option value="Water leakage">Water leakage</option>
              <option value="Drainage">Drainage</option>
              <option value="Streetlights">Streetlights</option>
              <option value="Electrical Hazard">Electrical Hazard</option>
              <option value="Damaged footpaths">Damaged footpaths</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            {/* Community Signals */}
            <select
              value={selectedSignal}
              onChange={(e) => setSelectedSignal(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#315C4C]/40 bg-[#FAFBF9] text-xs text-[#315C4C] font-medium focus:border-[#315C4C] outline-none"
            >
              <option value="all">Community Signals (All)</option>
              <option value="getting_worse">🔥 Flagged Getting Worse</option>
              <option value="challenged">⚠️ Resolution Challenged</option>
              <option value="has_evidence">📷 Attached Citizen Evidence</option>
            </select>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-[#737773]">
            <span>Showing {filteredIncidents.length} of {incidents.length} pinned</span>
            {(selectedWard !== 'all' ||
              selectedCategory !== 'all' ||
              selectedStatus !== 'all' ||
              selectedSignal !== 'all' ||
              searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedWard('all');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setSelectedSignal('all');
                  setSearchQuery('');
                }}
                className="text-[#315C4C] hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw size={10} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Map Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
          {/* MAP CANVAS (8 Cols) */}
          <div className="lg:col-span-8 bg-white border border-[#E4E6E2] rounded-xl overflow-hidden shadow-sm relative">
            {/* Map Top Coordinates Bar & Zoom Controls */}
            <div className="px-4 py-2.5 bg-[#F5F5F2] border-b border-[#E4E6E2] flex items-center justify-between text-xs font-mono text-[#737773]">
              <div className="flex items-center gap-2 text-[#315C4C] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#315C4C] animate-pulse" />
                <span>HYDERABAD PILOT GRID • ACTIVE GIS LAYER: {activeLayer.toUpperCase()}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white border border-[#E4E6E2] rounded p-0.5">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                    className="p-1 hover:bg-[#F5F5F2] rounded text-[#171918]"
                    title="Zoom in"
                  >
                    <ZoomIn size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.9, z - 0.1))}
                    className="p-1 hover:bg-[#F5F5F2] rounded text-[#171918]"
                    title="Zoom out"
                  >
                    <ZoomOut size={12} />
                  </button>
                </div>
                <span>17°26'N 78°24'E</span>
              </div>
            </div>

            {/* Interactive SVG Urban Baselayer */}
            <div
              className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#F5F5F2] overflow-hidden select-none transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            >
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="explore-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E4E6E2" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="#F5F5F2" />
                <rect width="100" height="100" fill="url(#explore-grid)" />

                {/* Urban Blocks & Neighborhoods */}
                <rect x="25" y="18" width="28" height="28" rx="2" fill="#FFFFFF" stroke="#E4E6E2" strokeWidth="0.6" />
                <text x="39" y="32" textAnchor="middle" fill="#737773" fontSize="2.8" fontFamily="monospace" opacity="0.8">
                  JUBILEE HILLS
                </text>

                <rect x="58" y="38" width="30" height="30" rx="2" fill="#FFFFFF" stroke="#E4E6E2" strokeWidth="0.6" />
                <text x="73" y="53" textAnchor="middle" fill="#737773" fontSize="2.8" fontFamily="monospace" opacity="0.8">
                  BANJARA HILLS
                </text>

                <rect x="15" y="10" width="22" height="20" rx="2" fill="#FFFFFF" stroke="#E4E6E2" strokeWidth="0.6" />
                <text x="26" y="20" textAnchor="middle" fill="#737773" fontSize="2.4" fontFamily="monospace" opacity="0.8">
                  MADHAPUR
                </text>

                <rect x="10" y="55" width="25" height="35" rx="2" fill="#FFFFFF" stroke="#E4E6E2" strokeWidth="0.6" />
                <text x="22" y="72" textAnchor="middle" fill="#737773" fontSize="2.6" fontFamily="monospace" opacity="0.8">
                  GACHIBOWLI
                </text>

                {/* Durgam Cheruvu Lake */}
                <path
                  d="M 40 24 Q 48 30 46 40 Q 42 46 36 42 Q 32 30 40 24 Z"
                  fill="#DDE7DF"
                  stroke="#315C4C"
                  strokeWidth="0.4"
                  strokeOpacity="0.5"
                />
                <text x="42" y="36" textAnchor="middle" fill="#315C4C" fontSize="1.8" fontFamily="monospace">
                  DURGAM CHERUVU
                </text>

                {/* Major Thoroughfares */}
                <line x1="0" y1="50" x2="100" y2="50" stroke="#FFFFFF" strokeWidth="3" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#E4E6E2" strokeWidth="0.6" />

                <line x1="55" y1="0" x2="55" y2="100" stroke="#FFFFFF" strokeWidth="3" />
                <line x1="55" y1="0" x2="55" y2="100" stroke="#E4E6E2" strokeWidth="0.6" />

                <line x1="28" y1="0" x2="28" y2="100" stroke="#FFFFFF" strokeWidth="2.5" />
                <line x1="28" y1="0" x2="28" y2="100" stroke="#E4E6E2" strokeWidth="0.6" />

                <line x1="20" y1="80" x2="70" y2="20" stroke="#FFFFFF" strokeWidth="2.5" />
                <line x1="20" y1="80" x2="70" y2="20" stroke="#E4E6E2" strokeWidth="0.5" />

                {/* FEATURE 2 & 3: SPATIAL HOTSPOT HALOS ON MAP */}
                {(activeLayer === 'hotspots' || activeLayer === 'density') &&
                  hotspots.map((hs, i) => {
                    const coords = projectCoordinates(hs.centerLat, hs.centerLng, 35 + (i % 3) * 20, 30 + (i % 3) * 18);
                    const color = getHotspotColor(hs.classification);
                    const isSelected = selectedHotspot?.id === hs.id;

                    return (
                      <g
                        key={hs.id}
                        className="cursor-pointer"
                        style={{ pointerEvents: 'all' }}
                        data-testid="hotspot-halo"
                        onClick={() => {
                          setSelectedHotspot(hs);
                          setSelectedIncident(null);
                        }}
                      >
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r={activeLayer === 'density' ? 12 : 9}
                          fill={color}
                          fillOpacity={isSelected ? 0.35 : 0.2}
                          stroke={color}
                          strokeWidth={isSelected ? 1.2 : 0.6}
                          strokeDasharray={isSelected ? '2,2' : undefined}
                        />
                        <circle cx={coords.x} cy={coords.y} r={1.5} fill={color} />
                      </g>
                    );
                  })}
              </svg>

              {/* Placed Interactive Hotspot Cluster Badges (HTML Overlay for 100% Click Reliability) */}
              {(activeLayer === 'hotspots' || activeLayer === 'density') &&
                hotspots.map((hs, i) => {
                  const coords = projectCoordinates(hs.centerLat, hs.centerLng, 35 + (i % 3) * 20, 30 + (i % 3) * 18);
                  const isSelected = selectedHotspot?.id === hs.id;
                  const isCritical = hs.classification === 'Critical';

                  return (
                    <button
                      key={`hs-badge-${hs.id}`}
                      type="button"
                      data-testid={`hotspot-badge-${hs.id}`}
                      style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-md border transition-all ${
                        isSelected
                          ? 'ring-2 ring-[#171918] scale-110 bg-[#171918] text-white border-white'
                          : isCritical
                          ? 'bg-[#B8463B] text-white border-white/80 hover:scale-105'
                          : 'bg-[#C58B36] text-white border-white/80 hover:scale-105'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHotspot(hs);
                        setSelectedIncident(null);
                      }}
                      title={`${hs.title} (Hotspot Score: ${hs.hotspotScore})`}
                    >
                      <Flame size={11} className="shrink-0" />
                      <span className="text-[10px] font-mono font-bold whitespace-nowrap">
                        {hs.classification} {hs.hotspotScore}
                      </span>
                    </button>
                  );
                })}

              {/* Placed Interactive Incident Pins */}
              {filteredIncidents.map((incident) => {
                const isSelected = selectedIncident?.id === incident.id;
                const isCritical = incident.severity === 'critical';
                const isHigh = incident.severity === 'high';

                const markerBg = isCritical ? 'bg-[#B8463B]' : isHigh ? 'bg-[#C58B36]' : 'bg-[#315C4C]';

                return (
                  <div
                    key={incident.id}
                    style={{ left: `${incident.mapX}%`, top: `${incident.mapY}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-transform group"
                    onClick={() => {
                      setSelectedIncident(incident);
                      setSelectedHotspot(null);
                    }}
                  >
                    {(incident.isNew || isSelected || incident.gettingWorseCount > 0) && (
                      <span
                        className={`absolute -inset-2 rounded-full animate-ping ${
                          incident.gettingWorseCount > 0 ? 'bg-[#B8463B]/30' : 'bg-[#315C4C]/30'
                        }`}
                      />
                    )}

                    <div
                      className={`relative w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white transition-all ${markerBg} ${
                        isSelected ? 'scale-125 ring-2 ring-[#171918]' : 'hover:scale-110'
                      }`}
                      title={`${incident.title} (${incident.severity})`}
                    >
                      {incident.gettingWorseCount > 0 ? (
                        <Flame size={12} className="text-white fill-white" />
                      ) : incident.isChallenged ? (
                        <AlertTriangle size={12} className="text-white" />
                      ) : (
                        <MapPin size={12} />
                      )}

                      {incident.gettingWorseCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#B8463B] border border-white flex items-center justify-center text-[8px] font-bold">
                          !
                        </span>
                      )}
                      {incident.isChallenged && (
                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#C58B36] border border-white flex items-center justify-center text-[8px] font-bold">
                          ?
                        </span>
                      )}
                    </div>

                    <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-7 px-2 py-0.5 rounded bg-[#171918] text-white text-[10px] font-mono whitespace-nowrap shadow-md z-30 pointer-events-none">
                      {incident.ticketNumber} • {incident.title.slice(0, 22)}...
                    </div>
                  </div>
                );
              })}

              {/* Map Legend */}
              <div className="absolute bottom-3 left-3 p-2.5 rounded-lg bg-white/95 border border-[#E4E6E2] shadow-xs text-[10px] font-mono space-y-1">
                <span className="text-[#737773] block uppercase font-bold text-[9px]">Map Layers & Signals:</span>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#B8463B]" />
                    <span>Critical</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#C58B36]" />
                    <span>High</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#315C4C]" />
                    <span>Standard</span>
                  </span>
                  {activeLayer === 'hotspots' && (
                    <span className="flex items-center gap-1 text-[#B8463B]">
                      <span className="w-3 h-3 rounded-full border border-[#B8463B] bg-[#B8463B]/20" />
                      <span>Cluster Halo</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[#B8463B]">
                    <Flame size={10} />
                    <span>Worsening</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* INSPECTOR PANEL / LIST (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* HOTSPOT SUMMARY CARD (WHEN HOTSPOT SELECTED) */}
            {selectedHotspot ? (
              <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 shadow-sm space-y-3.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E6E2]">
                  <div className="flex items-center gap-2">
                    <Flame size={14} className="text-[#B8463B]" />
                    <span className="font-mono text-xs font-bold text-[#B8463B]">
                      {selectedHotspot.classification} Hotspot
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#171918]">
                    Score: {selectedHotspot.hotspotScore}/100
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#171918]">
                    {selectedHotspot.title}
                  </h3>
                  <div className="text-xs text-[#737773] mt-0.5">
                    {selectedHotspot.neighborhood} • {selectedHotspot.incidentCount} linked reports
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#FAF5ED] border border-[#C58B36]/30 text-xs text-[#171918] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#C58B36] font-bold block">
                    Preventive Recommendation:
                  </span>
                  <p className="line-clamp-3 leading-relaxed">
                    {selectedHotspot.preventiveRecommendation}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="font-mono text-[11px] text-[#737773]">
                    {selectedHotspot.communityCitations} citizen citations
                  </span>

                  <button
                    type="button"
                    onClick={() => setInspectingHotspotModal(selectedHotspot)}
                    className="px-3 py-1.5 rounded-md bg-[#315C4C] text-white text-xs font-medium hover:bg-[#26483B] flex items-center gap-1 transition-colors"
                  >
                    <Eye size={12} />
                    <span>Deep Inspection</span>
                  </button>
                </div>
              </div>
            ) : selectedIncident ? (
              /* INDIVIDUAL INCIDENT CARD */
              <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E6E2]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#315C4C]" />
                    <span className="font-mono text-xs font-bold text-[#315C4C]">
                      {selectedIncident.ticketNumber}
                    </span>
                  </div>
                  <Badge severity={selectedIncident.severity} dot size="sm" />
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-[#737773] block mb-1">
                    {selectedIncident.category} • {selectedIncident.neighborhood}
                  </span>
                  <h3 className="text-sm font-bold text-[#171918] leading-snug">
                    {selectedIncident.title}
                  </h3>
                </div>

                <div className="p-3 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] text-xs space-y-2">
                  <div className="flex items-start gap-1.5 text-[#737773]">
                    <MapPin size={13} className="text-[#315C4C] mt-0.5 flex-shrink-0" />
                    <span className="text-[#171918] font-medium leading-snug">{selectedIncident.location}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#E4E6E2]/70 text-[11px] font-mono text-[#737773]">
                    <span>Coordinates:</span>
                    <span className="text-[#171918] font-semibold">
                      {selectedIncident.lat}°N, {selectedIncident.lng}°E
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#737773]">
                    <span>Current Status:</span>
                    <Badge status={selectedIncident.status as any} size="sm" />
                  </div>
                </div>

                {/* Community Validation Signals */}
                <div className="p-2.5 rounded-lg border border-[#E4E6E2] bg-[#FAFBF9] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[10px] font-mono font-semibold uppercase text-[#737773]">
                    <span>Community Signals</span>
                    <span className="text-[#315C4C]">Decentralized Consensus</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                    <div className="p-1 rounded bg-white border border-[#E4E6E2]">
                      <span className="text-[#737773] block text-[8px]">EXISTS</span>
                      <span className="font-bold text-[#171918]">{selectedIncident.stillExistsCount}</span>
                    </div>
                    <div
                      className={`p-1 rounded border ${
                        selectedIncident.gettingWorseCount > 0
                          ? 'bg-[#FAF0EF] border-[#B8463B]/30 text-[#B8463B]'
                          : 'bg-white border-[#E4E6E2] text-[#737773]'
                      }`}
                    >
                      <span className="block text-[8px]">WORSE</span>
                      <span className="font-bold">{selectedIncident.gettingWorseCount}</span>
                    </div>
                    <div className="p-1 rounded bg-white border border-[#E4E6E2]">
                      <span className="text-[#737773] block text-[8px]">FIXED</span>
                      <span className="font-bold text-[#315C4C]">{selectedIncident.appearsFixedCount}</span>
                    </div>
                    <div
                      className={`p-1 rounded border ${
                        selectedIncident.evidenceCount > 0
                          ? 'bg-[#DDE7DF]/50 border-[#315C4C]/30 text-[#315C4C]'
                          : 'bg-white border-[#E4E6E2] text-[#737773]'
                      }`}
                    >
                      <span className="block text-[8px]">PHOTOS</span>
                      <span className="font-bold">{selectedIncident.evidenceCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#171918]">
                    <Users size={12} className="text-[#315C4C]" />
                    <span>{selectedIncident.confirmationsCount} validations</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenDetailModal(selectedIncident)}
                    className="px-3.5 py-1.5 rounded-md bg-[#315C4C] text-white text-xs font-medium hover:bg-[#26483B] flex items-center gap-1 transition-colors"
                  >
                    <Eye size={12} />
                    <span>View Report</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Compact List of Visible Incidents */}
            <div className="bg-white border border-[#E4E6E2] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E4E6E2]">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171918]">
                  Visible Ward Reports ({filteredIncidents.length})
                </h4>
                <span className="text-[10px] font-mono text-[#737773]">SELECT TO PAN</span>
              </div>

              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {filteredIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => {
                      setSelectedIncident(inc);
                      setSelectedHotspot(null);
                    }}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all text-xs ${
                      selectedIncident?.id === inc.id
                        ? 'border-[#315C4C] bg-[#DDE7DF]/20'
                        : 'border-[#E4E6E2] bg-[#F5F5F2]/40 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-semibold text-[#315C4C]">
                        {inc.ticketNumber}
                      </span>
                      <Badge severity={inc.severity} size="sm" />
                    </div>
                    <div className="font-medium text-[#171918] truncate">{inc.title}</div>
                    <div className="text-[10px] text-[#737773] truncate mt-0.5">{inc.location}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Detail Modal */}
      <ReportDetailModal
        report={detailModalReport}
        onClose={() => setDetailModalReport(null)}
      />

      {/* Hotspot Detail Modal */}
      {inspectingHotspotModal && (
        <HotspotDetailModal
          hotspot={inspectingHotspotModal}
          onClose={() => setInspectingHotspotModal(null)}
          reports={reports}
          onSelectReport={(rep) => {
            setInspectingHotspotModal(null);
            setDetailModalReport(rep);
          }}
        />
      )}
    </div>
  );
};
