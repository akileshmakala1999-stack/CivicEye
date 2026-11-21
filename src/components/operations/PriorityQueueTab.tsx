import React, { useState, useEffect } from 'react';
import { DashboardReport } from '../../types';
import { Badge } from '../common/Badge';
import { intelligenceEngine, ReportIntelligence } from '../../services/intelligenceEngine';
import { ReportReviewModal } from './ReportReviewModal';
import {
  Flame,
  MapPin,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface PriorityQueueTabProps {
  reports: DashboardReport[];
  onRefresh: () => void;
}

interface RankedReportItem {
  report: DashboardReport;
  intelligence: ReportIntelligence;
}

export const PriorityQueueTab: React.FC<PriorityQueueTabProps> = ({
  reports,
  onRefresh,
}) => {
  const [rankedItems, setRankedItems] = useState<RankedReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingReport, setReviewingReport] = useState<DashboardReport | null>(null);

  const computeRankings = async () => {
    setIsLoading(true);
    const list: RankedReportItem[] = [];
    for (const rep of reports) {
      const intel = await intelligenceEngine.analyzeReport(rep);
      list.push({ report: rep, intelligence: intel });
    }
    // Sort descending by calculated Civic Priority Score
    list.sort((a, b) => b.intelligence.civicPriorityScore - a.intelligence.civicPriorityScore);
    setRankedItems(list);
    setIsLoading(false);
  };

  useEffect(() => {
    computeRankings();
  }, [reports]);

  return (
    <div className="space-y-4">
      {/* HEADER EXPLANATION */}
      <div className="p-4 rounded-xl bg-white border border-[#E4E6E2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#315C4C]" />
            <span className="font-mono text-xs uppercase font-bold text-[#315C4C]">
              Deterministic Municipal Dispatch Priority
            </span>
          </div>
          <p className="text-[#737773] leading-relaxed max-w-3xl">
            Ranked 0–100 by physical hazard risk (40%), community consensus & worsening alerts (30%), transit corridor vulnerability (20%), and turnaround SLA window (10%).
          </p>
        </div>

        <button
          type="button"
          onClick={computeRankings}
          className="px-3 py-1.5 rounded-lg border border-[#E4E6E2] bg-[#F5F5F2] hover:bg-white text-xs font-mono text-[#315C4C] flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          <span>Recalculate Queue</span>
        </button>
      </div>

      {/* RANKED LIST */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#737773] font-mono">
            Calculating civic priority scores across all active incident reports...
          </div>
        ) : (
          rankedItems.map((item, index) => {
            const { report, intelligence } = item;
            const isResolved = report.status === 'Resolved';

            return (
              <div
                key={report.id}
                className="p-4 rounded-xl border border-[#E4E6E2] bg-white hover:border-[#315C4C]/40 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Rank & Title */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2] flex flex-col items-center justify-center flex-shrink-0 font-mono">
                    <span className="text-[9px] text-[#737773]">RANK</span>
                    <span className="text-sm font-bold text-[#171918]">#{index + 1}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#315C4C]">
                        {report.ticketNumber}
                      </span>
                      <span className="text-[#E4E6E2]">|</span>
                      <span className="text-xs text-[#737773] font-mono">{report.category}</span>
                      <Badge severity={report.severity} size="sm" />
                      <Badge status={report.status} size="sm" />
                    </div>

                    <h4 className="text-sm font-bold text-[#171918] leading-snug">{report.title}</h4>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#737773]">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-[#315C4C]" />
                        <span>{report.location}</span>
                      </span>
                      <span>• {report.neighborhood}</span>
                      {report.gettingWorseCount && report.gettingWorseCount > 0 ? (
                        <span className="text-[#B8463B] font-mono font-bold flex items-center gap-0.5">
                          <Flame size={11} />
                          <span>Worsening Escalation (+{report.gettingWorseCount * 6} pts)</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Right: Scores & Action */}
                <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-[#E4E6E2]/70">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#737773] uppercase block">Priority Score</span>
                    <div className="text-xl font-bold font-mono text-[#315C4C]">
                      {intelligence.civicPriorityScore}
                      <span className="text-xs text-[#737773]">/100</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#C58B36] block">
                      Risk: {intelligence.riskScore}/100
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReviewingReport(report)}
                    className="px-3.5 py-2 rounded-lg bg-[#315C4C] text-white hover:bg-[#26483B] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Eye size={13} />
                    <span>{isResolved ? 'Inspect Closed' : 'Dispatch / Reassign'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ReportReviewModal
        report={reviewingReport}
        onClose={() => setReviewingReport(null)}
        onActionCompleted={() => {
          onRefresh();
          setReviewingReport(null);
        }}
      />
    </div>
  );
};
