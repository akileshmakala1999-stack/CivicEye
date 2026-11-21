import React, { useState } from 'react';
import { SectionHeader } from '../common/SectionHeader';
import { DEMO_HOTSPOTS } from '../../data/mockData';
import { HotspotCluster } from '../../types';
import { AlertTriangle, Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HotspotPreview: React.FC = () => {
  const [activeHotspotId, setActiveHotspotId] = useState<string>(DEMO_HOTSPOTS[0].id);

  const activeCluster = DEMO_HOTSPOTS.find((h) => h.id === activeHotspotId) || DEMO_HOTSPOTS[0];

  return (
    <section className="bg-white py-20 sm:py-28 border-b border-[#E4E6E2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="Pattern Intelligence"
          title="Detecting recurring civic hotspots."
          description="Isolated complaints often stem from systemic root causes. CivicEye aggregates historical reports to spotlight infrastructure clusters before full failures occur."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Hotspot Selector & Insights List */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E6E2]">
              <span className="text-xs font-mono uppercase tracking-wider text-[#737773]">
                Detected Incident Clusters
              </span>
              <span className="text-xs font-mono text-[#315C4C] font-medium">
                Algorithm: Spatial Density DB-Scan
              </span>
            </div>

            <div className="space-y-3">
              {DEMO_HOTSPOTS.map((hotspot: HotspotCluster) => {
                const isActive = hotspot.id === activeHotspotId;
                return (
                  <div
                    key={hotspot.id}
                    onClick={() => setActiveHotspotId(hotspot.id)}
                    className={`cursor-pointer rounded-lg p-5 border transition-all duration-200 ${
                      isActive
                        ? 'bg-[#F5F5F2] border-[#315C4C] shadow-sm'
                        : 'bg-white border-[#E4E6E2] hover:border-[#737773]'
                    }`}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            hotspot.riskLevel === 'high' ? 'bg-[#B8463B]' : 'bg-[#C58B36]'
                          }`}
                        />
                        <span className="text-xs font-mono uppercase text-[#737773]">
                          {hotspot.category}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-white border border-[#E4E6E2] text-[#171918]">
                        {hotspot.incidentCount} incidents • {hotspot.timeframe}
                      </span>
                    </div>

                    <h4 className="text-base font-semibold text-[#171918] mb-1">
                      {hotspot.title}
                    </h4>

                    <div className="text-xs text-[#737773] mb-2 font-mono">
                      Location: {hotspot.neighborhood}
                    </div>

                    <p className="text-xs text-[#737773] leading-relaxed">
                      {hotspot.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <Link
                to="/insights"
                className="inline-flex items-center gap-2 text-xs font-medium text-[#315C4C] hover:underline"
              >
                <span>Explore all district clustering patterns</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Right: Small Map-Like Density Visualization Canvas */}
          <div className="lg:col-span-6 bg-[#F5F5F2] border border-[#E4E6E2] rounded-lg p-5 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6E2] mb-4 text-xs">
              <div className="flex items-center gap-2 font-mono text-[#171918]">
                <Layers size={14} className="text-[#315C4C]" />
                <span>SPATIAL CLUSTER RADAR</span>
              </div>
              <span className="font-mono text-[11px] text-[#B8463B] font-semibold uppercase">
                {activeCluster.riskLevel.toUpperCase()} RECURRENCE INDEX
              </span>
            </div>

            {/* Visual Heatmap Canvas Mock */}
            <div className="relative w-full aspect-[4/3] bg-white border border-[#E4E6E2] rounded-md overflow-hidden p-4 flex flex-col justify-between">
              {/* SVG Grid with Heat Rings */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 400 300"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Street grid */}
                <line x1="0" y1="100" x2="400" y2="100" stroke="#F5F5F2" strokeWidth="16" />
                <line x1="0" y1="200" x2="400" y2="200" stroke="#F5F5F2" strokeWidth="16" />
                <line x1="120" y1="0" x2="120" y2="300" stroke="#F5F5F2" strokeWidth="16" />
                <line x1="280" y1="0" x2="280" y2="300" stroke="#F5F5F2" strokeWidth="16" />

                {/* Hotspot 1: North Ave (Asphalt) */}
                <circle
                  cx="120"
                  cy="100"
                  r={activeHotspotId === 'hotspot-1' ? '65' : '40'}
                  fill="#B8463B"
                  fillOpacity={activeHotspotId === 'hotspot-1' ? '0.18' : '0.08'}
                  className="transition-all duration-300"
                />
                <circle
                  cx="120"
                  cy="100"
                  r={activeHotspotId === 'hotspot-1' ? '35' : '20'}
                  fill="#B8463B"
                  fillOpacity="0.25"
                />
                <circle cx="120" cy="100" r="5" fill="#B8463B" />

                {/* Hotspot 2: Sector 7 Basin (Drainage) */}
                <circle
                  cx="280"
                  cy="200"
                  r={activeHotspotId === 'hotspot-2' ? '65' : '40'}
                  fill="#C58B36"
                  fillOpacity={activeHotspotId === 'hotspot-2' ? '0.18' : '0.08'}
                  className="transition-all duration-300"
                />
                <circle
                  cx="280"
                  cy="200"
                  r={activeHotspotId === 'hotspot-2' ? '35' : '20'}
                  fill="#C58B36"
                  fillOpacity="0.25"
                />
                <circle cx="280" cy="200" r="5" fill="#C58B36" />

                {/* Hotspot 3: East Boulevard (Streetlights) */}
                <circle
                  cx="280"
                  cy="100"
                  r={activeHotspotId === 'hotspot-3' ? '65' : '40'}
                  fill="#315C4C"
                  fillOpacity={activeHotspotId === 'hotspot-3' ? '0.18' : '0.08'}
                  className="transition-all duration-300"
                />
                <circle
                  cx="280"
                  cy="100"
                  r={activeHotspotId === 'hotspot-3' ? '35' : '20'}
                  fill="#315C4C"
                  fillOpacity="0.25"
                />
                <circle cx="280" cy="100" r="5" fill="#315C4C" />
              </svg>

              {/* Top overlay tag */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-white/95 border border-[#E4E6E2] text-[10px] font-mono text-[#171918]">
                  Focal Point: {activeCluster.neighborhood}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/95 border border-[#E4E6E2] text-[10px] font-mono text-[#737773]">
                  Radius: 350m
                </span>
              </div>

              {/* Bottom active cluster status card */}
              <div className="relative z-10 bg-white/95 backdrop-blur-sm border border-[#E4E6E2] rounded p-3 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[#171918]">
                    {activeCluster.title}
                  </span>
                  <span className="text-[10px] font-mono text-[#315C4C]">
                    Pattern Confirmed
                  </span>
                </div>
                <div className="text-[11px] text-[#737773]">
                  Threshold: High density repetition triggers municipal root-cause review protocol.
                </div>
              </div>
            </div>

            {/* Illustrative Disclaimer Note */}
            <div className="mt-3 flex items-start gap-2 text-[11px] text-[#737773] pt-2 border-t border-[#E4E6E2]">
              <AlertTriangle size={13} className="text-[#C58B36] flex-shrink-0 mt-0.5" />
              <span>
                <strong>Illustrative Intelligence Model:</strong> Sample spatial patterns synthesized from pilot data for demonstration purposes only. Does not assert live city predictions.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
