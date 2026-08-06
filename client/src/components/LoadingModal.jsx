import React, { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';

const CONCISE_STEPS = [
  "► Initializing notes generator pipeline...",
  "► Segmenting video audio & transcripts...",
  "► Mapping lecture outline syllabus...",
  "► Extracting technical formulas & concepts...",
  "► Assembling final study workspace notes..."
];

export default function LoadingModal({ 
  isOpen,
  isTerminalOpen = false,
  onToggleTerminal,
  inline = false
}) {
  if (!isOpen) return null;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    setCurrentStepIndex(0);
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < CONCISE_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 4500); // Transitions nicely over the generation span
    return () => clearInterval(interval);
  }, []);

  const renderCard = (bgClass = "bg-zinc-950/40", shadowClass = "shadow-xl", borderClass = "border-zinc-800", paddingClass = "p-5 sm:p-6") => (
    <div className={`w-full border ${borderClass} ${bgClass} rounded-2xl ${paddingClass} ${shadowClass} space-y-4 relative overflow-hidden`}>
      {/* Header toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
          </span>
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-100">
            AI Synthesis Active
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleTerminal}
            className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span>{isTerminalOpen ? 'Hide Logs' : 'Show Logs'}</span>
          </button>
          <span className="text-[10px] font-mono text-zinc-550">
            Step {currentStepIndex + 1}/{CONCISE_STEPS.length}
          </span>
        </div>
      </div>

      {/* Concise Typewriter Compiler Console */}
      <div className="relative text-xs text-zinc-305 leading-relaxed bg-black/60 p-4 rounded-xl border border-zinc-900/60 font-mono min-h-[140px] space-y-2">
        <div className="absolute top-2 right-2 text-[9px] text-zinc-650 font-bold uppercase tracking-wider">
          Agent Output
        </div>
        
        {CONCISE_STEPS.slice(0, currentStepIndex + 1).map((step, idx) => (
          <div key={idx} className="transition-all duration-300 animate-fadeIn">
            {step}
          </div>
        ))}
        
        <div className="flex items-center gap-1.5 text-[10px] text-orange-500 pt-2">
          <span>Compiling study guides...</span>
          <span className="typing-cursor" />
        </div>
      </div>

      {/* Bottom text */}
      <p className="text-[10px] text-zinc-550 font-medium tracking-wide text-center uppercase tracking-widest animate-pulse">
        Please keep this tab open. Synthesizing notes.
      </p>
    </div>
  );

  if (inline) {
    return <div className="mt-4 animate-fadeIn">{renderCard("bg-zinc-950/20", "shadow-md", "border-zinc-900", "p-4 sm:p-5")}</div>;
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fadeIn">
      {/* Ambient glowing radial glow */}
      <div className="absolute w-[450px] h-[450px] rounded-full bg-zinc-200/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full mx-4 relative z-10">
        {renderCard("bg-zinc-950/90 backdrop-blur-sm", "shadow-2xl", "border-zinc-800", "p-6")}
      </div>
    </div>
  );
}
