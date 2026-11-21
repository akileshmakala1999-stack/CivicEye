import React, { useState } from 'react';
import { DashboardReport } from '../../types';
import { ReportIntelligence } from '../../services/intelligenceEngine';
import { aiOrchestrationService } from '../../services/aiOrchestrationService';
import { communityValidationService } from '../../services/communityValidationService';
import { operationsService } from '../../services/operationsService';
import { AiTransparencyPanel } from '../ai/AiTransparencyPanel';
import {
  ShieldAlert,
  Cpu,
  Layers,
  ExternalLink,
  AlertTriangle,
  Building2,
  CheckCircle,
  User,
  Users,
} from 'lucide-react';

interface SmartReportAnalysisCardProps {
  report: DashboardReport;
  intelligence: ReportIntelligence;
  onSelectRelatedReport?: (reportId: string) => void;
}

export const SmartReportAnalysisCard: React.FC<SmartReportAnalysisCardProps> = ({
  report,
  intelligence,
  onSelectRelatedReport,
}) => {
  const [activeTab, setActiveTab] = useState<'ai_analysis' | 'relationships' | 'lifecycle'>('ai_analysis');

  // Detect real infrastructure relationships
  const relationships = aiOrchestrationService.getRelationshipsForReport(report.id);
  const communitySummary = communityValidationService.getCommunitySummary(report.id);
  const linkedWorkOrder = operationsService.getWorkOrderByReportId(report.id);

  // Derive environmental & infrastructure impacts
  const affectedInfra = report.category === 'Road damage'
    ? 'Asphalt Wearing Course, Aggregate Sub-Base, Road Shoulder Drainage'
    : report.category === 'Water leakage'
    ? 'HMWSSB Pressurized Distribution Main, Trench Bedding, Subsurface Soil'
    : report.category === 'Drainage'
    ? 'Precast Stormwater Box Culvert, Curb Inlets, Silt Interceptor'
    : report.category === 'Streetlights'
    ? 'High-Pressure Sodium/LED Array, Feeder Pillar 4B, Overhead Cabling'
    : report.category === 'Damaged footpaths'
    ? 'Interlocking Concrete Paver Blocks, Tactile Paving, Curbstones'
    : 'Municipal Street Sweeping Enclosure, Waste Storage Container';

  const environmentalImpact = report.category === 'Water leakage'
    ? 'Drinking water resource wastage; localized soil oversaturation and sinkhole risk.'
    : report.category === 'Drainage'
    ? 'Stagnant storm runoff breeds vector mosquitoes; raw silt contamination of storm culverts.'
    : report.category === 'Garbage'
    ? 'Odor nuisance, leachate percolation into roadside soil, stray animal gathering.'
    : 'Minimal environmental hazard; primary impact is transit disruption and pedestrian risk.';

  return (
    <div className="rounded-2xl border border-[#315C4C]/25 bg-white shadow-xs overflow-hidden text-xs text-[#171918]">
      {/* 5-STAGE SEPARATION NAV BAR */}
      <div className="bg-[#FAFBF9] border-b border-[#E4E6E2] p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#DDE7DF] text-[#315C4C] font-mono">
              <Cpu size={14} />
            </span>
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-[#315C4C] tracking-wider block">
                Multi-Layered Intelligence & Evidence System
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-[#171918]">
                {intelligence.detectedIssueType}
              </h3>
            </div>
          </div>

          {/* TAB BUTTONS */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E4E6E2]">
            <button
              type="button"
              onClick={() => setActiveTab('ai_analysis')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                activeTab === 'ai_analysis'
                  ? 'bg-[#315C4C] text-white shadow-2xs'
                  : 'text-[#737773] hover:text-[#171918]'
              }`}
            >
              AI Analysis
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('relationships')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                activeTab === 'relationships'
                  ? 'bg-[#315C4C] text-white shadow-2xs'
                  : 'text-[#737773] hover:text-[#171918]'
              }`}
            >
              <span>Corridor Links</span>
              {relationships.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                  activeTab === 'relationships' ? 'bg-white/20 text-white' : 'bg-[#DDE7DF] text-[#315C4C]'
                }`}>
                  {relationships.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('lifecycle')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                activeTab === 'lifecycle'
                  ? 'bg-[#315C4C] text-white shadow-2xs'
                  : 'text-[#737773] hover:text-[#171918]'
              }`}
            >
              5-Stage Governance
            </button>
          </div>
        </div>
      </div>

      {/* TAB CONTENT: 1. AI ANALYSIS & DECISION SUPPORT */}
      {activeTab === 'ai_analysis' && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* CRITICAL RISK & CONFIDENCE BANNER */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">
                AI Assessed Risk
              </span>
              <span className={`text-base font-bold capitalize ${
                intelligence.aiAssessedRisk === 'critical'
                  ? 'text-[#B8463B]'
                  : intelligence.aiAssessedRisk === 'high'
                  ? 'text-[#C58B36]'
                  : 'text-[#315C4C]'
              }`}>
                {intelligence.aiAssessedRisk}
              </span>
              <span className="text-[10px] font-mono text-[#737773] block mt-0.5">
                Score: {intelligence.riskScore}/100
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">
                Civic Priority Score
              </span>
              <span className="text-base font-bold text-[#171918]">
                {intelligence.civicPriorityScore}/100
              </span>
              <span className="text-[10px] font-mono text-[#315C4C] block mt-0.5">
                Deterministic
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">
                Primary Department
              </span>
              <span className="text-xs font-bold text-[#171918] truncate block" title={intelligence.suggestedDepartment}>
                {intelligence.suggestedDepartment}
              </span>
              <span className="text-[10px] font-mono text-[#315C4C] block mt-0.5">
                {Math.round(intelligence.departmentConfidence * 100)}% Match
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2]">
              <span className="text-[10px] font-mono uppercase text-[#737773] block mb-0.5">
                Evidence Confidence
              </span>
              <span className="text-base font-bold text-[#315C4C]">
                {Math.round(intelligence.confidenceLevel * 100)}%
              </span>
              <span className="text-[10px] font-mono text-[#737773] block mt-0.5">
                Photo Verified
              </span>
            </div>
          </div>

          {/* IMPACT MATRIX */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-[#E4E6E2] bg-white space-y-1.5">
              <span className="font-mono text-[10px] uppercase font-bold text-[#B8463B] flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>Public Safety & Resident Impact</span>
              </span>
              <p className="text-xs text-[#171918] leading-relaxed">
                {intelligence.publicSafetyConcern || 'Moderate hazard: Monitor for worsening conditions during rain.'}
              </p>
              <div className="pt-1 text-[11px] text-[#737773]">
                <span className="font-semibold text-[#171918]">Nearby Resident Effect: </span>
                {intelligence.potentialPublicImpact}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-[#E4E6E2] bg-white space-y-1.5">
              <span className="font-mono text-[10px] uppercase font-bold text-[#315C4C] flex items-center gap-1">
                <ShieldAlert size={12} />
                <span>Accessibility & Environmental Scope</span>
              </span>
              <p className="text-xs text-[#171918] leading-relaxed">
                {intelligence.accessibilityImpact}
              </p>
              <div className="pt-1 text-[11px] text-[#737773]">
                <span className="font-semibold text-[#171918]">Environmental Note: </span>
                {environmentalImpact}
              </div>
            </div>
          </div>

          {/* AFFECTED INFRASTRUCTURE & INVESTIGATION STEPS */}
          <div className="p-3.5 rounded-xl border border-[#E4E6E2] bg-[#FAFBF9] space-y-2">
            <div>
              <span className="font-mono text-[10px] uppercase text-[#737773] block font-bold mb-1">
                Potentially Affected Infrastructure Assets:
              </span>
              <div className="p-2 rounded-lg bg-white border border-[#E4E6E2] font-mono text-[11px] text-[#171918]">
                {affectedInfra}
              </div>
            </div>

            <div>
              <span className="font-mono text-[10px] uppercase text-[#737773] block font-bold mb-1">
                Recommended Municipal Investigation Steps:
              </span>
              <ul className="space-y-1 text-[11px] text-[#737773] bg-white p-2.5 rounded-lg border border-[#E4E6E2]">
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-[#315C4C]">1.</span>
                  <span>Conduct physical site inspection with structural depth gauge to measure defect extent.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-[#315C4C]">2.</span>
                  <span>Inspect underground utility alignment to ensure water or gas pipelines are not leaking beneath the sub-base.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-[#315C4C]">3.</span>
                  <span>Install temporary luminous hazard barricades prior to full squad mobilization.</span>
                </li>
              </ul>
            </div>

            {/* MISSING EVIDENCE WARNING */}
            {intelligence.missingInformation && intelligence.missingInformation.length > 0 && (
              <div className="p-2.5 rounded-lg bg-[#FAF5ED] border border-[#C58B36]/30 text-[11px] text-[#171918] flex items-start gap-2">
                <AlertTriangle size={13} className="text-[#C58B36] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#C58B36]">Suggested Additional Evidence: </span>
                  <span className="text-[#737773]">
                    {intelligence.missingInformation.join(' • ')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* AI TRANSPARENCY PANEL */}
          <AiTransparencyPanel
            confidenceScore={intelligence.confidenceLevel}
            dataSource="CivicEye Risk Matrix & Geo-Spatial Corridor Registry"
            recordsAnalyzedCount={23}
            limitations={intelligence.evidenceLimitations}
            humanReviewStatus="advisory_only"
          />
        </div>
      )}

      {/* TAB CONTENT: 2. INFRASTRUCTURE RELATIONSHIPS & CORRIDOR INTELLIGENCE */}
      {activeTab === 'relationships' && (
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-[#737773]">
              Detected Nearby Infrastructure Relationships ({relationships.length})
            </span>
            <span className="text-[11px] text-[#737773]">
              Within 600m Corridors
            </span>
          </div>

          {relationships.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#FAFBF9] border border-dashed border-[#E4E6E2] text-center text-[#737773]">
              <Layers size={20} className="mx-auto mb-1 opacity-50" />
              <p>No immediate spatial or multi-utility relationships detected for this ticket.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {relationships.map((rel) => {
                const isReportA = rel.reportIdA === report.id;
                const otherReportId = isReportA ? rel.reportIdB : rel.reportIdA;

                return (
                  <div
                    key={rel.id}
                    className="p-3.5 rounded-xl border border-[#315C4C]/20 bg-[#FAFBF9] space-y-2 hover:border-[#315C4C]/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#DDE7DF] text-[#315C4C]">
                          {rel.classification}
                        </span>
                        <span className="text-[11px] font-mono text-[#737773]">
                          Distance: ~{rel.distanceMeters}m
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-[#315C4C] font-semibold">
                        {Math.round(rel.confidence * 100)}% Link Confidence
                      </span>
                    </div>

                    <p className="text-xs text-[#171918] leading-relaxed">
                      {rel.explanation}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-[#E4E6E2]/70 text-[11px]">
                      <span className="text-[#737773] font-mono">
                        Linked Ticket: {otherReportId}
                      </span>
                      {onSelectRelatedReport && (
                        <button
                          type="button"
                          onClick={() => onSelectRelatedReport(otherReportId)}
                          className="text-[#315C4C] font-semibold hover:underline flex items-center gap-1"
                        >
                          <span>Inspect Report</span>
                          <ExternalLink size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. FIVE-STAGE GOVERNANCE SEPARATION */}
      {activeTab === 'lifecycle' && (
        <div className="p-4 sm:p-5 space-y-3">
          <p className="text-[#737773] leading-relaxed">
            CivicEye strictly separates citizen input from AI recommendations and official municipal status. No automated decisions are made without authorized personnel.
          </p>

          <div className="space-y-2.5 pt-1">
            {/* STAGE 1: CITIZEN REPORTED INFORMATION */}
            <div className="p-3 rounded-xl bg-white border border-[#E4E6E2] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-bold text-[#171918] flex items-center gap-1.5">
                  <User size={12} className="text-[#737773]" />
                  <span>1. Citizen Reported Information</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#E4E6E2]/50 text-[#737773]">
                  IMMUTABLE
                </span>
              </div>
              <p className="text-xs text-[#737773]">
                "{report.description}" (Reported: {report.reportTimestamp || report.reportDate} by citizen)
              </p>
            </div>

            {/* STAGE 2: AI ANALYSIS */}
            <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#315C4C]/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-bold text-[#315C4C] flex items-center gap-1.5">
                  <Cpu size={12} />
                  <span>2. AI Analysis & Multi-Agency Recommendation</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#DDE7DF] text-[#315C4C]">
                  ADVISORY ONLY
                </span>
              </div>
              <p className="text-xs text-[#737773]">
                Assessed risk: {intelligence.aiAssessedRisk}. Suggested wing: {intelligence.suggestedDepartment}.
              </p>
            </div>

            {/* STAGE 3: COMMUNITY VALIDATION */}
            <div className="p-3 rounded-xl bg-white border border-[#E4E6E2] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-bold text-[#315C4C] flex items-center gap-1.5">
                  <Users size={12} />
                  <span>3. Community Validation</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#DDE7DF] text-[#315C4C]">
                  CITIZEN CONSENSUS
                </span>
              </div>
              <p className="text-xs text-[#737773]">
                {communitySummary.total} total confirmations ({communitySummary.stillExists} still exists, {communitySummary.gettingWorse} getting worse).
              </p>
            </div>

            {/* STAGE 4: OFFICIAL REVIEW */}
            <div className="p-3 rounded-xl bg-white border border-[#E4E6E2] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-bold text-[#171918] flex items-center gap-1.5">
                  <Building2 size={12} className="text-[#315C4C]" />
                  <span>4. Official Review & Department Assignment</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#E4E6E2]/50 text-[#171918]">
                  MUNICIPAL ACTION
                </span>
              </div>
              <p className="text-xs text-[#737773]">
                Triage status: {report.status !== 'Submitted' ? 'Certified by Municipal Reviewer' : 'Awaiting Review Queue Clearance'}.
              </p>
            </div>

            {/* STAGE 5: OFFICIAL WORK ORDER STATUS */}
            <div className="p-3 rounded-xl bg-white border border-[#E4E6E2] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-bold text-[#171918] flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-[#315C4C]" />
                  <span>5. Official Work Order Execution & Sign-Off</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#DDE7DF] text-[#315C4C]">
                  FIELD DISPATCH
                </span>
              </div>
              <p className="text-xs text-[#737773]">
                {linkedWorkOrder
                  ? `Work Order ${linkedWorkOrder.id}: Status is "${linkedWorkOrder.status}". Target SLA: ${linkedWorkOrder.slaTargetHours}h.`
                  : 'Work order pending assignment upon triage approval.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
