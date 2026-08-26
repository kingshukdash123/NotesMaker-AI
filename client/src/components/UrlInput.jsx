import React from 'react';
import { X, Video } from 'lucide-react';

const YoutubeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

/** Smooth rotating gradient border wrapper */
function AnimatedBorderWrapper({ children, disabled, className = '' }) {
  return (
    <div
      className={`relative rounded-xl p-[1.5px] overflow-hidden shrink-0 transition-opacity duration-300 ${disabled ? 'opacity-50' : ''} ${className}`}
      style={{
        background: 'none', // base border outline always visible
      }}
    >
      <div className="animated-orange-border absolute" aria-hidden="true" />
      <div className="rounded-[10.5px] bg-zinc-950 overflow-hidden w-full h-full relative z-10">
        {children}
      </div>
    </div>
  );
}

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
  const handleClear = () => setUrl('');

  const previewDisabled = !url || isLoadingMeta || isGenerating;
  const generateDisabled = !url || isGenerating || isLoadingMeta;

  return (
    <div className="w-full space-y-5">

      {/* Bold Hero Heading */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-50 leading-tight">
          Turn Any Lecture Into{' '} <br />
          <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
            Study Notes
          </span>
        </h2>
        <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
          Paste a YouTube URL below and let the AI pipeline transcribe, outline, and synthesize your lecture.
        </p>
      </div>

      {/* URL Input + Action Button Row */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center w-full">

        {/* Input Box */}
        <div className="w-full sm:flex-1 flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-3.5 focus-within:border-orange-500/40 focus-within:shadow-[0_0_0_3px_rgba(249,115,22,0.07)] transition-all duration-200 group min-w-0">
          <YoutubeIcon className="w-5 h-5 text-orange-500/70 shrink-0 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 min-w-0 bg-transparent text-base text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {url && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Button */}
        <div className="shrink-0 w-full sm:w-auto">
          {!hasMetadata ? (
            <AnimatedBorderWrapper disabled={previewDisabled} className="w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onFetchMetadata(url)}
                disabled={previewDisabled}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-orange-400 hover:text-orange-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed transition-colors duration-150 whitespace-nowrap bg-transparent disabled:opacity-100"
              >
                {isLoadingMeta ? (
                  <>
                    <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Previewing...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 shrink-0" />
                    <span>Preview Video</span>
                  </>
                )}
              </button>
            </AnimatedBorderWrapper>
          ) : (
            <AnimatedBorderWrapper disabled={generateDisabled} className="w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onGenerateNotes(url)}
                disabled={generateDisabled}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-orange-400 hover:text-orange-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed transition-colors duration-150 whitespace-nowrap bg-transparent disabled:opacity-100"
              >
                {isGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Notes</span>
                  </>
                )}
              </button>
            </AnimatedBorderWrapper>
          )}
        </div>

      </div>
    </div>
  );
}
