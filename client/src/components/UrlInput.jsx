import React, { useState } from 'react';
import { Search, Sparkles, X, ArrowRight, Video, PlayCircle, Loader } from 'lucide-react';

const YoutubeIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function UrlInput({ 
  url, 
  setUrl, 
  onFetchMetadata, 
  onGenerateNotes, 
  onLoadMockData,
  isLoadingMeta, 
  isGenerating,
  pulseTestNotes = false,
  hasMetadata = false
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
            {!hasMetadata ? (
              /* Step 1: Preview Video Details Button */
              <button
                type="button"
                onClick={() => onFetchMetadata(url)}
                disabled={!url || isLoadingMeta || isGenerating}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 flex items-center justify-center gap-2 shadow-md hover:scale-[1.02]"
              >
                {isLoadingMeta ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>Previewing...</span>
                  </span>
                ) : (
                  <>
                    <Video className="w-4 h-4 text-zinc-950 shrink-0" />
                    <span>Preview Video</span>
                  </>
                )}
              </button>
            ) : (
              /* Step 2: Generate Notes Button */
              <button
                type="button"
                onClick={() => onGenerateNotes(url)}
                disabled={!url || isGenerating || isLoadingMeta}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold text-zinc-950 bg-zinc-100 hover:bg-white hover:scale-[1.02] shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>Generating...</span>
                  </span>
                ) : (
                  <>
                    <Loader className="w-4 h-4 text-zinc-950 shrink-0" />
                    <span>Generate Notes</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
