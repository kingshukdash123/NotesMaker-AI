import React from 'react';
import { Check, Loader2, Cpu, FileText, Layers, GitMerge, Sparkles, AlertTriangle, X } from 'lucide-react';

const STAGES = [
  {
    id: 'metadata',
    name: 'Metadata',
    desc: 'yt-dlp Video & Audio Info',
    icon: FileText,
  },
  {
    id: 'transcript',
    name: 'Transcript Merger',
    desc: 'Clean & Segment Alignment',
    icon: GitMerge,
  },
  {
    id: 'orchestrator',
    name: 'AI Orchestrator',
    desc: 'Outline & Plan Generation',
    icon: Cpu,
  },
  {
    id: 'fanout',
    name: 'Section Workers',
    desc: 'Parallel AI Draft Writers',
    icon: Layers,
  },
  {
    id: 'reducer',
    name: 'Reducer Node',
    desc: 'Synthesis & Final Assembly',
    icon: Sparkles,
  },
];

export default function PipelineTracker({ status, logs = [], error, onClose }) {
  // Infer active stage based on logs in exact sequential order
  const getActiveStageIndex = () => {
    if (status === 'COMPLETED') return 5; // All done
    if (status === 'FAILED') return -1;
    if (status !== 'PROCESSING' || logs.length === 0) return 0;

    let stage = 0;
    for (const log of logs) {
      const l = log.toLowerCase();
      if (l.includes('reducer')) {
        stage = Math.max(stage, 4);
      } else if (l.includes('section writer') || l.includes('section_writer') || l.includes('research')) {
        stage = Math.max(stage, 3);
      } else if (l.includes('orchestrator')) {
        stage = Math.max(stage, 2);
      } else if (l.includes('transcript merger')) {
        stage = Math.max(stage, 1);
      } else if (l.includes('transcript & metadata') || l.includes('metadata generator') || l.includes('starting notes generation')) {
        stage = Math.max(stage, 0);
      }
    }
    return stage;
  };

  const activeIndex = getActiveStageIndex();

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 bg-zinc-950 p-6 rounded-xl border border-zinc-800 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 animate-pulse"></div>
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-300">
            LangGraph Execution Pipeline
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800">
            {status === 'PROCESSING' && (
              <span className="text-orange-400 flex items-center gap-1.5 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing Pipeline
              </span>
            )}
            {status === 'COMPLETED' && (
              <span className="text-orange-500 flex items-center gap-1.5 font-semibold">
                <Check className="w-3.5 h-3.5" /> Pipeline Completed
              </span>
            )}
            {status === 'FAILED' && (
              <span className="text-red-500 flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> Pipeline Error
              </span>
            )}
            {status === 'IDLE' && (
              <span className="text-zinc-500">Idle</span>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 p-1.5 rounded-md transition"
              title="Dismiss pipeline tracker"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Steps Flow */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isDone = status === 'COMPLETED' || (status === 'PROCESSING' && idx < activeIndex);
          const isCurrent = status === 'PROCESSING' && idx === activeIndex;
          const isFailed = status === 'FAILED' && idx === activeIndex;

          return (
            <div
              key={stage.id}
              className={`relative flex flex-col items-center p-3.5 rounded-lg border transition duration-200 ${
                isDone
                  ? 'bg-orange-950/20 border-orange-500/30 text-orange-300'
                  : isCurrent
                  ? 'bg-zinc-900 border-orange-500 text-zinc-100 shadow-sm'
                  : isFailed
                  ? 'bg-red-950/30 border-red-500/40 text-red-300'
                  : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-500'
              }`}
            >
              <div className="relative mb-2">
                <div
                  className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${
                    isDone
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : isCurrent
                      ? 'bg-zinc-800 text-zinc-100 border border-orange-500 shadow-sm'
                      : isFailed
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-zinc-950 text-zinc-600 border border-zinc-800'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 text-orange-400 stroke-[3]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
              </div>

              <div className="text-center">
                <h4 className="text-xs font-bold tracking-tight">{stage.name}</h4>
                <p className="text-[10px] opacity-75 mt-0.5 leading-tight line-clamp-2">
                  {stage.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-md bg-red-950/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span className="font-mono">{error}</span>
        </div>
      )}
    </div>
  );
}
