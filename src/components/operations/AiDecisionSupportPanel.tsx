import React, { useState } from 'react';
import { DashboardReport, WorkOrder } from '../../types';
import { aiOrchestrationService } from '../../services/aiOrchestrationService';
import { AiTransparencyPanel } from '../ai/AiTransparencyPanel';
import {
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface AiDecisionSupportPanelProps {
  reports: DashboardReport[];
  workOrders: WorkOrder[];
  onNavigateTab?: (tabId: string) => void;
  onInspectReport?: (reportId: string) => void;
}

export const AiDecisionSupportPanel: React.FC<AiDecisionSupportPanelProps> = ({
  reports,
  workOrders,
  onNavigateTab,
  onInspectReport,
}) => {
  const [activeSection, setActiveSection] = useState<'daily_actions' | 'preventive_engine'>('daily_actions');
  const [scheduledProposals, setScheduledProposals] = useState<Record<string, boolean>>({});
  const [scheduleFeedback, setScheduleFeedback] = useState<string | null>(null);

  const handleScheduleReview = (proposalId: string, title: string) => {
    setScheduledProposals((prev) => ({ ...prev, [proposalId]: true }));
    setScheduleFeedback(`✓ Proposal ${proposalId} queued for municipal capital works review: "${title}"`);
    setTimeout(() => setScheduleFeedback(null), 4500);
  };

  const recommendations = aiOrchestrationService.getOperationsDecisionRecommendations(reports, workOrders);
  const preventiveActions = aiOrchestrationService.generatePreventiveActions(reports);

  return (
    <div className="space-y-4">
      {/* SCHEDULE FEEDBACK BANNER */}
      {scheduleFeedback && (
        <div className="p-3.5 rounded-xl bg-[#DDE7DF] border border-[#315C4C]/40 text-xs font-semibold text-[#315C4C] flex items-center justify-between shadow-xs animate-in fade-in duration-150">
          <span>{scheduleFeedback}</span>
          <span className="text-[10px] font-mono uppercase text-[#315C4C]/80">Budget Ledger Updated</span>
        </div>
      )}

      {/* SECTION NAV / HEADER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E4E6E2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-[#DDE7DF] text-[#315C4C]">
              <Sparkles size={14} />
            </span>
            <span className="font-mono text-xs uppercase font-bold text-[#315C4C] tracking-wider">
              Smart Municipal Decision Support & Early Action
            </span>
          </div>
          <p className="text-[#737773] max-w-2xl leading-relaxed">
            Synthesizes SLA deadlines, citizen verification challenges, and corridor cluster risk to recommend where operational teams should direct resources first today.
          </p>
        </div>

        {/* TOGGLE TABS */}
        <div className="flex items-center gap-1 bg-[#FAFBF9] p-1 rounded-xl border border-[#E4E6E2]">
          <button
            type="button"
            onClick={() => setActiveSection('daily_actions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSection === 'daily_actions'
                ? 'bg-[#315C4C] text-white shadow-2xs'
                : 'text-[#737773] hover:text-[#171918]'
            }`}
          >
            What to Investigate First ({recommendations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('preventive_engine')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSection === 'preventive_engine'
                ? 'bg-[#315C4C] text-white shadow-2xs'
                : 'text-[#737773] hover:text-[#171918]'
            }`}
          >
            Preventive Civic Actions ({preventiveActions.length})
          </button>
        </div>
      </div>

      {/* 1. DAILY OPERATIONAL INVESTIGATION RECOMMENDATIONS */}
      {activeSection === 'daily_actions' && (
        <div className="space-y-3.5">
          {recommendations.map((rec) => {
            const isCritical = rec.priority === 'critical';

            return (
              <div
                key={rec.id}
                className="p-5 rounded-2xl bg-white border border-[#E4E6E2] shadow-xs space-y-3 text-xs hover:border-[#315C4C]/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#E4E6E2]">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                      isCritical
                        ? 'bg-[#FAF0EF] text-[#B8463B] border border-[#B8463B]/30'
                        : 'bg-[#FAF5ED] text-[#C58B36] border border-[#C58B36]/30'
                    }`}>
                      {rec.priority} Priority
                    </span>
                    <span className="font-bold text-[#171918] text-sm">
                      {rec.title}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-[#315C4C]">
                    Confidence: {Math.round(rec.confidence * 100)}%
                  </span>
                </div>

                {/* 1. RECOMMENDATION */}
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-[#737773] font-bold">
                    1. Actionable Recommendation:
                  </span>
                  <p className="text-xs text-[#171918] font-semibold leading-relaxed">
                    {rec.recommendation}
                  </p>
                </div>

                {/* 2 & 3. WHY RECOMMENDED & SUPPORTING DATA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
                    <span className="font-mono text-[10px] uppercase text-[#737773] block mb-1">
                      2. Why Recommended:
                    </span>
                    <p className="text-[11px] text-[#171918] leading-relaxed">
                      {rec.whyRecommended}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
                    <span className="font-mono text-[10px] uppercase text-[#737773] block mb-1">
                      3. Supporting Municipal Data:
                    </span>
                    <p className="text-[11px] text-[#737773] leading-relaxed font-mono">
                      {rec.supportingData}
                    </p>
                  </div>
                </div>

                {/* 4. IMPACT IF DELAYED */}
                <div className="p-2.5 rounded-lg bg-[#FAF0EF] border border-[#B8463B]/25 text-[11px] text-[#B8463B] flex items-start gap-2">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">4. Risk & Impact if Delayed: </span>
                    <span>{rec.impactIfDelayed}</span>
                  </div>
                </div>

                {/* 6. LIMITATIONS */}
                <div className="text-[10px] text-[#737773] font-mono">
                  <span>Scope Limitations: </span>
                  {rec.limitations.join(' ')}
                </div>

                {/* 7. SUGGESTED ACTION BUTTON */}
                <div className="pt-2 flex items-center justify-between border-t border-[#E4E6E2]">
                  <span className="text-[11px] text-[#737773]">
                    Suggested Action: <strong className="text-[#171918]">{rec.suggestedAction}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {rec.relatedReportId && onInspectReport && (
                      <button
                        type="button"
                        onClick={() => onInspectReport(rec.relatedReportId!)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#E4E6E2] text-xs font-semibold text-[#171918] hover:bg-[#FAFBF9] transition-colors"
                      >
                        Inspect Report
                      </button>
                    )}
                    {rec.type === 'cross_dept_coordination' && onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('coordination')}
                        className="px-3 py-1.5 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] flex items-center gap-1 shadow-2xs transition-colors"
                      >
                        <span>Open Multi-Agency Workspace</span>
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. PREVENTIVE CIVIC ACTION ENGINE */}
      {activeSection === 'preventive_engine' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2] text-xs text-[#737773] leading-relaxed">
            The Preventive Civic Action Engine analyses recurring complaint clusters and repeat resolution failures to formulate proactive capital maintenance schedules before major infrastructure failures occur.
          </div>

          <div className="space-y-3.5">
            {preventiveActions.map((prev) => (
              <div
                key={prev.id}
                className="p-5 rounded-2xl bg-white border border-[#315C4C]/25 shadow-xs space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#E4E6E2]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#DDE7DF] text-[#315C4C]">
                      PROPOSAL {prev.id}
                    </span>
                    <h4 className="font-bold text-[#171918] text-sm">
                      {prev.patternTitle}
                    </h4>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#315C4C]">
                    Confidence: {Math.round(prev.confidence * 100)}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-[#737773] block mb-0.5">
                      Problem Pattern & Physical Evidence:
                    </span>
                    <p className="text-xs text-[#171918]">
                      {prev.problemPattern}
                    </p>
                    <p className="text-[11px] text-[#737773] mt-0.5">
                      {prev.evidenceSummary} (Trend Window: {prev.trendPeriod})
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2] space-y-1">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#315C4C] block">
                      Suggested Preventive Civic Action:
                    </span>
                    <p className="text-xs font-semibold text-[#171918]">
                      {prev.suggestedAction}
                    </p>
                    <div className="text-[10px] text-[#737773] font-mono pt-1">
                      Target Wing: <span className="text-[#315C4C] font-bold">{prev.recommendedDepartmentName}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#FAF0EF] border border-[#B8463B]/25 text-[11px] text-[#B8463B]">
                    <span className="font-bold">Potential Long-Term Impact: </span>
                    <span>{prev.potentialImpact}</span>
                  </div>

                  <div className="text-[10px] text-[#737773] font-mono">
                    <span>Limitations: </span>
                    {prev.limitations.join(' ')}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#E4E6E2] text-[11px]">
                  <span className="text-[#737773]">
                    Status: <strong className={`capitalize ${scheduledProposals[prev.id] ? 'text-[#315C4C]' : 'text-[#C58B36]'}`}>
                      {scheduledProposals[prev.id] ? 'Scheduled for Municipal Committee Review' : `${prev.status} for Review`}
                    </strong>
                  </span>
                  <button
                    type="button"
                    disabled={scheduledProposals[prev.id]}
                    onClick={() => handleScheduleReview(prev.id, prev.patternTitle)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      scheduledProposals[prev.id]
                        ? 'bg-[#DDE7DF] text-[#315C4C] cursor-default'
                        : 'bg-[#315C4C] text-white hover:bg-[#26483B]'
                    }`}
                  >
                    {scheduledProposals[prev.id] ? '✓ Scheduled' : 'Schedule for Review'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRANSPARENCY EXPLANATION */}
      <AiTransparencyPanel
        confidenceScore={0.93}
        dataSource="CivicEye Citywide Hotspot Corridors, SLA Logs & Historical Ingestion"
        recordsAnalyzedCount={reports.length + workOrders.length}
        humanReviewStatus="advisory_only"
      />
    </div>
  );
};
