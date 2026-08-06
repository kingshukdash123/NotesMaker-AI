import React from 'react';
import { MessageSquare, Calendar, Sparkles } from 'lucide-react';

export default function VideoQa() {
  return (
    <div className="max-w-xl mx-auto my-12 px-4">
      {/* Premium Clean Card */}
      <div className="relative border border-zinc-800 bg-zinc-950/30 backdrop-blur-md rounded-2xl p-8 sm:p-10 text-center shadow-2xl overflow-hidden flex flex-col items-center">
        {/* Sleek subtle top accent glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-zinc-500/35 to-transparent"></div>

        {/* Minimalist Premium Icon Container */}
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-350 shadow-inner mb-6 relative">
          <MessageSquare className="w-6 h-6 text-zinc-200" />
          {/* Subtle pulse light */}
          <span className="absolute top-[-2px] right-[-2px] flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
          </span>
        </div>

        {/* Premium Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-850 text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3 h-3 text-zinc-500" />
          Interactive Companion
        </span>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 mb-3">
          Video Q&A Assistant
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mb-8 leading-relaxed">
          Ask questions, lookup complex definitions, and jump to specific timestamps using semantic search indexing from your lecture videos.
        </p>

        {/* Maintenance / Availability Footer Card */}
        <div className="w-full border-t border-zinc-900/80 pt-6 mt-2 flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/50 border border-zinc-900 text-zinc-400 text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>Available in 1 - 2 Weeks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
