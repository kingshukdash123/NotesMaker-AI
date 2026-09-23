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
  Check,
  Clock,
  CheckCheck,
  RotateCcw,
  CircleDot,
  Pencil,
  X,
  Loader2,
  Layers
} from 'lucide-react';
import ThreeDotMenu from '../common/ThreeDotMenu';
import ActionModal from '../common/ActionModal';

export default function PlaylistsTab({
  playlists = [],
  savedVideos = [],
  isLoading = false,
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
  const { showConfirm, isAssistantOpen } = useApp();

  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );

  // Phone view: no playlist chosen by default (null). Desktop: default to first playlist.
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(() =>
    (typeof window !== 'undefined' && window.innerWidth >= 768) ? (playlists[0]?.id || null) : null
  );
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'videos'
  const [filter, setFilter] = useState('all'); // 'all' | 'unwatched' | 'watched'

  // Modal states
  const [playlistToRename, setPlaylistToRename] = useState(null);
  const [renameInput, setRenameInput] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [playlistToDelete, setPlaylistToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      <div className={`w-full md:w-64 lg:w-72 shrink-0 flex flex-col min-h-0 h-full rounded-2xl transition-colors ${mobileView === 'videos' ? 'hidden md:flex' : 'flex'
        } ${isDark ? 'bg-zinc-950/80 shadow-inner' : 'bg-white border border-zinc-200/80 shadow-xs'
        }`}>
        {/* Pinned Header */}
        <div className={`flex items-center justify-between p-3.5 pb-2.5 shrink-0 ${isDark ? 'border-b border-zinc-800/60' : 'border-b border-zinc-100'
          }`}>
          <div className="flex items-center gap-2">
            <ListVideo className="w-4 h-4 text-orange-500 shrink-0" />
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-zinc-800'
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
          {isLoading && playlists.length === 0 ? (
            <div className="p-1 space-y-2 animate-pulse">
              <div className={`h-8 rounded-xl ${isDark ? 'bg-zinc-900/60' : 'bg-zinc-100'}`} />
              <div className={`h-8 rounded-xl ${isDark ? 'bg-zinc-900/60' : 'bg-zinc-100'}`} />
              <div className={`h-8 rounded-xl ${isDark ? 'bg-zinc-900/60' : 'bg-zinc-100'}`} />
            </div>
          ) : playlists.length === 0 ? (
            <div className={`text-center py-8 px-3 rounded-xl text-xs space-y-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'
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
                  className={`group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer shrink-0 transition-all duration-150 ${isActive
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
                      <Folder className={`w-4 h-4 shrink-0 transition ${isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-zinc-400 group-hover:text-zinc-700'
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
                        onClick: (e) => {
                          if (e) e.stopPropagation();
                          setPlaylistToRename(pl);
                          setRenameInput(pl.name || '');
                        }
                      },
                      {
                        label: 'Delete',
                        icon: Trash2,
                        variant: 'danger',
                        onClick: (e) => {
                          if (e) e.stopPropagation();
                          setPlaylistToDelete(pl);
                        }
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
      <div className={`flex-1 min-w-0 h-full flex flex-col min-h-0 space-y-3 sm:space-y-4 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}>
        {activePlaylist ? (
          <>
            {/* Active Playlist Header & Completion Tracker Panel */}
            <div className={`px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl flex flex-col gap-3 shrink-0 transition-colors ${isDark ? 'bg-zinc-950/90 shadow-inner' : 'bg-white border border-zinc-200/80 shadow-xs'
              }`}>
              {/* Row 1: Playlist Name (Left) & Mobile Status / Desktop Mark All Button (Right) */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={handleBackToPlaylists}
                    className={`md:hidden p-1.5 -ml-1 rounded-xl transition flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer ${isDark
                        ? 'text-zinc-300 hover:text-white'
                        : 'text-zinc-700 hover:text-zinc-950'
                      }`}
                    title="Back to playlists"
                    aria-label="Back to playlists list"
                  >
                    <ArrowLeft className="w-4 h-4 text-orange-500" />
                  </button>

                  <h2
                    className={`text-base sm:text-lg font-bold truncate leading-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'
                      }`}
                    title={activePlaylist.name}
                  >
                    {activePlaylist.name}
                  </h2>
                </div>

                {/* Phone View: Status Block (Circle/% on left, Label + X of Y completed on right) */}
                <div className="flex sm:hidden items-center gap-2 shrink-0">
                  {totalCount === 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                          <circle
                            cx="22"
                            cy="22"
                            r="17"
                            className={`stroke-current fill-none ${isDark ? 'text-zinc-800' : 'text-zinc-200'}`}
                            strokeWidth="3.5"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                          <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>0</span>
                        </div>
                      </div>
                      <div className="flex flex-col text-left leading-tight">
                        <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                          Empty
                        </span>
                        <span className={`text-[10px] font-medium mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                          0 lectures
                        </span>
                      </div>
                    </div>
                  ) : isCompleted ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <Check className={`w-5 h-5 stroke-[3] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      </div>
                      <div className="flex flex-col text-left leading-tight">
                        <span className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          Completed
                        </span>
                        <span className={`text-[10px] font-medium mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                          {watchedCount} of {totalCount} completed
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                          <circle
                            cx="22"
                            cy="22"
                            r="17"
                            className={`stroke-current fill-none ${isDark ? 'text-zinc-800' : 'text-zinc-200'}`}
                            strokeWidth="3.5"
                          />
                          {totalCount > 0 && (
                            <circle
                              cx="22"
                              cy="22"
                              r="17"
                              className={`stroke-current fill-none transition-all duration-500 ease-out ${isInProgress ? 'text-orange-500' : 'text-zinc-400'
                                }`}
                              strokeWidth="3.5"
                              strokeDasharray={106.8}
                              strokeDashoffset={106.8 - (progressPercent / 100) * 106.8}
                              strokeLinecap="round"
                            />
                          )}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[8.5px] font-bold">
                          <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>
                            {progressPercent}%
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col text-left leading-tight">
                        <span className={`text-xs font-bold ${isInProgress
                            ? isDark ? 'text-amber-400' : 'text-amber-700'
                            : isDark ? 'text-zinc-400' : 'text-zinc-600'
                          }`}>
                          {isInProgress ? 'In Progress' : 'Not Started'}
                        </span>
                        <span className={`text-[10px] font-medium mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                          {watchedCount} of {totalCount} completed
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop View: Action Buttons on Extreme Right of Row 1 ("Mark All Watched" when in progress, "Reset Progress" when completed) */}
                {totalCount > 0 && (
                  <>
                    {!isCompleted ? (
                      <button
                        type="button"
                        disabled={isBulkLoading}
                        onClick={() => handleBulkToggle(true)}
                        className={`hidden sm:flex p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold items-center gap-1.5 transition cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-not-allowed ${isDark
                            ? 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-zinc-100'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                          }`}
                        title="Mark all videos as watched"
                        aria-label="Mark all videos as watched"
                      >
                        {isBulkLoading ? (
                          <Loader2 className={`w-3.5 h-3.5 animate-spin ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        ) : (
                          <CheckCheck className={`w-3.5 h-3.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        )}
                        <span>{isBulkLoading ? 'Updating...' : 'Mark All Watched'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBulkLoading}
                        onClick={() => handleBulkToggle(false)}
                        className={`hidden sm:flex p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold items-center gap-1.5 transition cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-not-allowed ${isDark
                            ? 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                          }`}
                        title="Reset watched status for this playlist"
                        aria-label="Reset watched status"
                      >
                        {isBulkLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        <span>{isBulkLoading ? 'Resetting...' : 'Reset Progress'}</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Row 2: (Desktop: Status | Filters) | (Phone: Filters | Action Button) */}
              <div className={`${totalCount === 0 ? 'hidden sm:flex' : 'flex'} items-center justify-between gap-2 sm:gap-3 pt-2.5 border-t ${isDark ? 'border-zinc-800/80' : 'border-zinc-100'
                }`}>
                {/* Desktop Left: Detailed Status Indicator */}
                <div className="hidden sm:flex items-center gap-2.5 sm:gap-3 min-w-0 shrink">
                  {isCompleted ? (
                    /* For full complete: only a clean tick without circle ring */
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      <Check className={`w-7 h-7 stroke-[3] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                  ) : (
                    /* Circular progress for in progress / not started */
                    <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                        <circle
                          cx="22"
                          cy="22"
                          r="17"
                          className={`stroke-current fill-none ${isDark ? 'text-zinc-800' : 'text-zinc-200'
                            }`}
                          strokeWidth="3.5"
                        />
                        {totalCount > 0 && (
                          <circle
                            cx="22"
                            cy="22"
                            r="17"
                            className={`stroke-current fill-none transition-all duration-500 ease-out ${isInProgress
                                ? 'text-orange-500'
                                : 'text-zinc-400'
                              }`}
                            strokeWidth="3.5"
                            strokeDasharray={106.8}
                            strokeDashoffset={106.8 - (progressPercent / 100) * 106.8}
                            strokeLinecap="round"
                          />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                        {totalCount === 0 ? (
                          <span className={isDark ? 'text-zinc-600' : 'text-zinc-400'}>0</span>
                        ) : (
                          <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>
                            {progressPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status label and count */}
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs font-bold leading-tight truncate ${totalCount === 0
                        ? isDark ? 'text-zinc-200' : 'text-zinc-800'
                        : isCompleted
                          ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                          : isInProgress
                            ? isDark ? 'text-amber-400' : 'text-amber-700'
                            : isDark ? 'text-zinc-400' : 'text-zinc-600'
                      }`}>
                      {totalCount === 0 ? 'Empty' : isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
                    </span>
                    <span className={`text-[11px] font-medium leading-tight mt-0.5 truncate ${isDark ? 'text-zinc-500' : 'text-zinc-500'
                      }`}>
                      {totalCount === 0 ? '0 lectures' : `${watchedCount} of ${totalCount} completed`}
                    </span>
                  </div>
                </div>

                {/* Phone View Left: Category Filter Text Buttons (in place of status) */}
                {totalCount > 0 && (
                  <div className={`sm:hidden flex items-center p-0.5 rounded-xl text-[11px] font-bold ${isDark ? 'bg-zinc-900/90' : 'bg-zinc-100'
                    }`}>
                    <button
                      type="button"
                      onClick={() => setFilter('all')}
                      className={`px-2 py-1 rounded-lg transition cursor-pointer ${filter === 'all'
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
                      className={`px-2 py-1 rounded-lg transition cursor-pointer ${filter === 'unwatched'
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
                      className={`px-2 py-1 rounded-lg transition cursor-pointer ${filter === 'watched'
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
                )}

                {/* Phone View Right: Action Button (Mark All when not completed, Reset when completed) */}
                {totalCount > 0 && (
                  <div className="flex sm:hidden items-center shrink-0">
                    {!isCompleted ? (
                      <button
                        type="button"
                        disabled={isBulkLoading}
                        onClick={() => handleBulkToggle(true)}
                        className={`p-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${isDark
                            ? 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-zinc-100'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                          }`}
                        title="Mark all videos as watched"
                        aria-label="Mark all videos as watched"
                      >
                        {isBulkLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                        ) : (
                          <CheckCheck className="w-4 h-4 text-green-400" />
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBulkLoading}
                        onClick={() => handleBulkToggle(false)}
                        className={`p-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${isDark
                            ? 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                          }`}
                        title="Reset watched status for this playlist"
                        aria-label="Reset watched status"
                      >
                        {isBulkLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                        ) : (
                          <RotateCcw className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Desktop View Right: Category Filter Tabs */}
                {totalCount > 0 && (
                  <div className="hidden sm:flex items-center gap-2 shrink-0 justify-end">
                    {/* Filter Tabs */}
                    <div className={`flex items-center p-0.5 rounded-xl text-[11px] font-bold shrink-0 ${isDark ? 'bg-zinc-900/90' : 'bg-zinc-100'
                      }`}>
                      <button
                        type="button"
                        onClick={() => setFilter('all')}
                        title={`All lectures (${totalCount})`}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filter === 'all'
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
                        title={`Unwatched lectures (${remainingCount})`}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filter === 'unwatched'
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
                        title={`Watched lectures (${watchedCount})`}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filter === 'watched'
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
                )}
              </div>
            </div>

            {/* Only Video Grid is Scrollable! */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
              {playlistVideos.length === 0 ? (
                <div className={`text-center py-16 rounded-2xl flex flex-col items-center justify-center gap-2.5 p-6 border ${isDark ? 'bg-zinc-950/40 border-zinc-900 text-zinc-400' : 'bg-white border-zinc-200/80 text-zinc-600 shadow-xs'
                  }`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-100 text-zinc-400'
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
                <div className={`text-center py-16 rounded-2xl flex flex-col items-center justify-center gap-2.5 p-6 border ${isDark ? 'bg-zinc-950/40 border-zinc-900 text-zinc-400' : 'bg-white border-zinc-200/80 text-zinc-600 shadow-xs'
                  }`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-zinc-900 text-green-400' : 'bg-green-50 text-green-700'
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
                <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 ${
                  isAssistantOpen
                    ? 'lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3'
                    : 'lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4'
                } gap-4 sm:gap-5`}>
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
          <div className={`text-center py-16 rounded-2xl flex flex-col items-center justify-center gap-2 p-6 border ${isDark ? 'bg-zinc-950/40 border-zinc-900 text-zinc-400' : 'bg-white border-zinc-200/80 text-zinc-600 shadow-xs'
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

      {/* Reusable Rename Playlist Modal */}
      <ActionModal
        isOpen={Boolean(playlistToRename)}
        onClose={() => setPlaylistToRename(null)}
        title="Rename Playlist"
        icon={Pencil}
        confirmText="Save Name"
        loadingText="Saving..."
        isLoading={isRenaming}
        isSubmitDisabled={!renameInput.trim()}
        onSubmit={async () => {
          if (!playlistToRename || !renameInput.trim()) return;
          setIsRenaming(true);
          try {
            await onRenamePlaylist?.(playlistToRename.id, renameInput.trim());
            setPlaylistToRename(null);
          } catch (err) {
            console.error('Failed to rename playlist:', err);
          } finally {
            setIsRenaming(false);
          }
        }}
      >
        <div className="space-y-1.5">
          <label className={`block text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
            Playlist Name
          </label>
          <input
            type="text"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            placeholder="e.g. Web Development, Physics"
            className={`w-full rounded-xl px-3 py-2 text-xs transition focus:outline-none focus:border-orange-500 ${
              isDark
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500'
                : 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:bg-white'
            }`}
            required
            maxLength={40}
            autoFocus
          />
        </div>
      </ActionModal>

      {/* Reusable Delete Playlist Confirmation Modal */}
      <ActionModal
        isOpen={Boolean(playlistToDelete)}
        onClose={() => setPlaylistToDelete(null)}
        title="Delete Playlist"
        icon={Trash2}
        iconColor="text-red-500"
        confirmText="Delete"
        confirmVariant="danger"
        loadingText="Deleting..."
        isLoading={isDeleting}
        onSubmit={async () => {
          if (!playlistToDelete) return;
          setIsDeleting(true);
          try {
            await onDeletePlaylist?.(playlistToDelete.id);
            if (activePlaylistId === playlistToDelete.id) {
              const remaining = playlists.filter(p => p.id !== playlistToDelete.id);
              setSelectedPlaylistId(isDesktop ? (remaining[0]?.id || null) : null);
              setMobileView('list');
            }
            setPlaylistToDelete(null);
          } catch (err) {
            console.error('Failed to delete playlist:', err);
          } finally {
            setIsDeleting(false);
          }
        }}
      >
        <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Are you sure you want to delete <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>"{playlistToDelete?.name || 'this playlist'}"</span>? All videos will be removed from this playlist.
        </p>
      </ActionModal>
    </div>
  );
}


