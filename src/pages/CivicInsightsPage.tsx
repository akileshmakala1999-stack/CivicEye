import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DashboardReport,
  HotspotData,
  WorkOrder,
} from '../types';
import { reportService } from '../services/reportService';
import { operationsService } from '../services/operationsService';
import { citywideIntelligenceService } from '../services/citywideIntelligenceService';
import { Badge } from '../components/common/Badge';
import { HotspotDetailModal } from '../components/insights/HotspotDetailModal';
import { RecurringProblemsSection } from '../components/insights/RecurringProblemsSection';
import { EarlyWarningSection } from '../components/insights/EarlyWarningSection';
import { WardComparisonSection } from '../components/insights/WardComparisonSection';
import { TemporalTrendsSection } from '../components/insights/TemporalTrendsSection';
import { ReportDetailModal } from '../components/dashboard/ReportDetailModal';
import {
  LineChart,
  Flame,
  RotateCcw,
  Building2,
  TrendingUp,
  Download,
  Filter,
  ChevronRight,
  MapPin,
  Radio,
} from 'lucide-react';

export const CivicInsightsPage: React.FC = () => {
  const [reports, setReports] = useState<DashboardReport[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<
    'hotspots' | 'recurring' | 'early_warning' | 'trends' | 'wards' | 'registry'
  >('hotspots');

  // Filters
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRangeDays, setSelectedRangeDays] = useState<number>(30);

  // Modals
  const [inspectingHotspot, setInspectingHotspot] = useState<HotspotData | null>(null);
  const [inspectingReport, setInspectingReport] = useState<DashboardReport | null>(null);

  // Load live data
  const loadData = async () => {
    const reps = await reportService.getAllReports();
    const orders = operationsService.getWorkOrders();
    setReports(reps);
    setWorkOrders(orders);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('civiceye_reports_updated', handleUpdate);
    window.addEventListener('civiceye_community_updated', handleUpdate);
    window.addEventListener('civiceye_operations_updated', handleUpdate);
    return () => {
      window.removeEventListener('civiceye_reports_updated', handleUpdate);
      window.removeEventListener('civiceye_community_updated', handleUpdate);
      window.removeEventListener('civiceye_operations_updated', handleUpdate);
    };
  }, []);

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (selectedWard !== 'all' && r.neighborhood !== selectedWard) return false;
    if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
    if (selectedSeverity !== 'all' && r.severity !== selectedSeverity) return false;
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    return true;
  });

  // Calculate Citywide Metrics from real filtered dataset
  const metrics = citywideIntelligenceService.getCitywideMetrics(filteredReports, workOrders);
  const detectedHotspots = citywideIntelligenceService.detectHotspots(filteredReports);
  const recurringProblems = citywideIntelligenceService.detectRecurringProblems(filteredReports, workOrders);
  const earlyWarnings = citywideIntelligenceService.getEarlyWarningSignals(filteredReports);
  const wardComparisons = citywideIntelligenceService.getWardComparisons(filteredReports, workOrders);
  const temporalTrends = citywideIntelligenceService.getTimeTrends(filteredReports, selectedRangeDays);

  // Export CSV handler
  const handleExportData = () => {
    const headers =
      'TicketNumber,Category,Severity,Status,Neighborhood,Location,Confirmations,ReportDate\n';
    const rows = filteredReports
      .map(
        (r) =>
          `"${r.ticketNumber}","${r.category}","${r.severity}","${r.status}","${r.neighborhood}","${r.location.replace(
            /"/g,
            '""'
          )}",${r.confirmationsCount},"${r.reportDate}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civiceye-intelligence-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleSelectReportById = (reportId: string) => {
    const rep = reports.find((r) => r.id === reportId);
    if (rep) {
      setInspectingReport(rep);
    }
  };

  const getHotspotBadgeColor = (classification: string) => {
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
    <div className="min-h-screen bg-[#F5F5F2] text-[#171918] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E4E6E2]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#315C4C] font-semibold mb-1">
              <LineChart size={14} />
              <span>PHASE 7 • CITYWIDE CIVIC INTELLIGENCE ENGINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171918]">
              Citywide Intelligence, Hotspots & Early Warning
            </h1>
            <p className="text-xs text-[#737773] mt-0.5 max-w-2xl leading-relaxed">
              Spatial clustering, repeated defect surveillance, temporal throughput velocity, and cross-jurisdictional municipal benchmarking across Hyderabad.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportData}
              className="px-3.5 py-2 rounded-lg bg-white border border-[#E4E6E2] text-xs font-medium text-[#171918] hover:bg-[#F5F5F2] flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download size={13} className="text-[#315C4C]" />
              <span>{downloadSuccess ? 'Downloaded CSV' : 'Export Open Data (CSV)'}</span>
            </button>

            <Link
              to="/explore"
              className="px-4 py-2 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <MapPin size={13} />
              <span>Live Multi-Layer Map</span>
            </Link>
          </div>
        </div>

        {/* 8 CORE CITYWIDE INTELLIGENCE METRIC CARDS (FEATURE 1) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">Total Reports</span>
            <div className="text-xl font-bold font-mono text-[#171918]">{metrics.totalReports}</div>
            <span className="text-[10px] text-[#315C4C] font-mono">100% evaluated</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">Active Backlog</span>
            <div className="text-xl font-bold font-mono text-[#C58B36]">{metrics.activeIssues}</div>
            <span className="text-[10px] text-[#737773] font-mono">In field queue</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">Critical Hazards</span>
            <div className="text-xl font-bold font-mono text-[#B8463B]">{metrics.criticalIssues}</div>
            <span className="text-[10px] text-[#B8463B] font-mono">Immediate risk</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">Recurring Defect</span>
            <div className="text-xl font-bold font-mono text-[#171918]">{metrics.recurringIssues}</div>
            <span className="text-[10px] text-[#315C4C] font-mono">Corridor repeat</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">Resolved Issues</span>
            <div className="text-xl font-bold font-mono text-[#315C4C]">{metrics.resolvedIssues}</div>
            <span className="text-[10px] text-[#315C4C] font-mono">Completed fixes</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">Resolution Rate</span>
            <div className="text-xl font-bold font-mono text-[#171918]">{metrics.resolutionRate}%</div>
            <span className="text-[10px] text-[#315C4C] font-mono">Target: 90%</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">Emerging Radar</span>
            <div className="text-xl font-bold font-mono text-[#B8463B]">{metrics.emergingHotspots}</div>
            <span className="text-[10px] text-[#B8463B] font-mono">Surge clusters</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E4E6E2] shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">Overdue SLAs</span>
            <div className="text-xl font-bold font-mono text-[#171918]">{metrics.overdueIssues}</div>
            <span className="text-[10px] text-[#737773] font-mono">Past deadline</span>
          </div>
        </div>

        {/* Multi-Dimensional Filter Bar */}
        <div className="p-4 rounded-xl bg-white border border-[#E4E6E2] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-[#737773] font-mono uppercase text-[11px] font-semibold">
              <Filter size={13} className="text-[#315C4C]" />
              <span>Filters:</span>
            </div>

            {/* Ward */}
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2] text-[#171918] font-medium"
            >
              <option value="all">All Hyderabad Wards</option>
              <option value="Jubilee Hills">Jubilee Hills</option>
              <option value="Banjara Hills">Banjara Hills</option>
              <option value="Madhapur">Madhapur</option>
              <option value="Gachibowli">Gachibowli</option>
              <option value="Kondapur">Kondapur</option>
              <option value="Begumpet">Begumpet</option>
            </select>

            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2] text-[#171918] font-medium"
            >
              <option value="all">All Defect Categories</option>
              <option value="Road damage">Road damage</option>
              <option value="Garbage">Garbage / Waste</option>
              <option value="Water leakage">Water leakage</option>
              <option value="Drainage">Drainage</option>
              <option value="Streetlights">Streetlights</option>
              <option value="Damaged footpaths">Damaged footpaths</option>
              <option value="Electrical Hazard">Electrical Hazard</option>
            </select>

            {/* Severity */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2] text-[#171918] font-medium"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Risk</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2] text-[#171918] font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#737773] font-mono">
              Matching: <strong>{filteredReports.length}</strong> reports
            </span>
            {(selectedWard !== 'all' ||
              selectedCategory !== 'all' ||
              selectedSeverity !== 'all' ||
              selectedStatus !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedWard('all');
                  setSelectedCategory('all');
                  setSelectedSeverity('all');
                  setSelectedStatus('all');
                }}
                className="px-2 py-1 rounded bg-[#F5F5F2] hover:bg-[#E4E6E2] text-[11px] font-semibold text-[#B8463B]"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Phase 7 Feature Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-[#E4E6E2] overflow-x-auto pb-px">
          {[
            { id: 'hotspots', label: 'Hotspot Detection', icon: <Flame size={14} />, badge: detectedHotspots.length },
            { id: 'recurring', label: 'Recurring Problems', icon: <RotateCcw size={14} />, badge: recurringProblems.length },
            { id: 'early_warning', label: 'Early Warning Radar', icon: <Radio size={14} />, badge: earlyWarnings.length },
            { id: 'trends', label: 'Temporal Trends', icon: <TrendingUp size={14} /> },
            { id: 'wards', label: 'Ward Benchmarking', icon: <Building2 size={14} />, badge: '6 Wards' },
            { id: 'registry', label: 'Open Incident Registry', icon: <Download size={14} />, badge: filteredReports.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#315C4C] text-[#315C4C] bg-white'
                  : 'border-transparent text-[#737773] hover:text-[#171918] hover:bg-white/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-[#F5F5F2] border border-[#E4E6E2]">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: HOTSPOT DETECTION & SPATIAL CLUSTERS (FEATURE 2 & 9) */}
        {activeTab === 'hotspots' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E6E2]">
                <div>
                  <h3 className="text-base font-bold text-[#171918]">
                    Active Spatial Hotspots (DBSCAN / Corridor Clusters)
                  </h3>
                  <p className="text-xs text-[#737773] mt-0.5">
                    Clustered within 750m proximity using centroid triangulation, weighted by defect severity, worsening citizen flags, and active durations.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#DDE7DF]/50 border border-[#315C4C]/20 text-xs font-mono font-semibold text-[#315C4C]">
                  {detectedHotspots.length} Clusters Verified
                </span>
              </div>

              {/* Hotspot Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {detectedHotspots.map((hs) => (
                  <div
                    key={hs.id}
                    className="p-4 rounded-xl border border-[#E4E6E2] bg-[#F5F5F2]/40 hover:bg-white hover:border-[#315C4C]/40 transition-all flex flex-col justify-between space-y-3.5 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${getHotspotBadgeColor(
                            hs.classification
                          )}`}
                        >
                          {hs.classification} Concentration
                        </span>

                        <div className="text-xs font-mono font-bold text-[#171918]">
                          Score: <span className="text-[#315C4C]">{hs.hotspotScore}</span>/100
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-[#171918] mb-1 line-clamp-1">
                        {hs.title}
                      </h4>

                      <div className="flex items-center gap-1.5 text-xs text-[#737773] mb-3">
                        <MapPin size={12} className="text-[#315C4C] flex-shrink-0" />
                        <span className="truncate">{hs.neighborhood} Centroid (~{hs.radiusMeters}m radius)</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-white border border-[#E4E6E2] text-xs font-mono text-center mb-3">
                        <div>
                          <span className="text-[10px] text-[#737773] block uppercase">Incidents</span>
                          <span className="font-bold text-[#171918]">{hs.incidentCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#737773] block uppercase">Active</span>
                          <span className="font-bold text-[#C58B36]">{hs.activeCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#737773] block uppercase">Repeats</span>
                          <span className="font-bold text-[#315C4C]">{hs.recurringCount}</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#737773] line-clamp-2 leading-relaxed">
                        {hs.preventiveRecommendation}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E4E6E2]/70 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-[#737773]">
                        {hs.communityCitations} citizen citations
                      </span>

                      <button
                        type="button"
                        onClick={() => setInspectingHotspot(hs)}
                        className="px-2.5 py-1 rounded bg-white hover:bg-[#DDE7DF] border border-[#E4E6E2] font-semibold text-[#315C4C] flex items-center gap-1 text-[11px] transition-colors"
                      >
                        <span>Deep Inspection</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RECURRING PROBLEMS SECTION (FEATURE 4) */}
        {activeTab === 'recurring' && (
          <RecurringProblemsSection
            recurringProblems={recurringProblems}
            onSelectReportById={handleSelectReportById}
          />
        )}

        {/* TAB 3: EARLY WARNING RADAR (FEATURE 7) */}
        {activeTab === 'early_warning' && (
          <EarlyWarningSection
            warnings={earlyWarnings}
            onSelectReportById={handleSelectReportById}
          />
        )}

        {/* TAB 4: TEMPORAL TRENDS (FEATURE 5) */}
        {activeTab === 'trends' && (
          <TemporalTrendsSection
            points={temporalTrends.points}
            incomingGrowthRate={temporalTrends.incomingGrowthRate}
            resolvedGrowthRate={temporalTrends.resolvedGrowthRate}
            selectedRangeDays={selectedRangeDays}
            onRangeChange={setSelectedRangeDays}
          />
        )}

        {/* TAB 5: WARD BENCHMARKING (FEATURE 6) */}
        {activeTab === 'wards' && (
          <WardComparisonSection
            wardMetrics={wardComparisons}
            onSelectWardFilter={(w) => {
              setSelectedWard(w);
              setActiveTab('registry');
            }}
          />
        )}

        {/* TAB 6: OPEN INCIDENT REGISTRY */}
        {activeTab === 'registry' && (
          <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6E2]">
              <div>
                <h3 className="text-base font-bold text-[#171918]">
                  Open Analytical Incident Ledger ({filteredReports.length} records)
                </h3>
                <p className="text-xs text-[#737773] mt-0.5">
                  Raw underlying incident reports with anonymized citizen metadata, verified GPS geohashes, and official municipal dispatch logs.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportData}
                className="px-3 py-1.5 rounded-lg bg-[#F5F5F2] hover:bg-[#E4E6E2] border border-[#E4E6E2] text-xs font-semibold text-[#171918] flex items-center gap-1.5 transition-colors"
              >
                <Download size={12} className="text-[#315C4C]" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-[#E4E6E2] rounded-xl">
              <table className="w-full text-left text-xs divide-y divide-[#E4E6E2]">
                <thead className="bg-[#F5F5F2] font-mono text-[10px] uppercase text-[#737773] tracking-wider select-none">
                  <tr>
                    <th className="py-3 px-3">Ticket ID</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-4">Title & Location</th>
                    <th className="py-3 px-3">Ward</th>
                    <th className="py-3 px-3">Severity</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Citations</th>
                    <th className="py-3 px-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E6E2] bg-white">
                  {filteredReports.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F5F5F2]/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#315C4C]">
                        {r.ticketNumber}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#737773]">
                        {r.category}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-[#171918] truncate">{r.title}</div>
                        <div className="text-[11px] text-[#737773] truncate">{r.location}</div>
                      </td>
                      <td className="py-3 px-3 text-[#171918]">{r.neighborhood}</td>
                      <td className="py-3 px-3">
                        <Badge severity={r.severity} size="sm" />
                      </td>
                      <td className="py-3 px-3">
                        <Badge status={r.status} size="sm" />
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#315C4C]">
                        {r.confirmationsCount} citations
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectingReport(r)}
                          className="px-2 py-1 rounded bg-[#F5F5F2] hover:bg-[#DDE7DF] border border-[#E4E6E2] text-[11px] font-semibold text-[#315C4C] transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL 1: HOTSPOT DEEP INSPECTION MODAL (FEATURE 9) */}
        {inspectingHotspot && (
          <HotspotDetailModal
            hotspot={inspectingHotspot}
            onClose={() => setInspectingHotspot(null)}
            reports={reports}
            onSelectReport={(rep) => {
              setInspectingHotspot(null);
              setInspectingReport(rep);
            }}
          />
        )}

        {/* MODAL 2: REPORT DETAIL MODAL (PHASE 2 & 5 REUSE) */}
        {inspectingReport && (
          <ReportDetailModal
            report={inspectingReport}
            onClose={() => setInspectingReport(null)}
          />
        )}
      </div>
    </div>
  );
};
