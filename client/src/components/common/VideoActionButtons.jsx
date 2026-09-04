import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Bookmark,
  FolderPlus,
  Trash2,
  Plus,
  X
} from 'lucide-react';

export default function VideoActionButtons({
  video,
  playlists = [],
  isSaved = false,
  onSave,
  onAddToPlaylist,
  onCreatePlaylist,
  onDelete,
  popoverPlacement = 'top', // 'top' | 'bottom'
  popoverAlign = 'right' // 'right' | 'left'
}) {
  const { isDark } = useTheme();
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const popoverRef = useRef(null);

  // Close playlist popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsPlaylistOpen(false);
      }
    };
    if (isPlaylistOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPlaylistOpen]);

  return (
    <div
      className="flex items-center gap-1 shrink-0 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Direct Save / Bookmark Button */}
      {onSave && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            isSaved
              ? 'text-orange-500 bg-orange-500/15 hover:bg-orange-500/25'
              : isDark
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                : 'text-orange-950/60 hover:text-orange-950 hover:bg-orange-100'
          }`}
          title={isSaved ? 'Saved in Library' : 'Save to Library'}
          aria-label={isSaved ? 'Remove from saved' : 'Save video'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      )}

      {/* 2. Direct Add to Playlist Button with Popover */}
      {onAddToPlaylist && (
        <div ref={popoverRef} className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaylistOpen((prev) => !prev);
            }}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isPlaylistOpen
                ? 'text-orange-500 bg-orange-500/15'
                : isDark
                  ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                  : 'text-orange-950/60 hover:text-orange-950 hover:bg-orange-100'
            }`}
            title="Add to Playlist"
            aria-label="Add to playlist"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>

          {/* Compact Playlist Selection Popover */}
          {isPlaylistOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute ${popoverAlign === 'left' ? 'left-0' : 'right-0'} ${
                popoverPlacement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
              } w-52 sm:w-60 border shadow-2xl rounded-2xl p-2 z-[80] animate-in fade-in slide-in-from-bottom-1 duration-150 ${
                isDark
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-200'
                  : 'bg-white border-orange-200 text-orange-950'
              }`}
            >
              <div className={`flex items-center justify-between pb-1.5 mb-1 border-b px-1 text-xs font-bold ${
                isDark ? 'border-zinc-800/80' : 'border-orange-100'
              }`}>
                <span>Add to playlist</span>
                <button
                  type="button"
                  onClick={() => setIsPlaylistOpen(false)}
                  className={`p-0.5 rounded transition cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100' : 'hover:bg-orange-100 text-orange-800'
                  }`}
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Playlists scrollable list */}
              <div className="space-y-0.5 max-h-44 overflow-y-auto custom-scrollbar my-1 pr-0.5">
                {playlists.length > 0 ? (
                  playlists.map((pl) => {
                    const isInPlaylist =
                      pl.videos?.some((v) => v.videoId === video.videoId) ||
                      video.playlistIds?.includes(pl.id);
                    return (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToPlaylist(video.videoId, pl.id, isInPlaylist, video);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition cursor-pointer ${
                          isInPlaylist
                            ? 'text-orange-500 bg-orange-500/15 font-semibold'
                            : isDark
                              ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900'
                              : 'text-orange-950 hover:bg-orange-50'
                        }`}
                      >
                        <span className="truncate pr-2">{pl.name}</span>
                        <span className="font-bold text-xs shrink-0">{isInPlaylist ? '✓' : '+'}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className={`text-center py-2 text-[10px] ${isDark ? 'text-zinc-500' : 'text-orange-900/60'}`}>
                    No custom playlists yet
                  </div>
                )}
              </div>

              {/* Quick Playlist Creation Input */}
              {onCreatePlaylist && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const name = newPlaylistName.trim();
                    if (!name) return;
                    setIsCreating(true);
                    try {
                      await onCreatePlaylist(name);
                      setNewPlaylistName('');
                    } catch (err) {
                      console.error('Failed to create playlist:', err);
                    } finally {
                      setIsCreating(false);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`flex items-center gap-1.5 mt-1 pt-1.5 border-t ${
                    isDark ? 'border-zinc-800/60' : 'border-orange-100'
                  }`}
                >
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="New playlist..."
                    disabled={isCreating}
                    className={`flex-1 px-2.5 py-1 text-xs border rounded-lg outline-none ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:border-zinc-700'
                        : 'bg-white border-orange-200 text-orange-950 placeholder-orange-900/40 focus:border-orange-400'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isCreating || !newPlaylistName.trim()}
                    className="btn-primary p-1.5 !rounded-lg text-xs font-bold shrink-0 cursor-pointer disabled:opacity-40"
                    title="Create Playlist"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Direct Remove Button (Only shown if onDelete exists) */}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            isDark
              ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
              : 'text-orange-900/50 hover:text-red-600 hover:bg-red-50'
          }`}
          title="Remove"
          aria-label="Remove video"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
