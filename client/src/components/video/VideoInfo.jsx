import { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp,
  Clock,
  Eye,
  User
} from 'lucide-react';
import YouTubeIcon from '../common/YouTubeIcon';
import Skeleton from '../common/Skeleton';
import LiveBadge from '../common/LiveBadge';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { normalizeVideoMetadata } from '../../models';
import { formatViews, formatTimeAgo } from '../../utils/formatters';

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
          className="inline-flex items-center font-mono font-semibold text-[11.5px] sm:text-xs text-blue-600 dark:text-blue-400 hover:underline bg-blue-500/10 hover:bg-blue-500/20 px-1 py-0.5 my-0.5 rounded transition cursor-pointer select-none align-baseline active:scale-95"
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
  const { openChannelExplorer } = useApp() || {};

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
  const isLoading = !metadata || (!metadata.title && !metadata.channel && !norm.title && !norm.channel);

  if (isLoading) {
    return (
      <div className={`w-full flex flex-col gap-2 bg-transparent border-0 select-none animate-in fade-in duration-200 ${className}`}>
        {/* Title skeleton + toggle */}
        <div className="w-full flex items-start justify-between gap-2.5">
          <Skeleton className="h-5 sm:h-6 w-4/5 rounded-md" />
          <Skeleton className="w-6 h-6 rounded-lg shrink-0" />
        </div>
        {/* Channel & Stats row skeleton */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
              <Skeleton className="h-4 w-28 sm:w-36 rounded" />
            </div>
            <span className={`text-xs ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`}>•</span>
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
        </div>
        {/* Description skeleton box */}
        <div className={`mt-2 p-3 sm:p-3.5 rounded-xl space-y-2 ${
          isDark ? 'bg-zinc-900/40' : 'bg-zinc-100/70'
        }`}>
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-11/12 rounded" />
          <Skeleton className="h-3.5 w-3/4 rounded" />
        </div>
      </div>
    );
  }
  const title = norm.title || metadata?.title || 'YouTube Video';
  const channel = norm.channel || metadata?.channel || metadata?.channelTitle || metadata?.author || 'YouTube Creator';
  const channelId = norm.channelId || metadata?.channel_id || metadata?.channelId || '';
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
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 2. Expanded Content: Channel Row + Description (Hidden when collapsed) */}
      {isExpanded && (
        <div className="flex flex-col gap-2 animate-in fade-in duration-150">
          {/* Channel & Metadata Stats Row (Matching SearchResultCard layout) */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="min-w-0">
              {/* Channel Row */}
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  if (openChannelExplorer) {
                    openChannelExplorer(channelId, channel);
                  }
                }}
                className="flex items-center gap-1.5 min-w-0 cursor-pointer group/channel inline-flex"
                title={`Explore channel: ${channel}`}
              >
                <User className={`w-3.5 h-3.5 shrink-0 transition-colors ${isDark ? 'text-zinc-500 group-hover/channel:text-zinc-200' : 'text-zinc-400 group-hover/channel:text-zinc-700'}`} />
                <span className={`text-xs sm:text-sm font-semibold truncate transition-colors ${
                  isDark ? 'text-zinc-300 group-hover/channel:text-zinc-100 group-hover/channel:underline' : 'text-zinc-700 group-hover/channel:text-zinc-900 group-hover/channel:underline'
                }`}>
                  {channel}
                </span>

                {isLive && (
                  <LiveBadge size="xs" className="ml-1.5" />
                )}
              </div>

              {/* Time Ago & Views (Next Line with Icons) */}
              {(timeAgoText || viewsText) && (
                <div className={`flex items-center gap-2.5 text-xs font-medium mt-1 ${
                  isDark ? 'text-zinc-500' : 'text-zinc-500'
                }`}>
                  {timeAgoText && (
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{timeAgoText}</span>
                    </span>
                  )}
                  {viewsText && (
                    <span className="flex items-center gap-1 shrink-0">
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>{viewsText}</span>
                    </span>
                  )}
                </div>
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
                className={`p-1 rounded-lg transition cursor-pointer select-none flex items-center justify-center shrink-0 self-start mt-0.5 ${
                  isDark 
                    ? 'hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200' 
                    : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <YouTubeIcon className="w-4 h-4 transition-transform hover:scale-110" />
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
