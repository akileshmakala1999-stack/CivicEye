import React from 'react';
import { SavedSimulationScenario } from '../../types';
import {
  X,
  History,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface SimulationHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedScenarios: SavedSimulationScenario[];
  currentFingerprint: string;
  onLoadScenario: (scenario: SavedSimulationScenario) => void;
  onDeleteScenario: (id: string) => void;
}

export const SimulationHistoryDrawer: React.FC<SimulationHistoryDrawerProps> = ({
  isOpen,
  onClose,
  savedScenarios,
  currentFingerprint,
  onLoadScenario,
  onDeleteScenario,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-[#E4E6E2] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#F5F5F2] border-b border-[#E4E6E2] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-[#315C4C]" />
            <h3 className="text-xs font-bold text-[#171918] uppercase tracking-wider">
              Simulation Scenario Archive ({savedScenarios.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {savedScenarios.length === 0 ? (
            <div className="text-center py-12 text-[#737773] text-xs space-y-2">
              <History className="w-8 h-8 mx-auto text-[#DDE7DF]" />
              <p className="font-semibold text-[#171918]">No Saved Simulations</p>
              <p className="text-[11px]">
                Run a city intervention simulation and click "Save Scenario" to archive results here.
              </p>
            </div>
          ) : (
            savedScenarios.map((item) => {
              const isFingerprintMatch = item.datasetFingerprint === currentFingerprint;
              const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg border border-[#E4E6E2] hover:border-[#DDE7DF] transition-all bg-white space-y-2.5 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#171918] leading-tight">
                        {item.name}
                      </h4>
                      <div className="flex items-center space-x-2 text-[10px] text-[#737773] mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteScenario(item.id)}
                      className="p-1 text-[#737773] hover:text-[#B8463B] transition-colors"
                      title="Delete Scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Fingerprint Match indicator */}
                  <div className="flex items-center space-x-1.5 text-[10px]">
                    {isFingerprintMatch ? (
                      <span className="text-emerald-700 flex items-center space-x-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Dataset Matches Current Live Data</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 flex items-center space-x-1 font-mono">
                        <AlertCircle className="w-3 h-3" />
                        <span>Baseline Data Has Changed Since Run</span>
                      </span>
                    )}
                  </div>

                  {/* Metrics Badge */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#F5F5F2] p-2 rounded">
                    <div>
                      <span className="text-[#737773] block">Backlog Resolved:</span>
                      <strong className="text-[#315C4C] font-mono">
                        {item.result.finalMetrics.backlogReductionPct}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#737773] block">Critical Mitigated:</span>
                      <strong className="text-[#B8463B] font-mono">
                        {item.result.finalMetrics.criticalReductionPct}%
                      </strong>
                    </div>
                  </div>

                  {/* Load Action */}
                  <button
                    type="button"
                    onClick={() => {
                      onLoadScenario(item);
                      onClose();
                    }}
                    className="w-full py-1.5 rounded-md text-xs font-semibold bg-[#315C4C] text-white hover:bg-[#284B3E] transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Load & Inspect Scenario</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
