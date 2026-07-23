import React, { useState } from 'react';
import { Search, Sparkles, X, ArrowRight, Video, PlayCircle, Loader } from 'lucide-react';

const YoutubeIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const PRESET_VIDEOS = [
  {
    title: 'Prompt Engineering',
    url: 'https://youtu.be/8RWfE9eDWXI?si=bixXPvr6nDZbUhJV',
    desc: 'Why Prompt Engineering matters'
  },
  {
    title: 'Attention is all you need',
    url: 'https://youtu.be/XwYY0lCGWW8?si=bUvCXiQSuQuvOhbi',
    desc: 'Transfomer architecture explained'
  },
  {
    title: 'LangChain-LangGraph-LangSmith',
    url: 'https://youtu.be/e-GR3PlEOVU?si=h0KLPQZ0QUw83p9m',
    desc: 'Build Agents using LangGraph with observability'
  }
];

export default function UrlInput({ 
  url, 
  setUrl, 
  onFetchMetadata, 
  onGenerateNotes, 
  onLoadMockData,
  isLoadingMeta, 
  isGenerating,
  pulseTestNotes = false
}) {
  const handleClear = () => {
    setUrl('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 space-y-4">
      {/* Input Search Box */}
      <div className=" p-2 rounded-xl">
        <div className="flex flex-col sm:flex-row items-center gap-2 bg-zinc-900/60 rounded-lg p-3 border border-zinc-800/80">
          <div className="flex items-center flex-1 w-full pl-3 gap-3">
            <YoutubeIcon className="w-5 h-5 text-red-500 shrink-0" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube Video URL (e.g., https://www.youtube.com/watch?v=...)"
              className="w-full bg-transparent text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none py-2"
            />
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
            {/* Fetch Info Button */}
            <button
              type="button"
              onClick={() => onFetchMetadata(url)}
              disabled={!url || isLoadingMeta || isGenerating}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isLoadingMeta ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></span>
                  Fetching...
                </span>
              ) : (
                <>
                  <Video className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Preview</span>
                </>
              )}
            </button>

            {/* Generate Notes Primary Button (shadcn Primary) */}
            <button
              type="button"
              onClick={() => onGenerateNotes(url)}
              disabled={!url || isGenerating || isLoadingMeta}
              className="flex-1 sm:flex-none px-4 py-2 rounded-md text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 flex items-center justify-center gap-2 shadow-sm"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 text-zinc-950 animate-spin" />
                  <span>Processing...</span>
                </span>
              ) : (
                <>
                  <Loader className="w-3.5 h-3.5" />
                  <span>Generate</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preset Quick Chips */}
      <div className="flex flex-wrap justify-center items-center gap-2 px-1">
        <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
          <PlayCircle className="w-3.5 h-3.5 text-zinc-400" /> Quick Demos:
        </span>
        {PRESET_VIDEOS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setUrl(preset.url);
              onFetchMetadata(preset.url);
            }}
            className="text-xs px-3 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 transition duration-150"
            title={preset.desc}
          >
            {preset.title}
          </button>
        ))}

        <span className="text-zinc-700">|</span>

        <button
          type="button"
          onClick={onLoadMockData}
          className={`text-xs px-3 py-1 rounded-md font-medium transition duration-150 flex items-center gap-1.5 ${
            pulseTestNotes
              ? 'bg-amber-950/20 hover:bg-amber-950/30 border border-amber-500/50 text-amber-400 animate-pulseGlow'
              : 'bg-zinc-900 hover:bg-zinc-800 border border-amber-950/60 text-amber-500 hover:text-amber-400'
          }`}
          title="Load pre-built test study notes for offline design, print, and copy testing"
        >
          <span>🧪 Load Test Notes</span>
        </button>
      </div>
    </div>
  );
}
