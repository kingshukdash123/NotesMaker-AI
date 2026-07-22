import React from 'react';
import { User, Clock, Calendar, Globe, ExternalLink, Play, CheckCircle, X } from 'lucide-react';

export default function VideoCard({ metadata, onStartGeneration, isGenerating, onClose }) {
  if (!metadata) return null;

  // Format duration in HH:MM:SS or MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  // Format upload date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    if (dateStr.length === 8) {
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  };

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
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white ml-0.5" />
            </div>
          </a>
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold bg-black/80 text-white rounded backdrop-blur">
            {formatDuration(metadata.duration)}
          </span>
        </div>

        {/* Video Info */}
        <div className="flex-1 w-full min-w-0 space-y-2.5 sm:space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 line-clamp-2 leading-snug">
              {metadata.title}
            </h2>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href={youtubeWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-zinc-100 transition p-1 hover:bg-zinc-900 rounded-md"
                title="Open on YouTube"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
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
            <span className="flex items-center gap-1.5 text-zinc-300 font-medium max-w-[200px] truncate">
              <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{metadata.channel || 'Unknown Channel'}</span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              {formatDuration(metadata.duration)}
            </span>
            {metadata.upload_date && (
              <span className="flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                {formatDate(metadata.upload_date)}
              </span>
            )}
            {metadata.language && (
              <span className="flex items-center gap-1 uppercase text-[9px] sm:text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 shrink-0">
                <Globe className="w-3 h-3 text-zinc-400 shrink-0" />
                {metadata.language}
              </span>
            )}
          </div>

          {metadata.description && (
            <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-2 leading-relaxed italic bg-zinc-900/60 p-2.5 rounded-md border border-zinc-800/80">
              "{metadata.description}"
            </p>
          )}

          <div className="pt-0.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] sm:text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Metadata Extracted & Ready for AI Processing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
