import React from 'react';
import { Camera, Cpu, MapPin, FileEdit, CheckCircle2 } from 'lucide-react';

interface ReportStepperProps {
  currentStep: number; // 1 to 5
  onStepClick?: (step: number) => void;
}

export const ReportStepper: React.FC<ReportStepperProps> = ({
  currentStep,
  onStepClick,
}) => {
  const steps = [
    { step: 1, label: 'Visual Capture', short: 'Photo', icon: <Camera size={14} /> },
    { step: 2, label: 'AI Vision Triage', short: 'AI Triage', icon: <Cpu size={14} /> },
    { step: 3, label: 'Location & Ward', short: 'Location', icon: <MapPin size={14} /> },
    { step: 4, label: 'Details & Voice', short: 'Details', icon: <FileEdit size={14} /> },
    { step: 5, label: 'Confirmation', short: 'Receipt', icon: <CheckCircle2 size={14} /> },
  ];

  return (
    <div className="bg-white border border-[#E4E6E2] rounded-xl p-4 sm:p-5 shadow-xs mb-8">
      <div className="flex items-center justify-between">
        {steps.map((s, idx) => {
          const isDone = s.step < currentStep;
          const isCurrent = s.step === currentStep;

          return (
            <React.Fragment key={s.step}>
              {/* Step indicator item */}
              <button
                type="button"
                onClick={() => isDone && onStepClick && onStepClick(s.step)}
                disabled={!isDone}
                className={`flex items-center gap-2 group transition-all text-left ${
                  isDone
                    ? 'cursor-pointer hover:opacity-80'
                    : isCurrent
                    ? 'cursor-default'
                    : 'cursor-not-allowed opacity-50'
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-mono font-semibold transition-all ${
                    isDone
                      ? 'bg-[#315C4C] text-white shadow-xs'
                      : isCurrent
                      ? 'bg-[#DDE7DF] text-[#315C4C] ring-2 ring-[#315C4C]/40 ring-offset-2'
                      : 'bg-[#F5F5F2] text-[#737773] border border-[#E4E6E2]'
                  }`}
                >
                  {isDone ? <CheckCircle2 size={15} /> : s.step}
                </div>

                <div className="hidden md:flex flex-col">
                  <span
                    className={`text-xs font-semibold leading-tight ${
                      isCurrent
                        ? 'text-[#171918]'
                        : isDone
                        ? 'text-[#315C4C]'
                        : 'text-[#737773]'
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="text-[10px] font-mono text-[#737773] uppercase">
                    Step 0{s.step}
                  </span>
                </div>
              </button>

              {/* Connecting line between steps */}
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-2 sm:mx-3 rounded transition-colors ${
                    s.step < currentStep ? 'bg-[#315C4C]' : 'bg-[#E4E6E2]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

