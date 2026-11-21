import React from 'react';
import {
  SimulationResult,
} from '../../types';
import {
  ShieldAlert,
  TrendingDown,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Calendar,
  Save,
  Scale,
  Sliders,
  Download,
  Info,
} from 'lucide-react';

interface SimulationResultsViewProps {
  result: SimulationResult;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onSaveScenario: () => void;
  onOpenCompare: () => void;
  onAdjustParams: () => void;
  isSaved?: boolean;
}

export const SimulationResultsView: React.FC<SimulationResultsViewProps> = ({
  result,
  selectedDay,
  onSelectDay,
  onSaveScenario,
  onOpenCompare,
  onAdjustParams,
  isSaved = false,
}) => {
  const currentStep =
    result.timeline.find((s) => s.day === selectedDay) ||
    result.timeline[result.timeline.length - 1];

  const { finalMetrics, baselineSummary, groundedExplanation } = result;

  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `simulation-${result.parameters.strategyId}-${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E4E6E2] shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#DDE7DF] text-[#315C4C]">
              {result.parameters.strategyId}
            </span>
            <span className="text-xs text-[#737773]">
              Fingerprint: <code className="font-mono">{baselineSummary.datasetFingerprint}</code>
            </span>
          </div>
          <h2 className="text-base font-bold text-[#171918] mt-1">
            {result.scenarioName}
          </h2>
          <p className="text-xs text-[#737773]">
            Target Area: <strong>{result.parameters.targetArea}</strong> | Crews:{' '}
            <strong>{result.parameters.activeTeams} teams</strong> ({result.parameters.dailyInterventionRate} issues/day)
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onAdjustParams}
            className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2] hover:bg-[#E4E6E2]/60 text-xs font-semibold text-[#171918] transition-colors flex items-center justify-center space-x-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Adjust</span>
          </button>
          <button
            type="button"
            onClick={onOpenCompare}
            className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-[#E4E6E2] bg-white hover:bg-[#F5F5F2] text-xs font-semibold text-[#315C4C] transition-colors flex items-center justify-center space-x-1.5"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>
          <button
            type="button"
            onClick={onSaveScenario}
            disabled={isSaved}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 ${
              isSaved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-[#315C4C] text-white hover:bg-[#284B3E]'
            }`}
          >
            {isSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="p-2 rounded-lg border border-[#E4E6E2] bg-white hover:bg-[#F5F5F2] text-[#737773] hover:text-[#171918] transition-colors"
            title="Export JSON"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Backlog Reduction */}
        <div className="bg-white p-4 rounded-xl border border-[#E4E6E2] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#737773]">
            <span>Backlog Reduction</span>
            <TrendingDown className="w-4 h-4 text-[#315C4C]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#171918] mt-2">
            {finalMetrics.backlogReductionPct}%
          </div>
          <div className="text-[11px] text-[#737773] mt-1 flex items-center justify-between">
            <span>Resolved:</span>
            <strong className="text-[#171918]">
              {finalMetrics.totalAddressed} / {baselineSummary.totalIssues}
            </strong>
          </div>
        </div>

        {/* Metric 2: Critical Safety Hazards */}
        <div className="bg-white p-4 rounded-xl border border-[#E4E6E2] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#737773]">
            <span>Critical Risk Mitigated</span>
            <ShieldAlert className="w-4 h-4 text-[#B8463B]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#B8463B] mt-2">
            {finalMetrics.criticalReductionPct}%
          </div>
          <div className="text-[11px] text-[#737773] mt-1 flex items-center justify-between">
            <span>Critical Remaining:</span>
            <strong className="text-[#B8463B]">
              {Math.max(
                0,
                baselineSummary.criticalCount -
                  Math.round(
                    (baselineSummary.criticalCount * finalMetrics.criticalReductionPct) / 100
                  )
              )}
            </strong>
          </div>
        </div>

        {/* Metric 3: Cascading Hazards Prevented */}
        <div className="bg-white p-4 rounded-xl border border-[#E4E6E2] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#737773]">
            <span>Cascades Prevented</span>
            <RotateCcw className="w-4 h-4 text-[#8C52FF]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#8C52FF] mt-2">
            {finalMetrics.cascadingHazardsPrevented}
          </div>
          <div className="text-[11px] text-[#737773] mt-1 flex items-center justify-between">
            <span>Secondary Failures:</span>
            <strong className="text-[#171918]">Preempted Early</strong>
          </div>
        </div>

        {/* Metric 4: Projected Citizen Satisfaction */}
        <div className="bg-white p-4 rounded-xl border border-[#E4E6E2] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#737773]">
            <span>Citizen Trust Index</span>
            <CheckCircle2 className="w-4 h-4 text-[#0288D1]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#0288D1] mt-2">
            {finalMetrics.citizenSatisfactionScore}/100
          </div>
          <div className="text-[11px] text-[#737773] mt-1 flex items-center justify-between">
            <span>Est. Days to 50%:</span>
            <strong className="text-[#171918]">
              {Math.ceil(result.baselineSummary.totalIssues * 0.5 / (result.parameters.activeTeams * result.parameters.dailyInterventionRate))}d
            </strong>
          </div>
        </div>
      </div>

      {/* Interactive Time Progression Slider */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E6E2] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4E6E2] pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#315C4C]" />
            <h3 className="text-xs font-bold text-[#171918] uppercase tracking-wider">
              Simulation Time Progression: Scrub Day 0 to Day {result.parameters.timelineDays}
            </h3>
          </div>
          <div className="text-xs text-[#737773]">
            Viewing State: <strong className="text-[#315C4C] font-mono text-sm">Day {selectedDay}</strong>{' '}
            ({currentStep.day === 0 ? 'Baseline Current' : `${currentStep.addressedCumulative} issues resolved`})
          </div>
        </div>

        {/* Step Buttons */}
        <div className="grid grid-cols-6 gap-2">
          {result.timeline.map((step) => {
            const isCurrent = step.day === selectedDay;
            return (
              <button
                key={step.day}
                type="button"
                onClick={() => onSelectDay(step.day)}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  isCurrent
                    ? 'border-[#315C4C] bg-[#315C4C] text-white shadow-md'
                    : 'border-[#E4E6E2] bg-[#F5F5F2] hover:bg-[#E4E6E2] text-[#171918]'
                }`}
              >
                <div className="text-[10px] font-mono font-bold">
                  {step.day === 0 ? 'DAY 0' : `DAY ${step.day}`}
                </div>
                <div
                  className={`text-[11px] font-mono font-bold mt-1 ${
                    isCurrent ? 'text-white' : 'text-[#315C4C]'
                  }`}
                >
                  {step.addressedCumulative} done
                </div>
                <div
                  className={`text-[9px] mt-0.5 truncate ${
                    isCurrent ? 'text-emerald-100' : 'text-[#737773]'
                  }`}
                >
                  {step.remainingBacklog} backlog
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Metric Highlights */}
        <div className="p-3 bg-[#F5F5F2] rounded-lg border border-[#E4E6E2] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-[#737773] block">Backlog at Day {selectedDay}:</span>
            <strong className="text-sm font-mono text-[#171918]">{currentStep.remainingBacklog} issues</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#737773] block">Critical Hazards Remaining:</span>
            <strong className="text-sm font-mono text-[#B8463B]">{currentStep.criticalRemaining}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#737773] block">Cascades Avoided:</span>
            <strong className="text-sm font-mono text-[#8C52FF]">{currentStep.cascadingAvoided}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#737773] block">Capacity Utilization:</span>
            <strong className="text-sm font-mono text-[#315C4C]">{currentStep.capacityUtilizationPct}%</strong>
          </div>
        </div>
      </div>

      {/* Category Breakdown Delta */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E6E2] shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[#171918] uppercase tracking-wider">
          Category Remediation Breakdown (Initial vs Resolved vs Remaining)
        </h3>
        <div className="space-y-2.5">
          {Object.entries(result.categoryBreakdown).map(([cat, delta]) => {
            const pct = delta.initial > 0 ? Math.round((delta.resolved / delta.initial) * 100) : 0;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#171918]">{cat}</span>
                  <span className="text-[11px] text-[#737773] font-mono">
                    {delta.resolved} of {delta.initial} resolved ({pct}%) • {delta.remaining} left
                  </span>
                </div>
                <div className="w-full bg-[#E4E6E2] rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-[#315C4C] h-2 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                  <div
                    className="bg-[#C58B36] h-2 transition-all duration-500"
                    style={{ width: `${100 - pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explainability & Mathematical Ranking Audit */}
      {result.explainabilityAudit && (
        <div className="bg-white p-5 rounded-xl border border-[#E4E6E2] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4E6E2] pb-3">
            <div className="flex items-center space-x-2 text-[#315C4C]">
              <Info className="w-4 h-4" />
              <h3 className="text-xs font-bold text-[#171918] uppercase tracking-wider">
                Simulation Explainability & Prioritization Audit
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-[#C58B36] border border-amber-200">
              SIMULATED ESTIMATE (MODEL ASSUMPTION)
            </span>
          </div>

          {/* Dataset & Capacity Accounting Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-[#F5F5F2] p-3 rounded-lg border border-[#E4E6E2]">
            <div>
              <span className="text-[10px] text-[#737773] block">Candidate Pool:</span>
              <strong className="text-sm font-mono text-[#171918]">
                {result.explainabilityAudit.totalReportsEvaluated} reports
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-[#737773] block">Geolocated / Missing GPS:</span>
              <strong className="text-sm font-mono text-[#315C4C]">
                {result.explainabilityAudit.reportsWithGps} GPS • {result.explainabilityAudit.reportsMissingCoordinates} no-GPS
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-[#737773] block">Allocated Crew Capacity:</span>
              <strong className="text-sm font-mono text-[#171918]">
                {result.explainabilityAudit.totalCapacityShifts} team-shifts
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-[#737773] block">Modeled Effort Consumed:</span>
              <strong className="text-sm font-mono text-[#315C4C]">
                {result.explainabilityAudit.totalCapacityConsumedShifts} team-shifts
              </strong>
            </div>
          </div>

          {/* Top Prioritized Reports Justification Table */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-[#171918] uppercase tracking-wider">
              Top Prioritized Candidate Reports & Ranking Justifications
            </h4>
            <div className="overflow-x-auto border border-[#E4E6E2] rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F2] text-[#737773] uppercase text-[9px] tracking-wider border-b border-[#E4E6E2]">
                  <tr>
                    <th className="p-2.5">Rank</th>
                    <th className="p-2.5">Ticket</th>
                    <th className="p-2.5">Norm. Score</th>
                    <th className="p-2.5">Department</th>
                    <th className="p-2.5">Effort</th>
                    <th className="p-2.5">Key Deterministic Priority Factors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E6E2]">
                  {result.explainabilityAudit.prioritizationReasons.map((reason) => (
                    <tr key={reason.reportId} className="bg-white hover:bg-[#F5F5F2]/50">
                      <td className="p-2.5 font-mono font-bold text-[#315C4C]">#{reason.rank}</td>
                      <td className="p-2.5 font-mono font-semibold text-[#171918]">{reason.ticketNumber}</td>
                      <td className="p-2.5 font-mono">
                        <span className="font-bold text-[#171918]">{reason.normalizedScore}</span>
                        {reason.primaryCalibrationStatus && (
                          <span className={`ml-1.5 px-1 py-0.5 rounded text-[8px] font-mono font-bold ${
                            reason.primaryCalibrationStatus === 'DATA-DERIVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : reason.primaryCalibrationStatus === 'RULE-BASED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {reason.primaryCalibrationStatus}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-[#737773]">{reason.department}</td>
                      <td className="p-2.5 font-mono text-[#737773]">{reason.estimatedEffortShifts} shifts</td>
                      <td className="p-2.5">
                        <div className="flex flex-wrap gap-1">
                          {reason.topContributingFactors.map((factor, fIdx) => (
                            <span
                              key={fIdx}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-[#DDE7DF]/50 text-[#315C4C] font-medium"
                            >
                              {factor}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Grounded AI Narrative & Transparency Box */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E6E2] shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-[#315C4C]">
          <Sparkles className="w-4 h-4" />
          <h3 className="text-xs font-bold text-[#171918] uppercase tracking-wider">
            Grounded Scenario Analysis & Operational Trade-Offs
          </h3>
        </div>

        <p className="text-xs text-[#171918] leading-relaxed bg-[#F5F5F2] p-3 rounded-lg border border-[#E4E6E2]">
          {groundedExplanation.summary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Key Strengths */}
          <div className="p-3 bg-[#DDE7DF]/30 rounded-lg border border-[#DDE7DF]">
            <h4 className="font-bold text-[#315C4C] text-[11px] uppercase tracking-wider mb-2">
              Key Strengths & Advantages
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-[#171918] text-[11px]">
              {groundedExplanation.keyStrengths.map((str, idx) => (
                <li key={idx}>{str}</li>
              ))}
            </ul>
          </div>

          {/* Operational Tradeoffs & Vulnerabilities */}
          <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200">
            <h4 className="font-bold text-[#C58B36] text-[11px] uppercase tracking-wider mb-2">
              Operational Trade-Offs & Vulnerabilities
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-[#171918] text-[11px]">
              {groundedExplanation.vulnerabilities.map((vuln, idx) => (
                <li key={idx}>{vuln}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Assumptions & Fingerprint */}
        <div className="p-3 bg-[#F5F5F2] rounded-lg border border-[#E4E6E2] text-[11px] text-[#737773] space-y-1">
          <strong className="text-[#171918] block">Simulation Parameters & Constraints:</strong>
          {groundedExplanation.assumptions.map((ass, idx) => (
            <p key={idx}>• {ass}</p>
          ))}
        </div>

        {/* Official Disclaimer */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-start space-x-2 text-[10px] text-[#737773]">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>Official Municipal Simulation Disclaimer:</strong> {groundedExplanation.disclaimer}
          </span>
        </div>
      </div>
    </div>
  );
};
