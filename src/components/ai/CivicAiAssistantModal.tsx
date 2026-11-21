import React, { useState, useEffect, useRef } from 'react';
import { GroundedAiMessage, OperationalRole } from '../../types';
import { aiOrchestrationService } from '../../services/aiOrchestrationService';
import { operationsService } from '../../services/operationsService';
import {
  Sparkles,
  X,
  Send,
  Database,
  ExternalLink,
  User,
  RefreshCw,
} from 'lucide-react';

interface CivicAiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSelectReportId?: (reportId: string) => void;
}

export const CivicAiAssistantModal: React.FC<CivicAiAssistantModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  onSelectReportId,
}) => {
  const [messages, setMessages] = useState<GroundedAiMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [activeRole, setActiveRole] = useState<OperationalRole>(() => operationsService.getActiveRole());
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Role-tailored prompt suggestions
  const rolePrompts: Record<OperationalRole, string[]> = {
    citizen: [
      'Which areas currently have the most unresolved drainage issues?',
      'Which neighborhoods have recurring road problems?',
      'Which unresolved issues could affect public safety?',
      'Which issues are repeatedly reported after being marked resolved?',
    ],
    reviewer: [
      'Which reports are becoming critical?',
      'Are there any connected issues that may require more than one department?',
      'Which unresolved issues could affect public safety?',
      'Which issues are repeatedly reported after being marked resolved?',
    ],
    staff: [
      'Which work orders are overdue?',
      'Are there any connected issues that may require more than one department?',
      'Which reports are becoming critical?',
      'What should the operations team investigate first today?',
    ],
    supervisor: [
      'What should the operations team investigate first today?',
      'Which departments have the largest active workload?',
      'Which work orders are overdue?',
      'Are there any connected issues that may require more than one department?',
    ],
    admin: [
      'Which departments have the largest active workload?',
      'Which neighborhoods have recurring road problems?',
      'Which work orders are overdue?',
      'What should the operations team investigate first today?',
    ],
    dispatcher: [
      'What should the operations team investigate first today?',
      'Which work orders are overdue?',
      'Are there any connected issues that may require more than one department?',
      'Which reports are becoming critical?',
    ],
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message grounded in active database
      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: `Welcome to the **CivicEye Grounded AI Assistant**. I provide factual, explainable answers grounded strictly in CivicEye's verified municipal records, work order SLA ledgers, and community validation telemetry across Hyderabad. How can I assist your municipal research today?`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          grounding: {
            supportingReportIds: [],
            dataSource: 'CivicEye Integrated Repository (Phases 1-9)',
            dateRangeAnalyzed: 'Real-Time Operational Intake',
            recordsAnalyzedCount: 23,
            confidenceLevel: 1.0,
            limitations: ['All answers are grounded in authenticated municipal and citizen records.'],
            tag: 'official_record',
          },
        },
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSend(initialQuery);
    }
  }, [initialQuery, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || isLoading) return;

    const userMessage: GroundedAiMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: q.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await aiOrchestrationService.askCivicAiAssistant(q, activeRole);
      setMessages((prev) => [...prev, response]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'A temporary service interruption occurred while processing your query. Please retry in a moment.',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          grounding: {
            supportingReportIds: [],
            dataSource: 'Error Handler',
            dateRangeAnalyzed: 'N/A',
            recordsAnalyzedCount: 0,
            confidenceLevel: 0,
            limitations: ['Network or compute timeout.'],
            tag: 'ai_inference',
          },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#E4E6E2] shadow-2xl w-full max-w-3xl h-[88vh] max-h-[750px] flex flex-col overflow-hidden text-[#171918]">
        {/* ASSISTANT HEADER */}
        <div className="p-3.5 sm:p-4 border-b border-[#E4E6E2] flex items-center justify-between bg-[#FAFBF9]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#315C4C] text-white shadow-xs">
              <Sparkles size={16} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#171918]">
                  CivicEye Grounded AI Assistant
                </h2>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#DDE7DF] text-[#315C4C] border border-[#315C4C]/20">
                  Phase 9 Grounded Engine
                </span>
              </div>
              <p className="text-[11px] text-[#737773] mt-0.5">
                Zero hallucination • Grounded in authorized civic reports, SLA timers & validations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ROLE CONTEXT SELECTOR */}
            <div className="flex items-center gap-1 text-[11px] font-mono bg-white border border-[#E4E6E2] rounded-lg px-2 py-1">
              <span className="text-[#737773]">Role:</span>
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as OperationalRole)}
                className="bg-transparent font-bold text-[#315C4C] focus:outline-hidden cursor-pointer"
              >
                <option value="citizen">Citizen</option>
                <option value="reviewer">Reviewer</option>
                <option value="staff">Field Staff</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#737773] hover:text-[#171918] hover:bg-[#E4E6E2] transition-colors"
              title="Close Assistant"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MESSAGES CHAT LOG */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#F5F5F2]/40 text-xs">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const gr = msg.grounding;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <span className="w-7 h-7 rounded-full bg-[#315C4C] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold shadow-2xs">
                    CE
                  </span>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 space-y-2.5 shadow-2xs ${
                    isUser
                      ? 'bg-[#171918] text-white rounded-tr-xs'
                      : 'bg-white border border-[#E4E6E2] text-[#171918] rounded-tl-xs'
                  }`}
                >
                  {/* MESSAGE BODY (MARKDOWN SUPPORT) */}
                  <div className="leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  {/* GROUNDING & CITATIONS FOOTER (ASSISTANT ONLY) */}
                  {!isUser && gr && (
                    <div className="pt-2 border-t border-[#E4E6E2]/70 space-y-2 text-[11px]">
                      {/* GROUNDING BADGES */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#DDE7DF] text-[#315C4C] font-semibold flex items-center gap-1">
                          <Database size={10} />
                          <span>{gr.dataSource}</span>
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#FAFBF9] border border-[#E4E6E2] text-[#737773] font-semibold">
                          {gr.recordsAnalyzedCount} records • {Math.round(gr.confidenceLevel * 100)}% conf
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                          gr.tag === 'official_record'
                            ? 'bg-[#DDE7DF] text-[#315C4C]'
                            : gr.tag === 'citizen_reported'
                            ? 'bg-[#FAF5ED] text-[#C58B36]'
                            : 'bg-[#FAFBF9] border border-[#E4E6E2] text-[#737773]'
                        }`}>
                          Tag: {gr.tag.replace('_', ' ')}
                        </span>
                      </div>

                      {/* SUPPORTING REPORT ID CHIPS */}
                      {gr.supportingReportIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] font-mono text-[#737773]">Citations:</span>
                          {gr.supportingReportIds.map((id) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => {
                                if (onSelectReportId) {
                                  onSelectReportId(id);
                                  onClose();
                                }
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-[#315C4C]/40 text-[#315C4C] font-bold hover:bg-[#DDE7DF]/40 flex items-center gap-1 transition-colors"
                              title="Inspect cited civic report"
                            >
                              <span>{id}</span>
                              <ExternalLink size={9} />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* LIMITATIONS / MISSING DATA DISCLOSURE */}
                      {gr.limitations && gr.limitations.length > 0 && (
                        <div className="text-[10px] text-[#737773] italic pt-0.5">
                          Note: {gr.limitations.join(' ')}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`text-[9px] font-mono ${isUser ? 'text-white/60 text-right' : 'text-[#737773]'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <span className="w-7 h-7 rounded-full bg-[#171918] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold">
                    <User size={13} />
                  </span>
                )}
              </div>
            );
          })}

          {/* LOADING SKELETON */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <span className="w-7 h-7 rounded-full bg-[#315C4C] text-white flex items-center justify-center shrink-0 text-xs font-mono font-bold animate-pulse">
                CE
              </span>
              <div className="p-3.5 rounded-2xl bg-white border border-[#E4E6E2] text-[#737773] text-xs flex items-center gap-2 shadow-2xs">
                <RefreshCw size={13} className="animate-spin text-[#315C4C]" />
                <span>Retrieving & synthesizing grounded municipal records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ROLE PROMPT CHIPS */}
        <div className="px-4 py-2 border-t border-[#E4E6E2] bg-[#FAFBF9] flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-[#737773] text-[10px] font-mono shrink-0">
            Suggested for <span className="capitalize font-bold text-[#315C4C]">{activeRole}</span>:
          </span>
          {rolePrompts[activeRole]?.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-white border border-[#E4E6E2] text-[#171918] hover:text-[#315C4C] hover:border-[#315C4C]/40 hover:bg-[#DDE7DF]/30 whitespace-nowrap transition-colors shrink-0 disabled:opacity-50 text-[11px]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* QUERY INPUT COMPOSER */}
        <div className="p-3 sm:p-4 border-t border-[#E4E6E2] bg-white flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask a grounded question as ${activeRole}: e.g. "Which areas have the most unresolved drainage issues?"`}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E4E6E2] text-xs text-[#171918] placeholder-[#737773]/70 focus:outline-hidden focus:border-[#315C4C] focus:ring-2 focus:ring-[#315C4C]/15 transition-all shadow-2xs"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] disabled:opacity-50 flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <span>Ask</span>
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
