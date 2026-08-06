import React from 'react';
import { User, ExternalLink, Play, CheckCircle, X } from 'lucide-react';

export default function VideoCard({ metadata, onStartGeneration, isGenerating, onClose }) {
  if (!metadata) return null;

  const youtubeWatchUrl = `https://www.youtube.com/watch?v=${metadata.video_id}`;

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 sm:mb-8 bg-zinc-950 p-4 sm:p-5 rounded-xl border border-zinc-800 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
        {/* Thumbnail Preview */}
        <div className="relative group rounded-lg overflow-hidden shrink-0 w-full sm:w-52 md:w-64 aspect-video bg-zinc-900 border border-zinc-800">
          <img
            src={metadata.thumbnail}
            alt={metadata.title}
            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
          />
          <a
            href={youtubeWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white ml-0.5" />
            </div>
          </a>
        </div>

        {/* Video Info */}
        <div className="flex-1 w-full min-w-0 space-y-2.5 sm:space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 line-clamp-2 leading-snug">
              {metadata.title}
            </h2>
            <div className="flex items-center gap-1 shrink-0">
              {/* <a
                href={youtubeWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-zinc-100 transition p-1 hover:bg-zinc-900 rounded-md"
                title="Open on YouTube"
              >
                <ExternalLink className="w-4 h-4" />
              </a> */}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 p-1 rounded-md transition"
                  title="Dismiss preview"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[11px] sm:text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-300 font-medium max-w-[250px] truncate">
              <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{metadata.channel || 'Unknown Channel'}</span>
            </span>
          </div>

          {/* Available Languages Display */}
          {metadata.available_languages && metadata.available_languages.length > 0 && (
            <div className="space-y-1.5 pt-0.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                Available Subtitles
              </span>
              <div className="flex flex-wrap gap-1.5">
                {metadata.available_languages.map((lang) => (
                  <span
                    key={lang.code}
                    className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-medium hover:border-zinc-700 transition"
                  >
                    {lang.name} ({lang.code})
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-0.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-orange-400 text-[11px] sm:text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Metadata Extracted & Ready for AI Processing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
