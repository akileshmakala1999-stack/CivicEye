import React from 'react';
import { DigitalTwinLayerConfig, DigitalTwinLayerId } from '../../types';
import {
  MapPin,
  AlertCircle,
  AlertTriangle,
  Flame,
  RotateCcw,
  Wrench,
  Users,
  Share2,
  CheckCircle2,
  Grid,
  Building2,
  Layers,
  CheckSquare,
  Square,
  RotateCcw as ResetIcon,
} from 'lucide-react';

interface DigitalTwinLayersPanelProps {
  layers: DigitalTwinLayerConfig[];
  onToggleLayer: (layerId: DigitalTwinLayerId) => void;
  onSetPreset: (preset: 'default' | 'all' | 'risk' | 'operations') => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  MapPin,
  AlertCircle,
  AlertTriangle,
  Flame,
  RotateCcw,
  Wrench,
  Users,
  Share2,
  CheckCircle2,
  Grid,
  Building2,
  Layers,
};

export const DigitalTwinLayersPanel: React.FC<DigitalTwinLayersPanelProps> = ({
  layers,
  onToggleLayer,
  onSetPreset,
}) => {
  const categories: { key: DigitalTwinLayerConfig['category']; label: string }[] = [
    { key: 'base', label: 'Base Civic Layers' },
    { key: 'risk', label: 'Risk & Spatial Density' },
    { key: 'operations', label: 'Municipal Operations' },
    { key: 'coordination', label: 'Multi-Agency Coordination' },
  ];

  return (
    <div className="bg-white rounded-lg border border-[#E4E6E2] shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-3 bg-[#F5F5F2] border-b border-[#E4E6E2] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[#315C4C]" />
          <h3 className="text-xs font-bold text-[#171918] tracking-wider uppercase">
            Intelligence Layers ({layers.filter((l) => l.isEnabled).length}/{layers.length})
          </h3>
        </div>
      </div>

      {/* Presets Bar */}
      <div className="p-2 border-b border-[#E4E6E2] bg-white grid grid-cols-4 gap-1 text-[10px]">
        <button
          type="button"
          onClick={() => onSetPreset('default')}
          className="px-1.5 py-1 text-center font-medium rounded text-[#315C4C] hover:bg-[#DDE7DF]/50 transition-colors flex items-center justify-center space-x-1"
          title="Reset to recommended default layers"
        >
          <ResetIcon className="w-2.5 h-2.5" />
          <span>Default</span>
        </button>
        <button
          type="button"
          onClick={() => onSetPreset('risk')}
          className="px-1.5 py-1 text-center font-medium rounded text-[#B8463B] hover:bg-red-50 transition-colors"
        >
          Risk Focus
        </button>
        <button
          type="button"
          onClick={() => onSetPreset('operations')}
          className="px-1.5 py-1 text-center font-medium rounded text-[#2E7D32] hover:bg-emerald-50 transition-colors"
        >
          Operations
        </button>
        <button
          type="button"
          onClick={() => onSetPreset('all')}
          className="px-1.5 py-1 text-center font-medium rounded text-[#737773] hover:bg-gray-100 transition-colors"
        >
          All (12)
        </button>
      </div>

      {/* Layers List */}
      <div className="p-3 space-y-4 overflow-y-auto flex-1 max-h-[600px]">
        {categories.map((cat) => {
          const catLayers = layers.filter((l) => l.category === cat.key);
          if (catLayers.length === 0) return null;

          return (
            <div key={cat.key} className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-[#737773] uppercase tracking-wider px-1">
                {cat.label}
              </h4>
              <div className="space-y-1">
                {catLayers.map((layer) => {
                  const IconComponent = ICON_MAP[layer.icon] || MapPin;
                  return (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => onToggleLayer(layer.id)}
                      className={`w-full text-left p-2 rounded flex items-center justify-between text-xs transition-colors border ${
                        layer.isEnabled
                          ? 'bg-[#F5F5F2] border-[#DDE7DF] text-[#171918]'
                          : 'bg-white border-transparent text-[#737773] hover:bg-[#F5F5F2]/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {layer.isEnabled ? (
                          <CheckSquare className="w-4 h-4 text-[#315C4C] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-[#737773] shrink-0" />
                        )}
                        <IconComponent
                          className="w-3.5 h-3.5 shrink-0"
                          // @ts-expect-error color styling
                          style={{ color: layer.color }}
                        />
                        <div className="truncate">
                          <p className="font-semibold truncate text-[11px] leading-tight">
                            {layer.name}
                          </p>
                          <p className="text-[9px] text-[#737773] truncate">
                            {layer.description}
                          </p>
                        </div>
                      </div>
                      <span
                        className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium shrink-0"
                        style={{
                          backgroundColor: layer.isEnabled ? `${layer.color}15` : '#E4E6E2',
                          color: layer.isEnabled ? layer.color : '#737773',
                        }}
                      >
                        {layer.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
