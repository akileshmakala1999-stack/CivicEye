import React, { useState } from 'react';
import { REPORT_SCENARIO_PRESETS, ReportScenarioPreset } from '../../data/reportScenarios';
import { Camera, Upload, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';

interface Step1MediaCaptureProps {
  selectedPreset: ReportScenarioPreset;
  customImage: string | null;
  onSelectPreset: (preset: ReportScenarioPreset) => void;
  onCustomImageUpload: (dataUrl: string) => void;
  onNext: () => void;
}

export const Step1MediaCapture: React.FC<Step1MediaCaptureProps> = ({
  selectedPreset,
  customImage,
  onSelectPreset,
  onCustomImageUpload,
  onNext,
}) => {
  const [shutterFlash, setShutterFlash] = useState(false);

  const displayImage = customImage || selectedPreset.thumbnailUrl;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCustomImageUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateShutter = () => {
    setShutterFlash(true);
    setTimeout(() => {
      setShutterFlash(false);
    }, 400);
  };

  return (
    <div className="space-y-8">
      {/* Step Header */}
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#315C4C] uppercase tracking-wider mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#315C4C]" />
          Stage 01 • Visual Evidence
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171918]">
          Capture or Upload Hazard Photograph
        </h2>
        <p className="text-sm text-[#737773] mt-1 max-w-2xl leading-relaxed">
          Clear visual evidence allows computer vision to estimate defect dimensions, classify severity, and verify municipal work orders without delayed site inspections.
        </p>
      </div>

      {/* Main Grid: Upload Area / Viewfinder on Left, Presets on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Viewfinder & Capture Interface */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-xl border border-[#E4E6E2] bg-white overflow-hidden shadow-xs">
            {/* Viewfinder Header */}
            <div className="px-4 py-2.5 bg-[#F5F5F2] border-b border-[#E4E6E2] flex items-center justify-between text-xs text-[#737773] font-mono">
              <div className="flex items-center gap-2 text-[#315C4C] font-semibold">
                <Camera size={14} />
                <span>EVIDENCE VIEWFINDER</span>
              </div>
              <span>OPTICAL SENSOR READY</span>
            </div>

            {/* Viewfinder Screen Area */}
            <div className="relative aspect-[4/3] bg-[#181C1A] overflow-hidden flex items-center justify-center select-none">
              {/* Shutter flash animation */}
              {shutterFlash && (
                <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-300" />
              )}

              {/* Display Image */}
              <img
                src={displayImage}
                alt="Civic hazard evidence"
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Optical Overlay (Crosshairs & Bounding Reticle) */}
              <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
                {/* Top Corner Marks */}
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-white/80" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-white/80" />
                </div>

                {/* Central Targeting Crosshair */}
                <div className="self-center flex flex-col items-center gap-1 text-white/70 font-mono text-[10px]">
                  <div className="w-12 h-12 border border-dashed border-white/60 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#B8463B]" />
                  </div>
                  <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                    DEFECT FOCAL POINT
                  </span>
                </div>

                {/* Bottom Corner Marks & Telemetry */}
                <div className="flex justify-between items-end">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-white/80" />
                  <div className="text-right text-[10px] font-mono text-white/90 bg-black/60 px-2 py-1 rounded backdrop-blur-xs space-y-0.5">
                    <div>GEO: 17.4325° N, 78.4071° E</div>
                    <div>ISO 200 • 1/500s • 4K RES</div>
                  </div>
                  <div className="w-6 h-6 border-b-2 border-r-2 border-white/80" />
                </div>
              </div>
            </div>

            {/* Viewfinder Action Footer */}
            <div className="p-4 bg-white border-t border-[#E4E6E2] flex flex-wrap items-center justify-between gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#F5F5F2] hover:bg-[#E4E6E2] border border-[#E4E6E2] text-xs font-medium text-[#171918] transition-colors">
                <Upload size={14} className="text-[#315C4C]" />
                <span>Upload Custom Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleSimulateShutter}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#315C4C] hover:bg-[#26483B] text-white text-xs font-medium transition-colors"
              >
                <Camera size={14} />
                <span>Simulate Camera Shutter</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#737773] px-1">
            <ShieldCheck size={14} className="text-[#315C4C]" />
            <span>EXIF camera metadata cryptographically hashed to prevent spoofed reports.</span>
          </div>
        </div>

        {/* Right Column: 1-Click Scenario Presets */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E4E6E2]">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-[#171918]">
              <Sparkles size={14} className="text-[#315C4C]" />
              <span>Realistic Testing Presets</span>
            </div>
            <span className="text-[10px] font-mono text-[#737773]">1-CLICK SELECT</span>
          </div>

          <p className="text-xs text-[#737773] leading-relaxed">
            Select one of these pre-calibrated Hyderabad municipal hazard scenarios to demonstrate the AI vision model:
          </p>

          <div className="space-y-3">
            {REPORT_SCENARIO_PRESETS.map((preset) => {
              const isSelected = selectedPreset.id === preset.id && !customImage;

              return (
                <div
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer text-left flex items-start gap-3 ${
                    isSelected
                      ? 'bg-white border-[#315C4C] shadow-sm ring-1 ring-[#315C4C]/20'
                      : 'bg-[#F5F5F2]/60 border-[#E4E6E2] hover:bg-white hover:border-[#737773]'
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  <img
                    src={preset.thumbnailUrl}
                    alt={preset.name}
                    className="w-14 h-14 rounded-md object-cover border border-[#E4E6E2] flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono uppercase text-[#737773]">
                        {preset.category}
                      </span>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#315C4C]">
                          <Check size={12} />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#737773]">
                          {preset.neighborhood}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-[#171918] truncate mb-0.5">
                      {preset.name}
                    </h4>

                    <p className="text-[11px] text-[#737773] line-clamp-1">
                      {preset.detectedHazard}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Next Step Button */}
          <div className="pt-4 border-t border-[#E4E6E2]">
            <Button
              onClick={onNext}
              variant="primary"
              size="lg"
              fullWidth
              icon={<ArrowRight size={16} />}
            >
              Analyze with AI Vision (Stage 02)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
