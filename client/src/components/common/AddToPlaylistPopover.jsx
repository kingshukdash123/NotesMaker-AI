import { useState, useEffect, useRef } from 'react';
import {
  FolderPlus,
  Plus,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  getUserPlaylists,
  getVideoPlaylistIds,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  createPlaylist
} from '../../services/firebase/libraryService';

export default function AddToPlaylistPopover({
  video = null,
  videoId: propVideoId = null,
  videoUrl = '',
  metadata = null,
  playlists: propPlaylists = null,
  onAddToPlaylist = null,
  onCreatePlaylist = null,
  currentUser = null,
  placement = 'top', // 'top' | 'bottom'
  align = 'left', // 'left' | 'right'
  className = '',
  buttonClassName = '',
  popoverClassName = '',
}) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [internalPlaylists, setInternalPlaylists] = useState([]);
  const [internalAssignedIds, setInternalAssignedIds] = useState([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loadingPlaylistIds, setLoadingPlaylistIds] = useState(() => new Set());
  const popoverRef = useRef(null);

  const currentVideoId = video?.videoId || propVideoId || '';
  const currentVideoUrl = video?.videoUrl || videoUrl || (currentVideoId ? `https://www.youtube.com/watch?v=${currentVideoId}` : '');
  const currentMetadata = video?.metadata || metadata || {};

  // Fetch playlists & memberships if currentUser is provided and propPlaylists is not controlled externally
  useEffect(() => {
    if (isOpen && currentUser && currentVideoId && !propPlaylists) {
      setIsLoadingPlaylists(true);
      Promise.all([
        getUserPlaylists(currentUser.uid),
        getVideoPlaylistIds(currentUser.uid, currentVideoId)
      ])
        .then(([playlistsData, assignedIds]) => {
          setInternalPlaylists(playlistsData || []);
          setInternalAssignedIds(assignedIds || []);
        })
        .catch((err) => console.error('Failed to load playlists:', err))
        .finally(() => setIsLoadingPlaylists(false));
    }
  }, [isOpen, currentUser, currentVideoId, propPlaylists]);

  // Click outside and escape dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const effectivePlaylists = propPlaylists || internalPlaylists;

  const handleToggle = async (e, pl, isInPlaylist) => {
    e.stopPropagation();
    if (loadingPlaylistIds.has(pl.id)) return;

    setLoadingPlaylistIds((prev) => new Set(prev).add(pl.id));
    try {
      if (onAddToPlaylist) {
        await onAddToPlaylist(currentVideoId, pl.id, isInPlaylist, video || {
          videoId: currentVideoId,
          videoUrl: currentVideoUrl,
          metadata: currentMetadata
        });
      } else if (currentUser && currentVideoId) {
        if (isInPlaylist) {
          await removeVideoFromPlaylist(currentUser.uid, currentVideoId, pl.id);
          setInternalAssignedIds((prev) => prev.filter((id) => id !== pl.id));
        } else {
          await addVideoToPlaylist(currentUser.uid, currentVideoId, pl.id, {
            videoUrl: currentVideoUrl,
            metadata: currentMetadata
          });
          setInternalAssignedIds((prev) => [...prev, pl.id]);
        }
        const updated = await getUserPlaylists(currentUser.uid);
        setInternalPlaylists(updated);
      }
    } catch (err) {
      console.error('Error toggling playlist:', err);
    } finally {
      setLoadingPlaylistIds((prev) => {
        const next = new Set(prev);
        next.delete(pl.id);
        return next;
      });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const name = newPlaylistName.trim();
    if (!name || isCreating) return;

    setIsCreating(true);
    try {
      if (onCreatePlaylist) {
        await onCreatePlaylist(name);
        setNewPlaylistName('');
      } else if (currentUser && currentVideoId) {
        const newPlaylistId = await createPlaylist(currentUser.uid, name);
        await addVideoToPlaylist(currentUser.uid, currentVideoId, newPlaylistId, {
          videoUrl: currentVideoUrl,
          metadata: currentMetadata
        });
        setInternalAssignedIds((prev) => [...prev, newPlaylistId]);
        setNewPlaylistName('');
        const updated = await getUserPlaylists(currentUser.uid);
        setInternalPlaylists(updated);
      }
    } catch (err) {
      console.error('Failed to create playlist:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      ref={popoverRef}
      className={`relative ${isOpen ? 'z-50' : ''} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Popover Trigger Button */}
      <button
        type="button"
        disabled={loadingPlaylistIds.size > 0 || isLoadingPlaylists}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center select-none disabled:cursor-wait ${
          isOpen
            ? isDark
              ? 'bg-orange-500/15 text-orange-400'
              : 'bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-xs'
            : isDark
              ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
        } ${buttonClassName}`}
        title="Add to Playlist"
        aria-label="Add to playlist"
      >
        {loadingPlaylistIds.size > 0 || isLoadingPlaylists ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
        ) : (
          <FolderPlus className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Shared Playlist Dropdown Modal / Popover */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${
            placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            align === 'left' ? 'left-0' : 'right-0'
          } w-56 max-w-[calc(100vw-2rem)] border shadow-2xl rounded-2xl p-2.5 z-50 ${
            isDark
              ? 'bg-zinc-950 border-zinc-800 text-zinc-200 shadow-black/90'
              : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
          } ${popoverClassName}`}
        >
          {/* Dropdown Header */}
          <div className={`flex items-center justify-between pb-1.5 mb-1 border-b px-1 text-xs font-bold ${
            isDark ? 'border-zinc-800/80' : 'border-zinc-100'
          }`}>
            <span>Add to playlist</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`p-0.5 rounded-md transition cursor-pointer ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
              }`}
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Playlists List: exactly 3 items visible, then scrollable */}
          <div className="space-y-0.5 max-h-[105px] overflow-y-auto custom-scrollbar my-1 pr-1">
            {isLoadingPlaylists ? (
              <div className="p-3 text-center">
                <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-orange-500" />
              </div>
            ) : effectivePlaylists.length > 0 ? (
              effectivePlaylists.map((pl) => {
                const isInPlaylist =
                  pl.videos?.some((v) => v.videoId === currentVideoId) ||
                  video?.playlistIds?.includes(pl.id) ||
                  internalAssignedIds.includes(pl.id);
                const isLoadingThis = loadingPlaylistIds.has(pl.id);

                return (
                  <button
                    key={pl.id}
                    type="button"
                    disabled={isLoadingThis}
                    onClick={(e) => handleToggle(e, pl, isInPlaylist)}
                    className={`w-full h-8 flex items-center justify-between px-2.5 rounded-lg text-xs font-medium text-left transition cursor-pointer disabled:cursor-wait ${
                      isDark
                        ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900'
                        : 'text-zinc-800 hover:bg-zinc-100 hover:text-zinc-900'
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
              <div className={`text-center py-2 text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                No custom playlists yet
              </div>
            )}
          </div>

          {/* Quick Playlist Creation Form */}
          {(onCreatePlaylist || currentUser) && (
            <form
              onSubmit={handleCreate}
              onClick={(e) => e.stopPropagation()}
              className={`flex items-center gap-1.5 mt-1 pt-1.5 border-t ${
                isDark ? 'border-zinc-800/60' : 'border-zinc-100'
              }`}
            >
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="New playlist..."
                disabled={isCreating}
                className={`flex-1 min-w-0 px-2.5 py-1 text-xs border rounded-lg outline-none transition focus:border-orange-500 ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-200 placeholder-zinc-500'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:bg-white'
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
  );
}
