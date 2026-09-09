import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import LibraryVideoCard from './LibraryVideoCard';
import { 
  Folder, 
  FolderOpen, 
  Plus, 
  Trash2, 
  BookOpen, 
  ListVideo, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  CheckCheck, 
  RotateCcw, 
  CircleDot, 
  Pencil, 
  X, 
  Loader2 
} from 'lucide-react';
import ThreeDotMenu from '../common/ThreeDotMenu';

export default function PlaylistsTab({ 
  playlists = [], 
  savedVideos = [],
  onCreatePlaylistOpen,
  onDeletePlaylist,
  onOpenVideo,
  onRemoveVideo,
  onTogglePlaylistAssociation,
  onCreatePlaylist,
  onToggleSave,
  onToggleVideoWatched,
  onSetAllVideosWatched,
  onRenamePlaylist
}) {
  const { isDark } = useTheme();
  const { showConfirm } = useApp();

  const [isDesktop, setIsDesktop] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );

  // Phone view: no playlist chosen by default (null). Desktop: default to first playlist.
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(() => 
    (typeof window !== 'undefined' && window.innerWidth >= 768) ? (playlists[0]?.id || null) : null
  );
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'videos'
  const [filter, setFilter] = useState('all'); // 'all' | 'unwatched' | 'watched'

  // Rename modal state
  const [playlistToRename, setPlaylistToRename] = useState(null);
  const [renameInput, setRenameInput] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Loading states for async watched status updates (no immediate optimistic update)
  const [togglingVideoIds, setTogglingVideoIds] = useState(() => new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      // If switching to desktop and nothing was chosen, select first playlist
      if (desktop && !selectedPlaylistId && playlists.length > 0) {
        setSelectedPlaylistId(playlists[0].id);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedPlaylistId, playlists]);

  // Reset filter when switching playlists
  useEffect(() => {
    setFilter('all');
  }, [selectedPlaylistId]);

  // On desktop: fallback to first playlist if valid. On phone: respect null (no default selection)
  const activePlaylistId = selectedPlaylistId && playlists.some(pl => pl.id === selectedPlaylistId)
    ? selectedPlaylistId
    : (isDesktop ? (playlists[0]?.id || null) : null);

  const activePlaylist = playlists.find(pl => pl.id === activePlaylistId);

  // Directly use the videos array belonging to the active playlist
  const playlistVideos = activePlaylist?.videos || [];

  // Computed metrics for active playlist
  const totalCount = playlistVideos.length;
  const watchedCount = playlistVideos.filter((v) => Boolean(v.watched)).length;
  const remainingCount = Math.max(0, totalCount - watchedCount);
  const progressPercent = totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0;
  const isCompleted = totalCount > 0 && watchedCount === totalCount;
  const isInProgress = watchedCount > 0 && watchedCount < totalCount;

  // Filtered videos for grid display
  const displayedVideos = playlistVideos.filter((v) => {
    if (filter === 'watched') return Boolean(v.watched);
    if (filter === 'unwatched') return !v.watched;
    return true;
  });

  const handleDeletePlaylist = async (id, e) => {
    if (e) e.stopPropagation();
    const confirmed = await showConfirm('Are you sure you want to delete this playlist? All videos inside will be removed from this playlist.');
    if (confirmed) {
      await onDeletePlaylist(id);
      if (activePlaylistId === id) {
        const remaining = playlists.filter(p => p.id !== id);
        setSelectedPlaylistId(isDesktop ? (remaining[0]?.id || null) : null);
        setMobileView('list');
      }
    }
  };

  const handleOpenRename = (pl) => {
    setPlaylistToRename(pl);
    setRenameInput(pl.name);
  };

  const handleSaveRename = async (e) => {
    e.preventDefault();
    if (!playlistToRename || !renameInput.trim() || isRenaming) return;
    setIsRenaming(true);
    try {
      if (onRenamePlaylist) {
        await onRenamePlaylist(playlistToRename.id, renameInput.trim());
      }
      setPlaylistToRename(null);
      setRenameInput('');
    } catch (err) {
      console.error('Failed to rename playlist:', err);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleVideoWatchedToggle = async (video) => {
    if (togglingVideoIds.has(video.videoId) || !activePlaylist) return;
    setTogglingVideoIds((prev) => new Set(prev).add(video.videoId));
    try {
      await onToggleVideoWatched?.(activePlaylist.id, video.videoId, !video.watched);
    } finally {
      setTogglingVideoIds((prev) => {
        const next = new Set(prev);
        next.delete(video.videoId);
        return next;
      });
    }
  };

  const handleBulkToggle = async (isWatched) => {
    if (isBulkLoading || !activePlaylist) return;
    setIsBulkLoading(true);
    try {
      await onSetAllVideosWatched?.(activePlaylist.id, isWatched);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleSelectPlaylist = (id) => {
    setSelectedPlaylistId(id);
    setMobileView('videos');
  };

  const handleBackToPlaylists = () => {
    setMobileView('list');
    setSelectedPlaylistId(null);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-5 lg:gap-6 items-stretch min-h-0 h-full overflow-hidden animate-in fade-in duration-300">
      
      {/* Playlists Left Navigation Sidebar Panel (Border removed) */}
      <div className={`w-full md:w-64 lg:w-72 shrink-0 flex flex-col min-h-0 h-full rounded-2xl transition-colors ${
        mobileView === 'videos' ? 'hidden md:flex' : 'flex'
      } ${
        isDark ? 'bg-zinc-950/80 shadow-inner' : 'bg-white border border-zinc-200/80 shadow-xs'
      }`}>
        {/* Pinned Header */}
        <div className={`flex items-center justify-between p-3.5 pb-2.5 shrink-0 ${
          isDark ? 'border-b border-zinc-800/60' : 'border-b border-zinc-100'
        }`}>
          <div className="flex items-center gap-2">
            <ListVideo className="w-4 h-4 text-orange-500 shrink-0" />
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-zinc-300' : 'text-zinc-800'
            }`}>
              Playlists
            </span>
          </div>

          <button
            type="button"
            onClick={onCreatePlaylistOpen}
            className="btn-primary px-2.5 py-1 !rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Create New Playlist"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>New</span>
          </button>
        </div>

        {/* Separately Scrollable Playlist List (No borders on items) */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {playlists.length === 0 ? (
            <div className={`text-center py-8 px-3 rounded-xl text-xs space-y-1 ${
              isDark ? 'text-zinc-500' : 'text-zinc-400'
            }`}>
              <Folder className="w-6 h-6 mx-auto opacity-40 mb-1" />
              <p className="font-semibold">No playlists created yet</p>
              <p className="text-[11px] opacity-75">Click "New" above to organize your lectures.</p>
            </div>
          ) : (
            playlists.map((pl) => {
              const isActive = activePlaylistId === pl.id;

              return (
                <div
                  key={pl.id}
                  onClick={() => handleSelectPlaylist(pl.id)}
                  title={pl.name}
                  className={`group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer shrink-0 transition-all duration-150 ${
                    isActive 
                      ? isDark 
                        ? 'bg-zinc-900 text-zinc-100 font-bold shadow-xs' 
                        : 'bg-zinc-100 text-zinc-900 font-bold shadow-2xs'
                      : isDark
                        ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {isActive ? (
                      <FolderOpen className={`w-4 h-4 shrink-0 ${isDark ? 'text-zinc-200' : 'text-orange-500'}`} />
                    ) : (
                      <Folder className={`w-4 h-4 shrink-0 transition ${
                        isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-zinc-400 group-hover:text-orange-500'
                      }`} />
                    )}
                    <span className="truncate flex-1 min-w-0 font-semibold leading-tight">
                      {pl.name}
                    </span>
                  </div>

                  {/* Reusable 3-Dot Options Menu */}
                  <ThreeDotMenu
                    items={[
                      {
                        label: 'Rename',
                        icon: Pencil,
                        onClick: () => handleOpenRename(pl)
                      },
                      {
                        label: 'Delete',
                        icon: Trash2,
                        variant: 'danger',
                        onClick: (e) => handleDeletePlaylist(pl.id, e)
                      }
                    ]}
                    title="Playlist options"
                    ariaLabel="Playlist options"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Playlist Videos Content Pane (Toggled on Mobile) */}
      <div className={`flex-1 min-w-0 h-full flex flex-col min-h-0 space-y-3 sm:space-y-4 ${
        mobileView === 'list' ? 'hidden md:flex' : 'flex'
      }`}>
        {activePlaylist ? (
          <>
            {/* Active Playlist Header & Completion Tracker Panel (Border removed) */}
            <div className={`px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl flex flex-col gap-3 shrink-0 transition-colors ${
              isDark ? 'bg-zinc-950/90 shadow-inner' : 'bg-white border border-zinc-200/80 shadow-xs'
            }`}>
              {/* Top Row: Title, Status Badge (with count & without border), Bulk Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Mobile Back Button to choose another playlist */}
                  <button
                    type="button"
                    onClick={handleBackToPlaylists}
                    className={`md:hidden p-1.5 -ml-1 rounded-xl transition flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer ${
                      isDark
                        ? 'text-zinc-300 hover:text-white'
                        : 'text-zinc-700 hover:text-zinc-950'
                    }`}
                    title="Back to playlists"
                    aria-label="Back to playlists list"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-orange-500" />
                  </button>

                  <h2 className={`text-base sm:text-lg font-bold truncate leading-snug ${
                    isDark ? 'text-zinc-100' : 'text-zinc-900'
                  }`} title={activePlaylist.name}>
                    {activePlaylist.name}
                  </h2>

                  {/* Status Badge: video count & watched count inside, WITHOUT border */}
                  {totalCount === 0 ? (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                      isDark ? 'bg-zinc-900 text-zinc-500' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      Empty
                    </span>
                  ) : isCompleted ? (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                      isDark ? 'bg-green-950/80 text-green-400' : 'bg-green-100 text-green-800'
                    }`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-green-400' : 'text-green-700'}`} />
                      <span>Completed</span>
                    </span>
                  ) : isInProgress ? (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                      isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-800'
                    }`}>
                      <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-amber-500' : 'text-amber-700'}`} />
                      <span>In Progress</span>
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                      isDark ? 'bg-zinc-800/80 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      <CircleDot className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Not Started</span>
                    </span>
                  )}
                </div>

                {/* Bulk Action Button */}
                {totalCount > 0 && (
                  <div className="flex items-center gap-2 shrink-0">
                    {!isCompleted ? (
                      <button
                        type="button"
                        disabled={isBulkLoading}
                        onClick={() => handleBulkToggle(true)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                          isDark
                            ? 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-zinc-100'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                        }`}
                        title="Mark all videos as watched"
                      >
                        {isBulkLoading ? (
                          <Loader2 className={`w-3.5 h-3.5 animate-spin ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        ) : (
                          <CheckCheck className={`w-3.5 h-3.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        )}
                        <span className="hidden sm:inline">
                          {isBulkLoading ? 'Updating...' : 'Mark All Watched'}
                        </span>
                        <span className="sm:hidden">
                          {isBulkLoading ? 'Updating...' : 'All Done'}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBulkLoading}
                        onClick={() => handleBulkToggle(false)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                          isDark
                            ? 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                        }`}
                        title="Reset watched status for this playlist"
                      >
                        {isBulkLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        <span>{isBulkLoading ? 'Resetting...' : 'Reset Progress'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Second Row: Progress Bar & Filter Tabs */}
              {totalCount > 0 && (
                <div className="space-y-2 pt-0.5">
                  {/* Slim Animated Progress Bar */}
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                    isDark ? 'bg-zinc-900' : 'bg-zinc-100'
                  }`}>
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 shadow-xs shadow-green-700/30'
                          : 'bg-gradient-to-r from-orange-500 to-amber-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Clean Bottom Row: Progress percentage on left, Filter tabs on right */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className={`font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {isCompleted ? (
                        <span className={`font-semibold flex items-center gap-1 ${
                          isDark ? 'text-green-400' : 'text-green-800'
                        }`}>
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-green-400' : 'text-green-700'}`} /> All lectures completed
                        </span>
                      ) : (
                        <span>{progressPercent}% completed</span>
                      )}
                    </span>

                    {/* Filter Tabs: All, Unwatched, Watched */}
                    <div className={`flex items-center p-0.5 rounded-lg border text-[11px] font-bold ${
                      isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-100 border-zinc-200/80'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                          filter === 'all'
                            ? isDark
                              ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                              : 'bg-white text-zinc-900 shadow-xs'
                            : isDark
                              ? 'text-zinc-500 hover:text-zinc-300'
                              : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >
                        All ({totalCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilter('unwatched')}
                        className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                          filter === 'unwatched'
                            ? isDark
                              ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                              : 'bg-white text-zinc-900 shadow-xs'
                            : isDark
                              ? 'text-zinc-500 hover:text-zinc-300'
                              : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >
                        Unwatched ({remainingCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilter('watched')}
                        className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                          filter === 'watched'
                            ? isDark
                              ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                              : 'bg-white text-zinc-900 shadow-xs'
                            : isDark
                              ? 'text-zinc-500 hover:text-zinc-300'
                              : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >
                        Watched ({watchedCount})
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Only Video Grid is Scrollable! */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
              {playlistVideos.length === 0 ? (
                <div className={`text-center py-16 rounded-2xl flex flex-col items-center justify-center gap-2.5 p-6 border ${
                  isDark ? 'bg-zinc-950/40 border-zinc-900 text-zinc-400' : 'bg-white border-zinc-200/80 text-zinc-600 shadow-xs'
                }`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isDark ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <p className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
                      This playlist is currently empty
                    </p>
                    <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      Browse lectures in the Discover tab and click the three-dots menu or playlist icon to add videos to "{activePlaylist.name}".
                    </p>
                  </div>
                </div>
              ) : displayedVideos.length === 0 ? (
                <div className={`text-center py-16 rounded-2xl flex flex-col items-center justify-center gap-2.5 p-6 border ${
                  isDark ? 'bg-zinc-950/40 border-zinc-900 text-zinc-400' : 'bg-white border-zinc-200/80 text-zinc-600 shadow-xs'
                }`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isDark ? 'bg-zinc-900 text-green-400' : 'bg-green-50 text-green-700'
                  }`}>
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <p className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
                      No {filter} lectures found
                    </p>
                    <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      {filter === 'unwatched'
                        ? 'Congratulations! You have completed all lectures in this playlist.'
                        : 'No lectures have been marked as watched yet. Click the checkbox on any video to mark it watched.'}
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className="btn-secondary text-xs px-3 py-1 cursor-pointer"
                      >
                        Show All Lectures ({totalCount})
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {displayedVideos.map((video) => (
                    <LibraryVideoCard
                      key={video.videoId}
                      video={video}
                      playlists={playlists}
                      onOpen={() => onOpenVideo(video)}
                      onDelete={() => onTogglePlaylistAssociation(video.videoId, activePlaylist.id, true, video)}
                      onAddToPlaylist={onTogglePlaylistAssociation}
                      onCreatePlaylist={onCreatePlaylist}
                      onSave={() => onToggleSave(video)}
                      isSaved={savedVideos.some(v => v.videoId === video.videoId)}
                      showCheckbox={true}
                      isWatched={Boolean(video.watched)}
                      isLoadingWatched={togglingVideoIds.has(video.videoId)}
                      onToggleWatched={() => handleVideoWatchedToggle(video)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={`text-center py-16 rounded-2xl flex flex-col items-center justify-center gap-2 p-6 border ${
            isDark ? 'bg-zinc-950/40 border-zinc-900 text-zinc-400' : 'bg-white border-zinc-200/80 text-zinc-600 shadow-xs'
          }`}>
            <FolderOpen className="w-8 h-8 text-orange-500 opacity-60" />
            <p className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
              No playlist selected
            </p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Select a playlist from the left or create a new one to view and manage its lectures.
            </p>
          </div>
        )}
      </div>

      {/* Rename Playlist Modal */}
      {playlistToRename && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[160] flex items-center justify-center p-4">
          <div className={`relative max-w-sm w-full rounded-2xl p-5 shadow-2xl border ${
            isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <button
              type="button"
              onClick={() => setPlaylistToRename(null)}
              className={`absolute right-4 top-4 p-1.5 rounded-lg transition cursor-pointer ${
                isDark ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className={`space-y-1 pb-3 border-b mb-4 ${isDark ? 'border-zinc-800/80' : 'border-zinc-100'}`}>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Pencil className="w-4 h-4 text-orange-500" />
                Rename Playlist
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Enter a new name for your playlist.
              </p>
            </div>

            <form onSubmit={handleSaveRename} className="space-y-4">
              <div className="space-y-1.5">
                <label className={`block text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  Playlist Name
                </label>
                <input
                  type="text"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  placeholder="e.g. Web Development, Physics"
                  className={`w-full rounded-xl px-3 py-2 text-xs transition focus:outline-none ${
                    isDark
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 focus:border-orange-500'
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-900 focus:border-orange-500'
                  }`}
                  required
                  maxLength={40}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPlaylistToRename(null)}
                  className="btn-secondary text-xs px-3 py-1.5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!renameInput.trim() || isRenaming}
                  className="btn-primary text-xs px-4 py-1.5 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isRenaming ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Name</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


