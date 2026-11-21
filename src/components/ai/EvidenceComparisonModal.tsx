import React from 'react';
import { WorkOrder, EvidenceComparisonResult } from '../../types';
import { aiOrchestrationService } from '../../services/aiOrchestrationService';
import { AiTransparencyPanel } from './AiTransparencyPanel';
import {
  X,
  Camera,
  CheckCircle,
  Eye,
  FileQuestion,
} from 'lucide-react';

interface EvidenceComparisonModalProps {
  workOrder: WorkOrder | null;
  onClose: () => void;
  onApprove?: (wo: WorkOrder) => void;
  onReturnRework?: (wo: WorkOrder) => void;
  isSupervisor?: boolean;
}

export const EvidenceComparisonModal: React.FC<EvidenceComparisonModalProps> = ({
  workOrder,
  onClose,
  onApprove,
  onReturnRework,
  isSupervisor = false,
}) => {
  if (!workOrder) return null;

  const comparison: EvidenceComparisonResult = aiOrchestrationService.compareEvidencePhotos(workOrder);
  const evidence = workOrder.completionEvidence;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#E4E6E2] shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-[#171918]">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-[#E4E6E2] flex items-center justify-between bg-[#FAFBF9]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#DDE7DF] text-[#315C4C] border border-[#315C4C]/20 flex items-center gap-1">
                <Eye size={12} />
                <span>AI Evidence Intelligence</span>
              </span>
              <span className="text-xs font-mono text-[#737773]">{workOrder.id}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#171918] tracking-tight">
              Before & After Resolution Verification: {workOrder.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs">
          {/* PHOTO COMPARISON STAGE */}
          {!comparison.isAvailable ? (
            <div className="p-8 rounded-xl bg-[#FAFBF9] border border-dashed border-[#E4E6E2] text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF5ED] text-[#C58B36] flex items-center justify-center mx-auto border border-[#C58B36]/30">
                <FileQuestion size={24} />
              </div>
              <h3 className="text-sm font-bold text-[#171918]">
                Visual Evidence Comparison Unavailable
              </h3>
              <p className="text-[#737773] max-w-md mx-auto leading-relaxed">
                {comparison.summary} CivicEye requires both original intake photographs and certified post-rectification proof to run comparative feature extraction.
              </p>
              <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-[#737773] pt-2">
                <span>Before Photo: {comparison.hasBeforePhoto ? '✓ Available' : '✗ Missing'}</span>
                <span>•</span>
                <span>After Photo: {comparison.hasAfterPhoto ? '✓ Available' : '✗ Missing'}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BEFORE PHOTO */}
                <div className="rounded-xl border border-[#E4E6E2] overflow-hidden bg-[#FAFBF9]">
                  <div className="p-2.5 bg-white border-b border-[#E4E6E2] flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#B8463B] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#B8463B]" />
                      Intake Defect Evidence (Before)
                    </span>
                    <span className="text-[10px] text-[#737773] font-mono">Reported</span>
                  </div>
                  <div className="aspect-video bg-[#E4E6E2]/40 relative flex items-center justify-center overflow-hidden">
                    {evidence?.beforePhotoUrl || (workOrder as any).thumbnailUrl ? (
                      <img
                        src={evidence?.beforePhotoUrl || (workOrder as any).thumbnailUrl}
                        alt="Before Repair"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-[#737773]">
                        <Camera size={24} className="mx-auto mb-1 opacity-50" />
                        <span>No image provided</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 text-[11px] text-[#737773]">
                    Original citizen intake photograph capturing structural defect.
                  </div>
                </div>

                {/* AFTER PHOTO */}
                <div className="rounded-xl border border-[#315C4C]/40 overflow-hidden bg-[#FAFBF9]">
                  <div className="p-2.5 bg-white border-b border-[#E4E6E2] flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#315C4C] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#315C4C]" />
                      Field Rectification Proof (After)
                    </span>
                    <span className="text-[10px] text-[#315C4C] font-mono font-semibold">Completed</span>
                  </div>
                  <div className="aspect-video bg-[#E4E6E2]/40 relative flex items-center justify-center overflow-hidden">
                    {evidence?.afterPhotoUrl ? (
                      <img
                        src={evidence.afterPhotoUrl}
                        alt="After Repair"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-[#737773]">
                        <Camera size={24} className="mx-auto mb-1 opacity-50" />
                        <span>Awaiting field squad upload</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 text-[11px] text-[#737773]">
                    Photographic proof submitted by field squad ({evidence?.submittedByStaffName || 'Assigned Squad'}).
                  </div>
                </div>
              </div>

              {/* AI VISUAL ANALYSIS SUMMARY */}
              <div className="p-4 rounded-xl bg-white border border-[#315C4C]/30 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#E4E6E2]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#DDE7DF] text-[#315C4C]">
                      {comparison.improvementStatus === 'substantially_improved'
                        ? 'Substantially Improved (Pass)'
                        : 'Partially Improved (Needs Inspection)'}
                    </span>
                    <span className="text-[11px] font-mono text-[#737773]">
                      Location Alignment: {Math.round(comparison.locationMatchConfidence * 100)}%
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#315C4C]">
                    Analysis Confidence: {Math.round(comparison.confidence * 100)}%
                  </span>
                </div>

                <p className="text-xs text-[#171918] leading-relaxed font-medium">
                  {comparison.summary}
                </p>

                <div className="space-y-1.5 pt-1">
                  <span className="font-mono text-[10px] uppercase text-[#737773] block font-bold">
                    Detected Visual Differences & Inferences:
                  </span>
                  <ul className="space-y-1 text-[11px] text-[#737773]">
                    {comparison.visibleDifferences.map((diff, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle size={13} className="text-[#315C4C] shrink-0 mt-0.5" />
                        <span>{diff}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* AI TRANSPARENCY PANEL */}
          <AiTransparencyPanel
            confidenceScore={comparison.confidence}
            dataSource="Work Order Photographic Submissions & Exif GPS Triangulation"
            recordsAnalyzedCount={2}
            limitations={comparison.limitations}
            humanReviewStatus={workOrder.status === 'Completed' ? 'human_verified' : 'advisory_only'}
          />
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-[#E4E6E2] bg-[#FAFBF9] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-[#737773]">
            <span className="font-bold text-[#171918]">Important:</span> AI evidence comparisons are advisory. Final sign-off requires physical supervisor verification and citizen confirmation.
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {isSupervisor && workOrder.status === 'Submitted for Review' && (
              <>
                {onReturnRework && (
                  <button
                    type="button"
                    onClick={() => {
                      onReturnRework(workOrder);
                      onClose();
                    }}
                    className="px-3 py-2 rounded-lg border border-[#B8463B]/30 text-[#B8463B] font-semibold text-xs hover:bg-[#FAF0EF] transition-colors"
                  >
                    Return for Rework
                  </button>
                )}
                {onApprove && (
                  <button
                    type="button"
                    onClick={() => {
                      onApprove(workOrder);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-lg bg-[#315C4C] text-white font-semibold text-xs hover:bg-[#26483B] flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle size={13} />
                    <span>Certify & Sign Off</span>
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-[#E4E6E2] text-xs font-semibold text-[#171918] hover:bg-[#FAFBF9] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
