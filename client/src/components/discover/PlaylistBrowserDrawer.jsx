import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Folder, ArrowLeft, Loader2, FolderPlus, User } from 'lucide-react';
import YouTubeIcon from '../common/YouTubeIcon';
import { fetchYouTubePlaylistItems } from '../../services/server/api';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import Skeleton from '../common/Skeleton';
import DrawerVideoCard from './DrawerVideoCard';
import { normalizeVideoMetadata } from '../../models';

export default function PlaylistBrowserDrawer({
  isOpen,
  playlistId,
  playlistSummary = null,
  userPlaylists = [],
  savedVideos = [],
  onClose,
  onBack,
  onVideoSelect,
  onSaveToLibrary,
  onSaveVideo,
  onTogglePlaylistAssociation,
  onCreatePlaylist
}) {
  const { isDark } = useTheme();
  const { openChannelExplorer } = useApp() || {};
  const drawerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [playlist, setPlaylist] = useState(null);
  const [videos, setVideos] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Manage smooth mount/unmount and opening/closing animation lifecycle matching Orbit sidebar
  useEffect(() => {
    let animFrame;
    if (isOpen) {
      setShouldRender(true);
      animFrame = requestAnimationFrame(() => {
        animFrame = requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!playlistId) {
      setPlaylist(null);
      setVideos([]);
      setTotalResults(0);
      setIsLoading(false);
      setError('');
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setPlaylist(null);
    setIsLoadingMore(false);
    setError('');
    setIsSaved(false);
    setIsSaving(false);
    setVideos([]);
    setNextPageToken(null);
    setTotalResults(0);

    fetchYouTubePlaylistItems(playlistId)
      .then((data) => {
        if (isMounted) {
          setPlaylist(data);
          const loadedVideos = data?.videos || (Array.isArray(data?.items) ? data.items : []);
          setVideos(loadedVideos);
          setNextPageToken(data?.nextPageToken || null);
          setTotalResults(data?.totalResults || loadedVideos.length || 0);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to fetch playlist items:', err);
          setError(err.message || 'Could not load playlist lectures. Please try again.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, playlistId]);

  const handleLoadMore = useCallback(async () => {
    if (!playlistId || !nextPageToken || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const data = await fetchYouTubePlaylistItems(playlistId, nextPageToken);
      const newVideos = data?.videos || (Array.isArray(data?.items) ? data.items : []);
      setVideos((prev) => [...prev, ...newVideos]);
      setNextPageToken(data?.nextPageToken || null);
      if (data?.totalResults) setTotalResults(data.totalResults);
    } catch (err) {
      console.error('Failed to load next playlist page:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [playlistId, nextPageToken, isLoadingMore]);

  if (!shouldRender) return null;

  const displayTitle = playlist?.title || playlistSummary?.title || 'Course Playlist';
  const displayChannel = playlist?.channel || playlistSummary?.channel || 'YouTube Creator';
  const displayYoutubeUrl = playlistId ? `https://www.youtube.com/playlist?list=${playlistId}` : '';

  // Check if this playlist is already saved in the user's library
  const isAlreadyInLibrary = Boolean(
    userPlaylists && userPlaylists.some((pl) => {
      // 1. YouTube / Source Playlist ID match
      if (playlistId && (pl.sourcePlaylistId === playlistId || pl.youtubePlaylistId === playlistId || pl.id === playlistId)) {
        return true;
      }

      return false;
    })
  );

  const isPlaylistSaved = isSaved || isAlreadyInLibrary;

  const handleSave = async () => {
    if (!onSaveToLibrary || isPlaylistSaved || isSaving) return;
    setIsSaving(true);
    try {
      await onSaveToLibrary(
        { ...(playlist || {}), ...(playlistSummary || {}), title: displayTitle, channel: displayChannel, playlistId },
        videos
      );
      setIsSaved(true);
    } catch (err) {
      console.error('Failed to save playlist to library:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Content Area Backdrop with smooth fade (doesn't cover chat sidebar or header) */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-[1px] z-30 transition-opacity duration-300 ease-in-out ${
          isAnimating ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer Panel constrained to the content area */}
      <div
        ref={drawerRef}
        className={`absolute top-0 bottom-0 right-0 w-full max-w-xl h-full z-40 flex flex-col shrink-0 overflow-hidden border-l transition-all duration-300 ease-in-out ${
          isAnimating
            ? 'translate-x-0 opacity-100 border-l animate-chat-sidebar'
            : 'translate-x-full opacity-0 pointer-events-none border-l-0'
        } ${
          isDark
            ? 'border-zinc-900/90 bg-zinc-950 text-zinc-100'
            : 'border-zinc-200 bg-white text-zinc-900 shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header - Title & Actions on top row, Channel & Count vertically aligned below title */}
        <div className={`p-3.5 sm:p-5 border-b ${
          isDark ? 'border-zinc-900/90 bg-zinc-950' : 'border-zinc-200 bg-white'
        }`}>
          {isLoading && !playlist?.title && !playlistSummary?.title ? (
            <div className="flex items-start justify-between gap-2.5 min-w-0">
              <div className="flex items-start gap-1.5 min-w-0 flex-1">
                <Skeleton className="w-7 h-7 rounded-lg shrink-0 -ml-1 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <Skeleton className="h-5 sm:h-6 w-3/4 rounded-md" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="w-3.5 h-3.5 rounded-full" />
                    <Skeleton className="h-3.5 w-28 rounded" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 -mr-1 -mt-1">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="w-8 h-8 rounded-lg" />
                <button
                  type="button"
                  onClick={onClose}
                  className={`p-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                  }`}
                  aria-label="Close drawer"
                  title="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2.5 min-w-0">
              {/* Left Column: Back Button + (Title & Channel Vertically Aligned Stack) */}
              <div className="flex items-start gap-1.5 min-w-0 flex-1">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={onBack || onClose}
                  className={`p-1.5 rounded-lg transition shrink-0 cursor-pointer -ml-1 mt-0.5 ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                  }`}
                  aria-label="Back"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>

                {/* Vertical Stack: Title and Channel Name share identical left starting position */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h2
                    title={displayTitle}
                    className={`text-sm sm:text-base md:text-lg font-bold line-clamp-2 leading-snug ${
                      isDark ? 'text-zinc-100' : 'text-zinc-900'
                    }`}
                  >
                    {displayTitle}
                  </h2>

                  {/* Channel Name & Video Count (Vertically aligned with Title start) */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      onClick={() => {
                        const chId = playlist?.channelId || playlistSummary?.channelId || '';
                        if (openChannelExplorer) {
                          openChannelExplorer(chId, displayChannel);
                        }
                      }}
                      className="flex items-center gap-1.5 min-w-0 cursor-pointer group/channel inline-flex"
                      title={`Explore channel: ${displayChannel}`}
                    >
                      <User className={`w-3.5 h-3.5 shrink-0 transition-colors ${isDark ? 'text-zinc-500 group-hover/channel:text-zinc-200' : 'text-zinc-400 group-hover/channel:text-zinc-700'}`} />
                      <p
                        title={displayChannel}
                        className={`text-xs font-medium truncate max-w-[180px] sm:max-w-[280px] transition-colors ${
                          isDark ? 'text-zinc-400 group-hover/channel:text-zinc-200 group-hover/channel:underline' : 'text-zinc-500 group-hover/channel:text-zinc-900 group-hover/channel:underline'
                        }`}
                      >
                        {displayChannel}
                      </p>
                    </div>
                    {videos.length > 0 && (
                      <>
                        <span className={`text-xs select-none ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`}>•</span>
                        <span className={`text-xs font-medium shrink-0 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {totalResults > videos.length ? `${videos.length} of ${totalResults}` : videos.length} videos
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Cluster: Add Playlist / Save Icon, YouTube Link Icon, then Close Cross */}
              <div className="flex items-center gap-1 shrink-0 -mr-1 -mt-1">
                {onSaveToLibrary && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPlaylistSaved || isSaving || isLoading}
                    className={`p-1.5 rounded-lg transition select-none flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-default ${
                      isPlaylistSaved
                        ? isDark
                          ? 'text-zinc-100 hover:text-white hover:bg-zinc-800/60'
                          : 'text-zinc-900 hover:text-black hover:bg-zinc-100'
                        : isSaving
                          ? 'opacity-80 cursor-wait'
                          : isDark
                            ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                            : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                    title={isSaving ? 'Adding...' : isPlaylistSaved ? 'Saved to Library' : 'Save Playlist to Library'}
                    aria-label={isPlaylistSaved ? 'Saved to Library' : 'Save Playlist to Library'}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                    ) : (
                      <FolderPlus className={`w-4 h-4 ${isPlaylistSaved ? 'fill-current' : ''}`} />
                    )}
                  </button>
                )}

                {/* YouTube Link Icon */}
                {displayYoutubeUrl && (
                  <a
                    href={displayYoutubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-1.5 rounded-lg transition-all flex items-center justify-center shrink-0 opacity-80 hover:opacity-100 ${
                      isDark
                        ? 'hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                        : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                    }`}
                    title="Open playlist on YouTube"
                    aria-label="Open playlist on YouTube"
                  >
                    <YouTubeIcon className="w-4 h-4 transition-transform hover:scale-110" />
                  </a>
                )}

                {/* Close Cross Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className={`p-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                  }`}
                  aria-label="Close drawer"
                  title="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Video List Body (YouTube Playlist Queue Style) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-3 space-y-1">
          {isLoading ? (
            <div className="space-y-1 p-1">
              {Array.from({ length: 7 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`p-1.5 sm:p-2.5 rounded-xl flex items-center gap-2 sm:gap-3 ${
                    isDark ? 'bg-zinc-900/30' : 'bg-zinc-100/60'
                  }`}
                >
                  {/* Index Number Skeleton */}
                  <div className="w-4 sm:w-5 flex justify-center shrink-0">
                    <Skeleton className="w-3.5 h-3.5 rounded" />
                  </div>

                  {/* Thumbnail Skeleton */}
                  <div className="relative w-24 min-[400px]:w-28 sm:w-32 aspect-video rounded-lg overflow-hidden shrink-0">
                    <Skeleton className="w-full h-full rounded-lg" />
                  </div>

                  {/* Metadata Details Skeleton */}
                  <div className="flex-1 min-w-0 pr-1 space-y-1.5">
                    <Skeleton className="h-3.5 sm:h-4 w-5/6 rounded" />
                    <Skeleton className="h-3.5 sm:h-4 w-1/2 rounded" />
                  </div>

                  {/* Action Buttons Skeleton */}
                  <div className="flex items-center gap-1 shrink-0 pr-1">
                    <Skeleton className="w-6 h-6 rounded-lg" />
                    <Skeleton className="w-6 h-6 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-3">
              <p className="text-xs text-red-500 font-medium">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  fetchYouTubePlaylistItems(playlistId)
                    .then((data) => {
                      setPlaylist(data);
                      const loadedVideos = data?.videos || (Array.isArray(data?.items) ? data.items : []);
                      setVideos(loadedVideos);
                      setNextPageToken(data?.nextPageToken || null);
                      setTotalResults(data?.totalResults || loadedVideos.length || 0);
                    })
                    .catch((err) => setError(err.message))
                    .finally(() => setIsLoading(false));
                }}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Retry
              </button>
            </div>
          ) : videos.length === 0 ? (
            <div className={`text-center py-12 space-y-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <Folder className="w-8 h-8 mx-auto opacity-40 mb-2" />
              <p className="text-xs font-semibold">No available public videos found</p>
              <p className="text-[11px]">This playlist may be empty, unlisted, or private.</p>
            </div>
          ) : (
            videos.map((vid, index) => {
              const norm = normalizeVideoMetadata(vid) || {};
              const vidId = norm.videoId;
              const isSaved = savedVideos.some(v => (v.videoId || v.id) === vidId);
              const assignedPlaylistIds = userPlaylists
                .filter(p => (p.videos || []).some(v => (v.videoId || v.id) === vidId))
                .map(p => p.id);
              norm.playlistIds = assignedPlaylistIds;

              return (
                <DrawerVideoCard
                  key={vidId || index}
                  video={norm}
                  index={index}
                  onSelect={onVideoSelect}
                  playlists={userPlaylists}
                  isSaved={isSaved}
                  onSave={onSaveVideo}
                  onAddToPlaylist={onTogglePlaylistAssociation}
                  onCreatePlaylist={onCreatePlaylist}
                />
              );
            })
          )}

          {/* Pagination: Load More Lectures Button */}
          {nextPageToken && (
            <div className="pt-2 pb-4 px-1">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  isDark
                    ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200 hover:text-white'
                    : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-900 hover:text-zinc-950 shadow-2xs'
                }`}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    <span>Loading more lectures...</span>
                  </>
                ) : (
                  <span>Load More Lectures</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
