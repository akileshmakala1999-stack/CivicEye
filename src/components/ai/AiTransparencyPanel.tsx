import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, Cpu, Database, AlertCircle } from 'lucide-react';

interface AiTransparencyPanelProps {
  modelProvider?: string;
  confidenceScore: number; // 0 to 1 or 0 to 100
  analysisTimestamp?: string;
  dataSource?: string;
  recordsAnalyzedCount?: number;
  limitations?: string[];
  humanReviewStatus?: 'pending_review' | 'human_verified' | 'advisory_only';
  isCompact?: boolean;
}

export const AiTransparencyPanel: React.FC<AiTransparencyPanelProps> = ({
  modelProvider = 'CivicEye Grounded Heuristic + Decision Engine',
  confidenceScore,
  analysisTimestamp,
  dataSource = 'CivicEye Municipal Records & Community Evidence',
  recordsAnalyzedCount = 23,
  limitations = [
    'Advisory inference: Does not represent an official municipal dispatch decision.',
    'Evaluates submitted photographic proof and citizen confirmation weights.',
  ],
  humanReviewStatus = 'advisory_only',
  isCompact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const confidencePct = confidenceScore <= 1 ? Math.round(confidenceScore * 100) : Math.round(confidenceScore);

  return (
    <div className="rounded-xl border border-[#315C4C]/20 bg-[#FAFBF9] text-xs text-[#171918] transition-all">
      {/* HEADER / ACCORDION TRIGGER */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2.5 sm:p-3 flex items-center justify-between gap-3 text-left hover:bg-[#E4E6E2]/30 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-[#DDE7DF] text-[#315C4C]">
            <Cpu size={13} />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase font-bold text-[#315C4C] tracking-wider">
                AI Transparency & Grounding
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white border border-[#E4E6E2] text-[#737773]">
                Explainable
              </span>
            </div>
            {!isCompact && (
              <p className="text-[11px] text-[#737773] mt-0.5">
                Deterministic scoring with grounded municipal facts. Click to inspect telemetry.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[11px] font-bold text-[#315C4C]">
            {confidencePct}% Confidence
          </span>
          {isOpen ? <ChevronUp size={14} className="text-[#737773]" /> : <ChevronDown size={14} className="text-[#737773]" />}
        </div>
      </button>

      {/* EXPANDABLE DETAIL DRAWER */}
      {isOpen && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 border-t border-[#E4E6E2]/70 space-y-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="p-2.5 rounded-lg bg-white border border-[#E4E6E2]">
              <span className="text-[9px] font-mono uppercase text-[#737773] block mb-0.5 flex items-center gap-1">
                <Cpu size={10} /> Model & Synthesis Engine
              </span>
              <span className="font-semibold text-[#171918]">{modelProvider}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-[#E4E6E2]">
              <span className="text-[9px] font-mono uppercase text-[#737773] block mb-0.5 flex items-center gap-1">
                <Database size={10} /> Grounded Data Source
              </span>
              <span className="font-semibold text-[#171918] truncate block" title={dataSource}>
                {dataSource}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-[#E4E6E2]">
              <span className="text-[9px] font-mono uppercase text-[#737773] block mb-0.5">
                Records Analyzed / Time
              </span>
              <span className="font-semibold text-[#171918]">
                {recordsAnalyzedCount} records • {analysisTimestamp || 'Live Intake Stream'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-[#E4E6E2]">
              <span className="text-[9px] font-mono uppercase text-[#737773] block mb-0.5 flex items-center gap-1">
                <ShieldCheck size={10} /> Review Governance
              </span>
              <span className="font-semibold text-[#315C4C]">
                {humanReviewStatus === 'human_verified'
                  ? 'Certified by Municipal Supervisor'
                  : 'Advisory Only (Human Authority Required)'}
              </span>
            </div>
          </div>

          {/* LIMITATIONS */}
          <div className="p-2.5 rounded-lg bg-[#FAF5ED] border border-[#C58B36]/30 text-[11px] text-[#171918]">
            <div className="flex items-center gap-1.5 font-bold text-[#C58B36] mb-1">
              <AlertCircle size={12} />
              <span>Model Scope & Known Limitations:</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-[#737773]">
              {limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
