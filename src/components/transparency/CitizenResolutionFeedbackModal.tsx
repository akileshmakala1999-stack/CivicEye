import React, { useState } from 'react';
import { DashboardReport, ResolutionQualityFeedback } from '../../types';
import { transparencyService } from '../../services/transparencyService';
import { X, Star, ShieldCheck, AlertTriangle, CheckCircle } from 'lucide-react';

interface CitizenResolutionFeedbackModalProps {
  report: DashboardReport;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const CitizenResolutionFeedbackModal: React.FC<CitizenResolutionFeedbackModalProps> = ({
  report,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [completeness, setCompleteness] = useState<'fully_fixed' | 'partially_fixed' | 'still_broken' | 'worsened'>(
    'fully_fixed'
  );
  const [hasRecurred, setHasRecurred] = useState<boolean>(false);
  const [comment, setComment] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{ feedback: ResolutionQualityFeedback; challenged: boolean } | null>(
    null
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = transparencyService.submitResolutionFeedback({
      reportId: report.id,
      rating,
      completeness,
      hasRecurred,
      feedbackComment: comment,
      evidencePhotoUrl: photoUrl || undefined,
    });

    setIsSubmitting(false);
    setSubmittedResult(res);
    if (onSubmitted) onSubmitted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E4E6E2] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E4E6E2] flex items-center justify-between bg-[#F5F5F2]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#315C4C]" />
            <div>
              <h3 className="font-bold text-[#171918] text-sm sm:text-base">
                Citizen Resolution Sign-Off & Rating
              </h3>
              <span className="text-[10px] font-mono text-[#737773]">
                {report.ticketNumber} • {report.neighborhood}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737773] hover:text-[#171918] hover:bg-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#171918]">
          {submittedResult ? (
            <div className="text-center py-6 space-y-4">
              <div
                className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                  submittedResult.challenged
                    ? 'bg-[#FAF5ED] text-[#C58B36] border border-[#C58B36]/30'
                    : 'bg-[#DDE7DF] text-[#315C4C] border border-[#315C4C]/30'
                }`}
              >
                {submittedResult.challenged ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
              </div>

              <div>
                <h4 className="text-base font-bold text-[#171918]">
                  {submittedResult.challenged ? 'Report Reopened for Rework' : 'Verification Recorded Successfully'}
                </h4>
                <p className="text-xs text-[#737773] max-w-sm mx-auto mt-1 leading-relaxed">
                  {submittedResult.challenged
                    ? 'Your challenge has been submitted to the department supervisor. The previous completion evidence is preserved in the audit log and the contractor has been queued for mandatory rework.'
                    : 'Thank you for actively verifying this civic repair. Your rating is now reflected on the public transparency scorecard.'}
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] transition-colors"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase font-bold text-[#737773] block">
                  1. Resolution Quality Rating (1 - 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        size={22}
                        className={
                          star <= rating
                            ? 'text-[#C58B36] fill-[#C58B36]'
                            : 'text-[#E4E6E2]'
                        }
                      />
                    </button>
                  ))}
                  <span className="font-mono text-xs font-bold text-[#171918] ml-2">
                    {rating === 5
                      ? '5/5 • Excellent Municipal Repair'
                      : rating === 4
                      ? '4/5 • Good Fix'
                      : rating === 3
                      ? '3/5 • Acceptable'
                      : rating === 2
                      ? '2/5 • Substandard Work'
                      : '1/5 • Hazard Remains Intact'}
                  </span>
                </div>
              </div>

              {/* Repair Completeness Condition */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase font-bold text-[#737773] block">
                  2. Ground Inspection Assessment
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'fully_fixed', label: '✓ Fully Rectified', desc: 'Work is complete and satisfactory' },
                    { key: 'partially_fixed', label: '⚠️ Partially Repaired', desc: 'Incomplete or substandard materials' },
                    { key: 'still_broken', label: '❌ Hazard Still Exists', desc: 'No visible physical repair done' },
                    { key: 'worsened', label: '🔥 Worsened on Site', desc: 'Condition deteriorated further' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setCompleteness(opt.key as any)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        completeness === opt.key
                          ? 'border-[#315C4C] bg-[#DDE7DF]/30 ring-1 ring-[#315C4C]'
                          : 'border-[#E4E6E2] bg-white hover:bg-[#FAFBF9]'
                      }`}
                    >
                      <span className="font-bold text-xs text-[#171918] block">{opt.label}</span>
                      <span className="text-[10px] text-[#737773] block mt-0.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Has issue recurred toggle */}
              <div className="p-3 rounded-lg bg-[#FAFBF9] border border-[#E4E6E2] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#171918] block">Did the issue return after earlier closure?</span>
                  <span className="text-[10px] text-[#737773]">Flags repeat infrastructure failures</span>
                </div>
                <input
                  type="checkbox"
                  checked={hasRecurred}
                  onChange={(e) => setHasRecurred(e.target.checked)}
                  className="w-4 h-4 accent-[#315C4C] cursor-pointer"
                />
              </div>

              {/* Optional Comments */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase font-bold text-[#737773] block">
                  3. Field Feedback Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe current road or drainage condition on-site..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none"
                />
              </div>

              {/* Optional Photo URL */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase font-bold text-[#737773] block">
                  4. Ground Evidence Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none font-mono"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-[#E4E6E2] text-xs font-medium text-[#737773] hover:text-[#171918] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-lg text-white text-xs font-semibold shadow-xs transition-colors ${
                    completeness === 'still_broken' || completeness === 'worsened' || hasRecurred
                      ? 'bg-[#B8463B] hover:bg-[#9c362d]'
                      : 'bg-[#315C4C] hover:bg-[#26483B]'
                  }`}
                >
                  {completeness === 'still_broken' || completeness === 'worsened' || hasRecurred
                    ? 'Submit Challenge & Reopen Ticket'
                    : 'Confirm & Sign Off Resolution'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
