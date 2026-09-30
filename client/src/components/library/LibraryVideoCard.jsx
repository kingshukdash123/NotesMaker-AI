import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { Cpu, Square, CheckSquare, Loader2, User } from 'lucide-react';
import VideoActionButtons from '../common/VideoActionButtons';
import { normalizeVideoMetadata } from '../../models';
import { getChannelInitial } from '../../utils/formatters';

export default function LibraryVideoCard({
  video,
  onOpen,
  onDelete,
  onAddToPlaylist,
  playlists = [],
  onSave,
  isSaved,
  onCreatePlaylist,
  showCheckbox = false,
  isWatched = false,
  isLoadingWatched = false,
  onToggleWatched,
}) {
  const { isDark } = useTheme();
  const { processedVideoIds, openChannelExplorer } = useApp() || {};

  const norm = normalizeVideoMetadata(video) || {};
  const currentVideoId = norm.videoId || '';

  // Check if notes already exist/processed for this video ID
  const isProcessed = Boolean(processedVideoIds && processedVideoIds.has(currentVideoId));
  const channelLetter = getChannelInitial(norm.channel);
  const durationText = norm.durationFormatted;

  return (
    <div className={`group relative flex flex-col h-full cursor-pointer transition-all duration-200 rounded-xl select-none hover:z-20 focus-within:z-30 ${isDark
        ? 'bg-zinc-900/40 hover:bg-zinc-900/70'
        : 'bg-zinc-100/70 hover:bg-zinc-100'
      }`}>
      {/* 16:9 Clean YouTube Thumbnail */}
      <div
        onClick={onOpen}
        className={`relative w-full aspect-video rounded-t-xl overflow-hidden shrink-0 transition-colors duration-150 ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'
          } ${isWatched ? 'opacity-85 group-hover:opacity-100' : ''
          }`}
      >
        {norm.thumbnail ? (
          <img
            src={norm.thumbnail}
            alt={norm.title || 'Educational Lecture Thumbnail'}
            className="w-full h-full object-cover transition-transform duration-250 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-100 text-zinc-400'
            }`}>
            <span className="text-xs font-semibold">Video</span>
          </div>
        )}

        {/* Live Broadcast / Duration Badge (Bottom Right) */}
        {norm.isLive ? (
          <div className="absolute bottom-1.5 right-1.5 z-20 bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>LIVE</span>
          </div>
        ) : norm.isLiveArchive ? (
          <div className="absolute bottom-1.5 right-1.5 z-20 bg-purple-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-md tracking-wider">
            <span>LIVE ARCHIVE</span>
          </div>
        ) : durationText ? (
          <div className="absolute bottom-1.5 right-1.5 z-20 bg-black/85 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md tracking-wide">
            <span>{durationText}</span>
          </div>
        ) : null}
      </div>


      {/* Details Section */}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2.5 min-w-0">
        {/* Title & Channel Stack */}
        <div className="space-y-1 min-w-0">
          {/* 1. Title (1 line clamp) */}
          <h4
            onClick={onOpen}
            className={`text-sm font-semibold line-clamp-1 leading-snug transition ${isDark ? 'text-zinc-100 group-hover:text-white' : 'text-zinc-900'
              }`}
            title={norm.title || ''}
          >
            {norm.title || 'Educational Video'}
          </h4>

          {/* 2. Channel Name with User Icon */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (openChannelExplorer) {
                openChannelExplorer(norm.channelId, norm.channel);
              }
            }}
            className="flex items-center gap-1.5 pt-0.5 min-w-0 cursor-pointer group/channel inline-flex"
            title={`Explore channel: ${norm.channel || ''}`}
          >
            <User className={`w-3.5 h-3.5 shrink-0 transition-colors ${isDark ? 'text-zinc-500 group-hover/channel:text-zinc-200' : 'text-zinc-400 group-hover/channel:text-zinc-700'}`} />
            {/* Channel Name */}
            <p
              className={`text-xs truncate font-medium transition-colors ${isDark ? 'text-zinc-400 group-hover/channel:text-zinc-200 group-hover/channel:underline' : 'text-zinc-600 group-hover/channel:text-zinc-900 group-hover/channel:underline'
                }`}
              title={norm.channel || ''}
            >
              {norm.channel || 'YouTube Creator'}
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-auto pt-1.5 flex items-center justify-between min-h-[28px]">
          {/* Action Buttons: Bookmark, Add to Playlist, Delete + Watched Checkbox */}
          <div className="flex items-center gap-1 shrink-0">
            <VideoActionButtons
              video={norm}
              playlists={playlists}
              isSaved={isSaved}
              onSave={onSave}
              onAddToPlaylist={onAddToPlaylist}
              onCreatePlaylist={onCreatePlaylist}
              onDelete={onDelete}
              popoverPlacement="top"
              popoverAlign="left"
            />

            {/* Checkbox at the action button */}
            {showCheckbox && (
              <button
                type="button"
                disabled={isLoadingWatched}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWatched?.(video);
                }}
                className={`p-1.5 rounded-lg transition cursor-pointer disabled:cursor-not-allowed ${isWatched
                    ? isDark
                      ? 'text-zinc-100 hover:text-white hover:bg-zinc-800/60'
                      : 'text-zinc-900 hover:text-black hover:bg-zinc-100'
                    : isDark
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                title={isLoadingWatched ? 'Updating status...' : isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                aria-label={isLoadingWatched ? 'Updating status...' : isWatched ? 'Mark as unwatched' : 'Mark as watched'}
              >
                {isLoadingWatched ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                ) : isWatched ? (
                  <CheckSquare className="w-3.5 h-3.5" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Right side: Notes generated icon */}
          {isProcessed ? (
            <span
              title="Notes generated & ready"
              className="inline-flex items-center justify-center p-1 shrink-0 text-emerald-500 dark:text-emerald-400"
            >
              <Cpu className="w-4 h-4" />
            </span>
          ) : (
            <div className="w-6" />
          )}
        </div>
      </div>
    </div>
  );
}

