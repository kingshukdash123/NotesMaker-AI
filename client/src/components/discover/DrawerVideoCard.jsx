import { Play, Clock } from 'lucide-react';
import VideoActionButtons from '../common/VideoActionButtons';
import LiveBadge from '../common/LiveBadge';
import { normalizeVideoMetadata } from '../../models';
import { useTheme } from '../../context/ThemeContext';

/**
 * Reusable video queue list item card for Playlist and Channel Explorer drawers.
 * Displays index number, 16:9 thumbnail with duration badge, title, time ago, and action buttons.
 */
export default function DrawerVideoCard({
  video,
  index = 0,
  onSelect,
  playlists = [],
  isSaved = false,
  onSave,
  onAddToPlaylist,
  onCreatePlaylist,
}) {
  const { isDark } = useTheme();
  const norm = normalizeVideoMetadata(video) || {};
  const durationText = (!norm.isLive && norm.durationFormatted && norm.durationFormatted !== '0:00' && norm.durationFormatted !== '00:00' && norm.durationFormatted !== '0:00:00') ? norm.durationFormatted : '';

  return (
    <div
      onClick={() => onSelect && onSelect(norm)}
      className={`group p-1.5 sm:p-2.5 rounded-xl transition-all duration-150 flex items-center gap-2 sm:gap-3 cursor-pointer select-none ${
        isDark
          ? 'hover:bg-zinc-900/80 text-zinc-100'
          : 'hover:bg-zinc-50 text-zinc-900'
      }`}
    >
      {/* 1. Index Number */}
      <div
        className={`w-4 sm:w-5 text-center text-[11px] sm:text-xs font-semibold shrink-0 ${
          isDark
            ? 'text-zinc-500 group-hover:text-zinc-300'
            : 'text-zinc-400 group-hover:text-zinc-900 font-medium'
        }`}
      >
        {index + 1}
      </div>

      {/* 2. 16:9 Thumbnail with Duration Badge and Hover Play Overlay */}
      <div
        className={`relative w-24 min-[400px]:w-28 sm:w-32 aspect-video rounded-lg overflow-hidden shrink-0 ${
          isDark ? 'bg-zinc-900' : 'bg-zinc-200'
        }`}
      >
        {norm.thumbnail ? (
          <img
            src={norm.thumbnail}
            alt={norm.title || 'Video Thumbnail'}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-200"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-4 h-4 opacity-40" />
          </div>
        )}

        {/* Live Badge / Duration */}
        {norm.isLive ? (
          <div className="absolute bottom-1 right-1 z-20">
            <LiveBadge size="xs" />
          </div>
        ) : durationText ? (
          <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-2xs text-white text-[9px] font-semibold px-1 py-0.2 rounded shadow-xs">
            {durationText}
          </div>
        ) : null}

        {/* Subtle hover play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current drop-shadow" />
        </div>
      </div>

      {/* 3. Title and Published Time Ago */}
      <div className="flex-1 min-w-0 pr-1">
        <h4
          className={`text-xs sm:text-sm font-semibold line-clamp-2 leading-snug transition ${
            isDark ? 'text-zinc-100 group-hover:text-white' : 'text-zinc-900'
          }`}
          title={norm.title || ''}
        >
          {norm.title}
        </h4>

        {norm.timeAgoText && (
          <div
            className={`flex items-center gap-1 text-[11px] font-medium mt-0.5 ${
              isDark ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            <Clock className="w-3 h-3 shrink-0" />
            <span>{norm.timeAgoText}</span>
          </div>
        )}
      </div>

      {/* 4. Action Buttons (Save / Bookmark & Add to Playlist) */}
      {onSave && (
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <VideoActionButtons
            video={norm}
            playlists={playlists}
            isSaved={isSaved}
            onSave={() => onSave(norm)}
            onAddToPlaylist={(videoId, playlistId, alreadyAssociated) =>
              onAddToPlaylist?.(videoId, playlistId, alreadyAssociated, norm)
            }
            onCreatePlaylist={onCreatePlaylist}
            popoverPlacement="left"
            popoverAlign="top"
          />
        </div>
      )}
    </div>
  );
}
