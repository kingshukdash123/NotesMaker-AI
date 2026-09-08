import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { FileCheck2, Square, CheckSquare, Loader2 } from 'lucide-react';
import VideoActionButtons from '../common/VideoActionButtons';
import { formatTimeAgo, getChannelInitial } from '../../utils/formatters';

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
  const { processedVideoIds } = useApp();
  const metadata = video.metadata || {};

  // Check if notes already exist/processed for this video ID
  const isProcessed = Boolean(processedVideoIds && processedVideoIds.has(video.videoId));
  const channelLetter = getChannelInitial(metadata.channel);
  const timeAgoText = formatTimeAgo(metadata.publishedAt || video.publishedAt);

  return (
    <div className={`group flex flex-col h-full cursor-pointer transition duration-150 rounded-xl select-none ${
      isWatched ? 'opacity-85 hover:opacity-100' : ''
    }`}>
      {/* 16:9 Clean YouTube Thumbnail */}
      <div
        onClick={onOpen}
        className={`relative w-full aspect-video rounded-xl overflow-hidden shrink-0 border shadow-xs transition-colors duration-150 ${
          isDark ? 'border-zinc-800/60 bg-zinc-900' : 'border-zinc-200 bg-zinc-100'
        }`}
      >
        {metadata.thumbnail ? (
          <img
            src={metadata.thumbnail}
            alt={metadata.title || ''}
            className="w-full h-full object-cover transition-transform duration-250 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            isDark ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-100 text-zinc-400'
          }`}>
            <span className="text-xs font-semibold">Video</span>
          </div>
        )}

        {/* Live Broadcast Badges (Bottom Right) */}
        {(video.isLive || video.mediaType === 'live') ? (
          <div className="absolute bottom-1.5 right-1.5 z-20 bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>LIVE</span>
          </div>
        ) : video.mediaType === 'live_archive' ? (
          <div className="absolute bottom-1.5 right-1.5 z-20 bg-purple-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-md tracking-wider">
            <span>LIVE ARCHIVE</span>
          </div>
        ) : (
          <div className="absolute bottom-1.5 right-1.5 z-20 bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition">
            <span>Watch</span>
          </div>
        )}
      </div>

      {/* Details Section (Flex-1 to align Action Bar at bottom) */}
      <div className="pt-2.5 px-0.5 flex-1 flex flex-col justify-between min-w-0">
        {/* Top Channel & Title Info */}
        <div className="flex items-start gap-2.5 min-w-0">
          {/* Channel Avatar Circle */}
          <div
            onClick={onOpen}
            className={`w-8 h-8 rounded-full border font-bold flex items-center justify-center shrink-0 text-xs uppercase mt-0.5 select-none ${
              isDark ? 'bg-zinc-800 border-zinc-700/60 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}
          >
            {channelLetter}
          </div>

          {/* Text Info */}
          <div className="flex-1 min-w-0">
            {/* Dynamic title */}
            <h4
              onClick={onOpen}
              className={`text-sm font-bold line-clamp-2 leading-snug transition ${
                isDark ? 'text-zinc-100 group-hover:text-white' : 'text-zinc-900 group-hover:text-orange-600'
              }`}
              title={metadata.title || ''}
            >
              {metadata.title || 'Educational Video'}
            </h4>

            {/* 1 Line for Channel Name */}
            <div className="flex items-center gap-1.5 mt-0.5 pb-2 min-w-0">
              <p
                onClick={onOpen}
                className={`text-xs truncate font-medium ${
                  isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title={metadata.channel || ''}
              >
                {metadata.channel || 'YouTube Creator'}
              </p>
              {timeAgoText && (
                <>
                  <span className={`text-[10px] shrink-0 ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}>•</span>
                  <span className={`text-[11px] shrink-0 font-normal ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    {timeAgoText}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar Pinned at the Bottom of the Card: Action Buttons first, Notes Icon in last */}
        <div className={`mt-auto pt-2 flex items-center justify-between border-t min-h-[32px] ${
          isDark ? 'border-zinc-800/60' : 'border-zinc-100'
        }`}>
          {/* Action Buttons: Bookmark, Add to Playlist, Delete + Watched Checkbox */}
          <div className="flex items-center gap-1 shrink-0">
            <VideoActionButtons
              video={video}
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
                className={`p-1.5 rounded-lg transition cursor-pointer disabled:cursor-not-allowed ${
                  isWatched
                    ? isDark
                      ? 'text-green-400 bg-green-950/60 hover:bg-green-900/60'
                      : 'text-green-800 bg-green-100 hover:bg-green-200'
                    : isDark
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                      : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
                title={isLoadingWatched ? 'Updating status...' : isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                aria-label={isLoadingWatched ? 'Updating status...' : isWatched ? 'Mark as unwatched' : 'Mark as watched'}
              >
                {isLoadingWatched ? (
                  <Loader2 className={`w-3.5 h-3.5 animate-spin ${
                    isWatched 
                      ? isDark ? 'text-green-400' : 'text-green-700'
                      : isDark ? 'text-zinc-300' : 'text-zinc-600'
                  }`} />
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
              className={`inline-flex items-center justify-center p-1.5 rounded-lg shrink-0 ${
                isDark ? 'text-green-500 bg-green-500/15' : 'text-green-700 bg-green-700/15'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
            </span>
          ) : (
            <div className="w-6.5" />
          )}
        </div>
      </div>
    </div>
  );
}

