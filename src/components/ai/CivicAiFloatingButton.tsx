import React from 'react';
import { Sparkles } from 'lucide-react';

interface CivicAiFloatingButtonProps {
  onClick: () => void;
  isOpen?: boolean;
}

export const CivicAiFloatingButton: React.FC<CivicAiFloatingButtonProps> = ({
  onClick,
  isOpen = false,
}) => {
  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        type="button"
        onClick={onClick}
        className="group px-4 py-2.5 rounded-full bg-[#171918] text-white hover:bg-[#315C4C] shadow-lg flex items-center gap-2.5 transition-all duration-200 border border-white/10 hover:shadow-xl hover:scale-102 focus:outline-hidden focus:ring-2 focus:ring-[#315C4C]/40"
        title="Open Grounded Civic AI Assistant"
      >
        <span className="p-1 rounded-full bg-white/15 text-white group-hover:bg-white group-hover:text-[#315C4C] transition-colors">
          <Sparkles size={13} className="animate-pulse" />
        </span>
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold tracking-tight">Civic AI</span>
          <span className="text-[9px] font-mono text-white/70 -mt-0.5">Grounded Intelligence</span>
        </div>
      </button>
    </div>
  );
};
