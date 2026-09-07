import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Bookmark,
  FolderPlus,
  Trash2,
  Plus,
  X,
  Check,
  Loader2
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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingPlaylistIds, setLoadingPlaylistIds] = useState(() => new Set());
  const popoverRef = useRef(null);

  const handleSave = async (e) => {
    e.stopPropagation();
    if (isSaving || !onSave) return;
    setIsSaving(true);
    try {
      await onSave();
    } catch (err) {
      console.error('Error saving video:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (isDeleting || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      console.error('Error deleting video:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePlaylist = async (e, pl, isInPlaylist) => {
    e.stopPropagation();
    if (loadingPlaylistIds.has(pl.id)) return;
    setLoadingPlaylistIds((prev) => new Set(prev).add(pl.id));
    try {
      await onAddToPlaylist?.(video.videoId, pl.id, isInPlaylist, video);
    } catch (err) {
      console.error('Error toggling playlist video:', err);
    } finally {
      setLoadingPlaylistIds((prev) => {
        const next = new Set(prev);
        next.delete(pl.id);
        return next;
      });
    }
  };

  // Close playlist popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!isPlaylistOpen) return;

    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsPlaylistOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsPlaylistOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
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
          disabled={isSaving}
          onClick={handleSave}
          className={`p-1.5 rounded-lg transition cursor-pointer disabled:cursor-wait ${
            isSaved
              ? 'text-orange-500 bg-orange-500/15 hover:bg-orange-500/25'
              : isDark
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                : 'text-orange-950/60 hover:text-orange-950 hover:bg-orange-100'
          }`}
          title={isSaving ? 'Saving...' : isSaved ? 'Saved in Library' : 'Save to Library'}
          aria-label={isSaved ? 'Remove from saved' : 'Save video'}
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
          ) : (
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          )}
        </button>
      )}

      {/* 2. Direct Add to Playlist Button with Popover */}
      {onAddToPlaylist && (
        <div ref={popoverRef} className={`relative ${isPlaylistOpen ? 'z-50' : ''}`}>
          <button
            type="button"
            disabled={loadingPlaylistIds.size > 0}
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaylistOpen((prev) => !prev);
            }}
            className={`p-1.5 rounded-lg transition cursor-pointer disabled:cursor-wait ${
              isPlaylistOpen
                ? 'text-orange-500 bg-orange-500/15'
                : isDark
                  ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                  : 'text-orange-950/60 hover:text-orange-950 hover:bg-orange-100'
            }`}
            title="Add to Playlist"
            aria-label="Add to playlist"
          >
            {loadingPlaylistIds.size > 0 ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
            ) : (
              <FolderPlus className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Compact Playlist Selection Popover directly anchored to button */}
          {isPlaylistOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute ${
                popoverPlacement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
              } ${
                popoverAlign === 'left' ? 'left-0' : 'right-0'
              } w-56 border shadow-2xl rounded-2xl p-2.5 z-50 ${
                isDark
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-200 shadow-black/90'
                  : 'bg-white border-orange-200 text-orange-950 shadow-orange-950/15'
              }`}
            >
              <div className={`flex items-center justify-between pb-1.5 mb-1 border-b px-1 text-xs font-bold ${
                isDark ? 'border-zinc-800/80' : 'border-orange-100'
              }`}>
                <span>Add to playlist</span>
                <button
                  type="button"
                  onClick={() => setIsPlaylistOpen(false)}
                  className={`p-0.5 rounded-md transition cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100' : 'hover:bg-orange-100 text-orange-800'
                  }`}
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Playlists scrollable list: exactly 3 playlists visible, after that use scroll */}
              <div className="space-y-1 max-h-[105px] overflow-y-auto custom-scrollbar my-1 pr-1">
                {playlists.length > 0 ? (
                  playlists.map((pl) => {
                    const isInPlaylist =
                      pl.videos?.some((v) => v.videoId === video.videoId) ||
                      video.playlistIds?.includes(pl.id);
                    const isLoadingThis = loadingPlaylistIds.has(pl.id);

                    return (
                      <button
                        key={pl.id}
                        type="button"
                        disabled={isLoadingThis}
                        onClick={(e) => handleTogglePlaylist(e, pl, isInPlaylist)}
                        className={`w-full h-8 flex items-center justify-between px-2.5 rounded-lg text-xs font-medium text-left transition cursor-pointer disabled:cursor-wait ${
                          isDark
                            ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900'
                            : 'text-orange-950 hover:bg-orange-100/70'
                        }`}
                      >
                        <span className="truncate pr-2">{pl.name}</span>
                        {isLoadingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500 shrink-0" />
                        ) : isInPlaylist ? (
                          <Check className="w-3.5 h-3.5 text-orange-500 shrink-0 stroke-[2.5]" />
                        ) : null}
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
                    {isCreating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
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
          disabled={isDeleting}
          onClick={handleDelete}
          className={`p-1.5 rounded-lg transition cursor-pointer disabled:cursor-wait ${
            isDark
              ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
              : 'text-orange-900/50 hover:text-red-600 hover:bg-red-50'
          }`}
          title={isDeleting ? 'Removing...' : 'Remove'}
          aria-label="Remove video"
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
