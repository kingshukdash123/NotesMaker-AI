import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';

export default function NotesViewer({ result, isFullscreen = false, onToggleFullscreen }) {
  if (!result || !result.draft_notes) return null;

  const draftNotes = result.draft_notes;

  return (
    <div className={`bg-zinc-950 border border-zinc-800 shadow-xl overflow-hidden transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-[120] w-screen h-screen overflow-y-auto p-4 sm:p-8 bg-black' 
        : 'w-full rounded-xl mb-12'
    }`}>
      {/* Notes Content Body */}
      <div className="p-5 sm:p-8 space-y-6">
        {/* Title Header */}
        <div className="flex justify-between border-b border-zinc-800 pb-5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-50 mb-2">
            {draftNotes.title || 'Comprehensive Lecture Notes'}
          </h1>

          <button
            type="button"
            onClick={() => onToggleFullscreen && onToggleFullscreen(!isFullscreen)}
            className="flex items-center justify-center p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
            title={isFullscreen ? "Exit full screen" : "Enter full screen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Markdown Notes Text */}
        {draftNotes.content && (
          <div className="markdown-content text-xs sm:text-sm text-zinc-305 leading-relaxed bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {draftNotes.content}
            </ReactMarkdown>
          </div>
        )}

        {/* References list */}
        {draftNotes.sections && draftNotes.sections.some(s => s.references && s.references.length > 0) && (
          <div className="pt-5 border-t border-zinc-800">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" /> Compiled Key References
            </h3>
            <ul className="flex flex-wrap gap-2">
              {draftNotes.sections.flatMap(s => s.references || []).map((ref, idx) => (
                <li key={idx}>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-305 text-xs border border-zinc-800 transition"
                  >
                    <span>{ref.title}</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
