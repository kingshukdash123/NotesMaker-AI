import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Folder, Play, Check, Loader2, FolderPlus, User } from 'lucide-react';
import { fetchYouTubePlaylistItems } from '../../services/server/api';
import { useTheme } from '../../context/ThemeContext';
import VideoActionButtons from '../common/VideoActionButtons';
import Skeleton from '../common/Skeleton';
import { normalizeVideoMetadata } from '../../models';

export default function PlaylistBrowserDrawer({
  isOpen,
  playlistId,
  playlistSummary = null,
  userPlaylists = [],
  savedVideos = [],
  onClose,
  onVideoSelect,
  onSaveToLibrary,
  onSaveVideo,
  onTogglePlaylistAssociation,
  onCreatePlaylist
}) {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [playlist, setPlaylist] = useState(null);
  const [videos, setVideos] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !playlistId) {
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
      setPlaylist(null);
      setVideos([]);
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

  if (!isOpen) return null;

  const displayTitle = playlist?.title || playlistSummary?.title || 'Course Playlist';
  const displayChannel = playlist?.channel || playlistSummary?.channel || 'YouTube Creator';

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

  const drawerContent = (
    <div className="fixed top-[53px] bottom-0 right-0 left-0 z-[95] overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed top-[53px] inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className={`relative w-full max-w-xl h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 border-l ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        {/* Drawer Header - Title & Actions (Add Playlist + Cross) on top row, Channel & Count on second row */}
        <div className={`p-3.5 sm:p-5 border-b space-y-1 ${
          isDark ? 'border-zinc-800/80 bg-zinc-900/60' : 'border-zinc-200 bg-white'
        }`}>
          {isLoading && !playlist?.title && !playlistSummary?.title ? (
            <div className="space-y-1.5 py-0.5">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 sm:h-6 w-3/4 rounded-md" />
                <div className="flex items-center gap-1 -mr-1 -mt-1">
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
              <div className="flex items-center gap-1.5">
                <Skeleton className="w-3.5 h-3.5 rounded-full" />
                <Skeleton className="h-3.5 w-28 rounded" />
              </div>
            </div>
          ) : (
            <>
              {/* Row 1: Title (left) & Actions Cluster: Add Playlist Icon before Cross (right) */}
              <div className="flex items-start justify-between gap-3 min-w-0">
                <h2
                  title={displayTitle}
                  className={`text-sm sm:text-base md:text-lg font-bold line-clamp-2 leading-snug flex-1 min-w-0 ${
                    isDark ? 'text-zinc-100' : 'text-zinc-900'
                  }`}
                >
                  {displayTitle}
                </h2>

                {/* Actions Cluster: Add Playlist / Save Icon before Cross */}
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

              {/* Row 2: Channel Name & Video Count */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <User className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                  <p
                    title={displayChannel}
                    className={`text-xs font-medium truncate max-w-[200px] sm:max-w-[320px] ${
                      isDark ? 'text-zinc-400' : 'text-zinc-500'
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
            </>
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

              return (
                <div
                  key={vidId || index}
                  onClick={() => onVideoSelect(norm)}
                  className={`group p-1.5 sm:p-2.5 rounded-xl transition-all duration-150 flex items-center gap-2 sm:gap-3 cursor-pointer ${
                    isDark
                      ? 'hover:bg-zinc-900/80 text-zinc-100'
                      : 'hover:bg-zinc-50 text-zinc-900'
                  }`}
                >
                  {/* Index Number */}
                  <div className={`w-4 sm:w-5 text-center text-[11px] sm:text-xs font-semibold shrink-0 ${
                    isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-zinc-400 group-hover:text-zinc-900 font-medium'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Clean YouTube Thumbnail with duration badge */}
                  <div className={`relative w-24 min-[400px]:w-28 sm:w-32 aspect-video rounded-lg overflow-hidden shrink-0 ${
                    isDark ? 'bg-zinc-900' : 'bg-zinc-200'
                  }`}>
                    <img
                      src={norm.thumbnail}
                      alt={norm.title || 'Playlist Lecture Video Thumbnail'}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-200"
                      loading="lazy"
                      decoding="async"
                    />
                    {/* Duration Badge */}
                    {norm.durationFormatted && (
                      <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-2xs text-white text-[9px] font-semibold px-1 py-0.2 rounded shadow-xs">
                        {norm.durationFormatted}
                      </div>
                    )}
                    {/* Subtle hover play overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current drop-shadow" />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className={`text-xs sm:text-sm font-semibold line-clamp-2 leading-snug transition ${
                      isDark ? 'text-zinc-100 group-hover:text-white' : 'text-zinc-900'
                    }`}>
                      {norm.title}
                    </h4>
                  </div>

                  {/* Action Buttons: Save / Bookmark & Add to Playlist */}
                  {onSaveVideo && (
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <VideoActionButtons
                        video={norm}
                        playlists={userPlaylists}
                        isSaved={isSaved}
                        onSave={() => onSaveVideo(norm)}
                        onAddToPlaylist={(videoId, playlistId, alreadyAssociated) =>
                          onTogglePlaylistAssociation?.(videoId, playlistId, alreadyAssociated, norm)
                        }
                        onCreatePlaylist={onCreatePlaylist}
                        popoverPlacement="left"
                        popoverAlign="top"
                      />
                    </div>
                  )}
                </div>
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
    </div>
  );

  return createPortal(drawerContent, document.body);
}
