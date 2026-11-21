import React, { useState, useEffect } from 'react';
import {
  DepartmentPerformanceMetric,
  ResponseTimeIntervalMetric,
  TransparencyScorecardItem,
  PublicAuditRecord,
  PublicAccountabilityReport,
} from '../types';
import { transparencyService } from '../services/transparencyService';
import { TransparencyScorecard } from '../components/transparency/TransparencyScorecard';
import { DepartmentPerformanceSection } from '../components/transparency/DepartmentPerformanceSection';
import { ResponseTimeTransparencySection } from '../components/transparency/ResponseTimeTransparencySection';
import { PublicAuditTrailSection } from '../components/transparency/PublicAuditTrailSection';
import { PublicAccountabilityReportsSection } from '../components/transparency/PublicAccountabilityReportsSection';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  ShieldCheck,
  Building2,
  Clock,
  History,
  FileText,
  Download,
} from 'lucide-react';

export const PublicTransparencyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'scorecard' | 'departments' | 'response_times' | 'audit_trail' | 'reports'
  >('scorecard');

  const [metrics, setMetrics] = useState({
    totalReports: 23,
    reportsReviewed: 22,
    reportsAssigned: 21,
    reportsInProgress: 3,
    reportsCompleted: 2,
    citizenVerifiedResolutions: 2,
    overdueReports: 1,
    blockedReports: 0,
    reopenedIssues: 0,
    resolutionRate: 9,
    citizenVerificationRate: 100,
    onTimeRate: 94,
  });

  const [departments, setDepartments] = useState<DepartmentPerformanceMetric[]>([]);
  const [intervals, setIntervals] = useState<ResponseTimeIntervalMetric[]>([]);
  const [scorecardItems, setScorecardItems] = useState<TransparencyScorecardItem[]>([]);
  const [auditRecords, setAuditRecords] = useState<PublicAuditRecord[]>([]);
  const [reports, setReports] = useState<PublicAccountabilityReport[]>([]);

  const loadTransparencyData = async () => {
    try {
      const m = await transparencyService.getPublicTransparencyMetrics();
      setMetrics(m);

      const d = await transparencyService.getDepartmentPerformanceMetrics();
      setDepartments(d);

      const iv = transparencyService.getResponseTimeMetrics();
      setIntervals(iv);

      const sc = await transparencyService.getTransparencyScorecard();
      setScorecardItems(sc);

      const ar = transparencyService.getPublicAuditTrail();
      setAuditRecords(ar);

      const rep = transparencyService.getAccountabilityReports();
      setReports(rep);
    } catch (e) {
      console.warn('Error loading transparency data', e);
    }
  };

  useEffect(() => {
    loadTransparencyData();

    const handleUpdate = () => loadTransparencyData();
    window.addEventListener('civiceye_reports_updated', handleUpdate);
    window.addEventListener('civiceye_operations_updated', handleUpdate);
    window.addEventListener('civiceye_community_updated', handleUpdate);
    window.addEventListener('civiceye_transparency_updated', handleUpdate);

    return () => {
      window.removeEventListener('civiceye_reports_updated', handleUpdate);
      window.removeEventListener('civiceye_operations_updated', handleUpdate);
      window.removeEventListener('civiceye_community_updated', handleUpdate);
      window.removeEventListener('civiceye_transparency_updated', handleUpdate);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F2] pb-24">
      {/* Top Header Banner */}
      <div className="bg-white border-b border-[#E4E6E2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#DDE7DF] text-[#315C4C] font-semibold border border-[#315C4C]/20 flex items-center gap-1">
                  <ShieldCheck size={12} />
                  <span>Public Governance & Integrity Portal</span>
                </span>
                <span className="text-xs font-mono text-[#737773]">Phase 8 Production Suite</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#171918]">
                Civic Trust, Transparency & Municipal Accountability
              </h1>
              <p className="text-xs sm:text-sm text-[#737773] mt-1.5 max-w-3xl leading-relaxed">
                Open governance telemetry tracking the complete lifecycle of civic reports across Hyderabad. Inspect response intervals, departmental turnaround, citizen verification rates, and tamper-resistant audit ledgers.
              </p>
            </div>

            {/* Quick Export CTA */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => transparencyService.exportPublicDataCsv()}
                className="px-4 py-2 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Download size={13} />
                <span>Export Safe CSV</span>
              </button>
              <button
                type="button"
                onClick={() => transparencyService.exportPublicDataJson()}
                className="px-4 py-2 rounded-lg bg-[#FAFBF9] border border-[#E4E6E2] text-xs font-semibold text-[#171918] hover:bg-white transition-colors"
              >
                <Download size={13} />
                <span>Open JSON</span>
              </button>
            </div>
          </div>

          {/* Data Source & Operational Mode Indicator */}
          {isSupabaseConfigured ? (
            <div className="mt-4 p-3 rounded-lg bg-[#EBF3ED] border border-[#315C4C]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#315C4C]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#315C4C] animate-pulse shrink-0" />
                <span className="font-bold text-[#171918]">Live Municipal Database Connected:</span>
                <span className="text-[#737773] text-[11px]">
                  All public metrics, audit ledgers, and citizen ratings are synchronized in real-time with the central municipal database.
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase bg-white px-2 py-0.5 rounded border border-[#315C4C]/20 font-bold shrink-0 self-start sm:self-auto">
                Production RLS Enforced
              </span>
            </div>
          ) : (
            <div className="mt-4 p-3 rounded-lg bg-[#FAF5ED] border border-[#C58B36]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#171918]">
              <div className="flex items-start sm:items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C58B36] shrink-0 mt-1 sm:mt-0" />
                <div>
                  <span className="font-bold text-[#C58B36]">Local Demo & Offline Simulation Mode (Browser Sandbox):</span>
                  <span className="text-[#737773] text-[11px] ml-1">
                    Operating on client-side browser storage with Sector 04 reference benchmarks. Simulated municipal activities and ratings are local to your browser and not shared with live municipal servers or other citizens.
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase bg-white px-2 py-0.5 rounded border border-[#C58B36]/30 text-[#C58B36] font-bold shrink-0 self-start sm:self-auto">
                Local Sandbox
              </span>
            </div>
          )}

          {/* 10 Key Telemetry KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-8">
            <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block">Total Reports</span>
              <span className="text-xl font-bold text-[#171918]">{metrics.totalReports}</span>
              <span className="text-[10px] text-[#315C4C] block mt-0.5 font-mono">100% Tracked</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block">Triage Reviewed</span>
              <span className="text-xl font-bold text-[#171918]">{metrics.reportsReviewed}</span>
              <span className="text-[10px] text-[#315C4C] block mt-0.5 font-mono">
                {Math.round((metrics.reportsReviewed / Math.max(1, metrics.totalReports)) * 100)}% Coverage
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block">Department Assigned</span>
              <span className="text-xl font-bold text-[#171918]">{metrics.reportsAssigned}</span>
              <span className="text-[10px] text-[#315C4C] block mt-0.5 font-mono">6 Specialized Wings</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block">In Field Progress</span>
              <span className="text-xl font-bold text-[#C58B36]">{metrics.reportsInProgress}</span>
              <span className="text-[10px] text-[#737773] block mt-0.5 font-mono">Active Crews on Site</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block">Completed Lifecycle</span>
              <span className="text-xl font-bold text-[#315C4C]">{metrics.reportsCompleted}</span>
              <span className="text-[10px] text-[#315C4C] block mt-0.5 font-mono">Verified Rectifications</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block">Citizen Verified</span>
              <span className="text-xl font-bold text-[#315C4C]">{metrics.citizenVerifiedResolutions}</span>
              <span className="text-[10px] text-[#315C4C] block mt-0.5 font-mono">
                {metrics.citizenVerificationRate}% Verification Rate
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block">Active Overdue</span>
              <span className={`text-xl font-bold ${metrics.overdueReports > 0 ? 'text-[#B8463B]' : 'text-[#315C4C]'}`}>
                {metrics.overdueReports}
              </span>
              <span className="text-[10px] text-[#737773] block mt-0.5 font-mono">
                {metrics.blockedReports > 0 ? `${metrics.blockedReports} Blocked (Paused)` : 'SLA Monitored'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block">Reopened Issues</span>
              <span className="text-xl font-bold text-[#171918]">{metrics.reopenedIssues}</span>
              <span className="text-[10px] text-[#315C4C] block mt-0.5 font-mono">Preserved Evidence</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block">Resolution Rate</span>
              <span className="text-xl font-bold text-[#315C4C]">{metrics.resolutionRate}%</span>
              <span className="text-[10px] text-[#737773] block mt-0.5 font-mono">Sector 04 Baseline</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block">SLA Compliance</span>
              <span className="text-xl font-bold text-[#315C4C]">{metrics.onTimeRate}%</span>
              <span className="text-[10px] text-[#315C4C] block mt-0.5 font-mono">Target: ≥90%</span>
            </div>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#E4E6E2]/80">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5">
            {[
              { id: 'scorecard', label: '1. Transparency Scorecard', icon: ShieldCheck },
              { id: 'departments', label: '2. Department Performance', icon: Building2 },
              { id: 'response_times', label: '3. Response Times & SLA', icon: Clock },
              { id: 'audit_trail', label: '4. Public Audit Trail', icon: History },
              { id: 'reports', label: '5. Periodic Reports & Export', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#171918] text-white shadow-xs'
                      : 'text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]/40'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Pane */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'scorecard' && <TransparencyScorecard scorecardItems={scorecardItems} />}

        {activeTab === 'departments' && <DepartmentPerformanceSection departments={departments} />}

        {activeTab === 'response_times' && <ResponseTimeTransparencySection intervals={intervals} />}

        {activeTab === 'audit_trail' && <PublicAuditTrailSection auditRecords={auditRecords} />}

        {activeTab === 'reports' && <PublicAccountabilityReportsSection reports={reports} />}
      </main>
    </div>
  );
};
