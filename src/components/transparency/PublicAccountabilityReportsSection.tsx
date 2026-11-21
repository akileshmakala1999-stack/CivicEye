import React, { useState } from 'react';
import { PublicAccountabilityReport } from '../../types';
import { transparencyService } from '../../services/transparencyService';
import { FileText, Download, CheckCircle, AlertTriangle } from 'lucide-react';

interface PublicAccountabilityReportsSectionProps {
  reports: PublicAccountabilityReport[];
}

export const PublicAccountabilityReportsSection: React.FC<PublicAccountabilityReportsSectionProps> = ({ reports }) => {
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id || '');
  const [isExporting, setIsExporting] = useState(false);

  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  const handleDownloadCsv = async () => {
    setIsExporting(true);
    await transparencyService.exportPublicDataCsv();
    setIsExporting(false);
  };

  const handleDownloadJson = async () => {
    setIsExporting(true);
    await transparencyService.exportPublicDataJson();
    setIsExporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Bar */}
      <div className="bg-white border border-[#E4E6E2] rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E4E6E2]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#DDE7DF] text-[#315C4C] font-semibold border border-[#315C4C]/20">
                Data-Driven Accountability • Features 12 & 13
              </span>
              <span className="text-xs font-mono text-[#737773]">Periodic Response Audits</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#171918]">
              Public Accountability Reports & Open Data Export
            </h2>
            <p className="text-xs sm:text-sm text-[#737773] mt-1 max-w-2xl leading-relaxed">
              Synthesized response summaries evaluating weekly and monthly performance. Export privacy-safe municipal datasets in open CSV and JSON formats with zero PII exposure.
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg bg-[#315C4C] text-white text-xs font-medium hover:bg-[#26483B] flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Download size={13} />
              <span>Export Safe CSV</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg bg-white border border-[#E4E6E2] text-xs font-medium text-[#171918] hover:bg-[#FAFBF9] flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download size={13} />
              <span>Export Open JSON</span>
            </button>
          </div>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 pb-2 border-b border-[#E4E6E2]/70">
          {reports.map((rep) => (
            <button
              key={rep.id}
              type="button"
              onClick={() => setSelectedReportId(rep.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                activeReport.id === rep.id
                  ? 'bg-[#171918] text-white shadow-xs'
                  : 'bg-[#FAFBF9] text-[#737773] hover:text-[#171918] border border-[#E4E6E2]'
              }`}
            >
              <FileText size={13} />
              <span>{rep.title}</span>
            </button>
          ))}
        </div>

        {/* Active Report Document Card */}
        {activeReport && (
          <div className="mt-6 p-6 rounded-xl bg-[#FAFBF9] border border-[#E4E6E2] space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E6E2]">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#315C4C] font-bold block mb-1">
                  {activeReport.periodLabel}
                </span>
                <h3 className="text-lg font-bold text-[#171918]">{activeReport.title}</h3>
              </div>
              <div className="text-xs font-mono text-[#737773]">
                Published: {activeReport.generatedDate}
              </div>
            </div>

            {/* 4 Telemetry Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-white border border-[#E4E6E2]">
                <span className="text-[10px] text-[#737773] block uppercase">Total Intake</span>
                <span className="font-bold text-[#171918] text-base">{activeReport.totalIntake} reports</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#E4E6E2]">
                <span className="text-[10px] text-[#737773] block uppercase">Resolved Count</span>
                <span className="font-bold text-[#315C4C] text-base">{activeReport.resolvedCount} closed</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#E4E6E2]">
                <span className="text-[10px] text-[#737773] block uppercase">Citizen Verification</span>
                <span className="font-bold text-[#171918] text-base">{activeReport.verificationRate}% verified</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#E4E6E2]">
                <span className="text-[10px] text-[#737773] block uppercase">SLA Adherence</span>
                <span className="font-bold text-[#315C4C] text-base">{activeReport.slaAdherenceRate}% on-time</span>
              </div>
            </div>

            {/* Two Column: Accomplishments vs Accountability Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Highlights */}
              <div className="p-4 rounded-xl bg-white border border-[#E4E6E2] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#315C4C] uppercase font-mono">
                  <CheckCircle size={14} />
                  <span>Key Municipal Highlights & Resolutions</span>
                </div>
                <ul className="space-y-2 text-xs text-[#171918]">
                  {activeReport.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-[#315C4C] font-bold mt-0.5">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gaps */}
              <div className="p-4 rounded-xl bg-white border border-[#E4E6E2] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#B8463B] uppercase font-mono">
                  <AlertTriangle size={14} />
                  <span>Accountability Gaps & Action Items</span>
                </div>
                <ul className="space-y-2 text-xs text-[#171918]">
                  {activeReport.keyGapsIdentified.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-[#B8463B] font-bold mt-0.5">•</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Top Wards Mention */}
            <div className="pt-2 flex items-center justify-between text-xs font-mono text-[#737773]">
              <span>Primary Corridors Covered: {activeReport.topHazardWards.join(', ')}</span>
              <span className="text-[#315C4C] font-semibold">Immutable Municipal Audit Signature</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
