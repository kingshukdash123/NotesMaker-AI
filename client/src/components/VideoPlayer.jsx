import React, { useState } from 'react';
import { ExternalLink, User, Subtitles, Loader2, PlayCircle } from 'lucide-react';

export default function VideoPlayer({ videoId, metadata }) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!videoId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/40 border border-zinc-900 rounded-xl glass-panel min-h-[300px]">
        <PlayCircle className="w-12 h-12 text-zinc-600 mb-3 animate-pulse" />
        <p className="text-sm text-zinc-400 font-medium">No video tutorial loaded</p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
  const youtubeWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950/40 border border-zinc-900 rounded-xl overflow-hidden shadow-2xl glass-panel animate-in fade-in duration-300">
      {/* Player Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span className="text-[11px] font-semibold text-zinc-400 tracking-wide uppercase truncate">
            {metadata?.channel || 'YouTube Tutorial'}
          </span>
        </div>
      </div>

      {/* Video Embed IFrame */}
      <div className="relative w-full aspect-video bg-black shrink-0 border-b border-zinc-900">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}
        <iframe
          src={embedUrl}
          title={metadata?.title || 'YouTube video player'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setIsLoaded(true)}
          className="w-full h-full"
        />
      </div>

      {/* Video Information & Subtitles (Scrollable on overflow) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-zinc-100 leading-snug">
            {metadata?.title || 'YouTube Video'}
          </h2>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
            <User className="w-3.5 h-3.5 text-zinc-500" />
            <span className="font-medium text-zinc-300">{metadata?.channel || 'Unknown Creator'}</span>
          </div>
        </div>

        {/* Available Languages Display */}
        {metadata?.available_languages && metadata.available_languages.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-zinc-900/60">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
              <Subtitles className="w-3.5 h-3.5 text-zinc-500" />
              <span>Available Video Subtitles ({metadata.available_languages.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {metadata.available_languages.map((lang) => (
                <span
                  key={lang.code}
                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-medium hover:border-zinc-700 hover:text-zinc-100 transition"
                >
                  {lang.name} ({lang.code})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
