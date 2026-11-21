import React from 'react';
import { SimulationResult } from '../../types';
import { digitalTwinService } from '../../services/digitalTwinService';
import {
  X,
  Scale,
  Award,
} from 'lucide-react';

interface InterventionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: SimulationResult[];
  onSelectScenario: (scenario: SimulationResult) => void;
}

export const InterventionComparisonModal: React.FC<InterventionComparisonModalProps> = ({
  isOpen,
  onClose,
  scenarios,
  onSelectScenario,
}) => {
  if (!isOpen || scenarios.length === 0) return null;

  const comparison = digitalTwinService.compareScenarios(scenarios);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E4E6E2] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#F5F5F2] border-b border-[#E4E6E2] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#315C4C] text-white flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#171918]">
                Intervention Strategy Comparison ({scenarios.length} Scenarios)
              </h3>
              <p className="text-[11px] text-[#737773]">
                Side-by-side trade-off evaluation across speed, life-safety mitigation, and crew efficiency.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Recommendation Banner */}
          <div className="p-4 bg-[#DDE7DF]/50 rounded-lg border border-[#315C4C]/30 flex items-start space-x-3">
            <Award className="w-5 h-5 text-[#315C4C] shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#315C4C] block">
                Algorithmic Recommendation
              </span>
              <p className="text-xs font-bold text-[#171918] mt-0.5">
                {comparison.recommendationReason}
              </p>
            </div>
          </div>

          {/* Comparative Matrix Table */}
          <div className="overflow-x-auto border border-[#E4E6E2] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F2] text-[#737773] uppercase text-[10px] tracking-wider border-b border-[#E4E6E2]">
                <tr>
                  <th className="p-3">Scenario Strategy</th>
                  <th className="p-3">Teams</th>
                  <th className="p-3">Backlog Reduction</th>
                  <th className="p-3">Critical Mitigation</th>
                  <th className="p-3">Cascades Avoided</th>
                  <th className="p-3">Efficiency</th>
                  <th className="p-3">Trust Index</th>
                  <th className="p-3">Days to 50%</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E6E2]">
                {comparison.scenarios.map((item) => {
                  const isRecommended = item.id === comparison.recommendedScenarioId;
                  const originalScenario = scenarios.find((s) => s.id === item.id);

                  return (
                    <tr
                      key={item.id}
                      className={isRecommended ? 'bg-[#DDE7DF]/20' : 'bg-white hover:bg-[#F5F5F2]/50'}
                    >
                      <td className="p-3 font-semibold text-[#171918]">
                        <div className="flex items-center space-x-2">
                          {isRecommended && (
                            <span className="p-1 rounded bg-[#315C4C] text-white text-[9px] font-bold">
                              TOP
                            </span>
                          )}
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono">{item.activeTeams}</td>
                      <td className="p-3 font-mono font-bold text-[#315C4C]">
                        {item.backlogReductionPct}%
                      </td>
                      <td className="p-3 font-mono font-bold text-[#B8463B]">
                        {item.criticalReductionPct}%
                      </td>
                      <td className="p-3 font-mono font-bold text-[#8C52FF]">
                        {item.cascadingAvoided}
                      </td>
                      <td className="p-3 font-mono">{item.resourceEfficiencyScore}%</td>
                      <td className="p-3 font-mono">{item.citizenSatisfactionScore}/100</td>
                      <td className="p-3 font-mono font-bold">{item.estimatedDaysToFiftyPct}d</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (originalScenario) onSelectScenario(originalScenario);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-md text-[11px] font-semibold bg-[#315C4C] text-white hover:bg-[#284B3E] transition-colors"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Comparative Insights */}
          <div className="p-4 bg-[#F5F5F2] rounded-lg border border-[#E4E6E2] space-y-2">
            <h4 className="font-bold text-[#171918] text-xs uppercase tracking-wider">
              Comparative Analysis Insights
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-[#737773] text-[11px]">
              {comparison.comparativeInsights.map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F5F5F2] border-t border-[#E4E6E2] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#E4E6E2] bg-white text-[#171918] font-semibold text-xs hover:bg-[#F5F5F2] transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
