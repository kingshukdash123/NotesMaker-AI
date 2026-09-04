import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Folder, Play, Check, Bookmark, ListVideo, Loader2 } from 'lucide-react';
import { fetchYouTubePlaylistItems } from '../../services/server/api';
import { useTheme } from '../../context/ThemeContext';

export default function PlaylistBrowserDrawer({
  isOpen,
  playlistId,
  playlistSummary = null,
  onClose,
  onVideoSelect,
  onSaveToLibrary
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

  const handleSave = async () => {
    if (!onSaveToLibrary || isSaved || isSaving) return;
    setIsSaving(true);
    try {
      await onSaveToLibrary(
        { ...(playlist || {}), ...(playlistSummary || {}), title: displayTitle, channel: displayChannel },
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
        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-orange-200 text-orange-950'
      }`}>
        {/* Drawer Header - YouTube Playlist Panel Style */}
        <div className={`p-4 sm:p-5 border-b flex items-start justify-between gap-3 ${
          isDark ? 'border-zinc-800/80 bg-zinc-900/60' : 'border-orange-200 bg-white'
        }`}>
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
              isDark ? 'bg-zinc-800 border-zinc-700/60 text-orange-500' : 'bg-orange-50 border-orange-200 text-orange-600'
            }`}>
              <ListVideo className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isDark ? 'bg-orange-500/15 text-orange-400' : 'bg-orange-100 text-orange-800'
                }`}>
                  Playlist
                </span>
                {videos.length > 0 && (
                  <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-orange-900/80'}`}>
                    {totalResults > videos.length ? `${videos.length} of ${totalResults}` : videos.length} videos
                  </span>
                )}
              </div>
              {isLoading && !playlist?.title && !playlistSummary?.title ? (
                <div className="space-y-1.5 py-0.5 min-w-[200px]">
                  <div className={`h-5 w-48 rounded animate-pulse ${isDark ? 'bg-zinc-800' : 'bg-orange-200/70'}`} />
                  <div className={`h-3.5 w-28 rounded animate-pulse ${isDark ? 'bg-zinc-800' : 'bg-orange-200/50'}`} />
                </div>
              ) : (
                <>
                  <h2 className={`text-base sm:text-lg font-bold line-clamp-2 leading-snug ${
                    isDark ? 'text-zinc-100' : 'text-orange-950'
                  }`}>
                    {displayTitle}
                  </h2>
                  <p className={`text-xs font-medium truncate ${isDark ? 'text-zinc-400' : 'text-orange-800'}`}>
                    {displayChannel}
                  </p>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg transition shrink-0 cursor-pointer ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100' : 'hover:bg-orange-100 text-orange-800 hover:text-orange-950'
            }`}
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className={`px-4 sm:px-5 py-2.5 border-b flex items-center justify-between gap-2 text-xs ${
          isDark ? 'border-zinc-800/60 bg-zinc-950 text-zinc-400' : 'border-orange-200 bg-orange-50/70 text-orange-900'
        }`}>
          <div className="font-medium text-[11px] truncate">
            Click any lecture to open and generate notes
          </div>
          {onSaveToLibrary && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaved || isSaving || isLoading}
              className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ${
                isSaved
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg'
                  : isSaving
                    ? 'btn-secondary !rounded-lg opacity-80'
                    : 'btn-primary !rounded-lg'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Saved to Library</span>
                </>
              ) : isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                  <span>Saving all lectures...</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save Playlist</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Video List Body (YouTube Playlist Queue Style) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-3 space-y-1">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl animate-pulse flex items-center gap-3 ${
                    isDark ? 'bg-zinc-900/40' : 'bg-orange-100/40 border border-orange-200/60'
                  }`}
                >
                  <div className={`w-6 h-4 rounded shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-orange-200/70'}`} />
                  <div className={`w-28 sm:w-32 aspect-video rounded-lg shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-orange-200/70'}`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-3.5 rounded w-3/4 ${isDark ? 'bg-zinc-800' : 'bg-orange-200/70'}`} />
                    <div className={`h-2.5 rounded w-1/3 ${isDark ? 'bg-zinc-800' : 'bg-orange-200/50'}`} />
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
            <div className={`text-center py-12 space-y-1 ${isDark ? 'text-zinc-500' : 'text-orange-900/60'}`}>
              <Folder className="w-8 h-8 mx-auto opacity-40 mb-2" />
              <p className="text-xs font-semibold">No available public videos found</p>
              <p className="text-[11px]">This playlist may be empty, unlisted, or private.</p>
            </div>
          ) : (
            videos.map((vid, index) => (
              <div
                key={vid.videoId || index}
                onClick={() => onVideoSelect(vid)}
                className={`group p-2 sm:p-2.5 rounded-xl transition-all duration-150 flex items-center gap-3 cursor-pointer ${
                  isDark
                    ? 'hover:bg-zinc-900/80 text-zinc-100'
                    : 'hover:bg-orange-50 text-orange-950'
                }`}
              >
                {/* Index Number */}
                <div className={`w-5 text-center text-xs font-semibold shrink-0 ${
                  isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-orange-900/60 group-hover:text-orange-950 font-bold'
                }`}>
                  {index + 1}
                </div>

                {/* Clean YouTube Thumbnail without gaudy center play button */}
                <div className={`relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden shrink-0 border ${
                  isDark ? 'border-zinc-800/60 bg-zinc-900' : 'border-orange-200/80 bg-orange-50 shadow-2xs'
                }`}>
                  <img
                    src={vid.thumbnail}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-200"
                    loading="lazy"
                  />
                  {/* Subtle hover play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-current drop-shadow" />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs sm:text-sm font-semibold line-clamp-2 leading-snug transition ${
                    isDark ? 'text-zinc-100 group-hover:text-white' : 'text-orange-950 group-hover:text-orange-600'
                  }`}>
                    {vid.title}
                  </h4>
                  <p className={`text-[11px] truncate mt-0.5 font-normal ${
                    isDark ? 'text-zinc-400' : 'text-orange-800'
                  }`}>
                    {vid.channel}
                  </p>
                </div>
              </div>
            ))
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
                    : 'bg-white hover:bg-orange-50 border-orange-200 text-orange-950 hover:text-orange-900 shadow-2xs'
                }`}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    <span>Loading more lectures...</span>
                  </>
                ) : (
                  <span>Load More Lectures ({videos.length} of {totalResults})</span>
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
