import { useState, useEffect, useRef } from 'react';
import { 
  NotebookPen, 
  BarChart2, 
  MessageSquare, 
  Bookmark, 
  FolderPlus, 
  Plus, 
  Check, 
  Loader2 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getUserPlaylists, addVideoToPlaylist, createPlaylist } from '../services/firebase/libraryService';

export default function Tabs({ 
  activeTab, 
  setActiveTab, 
  currentUser,
  videoId,
  videoUrl,
  metadata,
  isSaved,
  onToggleSave,
  isCheckingSaved,
  hasNotes = false,
  className = '' 
}) {
  const { isDark } = useTheme();
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [addedPlaylistId, setAddedPlaylistId] = useState(null);
  const playlistPopoverRef = useRef(null);

  const tools = [
    { id: 'notes', label: 'Study Notes', icon: NotebookPen },
    { id: 'summary', label: 'Summary Dashboard', icon: BarChart2 },
    { id: 'qa', label: 'Video Q&A Companion', icon: MessageSquare },
  ];

  // Fetch playlists when popover opens
  useEffect(() => {
    if (isPlaylistOpen && currentUser) {
      setLoadingPlaylists(true);
      getUserPlaylists(currentUser.uid)
        .then((data) => setPlaylists(data))
        .catch((err) => console.error('Failed to load playlists:', err))
        .finally(() => setLoadingPlaylists(false));
    }
  }, [isPlaylistOpen, currentUser]);

  // Click outside to close playlist popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (playlistPopoverRef.current && !playlistPopoverRef.current.contains(e.target)) {
        setIsPlaylistOpen(false);
      }
    };
    if (isPlaylistOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPlaylistOpen]);

  const handleAddToPlaylist = async (playlistId) => {
    if (!currentUser || !videoId) return;
    try {
      await addVideoToPlaylist(currentUser.uid, videoId, playlistId, {
        videoUrl: videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
        metadata,
        notesReady: hasNotes
      });
      setAddedPlaylistId(playlistId);
      setTimeout(() => {
        setAddedPlaylistId(null);
        setIsPlaylistOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to add video to playlist:', err);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e?.preventDefault();
    if (!currentUser || !newPlaylistName.trim()) return;
    setIsCreatingPlaylist(true);
    try {
      const playlistId = await createPlaylist(currentUser.uid, newPlaylistName.trim());
      await addVideoToPlaylist(currentUser.uid, videoId, playlistId, {
        videoUrl: videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
        metadata,
        notesReady: hasNotes
      });
      setNewPlaylistName('');
      setAddedPlaylistId(playlistId);
      const updated = await getUserPlaylists(currentUser.uid);
      setPlaylists(updated);
      setTimeout(() => {
        setAddedPlaylistId(null);
        setIsPlaylistOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to create playlist:', err);
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 bg-transparent ${className}`}>
      {/* Header Titles Row */}
      <div className="flex items-center justify-between px-0.5">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${
          isDark ? 'text-zinc-400' : 'text-orange-900'
        }`}>
          Study Tools
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${
          isDark ? 'text-zinc-400' : 'text-orange-900'
        }`}>
          Quick Actions
        </span>
      </div>

      {/* Buttons Row */}
      <div className="w-full flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* 1. Left Side: Study Tools */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTab(tool.id)}
                title={tool.label}
                aria-label={tool.label}
                className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center select-none ${
                  isActive
                    ? isDark 
                      ? 'bg-orange-500/15 text-orange-400 font-bold' 
                      : 'bg-orange-100 text-orange-600 font-bold'
                    : isDark
                      ? 'text-zinc-500 hover:text-orange-400 hover:bg-orange-500/10'
                      : 'text-orange-950/60 hover:text-orange-600 hover:bg-orange-100/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>

      {/* 2. Right Side: Video Actions (Save to Library & Add to Playlist) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Save to Library Button */}
        {onToggleSave && (
          <button
            type="button"
            onClick={onToggleSave}
            disabled={isCheckingSaved}
            title={isSaved ? 'Saved to Library' : 'Save to Library'}
            aria-label={isSaved ? 'Saved to Library' : 'Save to Library'}
            className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center select-none ${
              isSaved
                ? isDark 
                  ? 'bg-orange-500/15 text-orange-400' 
                  : 'bg-orange-100 text-orange-600'
                : isDark
                  ? 'text-zinc-500 hover:text-orange-400 hover:bg-orange-500/10'
                  : 'text-orange-950/60 hover:text-orange-600 hover:bg-orange-100/60'
            }`}
          >
            {isCheckingSaved ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
            ) : (
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            )}
          </button>
        )}

          {/* Add to Playlist Button */}
          <div className="relative" ref={playlistPopoverRef}>
            <button
              type="button"
              onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
              title="Add to Playlist"
              aria-label="Add to Playlist"
              className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center select-none ${
                isPlaylistOpen
                  ? isDark 
                    ? 'bg-orange-500/15 text-orange-400' 
                    : 'bg-orange-100 text-orange-600'
                  : isDark
                    ? 'text-zinc-500 hover:text-orange-400 hover:bg-orange-500/10'
                    : 'text-orange-950/60 hover:text-orange-600 hover:bg-orange-100/60'
              }`}
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>

            {/* Playlist Dropdown */}
          {isPlaylistOpen && (
            <div className={`absolute bottom-full mb-2 right-0 w-48 max-w-[calc(100vw-3rem)] p-2 rounded-xl border shadow-2xl z-50 animate-in fade-in duration-100 ${
              isDark 
                ? 'bg-zinc-950 border-zinc-800 text-zinc-200 shadow-black/80' 
                : 'bg-white border-orange-200 text-orange-950 shadow-orange-500/10'
            }`}>
              {/* Dropdown Header */}
              <div className="flex items-center justify-between px-1 pb-1.5 border-b border-inherit mb-1">
                <span className={`text-[10px] font-bold ${isDark ? 'text-zinc-400' : 'text-orange-900'}`}>Add to Playlist</span>
              </div>

              {/* Playlists List */}
              <div className="max-h-36 overflow-y-auto space-y-0.5 custom-scrollbar py-1">
                {loadingPlaylists ? (
                  <div className="p-3 text-center">
                    <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-orange-500" />
                  </div>
                ) : playlists.length === 0 ? (
                  <div className={`p-2 text-center text-[10px] ${isDark ? 'text-zinc-500' : 'text-orange-950/50'}`}>No playlists yet</div>
                ) : (
                  playlists.map((pl) => {
                    const isAdded = addedPlaylistId === pl.id;
                    const isAlreadyIn = pl.videoIds?.includes(videoId);

                    return (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => handleAddToPlaylist(pl.id)}
                        disabled={isAlreadyIn}
                        className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg text-left transition select-none ${
                          isAlreadyIn
                            ? isDark ? 'text-zinc-600 bg-zinc-900/40 cursor-default' : 'text-orange-300 bg-orange-50 cursor-default'
                            : isDark 
                              ? 'text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 cursor-pointer' 
                              : 'text-orange-950 hover:bg-orange-50 hover:text-orange-600 cursor-pointer'
                        }`}
                      >
                        <span className="truncate flex-1 font-medium">{pl.name}</span>
                        {isAdded ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : isAlreadyIn ? (
                          <span className={`text-[9px] ${isDark ? 'text-zinc-600' : 'text-orange-400'}`}>Added</span>
                        ) : (
                          <Plus className="w-3.5 h-3.5 opacity-40 shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Create New Playlist Form */}
              <form onSubmit={handleCreatePlaylist} className="flex gap-1 pt-1.5 border-t border-inherit">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="New playlist..."
                  className={`flex-1 rounded-lg px-2 py-1 text-[10px] outline-none border transition ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:border-orange-500' 
                      : 'bg-orange-50/50 border-orange-200 text-orange-950 placeholder-orange-400 focus:border-orange-500'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isCreatingPlaylist || !newPlaylistName.trim()}
                  className="btn-primary px-2.5 py-1 text-[10px] shrink-0 font-bold"
                >
                  {isCreatingPlaylist ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    'Add'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
