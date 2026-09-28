import { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { normalizeVideoMetadata } from '../../models';
import { getChannelInitial, formatViews, formatTimeAgo } from '../../utils/formatters';

/**
 * Converts a timestamp string (e.g. "0:01:24", "1:13:09", "12:34", "0:32") into total seconds.
 */
function parseTimestampToSeconds(timeStr) {
  if (!timeStr) return 0;
  const clean = timeStr.replace(/[[\]()]/g, '').trim();
  const parts = clean.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Renders description text with clickable timestamps and external URLs.
 */
function renderDescriptionContent(text) {
  if (!text) return null;

  // Regex matching either a URL or a Timestamp (e.g. 0:01:24, 1:13:09, 12:34, 0:32)
  const pattern = /(https?:\/\/[^\s]+|\b\d{1,2}:\d{2}(?::\d{2})?\b)/g;
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (!part) return null;

    // 1. External URL link
    if (/^https?:\/\/[^\s]+$/i.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 break-all transition-colors inline"
        >
          {part}
        </a>
      );
    }

    // 2. Clickable Video Timestamp
    if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(part)) {
      const seconds = parseTimestampToSeconds(part);
      return (
        <button
          key={index}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('seek-video', { detail: { seconds } }));
          }}
          title={`Seek video to ${part}`}
          className="inline-flex items-center font-mono font-bold text-[11.5px] sm:text-xs text-orange-500 hover:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 px-1 py-0.5 my-0.5 rounded transition cursor-pointer select-none align-baseline active:scale-95"
        >
          <span>{part}</span>
        </button>
      );
    }

    // 3. Plain text
    return <span key={index}>{part}</span>;
  });
}

export default function VideoInfo({ 
  metadata, 
  videoId, 
  videoUrl, 
  className = '' 
}) {
  const { isDark } = useTheme();

  // On phone/mobile screens (< 768px), collapse initially.
  // On large devices (>= 768px), expand by default initially.
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  // Reset collapse/expand state whenever active video changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsExpanded(window.innerWidth >= 768);
    }
  }, [videoId]);

  const norm = normalizeVideoMetadata(metadata) || normalizeVideoMetadata({ videoId, videoUrl }) || {};
  const title = norm.title || metadata?.title || 'YouTube Video';
  const channel = norm.channel || metadata?.channel || metadata?.channelTitle || metadata?.author || 'YouTube Creator';
  const channelInitial = getChannelInitial(channel);
  const viewsText = norm.viewsText || (norm.viewCount ? formatViews(norm.viewCount) : '');
  const timeAgoText = norm.timeAgoText || (norm.publishedAt ? formatTimeAgo(norm.publishedAt) : '');
  const description = (norm.description || metadata?.description || '').trim();
  const isLive = Boolean(norm.isLive || metadata?.is_live || metadata?.isLive);
  const isLiveArchive = Boolean(norm.isLiveArchive || metadata?.is_live_archive || metadata?.isLiveArchive);
  const watchUrl = norm.videoUrl || videoUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '');

  const hasDescription = description.length > 0;

  return (
    <div className={`w-full flex flex-col gap-2 bg-transparent border-0 select-none ${className}`}>
      {/* 1. Header: Video Title & Single Collapse Toggle (When collapsed, only this 1 line title is shown) */}
      <div 
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(prev => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(prev => !prev);
          }
        }}
        aria-expanded={isExpanded}
        title={isExpanded ? 'Collapse info' : 'Expand info'}
        className="w-full flex items-start justify-between gap-2.5 cursor-pointer bg-transparent border-0 p-0 transition group"
      >
        <h2 
          className={`font-bold transition leading-snug flex-1 pr-1 min-w-0 ${
            isExpanded 
              ? 'text-sm sm:text-base break-words ' + (isDark ? 'text-zinc-100' : 'text-zinc-900') 
              : 'text-xs sm:text-sm truncate ' + (isDark ? 'text-zinc-200 group-hover:text-white' : 'text-zinc-800')
          }`}
          title={!isExpanded ? title : ''}
        >
          {title}
        </h2>

        {/* Minimal Toggle Chevron Button - Aligned to top of title */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(prev => !prev);
          }}
          aria-label={isExpanded ? 'Collapse info' : 'Expand info'}
          className={`shrink-0 p-1 -mt-0.5 rounded-lg text-xs font-medium flex items-center transition cursor-pointer ${
            isDark 
              ? 'hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200' 
              : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
          }`}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-orange-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-orange-500" />
          )}
        </button>
      </div>

      {/* 2. Expanded Content: Channel Row + Description (Hidden when collapsed) */}
      {isExpanded && (
        <div className="flex flex-col gap-2 animate-in fade-in duration-150">
          {/* Channel & Metadata Stats Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-orange-500/15 border border-orange-500/25 flex items-center justify-center font-bold text-[11px] sm:text-xs text-orange-500 shrink-0">
                {channelInitial}
              </div>

              <span className={`text-xs sm:text-sm font-semibold truncate ${
                isDark ? 'text-zinc-300' : 'text-zinc-700'
              }`}>
                {channel}
              </span>

              {viewsText && (
                <span className={`text-[11px] sm:text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  &bull; {viewsText}
                </span>
              )}

              {timeAgoText && (
                <span className={`text-[11px] sm:text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  &bull; {timeAgoText}
                </span>
              )}

              {isLive && (
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9.5px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  LIVE
                </span>
              )}

              {isLiveArchive && (
                <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9.5px] font-bold px-1.5 py-0.5 rounded tracking-wider">
                  LIVE ARCHIVE
                </span>
              )}
            </div>

            {/* Direct YouTube Logo Link */}
            {watchUrl && (
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Watch on YouTube"
                aria-label="Watch on YouTube"
                className={`p-1 rounded-lg transition cursor-pointer select-none flex items-center justify-center ${
                  isDark 
                    ? 'hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200' 
                    : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <svg className="w-4 h-4 shrink-0 transition-transform hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                  <polygon fill="#FFFFFF" points="9.545,15.568 15.818,12 9.545,8.432" />
                </svg>
              </a>
            )}
          </div>

          {/* Separator between Channel and Description */}
          {hasDescription && (
            <div className={`w-full h-px my-0.5 ${
              isDark ? 'bg-zinc-800/60' : 'bg-zinc-200/80'
            }`} />
          )}

          {/* Description Section */}
          {hasDescription && (
            <div className="pt-0.5">
              <div 
                className={`text-xs leading-relaxed whitespace-pre-line break-words select-text ${
                  isDark ? 'text-zinc-300' : 'text-zinc-700'
                }`}
              >
                {renderDescriptionContent(description)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
