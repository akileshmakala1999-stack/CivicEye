import React, { useState, useEffect } from 'react';
import {
  DashboardReport,
  WorkOrder,
  HotspotData,
  DigitalTwinLayerConfig,
  DigitalTwinLayerId,
  SpatialDensityCell,
  SimulationParameters,
  SimulationResult,
  SavedSimulationScenario,
  CascadingDependencyChain,
  InfrastructureRelationship,
  OperationalRole,
} from '../types';
import { reportService } from '../services/reportService';
import { operationsService } from '../services/operationsService';
import { citywideIntelligenceService } from '../services/citywideIntelligenceService';
import { aiOrchestrationService } from '../services/aiOrchestrationService';
import { digitalTwinService } from '../services/digitalTwinService';

import { DigitalTwinMap } from '../components/digitaltwin/DigitalTwinMap';
import { DigitalTwinLayersPanel } from '../components/digitaltwin/DigitalTwinLayersPanel';
import { ScenarioBuilderModal } from '../components/digitaltwin/ScenarioBuilderModal';
import { SimulationResultsView } from '../components/digitaltwin/SimulationResultsView';
import { InterventionComparisonModal } from '../components/digitaltwin/InterventionComparisonModal';
import { SimulationHistoryDrawer } from '../components/digitaltwin/SimulationHistoryDrawer';
import { InfrastructureCascadeGraph } from '../components/digitaltwin/InfrastructureCascadeGraph';

import {
  Layers,
  Sparkles,
  History,
  Scale,
  Play,
  Share2,
  MapPin,
  Calendar,
} from 'lucide-react';

export const DigitalTwinPage: React.FC = () => {
  // Operational Role for RBAC
  const [currentRole, setCurrentRole] = useState<OperationalRole>('supervisor');

  // Base Data
  const [reports, setReports] = useState<DashboardReport[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [hotspots, setHotspots] = useState<HotspotData[]>([]);
  const [relationships, setRelationships] = useState<InfrastructureRelationship[]>([]);
  const [cascadingChains, setCascadingChains] = useState<CascadingDependencyChain[]>([]);
  const [densityGrid, setDensityGrid] = useState<SpatialDensityCell[]>([]);
  const [layers, setLayers] = useState<DigitalTwinLayerConfig[]>([]);
  const [datasetFingerprint, setDatasetFingerprint] = useState<string>('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'map' | 'simulation' | 'cascades'>('map');

  // Simulation State
  const [activeSimulation, setActiveSimulation] = useState<SimulationResult | null>(null);
  const [simulatedDay, setSimulatedDay] = useState<number>(0);
  const [savedScenarios, setSavedScenarios] = useState<SavedSimulationScenario[]>([]);
  const [isCurrentScenarioSaved, setIsCurrentScenarioSaved] = useState<boolean>(false);

  // Modals & Drawers
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [compareScenariosList, setCompareScenariosList] = useState<SimulationResult[]>([]);

  // Load Data
  useEffect(() => {
    loadData();
  }, [currentRole]);

  const loadData = async () => {
    try {
      const repList = await reportService.getAllReports();
      setReports(repList);

      const woList = await operationsService.getWorkOrders();
      setWorkOrders(woList);

      const hsList = citywideIntelligenceService.detectHotspots(repList);
      setHotspots(hsList);

      const relList = aiOrchestrationService.getRelationships();
      setRelationships(relList);

      const chains = digitalTwinService.detectCascadingChains(repList);
      setCascadingChains(chains);

      const grid = digitalTwinService.calculateSpatialDensityGrid(repList, 4);
      setDensityGrid(grid);

      const layerConfigs = digitalTwinService.getLayers(repList, woList);
      setLayers(layerConfigs);

      const fp = digitalTwinService.getDatasetFingerprint(repList);
      setDatasetFingerprint(fp);

      const saved = await digitalTwinService.getSavedScenarios(currentRole);
      setSavedScenarios(saved);

      // Pre-seed a default simulation if none exists
      if (!activeSimulation && repList.length > 0) {
        const defaultResult = digitalTwinService.runSimulation(
          {
            strategyId: 'strategy_a',
            strategyName: 'Strategy A: Critical Issues First',
            targetArea: 'citywide',
            targetCategory: 'all',
            activeTeams: 6,
            dailyInterventionRate: 2.5,
            timelineDays: 30,
          },
          repList,
          woList
        );
        setActiveSimulation(defaultResult);
        setSimulatedDay(0);
      }
    } catch (err) {
      console.error('Failed to load digital twin data:', err);
    }
  };

  // 12 Layers Toggle Handlers
  const handleToggleLayer = (layerId: DigitalTwinLayerId) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, isEnabled: !l.isEnabled } : l))
    );
  };

  const handleSetLayerPreset = (preset: 'default' | 'all' | 'risk' | 'operations') => {
    setLayers((prev) =>
      prev.map((l) => {
        switch (preset) {
          case 'default':
            return { ...l, isEnabled: l.isDefault };
          case 'all':
            return { ...l, isEnabled: true };
          case 'risk':
            return {
              ...l,
              isEnabled:
                l.id === 'critical_risk' ||
                l.id === 'civic_hotspots' ||
                l.id === 'risk_density' ||
                l.id === 'recurring_issues',
            };
          case 'operations':
            return {
              ...l,
              isEnabled:
                l.id === 'work_orders' ||
                l.id === 'department_activity' ||
                l.id === 'multi_agency_zones' ||
                l.id === 'resolved_issues',
            };
          default:
            return l;
        }
      })
    );
  };

  // Run Simulation Handler
  const handleRunSimulation = (params: SimulationParameters) => {
    const result = digitalTwinService.runSimulation(params, reports, workOrders);
    setActiveSimulation(result);
    setSimulatedDay(0);
    setIsCurrentScenarioSaved(false);
    setActiveTab('simulation');
  };

  // Save Scenario Handler
  const handleSaveCurrentScenario = async () => {
    if (!activeSimulation) return;
    const scenarioToSave: SavedSimulationScenario = {
      id: activeSimulation.id,
      name: activeSimulation.scenarioName,
      description: `Target: ${activeSimulation.parameters.targetArea} • Teams: ${activeSimulation.parameters.activeTeams}`,
      createdByRole: currentRole,
      createdAt: new Date().toISOString(),
      datasetFingerprint,
      parameters: activeSimulation.parameters,
      result: activeSimulation,
    };
    await digitalTwinService.saveScenario(scenarioToSave);
    const updated = await digitalTwinService.getSavedScenarios(currentRole);
    setSavedScenarios(updated);
    setIsCurrentScenarioSaved(true);
  };

  // Delete Scenario Handler
  const handleDeleteScenario = async (id: string) => {
    try {
      await digitalTwinService.deleteScenario(id, currentRole);
      const updated = await digitalTwinService.getSavedScenarios(currentRole);
      setSavedScenarios(updated);
    } catch (err: any) {
      alert(err.message || 'Unauthorized: Only municipal supervisors or administrators may delete simulation scenarios.');
    }
  };

  // Load Scenario from Archive
  const handleLoadSavedScenario = (scenario: SavedSimulationScenario) => {
    setActiveSimulation(scenario.result);
    setSimulatedDay(0);
    setIsCurrentScenarioSaved(true);
    setActiveTab('simulation');
  };

  // Compare Scenarios
  const handleOpenComparison = () => {
    const scenariosToCompare: SimulationResult[] = [];
    if (activeSimulation) {
      scenariosToCompare.push(activeSimulation);
    }
    // Generate Strategy B and Strategy E for rich side-by-side comparison
    const stratB = digitalTwinService.runSimulation(
      {
        strategyId: 'strategy_b',
        strategyName: 'Strategy B: Hotspot Reduction',
        targetArea: activeSimulation?.parameters.targetArea || 'citywide',
        targetCategory: 'all',
        activeTeams: activeSimulation?.parameters.activeTeams || 6,
        dailyInterventionRate: 2.5,
        timelineDays: 30,
      },
      reports,
      workOrders
    );
    scenariosToCompare.push(stratB);

    const stratE = digitalTwinService.runSimulation(
      {
        strategyId: 'strategy_e',
        strategyName: 'Strategy E: Balanced Prioritization',
        targetArea: activeSimulation?.parameters.targetArea || 'citywide',
        targetCategory: 'all',
        activeTeams: activeSimulation?.parameters.activeTeams || 6,
        dailyInterventionRate: 2.5,
        timelineDays: 30,
      },
      reports,
      workOrders
    );
    scenariosToCompare.push(stratE);

    setCompareScenariosList(scenariosToCompare);
    setIsCompareOpen(true);
  };

  const { validReports, nonGeographicReports, outsideViewportReports } = digitalTwinService.filterGeographicReports(reports);

  // Resolved IDs for current simulated day
  const simulatedResolvedIds =
    activeSimulation && simulatedDay > 0
      ? activeSimulation.resolvedReportIdsByDay[simulatedDay] || []
      : [];

  const isSupervisorOrAdmin = currentRole === 'supervisor' || currentRole === 'admin';

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-[#171918] pb-12">
      {/* Top Banner / Navigation Bar */}
      <div className="bg-white border-b border-[#E4E6E2] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Title & Metadata */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#315C4C] text-white flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-[#171918] tracking-tight">
                  Civic Digital Twin & City Simulation Engine
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#DDE7DF] text-[#315C4C]">
                  PHASE 10
                </span>
              </div>
              <p className="text-[11px] text-[#737773]">
                Spatial civic intelligence • 12 Layer Analytics • Deterministic Intervention Simulator
              </p>
            </div>
          </div>

          {/* Role Switcher & Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* RBAC Role Switcher */}
            <div className="flex items-center space-x-1.5 bg-[#F5F5F2] px-2 py-1 rounded-lg border border-[#E4E6E2] text-[11px]">
              <span className="text-[#737773] font-medium">Role:</span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as OperationalRole)}
                className="bg-transparent font-bold text-[#315C4C] outline-none cursor-pointer capitalize"
              >
                <option value="citizen">Citizen (Public View)</option>
                <option value="staff">Staff / Reviewer</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {/* Archive Button */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-[#E4E6E2] bg-white hover:bg-[#F5F5F2] text-xs font-semibold text-[#171918] transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <History className="w-3.5 h-3.5" />
              <span>Archive ({savedScenarios.length})</span>
            </button>

            {/* Compare Button */}
            <button
              type="button"
              onClick={handleOpenComparison}
              className="px-3 py-1.5 rounded-lg border border-[#E4E6E2] bg-white hover:bg-[#F5F5F2] text-xs font-semibold text-[#315C4C] transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare</span>
            </button>

            {/* New Simulation Button (Supervisor/Admin only) */}
            {isSupervisorOrAdmin ? (
              <button
                type="button"
                onClick={() => setIsBuilderOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#315C4C] hover:bg-[#284B3E] text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>New Simulation</span>
              </button>
            ) : (
              <div
                className="px-3 py-1.5 rounded-lg bg-[#E4E6E2]/50 text-[#737773] text-[11px] font-medium"
                title="Only Municipal Supervisors and Admins can configure intervention simulations"
              >
                Simulation Config (Supervisor Only)
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-6 text-xs font-semibold border-t border-[#E4E6E2]/60">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`py-2.5 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'map'
                ? 'border-[#315C4C] text-[#315C4C]'
                : 'border-transparent text-[#737773] hover:text-[#171918]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Spatial Digital Twin Map</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulation')}
            className={`py-2.5 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'simulation'
                ? 'border-[#315C4C] text-[#315C4C]'
                : 'border-transparent text-[#737773] hover:text-[#171918]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Intervention Simulation Engine</span>
            {activeSimulation && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cascades')}
            className={`py-2.5 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'cascades'
                ? 'border-[#315C4C] text-[#315C4C]'
                : 'border-transparent text-[#737773] hover:text-[#171918]'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Infrastructure Cascades ({cascadingChains.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* TAB 1: SPATIAL DIGITAL TWIN MAP */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column: 12 Toggleable Intelligence Layers */}
            <div className="lg:col-span-1">
              <DigitalTwinLayersPanel
                layers={layers}
                onToggleLayer={handleToggleLayer}
                onSetPreset={handleSetLayerPreset}
              />
            </div>

            {/* Right Column: Spatial Digital Twin Map Canvas */}
            <div className="lg:col-span-3 space-y-4">
              <DigitalTwinMap
                reports={validReports}
                nonGeographicCount={nonGeographicReports.length}
                outsideViewportCount={outsideViewportReports.length}
                layers={layers}
                hotspots={hotspots}
                workOrders={workOrders}
                densityGrid={densityGrid}
                cascadingChains={cascadingChains}
                relationships={relationships}
                simulatedResolvedIds={simulatedResolvedIds}
                simulatedDay={simulatedDay}
              />

              {/* Quick Simulation Scrub Bar if active */}
              {activeSimulation && (
                <div className="bg-white p-3 rounded-lg border border-[#E4E6E2] shadow-xs flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-[#315C4C]" />
                    <span className="font-semibold text-[#171918]">
                      Time Travel Scrubber (Simulation: {activeSimulation.parameters.strategyId}):
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {[0, 1, 3, 7, 14, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSimulatedDay(d)}
                        className={`px-2 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                          simulatedDay === d
                            ? 'bg-[#315C4C] text-white'
                            : 'bg-[#F5F5F2] text-[#737773] hover:bg-[#E4E6E2]'
                        }`}
                      >
                        Day {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INTERVENTION SIMULATION OUTCOMES */}
        {activeTab === 'simulation' && (
          <div>
            {activeSimulation ? (
              <SimulationResultsView
                result={activeSimulation}
                selectedDay={simulatedDay}
                onSelectDay={(day) => setSimulatedDay(day)}
                onSaveScenario={handleSaveCurrentScenario}
                onOpenCompare={handleOpenComparison}
                onAdjustParams={() => setIsBuilderOpen(true)}
                isSaved={isCurrentScenarioSaved}
              />
            ) : (
              <div className="bg-white p-12 text-center rounded-xl border border-[#E4E6E2] shadow-sm space-y-4">
                <Sparkles className="w-10 h-10 mx-auto text-[#315C4C]" />
                <h3 className="text-base font-bold text-[#171918]">
                  No Simulation Model Currently Running
                </h3>
                <p className="text-xs text-[#737773] max-w-md mx-auto">
                  Model hypothetical municipal intervention scenarios to calculate backlog reduction,
                  critical hazard mitigation, and cascading cost avoidance over 30 days.
                </p>
                {isSupervisorOrAdmin ? (
                  <button
                    type="button"
                    onClick={() => setIsBuilderOpen(true)}
                    className="px-5 py-2.5 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#284B3E] transition-colors"
                  >
                    Configure New Simulation
                  </button>
                ) : (
                  <p className="text-xs text-amber-700 font-medium">
                    (Switch role to Supervisor or Admin to configure simulations)
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INFRASTRUCTURE CASCADES */}
        {activeTab === 'cascades' && (
          <div className="space-y-6">
            <InfrastructureCascadeGraph
              chains={cascadingChains}
              onSelectReportId={(_repId) => {
                setActiveTab('map');
                // Auto enable critical layer
                handleSetLayerPreset('risk');
              }}
            />
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <ScenarioBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onRunSimulation={handleRunSimulation}
        initialParams={activeSimulation?.parameters}
      />

      <SimulationHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedScenarios={savedScenarios}
        currentFingerprint={datasetFingerprint}
        onLoadScenario={handleLoadSavedScenario}
        onDeleteScenario={handleDeleteScenario}
      />

      <InterventionComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        scenarios={compareScenariosList}
        onSelectScenario={(scen) => {
          setActiveSimulation(scen);
          setSimulatedDay(0);
          setActiveTab('simulation');
        }}
      />
    </div>
  );
};
