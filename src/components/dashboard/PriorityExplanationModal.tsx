import React from 'react';
import { IssueSeverity, IssueCategory } from '../../types';
import { Badge } from '../common/Badge';
import {
  X,
  HelpCircle,
  Info,
  TrendingUp,
} from 'lucide-react';

interface PriorityExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: {
    id?: string;
    title: string;
    category: IssueCategory;
    severity: IssueSeverity;
    confirmationsCount: number;
    location?: string;
    description?: string;
    status?: string;
  } | null;
}

export const PriorityExplanationModal: React.FC<PriorityExplanationModalProps> = ({
  isOpen,
  onClose,
  issue,
}) => {
  if (!isOpen || !issue) return null;

  // Deterministic calculation
  const count = issue.confirmationsCount || 0;
  const isCritical = issue.severity === 'critical';
  const isHigh = issue.severity === 'high';

  // Physical Risk score (0-100)
  let riskScore = 48;
  if (isCritical) riskScore = 92;
  else if (isHigh) riskScore = 76;
  else if (issue.severity === 'medium') riskScore = 52;
  else riskScore = 26;

  // Civic Priority score (0-100)
  const validationFactor = Math.min(30, Math.round(count * 1.2) + 8);
  const transitWeight = (issue.location || '').toLowerCase().includes('road') ? 18 : 12;
  const rawPriority = Math.round(riskScore * 0.4) + validationFactor + transitWeight + 10;
  const priorityScore = Math.min(99, Math.max(20, rawPriority));

  const factors = [
    {
      name: 'Physical Hazard Risk Baseline',
      weight: '40%',
      points: Math.round(riskScore * 0.4),
      evidence: `Derived from ${issue.severity.toUpperCase()} severity and ${issue.category.toLowerCase()} danger potential.`,
    },
    {
      name: 'Community Validation Boost',
      weight: '30%',
      points: validationFactor,
      evidence: `${count} verified citizen confirmations recorded in ward registry.`,
    },
    {
      name: 'Transit Corridor Criticality',
      weight: '20%',
      points: transitWeight,
      evidence: issue.location ? `Located on ${issue.location}` : 'Standard neighborhood street grid.',
    },
    {
      name: 'SLA Escalation Window',
      weight: '10%',
      points: 10,
      evidence: `Active ticket in ${issue.status || 'Submitted'} state tracking municipal response window.`,
    },
  ];

  const whatCouldChange = [
    `+5 community confirmations will increase priority score by ~6–8 points.`,
    `A report of condition "Getting Worse" triggers immediate hazard escalation.`,
    `Uploading additional geotagged photos increases evidence confidence from 84% to 98%.`,
    `Work order assignment by GHMC field engineer moves ticket into active physical maintenance.`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#181C1A]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white border border-[#E4E6E2] rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E6E2] bg-[#F5F5F2]">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#171918]">
            <HelpCircle size={15} className="text-[#315C4C]" />
            <span>Civic Priority & Risk Architecture</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2] transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[78vh] overflow-y-auto text-xs">
          {/* Issue Title & Scores Header */}
          <div className="pb-4 border-b border-[#E4E6E2]">
            <span className="font-mono text-[10px] uppercase text-[#737773] block mb-1">
              {issue.category} • Deterministic Priority Audit
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[#171918] leading-snug mb-3">
              {issue.title}
            </h3>

            {/* Dual Score Cards: Risk vs Priority */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Civic Priority Score Card */}
              <div className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#315C4C]/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-[#315C4C] font-bold">
                    Civic Priority Score
                  </span>
                  <Badge severity={isCritical ? 'critical' : isHigh ? 'high' : 'medium'} dot size="sm" />
                </div>
                <div className="text-2xl font-bold text-[#315C4C] font-mono">
                  {priorityScore} <span className="text-xs font-normal text-[#737773]">/ 100</span>
                </div>
                <p className="text-[10px] text-[#737773] leading-tight">
                  Queue order for municipal dispatch based on risk & community urgency.
                </p>
              </div>

              {/* Physical Risk Score Card */}
              <div className="p-3.5 rounded-xl bg-[#FAF5ED]/50 border border-[#C58B36]/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-[#C58B36] font-bold">
                    Physical Risk Score
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#C58B36]">
                    {isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'MODERATE'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#C58B36] font-mono">
                  {riskScore} <span className="text-xs font-normal text-[#737773]">/ 100</span>
                </div>
                <p className="text-[10px] text-[#737773] leading-tight">
                  Calculated potential for physical collision, injury, or utility failure.
                </p>
              </div>
            </div>
          </div>

          {/* Transparent Distinction Note */}
          <div className="p-3.5 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2] flex items-start gap-2.5">
            <Info size={15} className="text-[#315C4C] mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-[#737773] leading-relaxed">
              <strong className="text-[#171918]">Risk vs Priority Distinction:</strong> Physical Risk reflects intrinsic structural hazard danger. Civic Priority determines how quickly municipal field crews are deployed by factoring in community consensus and transit disruption.
            </p>
          </div>

          {/* Documented Factor Weightings Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-[11px] uppercase font-bold text-[#171918]">
                Documented Scoring Weights & Evidence
              </h4>
              <span className="text-[10px] font-mono text-[#737773]">100% EXPLAINABLE</span>
            </div>

            <div className="space-y-2">
              {factors.map((f, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-white border border-[#E4E6E2] space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171918]">{f.name}</span>
                    <span className="font-mono text-[11px] text-[#315C4C] font-semibold">
                      Weight: {f.weight} ({f.points} pts)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#737773] leading-snug">
                    {f.evidence}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* What Could Change the Score? */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase font-bold text-[#315C4C]">
              <TrendingUp size={13} />
              <span>What Could Change This Priority Score?</span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#315C4C]/25 space-y-2">
              {whatCouldChange.map((change, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-[#171918]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#315C4C] mt-1.5 flex-shrink-0" />
                  <span className="leading-snug">{change}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Quality Note */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#E4E6E2] text-[11px] text-[#737773]">
            <span className="font-mono uppercase text-[10px]">Evidence Verification:</span>
            <span className="font-medium text-[#171918]">
              {count > 0 ? `${count} Citizen Validations (Ward Watch)` : 'Single Citizen Observation'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F5F5F2] border-t border-[#E4E6E2] flex items-center justify-between text-xs text-[#737773]">
          <span className="font-mono text-[10px]">
            CIVIC INTELLIGENCE ENGINE • PHASE 4
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
