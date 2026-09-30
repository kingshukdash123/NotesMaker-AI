import { useState } from 'react';
import { ListVideo, Play, Loader2, User, Clock, FolderPlus } from 'lucide-react';
import YouTubeIcon from '../common/YouTubeIcon';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { getChannelInitial, formatTimeAgo } from '../../utils/formatters';

export default function SearchResultPlaylistCard({
  playlist,
  onOpen,
  userPlaylists = [],
  onSaveToLibrary
}) {
  const { isDark } = useTheme();
  const { openChannelExplorer } = useApp() || {};
  const channelLetter = getChannelInitial(playlist.channel);
  const playlistId = playlist.playlistId || playlist.id;
  const timeAgoText = formatTimeAgo(playlist.publishedAt);
  const rawDescription = playlist.description || playlist.metadata?.description || playlist.snippet?.description || '';
  const descriptionText = rawDescription ? rawDescription.replace(/\s+/g, ' ').trim() : '';
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Check if this playlist is already saved in the user's library
  const isAlreadyInLibrary = Boolean(
    justSaved ||
    (userPlaylists && userPlaylists.some((pl) => {
      if (playlistId && (pl.sourcePlaylistId === playlistId || pl.youtubePlaylistId === playlistId || pl.id === playlistId)) {
        return true;
      }
      return false;
    }))
  );

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!onSaveToLibrary || isAlreadyInLibrary || isSaving) return;
    setIsSaving(true);
    try {
      await onSaveToLibrary(playlist);
      setJustSaved(true);
    } catch (err) {
      console.error('Failed to save playlist:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={() => onOpen(playlist)}
      className={`group flex flex-col sm:flex-row gap-3 sm:gap-4.5 cursor-pointer rounded-2xl p-3 sm:p-3.5 transition duration-150 select-none ${isDark
          ? 'bg-zinc-900/40 hover:bg-zinc-900/70 text-zinc-100'
          : 'bg-zinc-100/70 hover:bg-zinc-100 text-zinc-900'
        }`}
    >
      {/* Thumbnail Column with YouTube Playlist Stack Overlay */}
      <div className={`relative w-full sm:w-64 md:w-72 lg:w-76 aspect-video rounded-xl overflow-hidden shrink-0 ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'
        }`}>
        {playlist.thumbnail ? (
          <img
            src={playlist.thumbnail}
            alt={playlist.title || 'Course Playlist Thumbnail'}
            className="w-full h-full object-cover transition-transform duration-250 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-100 text-zinc-400'
            }`}>
            <ListVideo className="w-10 h-10" />
          </div>
        )}

        {/* Right-Side Playlist Badge Panel (YouTube Signature Style) */}
        <div className="absolute top-0 right-0 bottom-0 w-[38%] bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-1 z-10 select-none">
          <ListVideo className="w-5 h-5 sm:w-6 sm:h-6 text-white/90" />
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-white/90">
            Playlist
          </span>
        </div>

        {/* Play All Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center z-20">
          <div className="flex items-center gap-1.5 text-white text-xs font-bold uppercase tracking-wider bg-black/75 px-3 py-1.5 rounded-lg shadow-md">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play All</span>
          </div>
        </div>
      </div>

      {/* Info Column (Matching screenshot layout) */}
      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div>
          {/* Title (2 lines on phone view) */}
          <h3 className={`text-sm sm:text-base md:text-lg font-bold line-clamp-2 leading-snug transition ${isDark ? 'text-zinc-100 group-hover:text-white' : 'text-zinc-900'
            }`}>
            {playlist.title}
          </h3>

          {/* ── Mobile Layout (< sm): Channel/Time Ago on Left, Actions & YouTube on Right ── */}
          <div className="flex sm:hidden items-center justify-between gap-2 min-w-0 mt-1.5">
            {/* Left: Channel + Time Ago */}
            <div className="min-w-0">
              {/* Channel Row */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (openChannelExplorer) {
                    openChannelExplorer(playlist.channelId, playlist.channel);
                  }
                }}
                className="flex items-center gap-1.5 min-w-0 cursor-pointer group/channel"
                title={`Explore channel: ${playlist.channel}`}
              >
                <User className={`w-3.5 h-3.5 shrink-0 transition-colors ${isDark ? 'text-zinc-500 group-hover/channel:text-zinc-200' : 'text-zinc-400 group-hover/channel:text-zinc-700'}`} />
                <p className={`text-xs font-medium truncate max-w-[150px] transition-colors ${isDark ? 'text-zinc-400 group-hover/channel:text-zinc-200 group-hover/channel:underline' : 'text-zinc-600 group-hover/channel:text-zinc-900 group-hover/channel:underline'
                  }`}>
                  {playlist.channel}
                </p>
              </div>

              {/* Time Ago */}
              {timeAgoText && (
                <div className={`flex items-center gap-1 text-xs font-medium mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-500'
                  }`}>
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{timeAgoText}</span>
                </div>
              )}
            </div>

            {/* Mobile Actions: Add to Library & YouTube */}
            <div className="flex items-center gap-1 shrink-0">
              {onSaveToLibrary && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isAlreadyInLibrary}
                  className={`p-1.5 rounded-lg transition select-none flex items-center gap-1.5 cursor-pointer disabled:cursor-default ${isAlreadyInLibrary
                      ? isDark
                        ? 'text-zinc-100 hover:text-white hover:bg-zinc-800/60'
                        : 'text-zinc-900 hover:text-black hover:bg-zinc-100'
                      : isSaving
                        ? 'opacity-80 cursor-wait'
                        : isDark
                          ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  title={isSaving ? 'Adding...' : isAlreadyInLibrary ? 'Added to Library' : 'Add to Library'}
                  aria-label={isAlreadyInLibrary ? 'Added to Library' : 'Add to Library'}
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                  ) : (
                    <FolderPlus className={`w-3.5 h-3.5 ${isAlreadyInLibrary ? 'fill-current' : ''}`} />
                  )}
                </button>
              )}

              {/* YouTube link at extreme right */}
              {playlistId && (
                <a
                  href={`https://www.youtube.com/playlist?list=${playlistId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`p-1.5 rounded-lg transition-all flex items-center justify-center shrink-0 opacity-80 hover:opacity-100 ${isDark
                      ? 'hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                      : 'hover:bg-zinc-200/70 text-zinc-500 hover:text-zinc-900'
                    }`}
                  title="Open playlist on YouTube"
                  aria-label="Open playlist on YouTube"
                >
                  <YouTubeIcon className="w-4 h-4 transition-transform hover:scale-110" />
                </a>
              )}
            </div>
          </div>

          {/* ── Larger Devices Layout (>= sm): Channel -> Time Ago -> Action Buttons -> Description ── */}
          <div className="hidden sm:block">
            {/* Channel Row */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (openChannelExplorer) {
                  openChannelExplorer(playlist.channelId, playlist.channel);
                }
              }}
              className="flex items-center gap-1.5 min-w-0 mt-1.5 cursor-pointer group/channel inline-flex"
              title={`Explore channel: ${playlist.channel}`}
            >
              <User className={`w-3.5 h-3.5 shrink-0 transition-colors ${isDark ? 'text-zinc-500 group-hover/channel:text-zinc-200' : 'text-zinc-400 group-hover/channel:text-zinc-700'}`} />
              <p className={`text-xs font-medium truncate max-w-[320px] transition-colors ${isDark ? 'text-zinc-400 group-hover/channel:text-zinc-200 group-hover/channel:underline' : 'text-zinc-600 group-hover/channel:text-zinc-900 group-hover/channel:underline'
                }`}>
                {playlist.channel}
              </p>
            </div>

            {/* Time Ago */}
            {timeAgoText && (
              <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'
                }`}>
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{timeAgoText}</span>
              </div>
            )}

            {/* Action Bar: Placed between Time Ago and Description */}
            <div className="flex items-center justify-between gap-2 mt-2 pt-0.5">
              {onSaveToLibrary ? (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isAlreadyInLibrary}
                  className={`p-1.5 rounded-lg transition select-none flex items-center gap-1.5 cursor-pointer disabled:cursor-default ${isAlreadyInLibrary
                      ? isDark
                        ? 'text-zinc-100 hover:text-white hover:bg-zinc-800/60'
                        : 'text-zinc-900 hover:text-black hover:bg-zinc-100'
                      : isSaving
                        ? 'opacity-80 cursor-wait'
                        : isDark
                          ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  title={isSaving ? 'Adding...' : isAlreadyInLibrary ? 'Added to Library' : 'Add to Library'}
                  aria-label={isAlreadyInLibrary ? 'Added to Library' : 'Add to Library'}
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                  ) : (
                    <FolderPlus className={`w-3.5 h-3.5 ${isAlreadyInLibrary ? 'fill-current' : ''}`} />
                  )}
                </button>
              ) : (
                <div />
              )}

              {/* YouTube Link on extreme right of Action Bar */}
              {playlistId && (
                <a
                  href={`https://www.youtube.com/playlist?list=${playlistId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`p-1.5 rounded-lg transition-all flex items-center justify-center shrink-0 opacity-80 hover:opacity-100 ${isDark
                      ? 'hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                      : 'hover:bg-zinc-200/70 text-zinc-500 hover:text-zinc-900'
                    }`}
                  title="Open playlist on YouTube"
                  aria-label="Open playlist on YouTube"
                >
                  <YouTubeIcon className="w-4 h-4 transition-transform hover:scale-110" />
                </a>
              )}
            </div>

            {/* Description Snippet (2-line clamped on sm+) */}
            {descriptionText && (
              <p className={`line-clamp-2 mt-2 text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                {descriptionText}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


