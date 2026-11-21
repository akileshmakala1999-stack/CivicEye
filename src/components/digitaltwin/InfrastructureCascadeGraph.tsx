import React from 'react';
import { CascadingDependencyChain } from '../../types';
import {
  Share2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Info,
} from 'lucide-react';

interface InfrastructureCascadeGraphProps {
  chains: CascadingDependencyChain[];
  onSelectReportId?: (reportId: string) => void;
}

export const InfrastructureCascadeGraph: React.FC<InfrastructureCascadeGraphProps> = ({
  chains,
  onSelectReportId,
}) => {
  if (chains.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-[#737773] bg-white rounded-xl border border-[#E4E6E2]">
        <Share2 className="w-8 h-8 mx-auto text-[#DDE7DF] mb-2" />
        <p className="font-semibold text-[#171918]">No Active Cascading Chains Detected</p>
        <p className="text-[11px] mt-1">
          No correlated infrastructure failure sequences detected across active reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Disclaimer & Causality Disclosure */}
      <div className="p-3 bg-white rounded-xl border border-[#E4E6E2] shadow-xs flex items-start space-x-2.5 text-xs text-[#737773]">
        <Info className="w-4 h-4 text-[#315C4C] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#171918]">Causality & Spatial Relationship Disclosure:</strong> Spatial
          co-location of municipal defects indicates physical correlation, not definitive verified causation.
          Chains are categorized by empirical certainty (*Recorded Engineering Link*, *Data-Supported Inference*,
          or *Hypothetical Cascade*). Field technical validation is required before official work order dispatch.
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Share2 className="w-4 h-4 text-[#315C4C]" />
          <h3 className="text-xs font-bold text-[#171918] uppercase tracking-wider">
            Cascading Infrastructure Failure Chains ({chains.length})
          </h3>
        </div>
        <span className="text-[10px] text-[#737773] font-mono">
          Physical Causal Dependencies (Water → Road → Grid)
        </span>
      </div>

      <div className="space-y-4">
        {chains.map((chain) => (
          <div
            key={chain.chainId}
            className="bg-white p-4 rounded-xl border border-[#E4E6E2] shadow-sm space-y-4"
          >
            {/* Chain Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4E6E2] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#DDE7DF] text-[#315C4C]">
                  {chain.neighborhood}
                </span>
                <h4 className="text-xs font-bold text-[#171918] mt-1">
                  {chain.corridorName}
                </h4>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-[#737773] block">Delayed Repair Cost Multiplier:</span>
                  <strong className="text-[#B8463B] font-mono font-bold">
                    {chain.estimatedEscalationCostMultiplier}x
                  </strong>
                  <span className="text-[9px] text-[#737773] block">
                    (Model Assumption: Emergency vs Scheduled repair)
                  </span>
                </div>
              </div>
            </div>

            {/* Directed Chain Steps */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {chain.nodes.map((node, index) => {
                const isRoot = node.stage === 1;
                const isLast = index === chain.nodes.length - 1;
                const certaintyLabel =
                  node.certainty === 'recorded'
                    ? 'Recorded Link'
                    : node.certainty === 'data_supported'
                    ? 'Data-Supported'
                    : 'Hypothetical Cascade';

                return (
                  <React.Fragment key={node.id}>
                    <div
                      onClick={() => onSelectReportId && onSelectReportId(node.reportId)}
                      className={`flex-1 p-3 rounded-lg border transition-all cursor-pointer ${
                        isRoot
                          ? 'border-[#B8463B]/40 bg-red-50/30 hover:border-[#B8463B]'
                          : 'border-[#E4E6E2] bg-[#F5F5F2] hover:border-[#DDE7DF]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span
                          className={`font-bold font-mono px-1.5 py-0.5 rounded ${
                            isRoot
                              ? 'bg-[#B8463B] text-white'
                              : 'bg-[#DDE7DF] text-[#315C4C]'
                          }`}
                        >
                          Stage {node.stage}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white border border-[#E4E6E2] text-[#737773]">
                          {certaintyLabel}
                        </span>
                      </div>

                      <h5 className="font-bold text-[#171918] text-xs truncate">
                        {node.title}
                      </h5>
                      <p className="text-[10px] text-[#737773] mt-0.5 truncate">
                        {node.stageLabel}
                      </p>

                      <div className="mt-2 pt-2 border-t border-[#E4E6E2] flex items-center justify-between text-[10px]">
                        <span className="text-[#737773] flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Window: {node.avoidableIfAddressedWithinDays}d</span>
                        </span>
                        <span className="font-semibold capitalize text-[#315C4C]">
                          {node.category}
                        </span>
                      </div>
                    </div>

                    {!isLast && (
                      <div className="flex items-center justify-center shrink-0 text-[#737773] py-1 md:py-0">
                        <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Strategic Advice */}
            <div className="p-2.5 bg-[#DDE7DF]/30 rounded-lg border border-[#DDE7DF] flex items-start space-x-2 text-[11px] text-[#315C4C]">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Remediation Strategy:</strong> Resolving Root Stage 1 (Water Leakage) within{' '}
                <strong>{chain.nodes[0]?.avoidableIfAddressedWithinDays || 3} days</strong> halts ground
                decompaction, preventing road subsidence and averting an estimated{' '}
                <strong>{chain.estimatedEscalationCostMultiplier}x</strong> emergency repair expenditure.
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
