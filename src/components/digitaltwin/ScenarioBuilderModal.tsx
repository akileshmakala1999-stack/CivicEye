import React, { useState } from 'react';
import {
  SimulationStrategyId,
  SimulationParameters,
  SimulationWeights,
  HyderabadNeighborhood,
  IssueCategory,
} from '../../types';
import {
  X,
  Play,
  Sliders,
  ShieldAlert,
  Flame,
  RotateCcw,
  Users,
  Scale,
  Sparkles,
  Info,
} from 'lucide-react';

interface ScenarioBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunSimulation: (params: SimulationParameters) => void;
  initialParams?: Partial<SimulationParameters>;
}

export const ScenarioBuilderModal: React.FC<ScenarioBuilderModalProps> = ({
  isOpen,
  onClose,
  onRunSimulation,
  initialParams,
}) => {
  const [strategyId, setStrategyId] = useState<SimulationStrategyId>(
    initialParams?.strategyId || 'strategy_a'
  );
  const [targetArea, setTargetArea] = useState<string>(initialParams?.targetArea || 'citywide');
  const [targetCategory, setTargetCategory] = useState<string>(
    initialParams?.targetCategory || 'all'
  );
  const [activeTeams, setActiveTeams] = useState<number>(initialParams?.activeTeams || 6);
  const [dailyRate, setDailyRate] = useState<number>(initialParams?.dailyInterventionRate || 2.5);
  const [timelineDays, setTimelineDays] = useState<number>(initialParams?.timelineDays || 30);

  // Custom weights for Strategy F
  const [customWeights, setCustomWeights] = useState<SimulationWeights>({
    riskWeight: 40,
    densityWeight: 20,
    recurrenceWeight: 15,
    communityWeight: 15,
    ageWeight: 10,
    costWeight: 10,
  });

  if (!isOpen) return null;

  const strategies: {
    id: SimulationStrategyId;
    name: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    accentColor: string;
    weightsSummary: string;
  }[] = [
    {
      id: 'strategy_a',
      name: 'Strategy A: Critical Issues First',
      description: 'Maximizes public safety by rapidly dispatching teams to acute life-safety and high-risk hazards.',
      icon: ShieldAlert,
      accentColor: '#B8463B',
      weightsSummary: 'Risk: 50% | Severity: 30% | Age: 20%',
    },
    {
      id: 'strategy_b',
      name: 'Strategy B: Hotspot Reduction',
      description: 'Targets dense geographic clusters and high-traffic corridors to reduce travel transit time by ~35%.',
      icon: Flame,
      accentColor: '#E06D53',
      weightsSummary: 'Density: 50% | Cluster Size: 30% | Risk: 20%',
    },
    {
      id: 'strategy_c',
      name: 'Strategy C: Recurring Prevention',
      description: 'Focuses on chronic failure zones and structural root causes (e.g. water leaks eroding roadbeds).',
      icon: RotateCcw,
      accentColor: '#8C52FF',
      weightsSummary: 'Recurrence: 60% | Infra Link: 20% | Risk: 20%',
    },
    {
      id: 'strategy_d',
      name: 'Strategy D: Community Impact',
      description: 'Prioritizes civic grievances with highest citizen validation, upvotes, and escalation signals.',
      icon: Users,
      accentColor: '#0288D1',
      weightsSummary: 'Confirmations: 50% | Getting Worse: 30% | Age: 20%',
    },
    {
      id: 'strategy_e',
      name: 'Strategy E: Balanced Prioritization',
      description: 'Equitably blends severity, geography, recurrence, and community grievance across all municipal sectors.',
      icon: Scale,
      accentColor: '#315C4C',
      weightsSummary: 'Equal Proportional Weighting (16.6% each)',
    },
    {
      id: 'strategy_f',
      name: 'Strategy F: Custom Multi-Factor',
      description: 'Customize priority sliders to model specialized municipal scenarios or budget constraints.',
      icon: Sliders,
      accentColor: '#C58B36',
      weightsSummary: 'User Configured Custom Weights',
    },
  ];

  const handleRun = () => {
    const selectedStrat = strategies.find((s) => s.id === strategyId);
    onRunSimulation({
      strategyId,
      strategyName: selectedStrat ? selectedStrat.name : 'Custom Scenario',
      targetArea,
      targetCategory,
      activeTeams,
      dailyInterventionRate: dailyRate,
      timelineDays,
      customWeights: strategyId === 'strategy_f' ? customWeights : undefined,
    });
    onClose();
  };

  const neighborhoods: (string | HyderabadNeighborhood)[] = [
    'citywide',
    'Jubilee Hills',
    'Banjara Hills',
    'Madhapur',
    'Gachibowli',
    'Begumpet',
    'Kondapur',
  ];

  const categories: (string | IssueCategory)[] = [
    'all',
    'Road damage',
    'Water leakage',
    'Sewage overflow',
    'Streetlight',
    'Garbage & Sanitation',
    'Traffic issues',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E4E6E2] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#F5F5F2] border-b border-[#E4E6E2] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#315C4C] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#171918]">Configure City Intervention Simulation</h3>
              <p className="text-[11px] text-[#737773]">
                Model intervention strategies, crew capacity constraints, and cascading defect prevention.
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

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* 1. Strategy Selection */}
          <div className="space-y-3">
            <label className="font-bold text-[#171918] uppercase tracking-wider text-[11px] block">
              1. Select Intervention Strategy
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {strategies.map((strat) => {
                const Icon = strat.icon;
                const isSelected = strategyId === strat.id;

                return (
                  <div
                    key={strat.id}
                    onClick={() => setStrategyId(strat.id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#315C4C] bg-[#F5F5F2] ring-1 ring-[#315C4C] shadow-sm'
                        : 'border-[#E4E6E2] bg-white hover:border-[#DDE7DF]'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${strat.accentColor}15`,
                          color: strat.accentColor,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[#171918] text-xs">{strat.name}</h4>
                        <p className="text-[11px] text-[#737773] mt-1 leading-relaxed">
                          {strat.description}
                        </p>
                        <div className="mt-2 text-[10px] font-mono text-[#315C4C] bg-white px-2 py-0.5 rounded border border-[#E4E6E2] inline-block">
                          {strat.weightsSummary}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strategy F Custom Sliders */}
          {strategyId === 'strategy_f' && (
            <div className="p-4 bg-[#F5F5F2] rounded-lg border border-[#DDE7DF] space-y-3">
              <div className="flex items-center space-x-2 text-[#315C4C] font-bold text-xs">
                <Sliders className="w-4 h-4" />
                <span>Custom Weight Sliders (Normalized in calculation)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#737773]">Risk & Severity</span>
                    <span className="font-bold">{customWeights.riskWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customWeights.riskWeight}
                    onChange={(e) =>
                      setCustomWeights({ ...customWeights, riskWeight: parseInt(e.target.value) })
                    }
                    className="w-full accent-[#315C4C]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#737773]">Spatial Density</span>
                    <span className="font-bold">{customWeights.densityWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customWeights.densityWeight}
                    onChange={(e) =>
                      setCustomWeights({ ...customWeights, densityWeight: parseInt(e.target.value) })
                    }
                    className="w-full accent-[#315C4C]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#737773]">Recurrence History</span>
                    <span className="font-bold">{customWeights.recurrenceWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customWeights.recurrenceWeight}
                    onChange={(e) =>
                      setCustomWeights({
                        ...customWeights,
                        recurrenceWeight: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-[#315C4C]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#737773]">Community Signals</span>
                    <span className="font-bold">{customWeights.communityWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customWeights.communityWeight}
                    onChange={(e) =>
                      setCustomWeights({
                        ...customWeights,
                        communityWeight: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-[#315C4C]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#737773]">Backlog Age</span>
                    <span className="font-bold">{customWeights.ageWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customWeights.ageWeight}
                    onChange={(e) =>
                      setCustomWeights({ ...customWeights, ageWeight: parseInt(e.target.value) })
                    }
                    className="w-full accent-[#315C4C]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#737773]">Cascade Prevention</span>
                    <span className="font-bold">{customWeights.costWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customWeights.costWeight}
                    onChange={(e) =>
                      setCustomWeights({ ...customWeights, costWeight: parseInt(e.target.value) })
                    }
                    className="w-full accent-[#315C4C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Target Scope Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-[#171918] uppercase tracking-wider text-[11px] block mb-1.5">
                Target Geographic Area
              </label>
              <select
                value={targetArea}
                onChange={(e) => setTargetArea(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#E4E6E2] bg-white text-[#171918] focus:border-[#315C4C] outline-none"
              >
                {neighborhoods.map((n) => (
                  <option key={n} value={n}>
                    {n === 'citywide' ? 'All Hyderabad (Citywide)' : n}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-[#171918] uppercase tracking-wider text-[11px] block mb-1.5">
                Target Civic Category
              </label>
              <select
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#E4E6E2] bg-white text-[#171918] focus:border-[#315C4C] outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All Civic Categories' : c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Operational Capacity Constraints */}
          <div className="space-y-4 pt-2 border-t border-[#E4E6E2]">
            <label className="font-bold text-[#171918] uppercase tracking-wider text-[11px] block">
              2. Operational Capacity Constraints
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-3 bg-[#F5F5F2] rounded-lg border border-[#E4E6E2]">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-medium text-[#737773]">Active Field Teams</span>
                  <span className="font-mono font-bold text-sm text-[#315C4C]">{activeTeams} teams</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={activeTeams}
                  onChange={(e) => setActiveTeams(parseInt(e.target.value))}
                  className="w-full accent-[#315C4C]"
                />
                <span className="text-[10px] text-[#737773] mt-1 block">
                  Municipal crews allocated to selected corridor.
                </span>
              </div>

              <div className="p-3 bg-[#F5F5F2] rounded-lg border border-[#E4E6E2]">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-medium text-[#737773]">Intervention Rate</span>
                  <span className="font-mono font-bold text-sm text-[#315C4C]">{dailyRate} issues/day</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.5"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(parseFloat(e.target.value))}
                  className="w-full accent-[#315C4C]"
                />
                <span className="text-[10px] text-[#737773] mt-1 block">
                  Average throughput per crew per working shift.
                </span>
              </div>

              <div className="p-3 bg-[#F5F5F2] rounded-lg border border-[#E4E6E2]">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-medium text-[#737773]">Simulation Horizon</span>
                  <span className="font-mono font-bold text-sm text-[#315C4C]">{timelineDays} Days</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTimelineDays(d)}
                      className={`py-1 text-center font-medium rounded text-xs transition-colors ${
                        timelineDays === d
                          ? 'bg-[#315C4C] text-white font-bold'
                          : 'bg-white border border-[#E4E6E2] text-[#171918] hover:bg-[#F5F5F2]'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-[#737773] mt-2 block">
                  Total daily capacity: ~{Math.round(activeTeams * dailyRate)} issues/day
                </span>
              </div>
            </div>
          </div>

          {/* Isolation Notice */}
          <div className="p-3 bg-[#DDE7DF]/40 border border-[#DDE7DF] rounded-lg flex items-start space-x-2.5 text-[11px] text-[#315C4C]">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Strict Simulation Isolation:</strong> This simulation evaluates hypothetical
              intervention models inside an isolated projection memory sandbox. It will <strong>never</strong>{' '}
              mutate real civic report statuses, dispatch official work orders, or alter citizen audit logs.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F5F5F2] border-t border-[#E4E6E2] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#E4E6E2] bg-white text-[#171918] font-semibold text-xs hover:bg-[#F5F5F2] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRun}
            className="px-5 py-2 rounded-lg bg-[#315C4C] text-white font-semibold text-xs hover:bg-[#284B3E] transition-colors shadow-sm flex items-center space-x-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Simulation Model</span>
          </button>
        </div>
      </div>
    </div>
  );
};
