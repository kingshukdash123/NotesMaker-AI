import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Play, 
  Loader2, 
  Folder, 
  Layers, 
  Film, 
  ChevronRight 
} from 'lucide-react';
import YouTubeIcon from '../common/YouTubeIcon';
import Skeleton from '../common/Skeleton';
import DrawerVideoCard from './DrawerVideoCard';
import { fetchYouTubeChannelProfile, fetchYouTubeChannelVideos, fetchYouTubeChannelPlaylists } from '../../services/server/api';
import { useTheme } from '../../context/ThemeContext';
import { normalizeVideoMetadata } from '../../models';
import { getChannelInitial } from '../../utils/formatters';

export default function ChannelExplorerDrawer({
  isOpen,
  channelId,
  channelTitle = '',
  userPlaylists = [],
  savedVideos = [],
  onClose,
  onVideoSelect,
  onPlaylistSelect,
  onSaveVideo,
  onTogglePlaylistAssociation,
  onCreatePlaylist
}) {
  const { isDark } = useTheme();

  // Active Tab: 'videos' | 'playlists'
  const [activeTab, setActiveTab] = useState('videos');

  // Manage smooth mount/unmount and opening/closing animation lifecycle matching Orbit sidebar
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

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

  // Channel Profile State
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Videos (Uploads) State
  const [videos, setVideos] = useState([]);
  const [videoNextPageToken, setVideoNextPageToken] = useState(null);
  const [isVideosLoading, setIsVideosLoading] = useState(false);
  const [isLoadingMoreVideos, setIsLoadingMoreVideos] = useState(false);
  const [videosError, setVideosError] = useState('');

  // Playlists State
  const [playlists, setPlaylists] = useState([]);
  const [playlistNextPageToken, setPlaylistNextPageToken] = useState(null);
  const [isPlaylistsLoading, setIsPlaylistsLoading] = useState(false);
  const [isLoadingMorePlaylists, setIsLoadingMorePlaylists] = useState(false);
  const [playlistsLoaded, setPlaylistsLoaded] = useState(false);

  // Load Channel Profile & Initial Videos when opened
  useEffect(() => {
    const targetQuery = (channelId || channelTitle || '').trim();
    if (!isOpen) {
      setActiveTab('videos');
      return;
    }
    if (!targetQuery) return;

    let isMounted = true;
    setIsProfileLoading(true);
    setIsVideosLoading(true);
    setVideosError('');
    setVideos([]);
    setVideoNextPageToken(null);
    setPlaylists([]);
    setPlaylistNextPageToken(null);
    setPlaylistsLoaded(false);

    // 1. Fetch channel profile (1 quota unit)
    fetchYouTubeChannelProfile(targetQuery)
      .then((data) => {
        if (!isMounted) return;
        setProfile(data);
        const resolvedId = data?.channelId || targetQuery;

        // 2. Fetch channel uploads / videos (1-2 quota units)
        fetchYouTubeChannelVideos(resolvedId)
          .then((vData) => {
            if (isMounted) {
              const loadedVideos = vData?.videos || [];
              setVideos(loadedVideos);
              setVideoNextPageToken(vData?.nextPageToken || null);
            }
          })
          .catch((err) => {
            if (isMounted) {
              console.error('Failed to load channel videos:', err);
              setVideosError(err.message || 'Could not load channel videos.');
            }
          })
          .finally(() => {
            if (isMounted) setIsVideosLoading(false);
          });
      })
      .catch((err) => {
        console.warn('Failed to load channel profile, falling back to direct video fetch:', err);
        if (isMounted) {
          fetchYouTubeChannelVideos(targetQuery)
            .then((vData) => {
              if (isMounted) {
                setVideos(vData?.videos || []);
                setVideoNextPageToken(vData?.nextPageToken || null);
              }
            })
            .catch((vErr) => {
              if (isMounted) {
                setVideosError(vErr.message || 'Could not load channel videos.');
              }
            })
            .finally(() => {
              if (isMounted) setIsVideosLoading(false);
            });
        }
      })
      .finally(() => {
        if (isMounted) setIsProfileLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, channelId, channelTitle]);

  // Lazy-load Playlists when user switches to 'playlists' tab for the first time
  useEffect(() => {
    const targetQuery = (profile?.channelId || channelId || channelTitle || '').trim();
    if (!isOpen || !targetQuery || activeTab !== 'playlists' || playlistsLoaded) return;

    let isMounted = true;
    setIsPlaylistsLoading(true);

    fetchYouTubeChannelPlaylists(targetQuery)
      .then((data) => {
        if (isMounted) {
          setPlaylists(data?.items || []);
          setPlaylistNextPageToken(data?.nextPageToken || null);
          setPlaylistsLoaded(true);
        }
      })
      .catch((err) => {
        console.warn('Failed to load channel playlists:', err);
      })
      .finally(() => {
        if (isMounted) setIsPlaylistsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, channelId, channelTitle, profile?.channelId, activeTab, playlistsLoaded]);

  // Load More Videos Pagination
  const handleLoadMoreVideos = useCallback(async () => {
    const targetQuery = (profile?.channelId || channelId || channelTitle || '').trim();
    if (!targetQuery || !videoNextPageToken || isLoadingMoreVideos) return;
    setIsLoadingMoreVideos(true);
    try {
      const data = await fetchYouTubeChannelVideos(targetQuery, videoNextPageToken);
      const newVideos = data?.videos || [];
      setVideos((prev) => [...prev, ...newVideos]);
      setVideoNextPageToken(data?.nextPageToken || null);
    } catch (err) {
      console.error('Failed to load more channel videos:', err);
    } finally {
      setIsLoadingMoreVideos(false);
    }
  }, [profile?.channelId, channelId, channelTitle, videoNextPageToken, isLoadingMoreVideos]);

  // Load More Playlists Pagination
  const handleLoadMorePlaylists = useCallback(async () => {
    const targetQuery = (profile?.channelId || channelId || channelTitle || '').trim();
    if (!targetQuery || !playlistNextPageToken || isLoadingMorePlaylists) return;
    setIsLoadingMorePlaylists(true);
    try {
      const data = await fetchYouTubeChannelPlaylists(targetQuery, playlistNextPageToken);
      const newItems = data?.items || [];
      setPlaylists((prev) => [...prev, ...newItems]);
      setPlaylistNextPageToken(data?.nextPageToken || null);
    } catch (err) {
      console.error('Failed to load more channel playlists:', err);
    } finally {
      setIsLoadingMorePlaylists(false);
    }
  }, [profile?.channelId, channelId, channelTitle, playlistNextPageToken, isLoadingMorePlaylists]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const displayTitle = profile?.title || channelTitle || 'YouTube Channel';
  const displayThumbnail = profile?.thumbnail || '';
  const displayYoutubeUrl = profile?.youtubeUrl || (channelId ? `https://www.youtube.com/channel/${channelId}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(displayTitle)}`);
  const channelLetter = getChannelInitial(displayTitle);

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
        role="dialog"
        aria-modal="true"
        aria-label={`Explore ${displayTitle}`}
      >
        {/* ── 1. Drawer Header ── */}
        <div
          className={`p-3.5 sm:p-5 border-b space-y-2.5 ${
            isDark ? 'border-zinc-900/90 bg-zinc-950' : 'border-zinc-200 bg-white'
          }`}
        >
          {isProfileLoading && !profile?.title && !channelTitle ? (
            <div className="space-y-1.5 py-0.5">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 sm:h-6 w-3/4 rounded-md" />
                <div className="flex items-center gap-1 -mr-1 -mt-1">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="w-8 h-8 rounded-lg" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Channel Logo / Avatar Icon */}
                {displayThumbnail ? (
                  <img
                    src={displayThumbnail}
                    alt={displayTitle}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 ring-1 ${
                      isDark ? 'ring-zinc-700 bg-zinc-800' : 'ring-zinc-300 bg-zinc-100'
                    }`}
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${
                      isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800'
                    }`}
                  >
                    {channelLetter}
                  </div>
                )}

                <h2
                  title={displayTitle}
                  className={`text-sm sm:text-base md:text-lg font-bold line-clamp-1 leading-snug flex-1 min-w-0 ${
                    isDark ? 'text-zinc-100' : 'text-zinc-900'
                  }`}
                >
                  {displayTitle}
                </h2>
              </div>

              {/* Actions Cluster: YouTube Button before Cross */}
              <div className="flex items-center gap-1 shrink-0 -mr-1 -mt-1">
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
                    title="Open channel on YouTube"
                    aria-label="Open channel on YouTube"
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

          {/* Navigation Tabs (Only Videos & Playlists) */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/40">
            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none ${
                activeTab === 'videos'
                  ? isDark
                    ? 'bg-zinc-800 text-zinc-100 shadow-2xs'
                    : 'bg-zinc-100 text-zinc-900 shadow-2xs'
                  : isDark
                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <Film className="w-3.5 h-3.5 shrink-0" />
              <span>Videos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('playlists')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none ${
                activeTab === 'playlists'
                  ? isDark
                    ? 'bg-zinc-800 text-zinc-100 shadow-2xs'
                    : 'bg-zinc-100 text-zinc-900 shadow-2xs'
                  : isDark
                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <Folder className="w-3.5 h-3.5 shrink-0" />
              <span>Playlists / Courses</span>
            </button>
          </div>
        </div>

        {/* ── 2. Content Body (Queue List Style matching PlaylistBrowserDrawer) ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-3 space-y-1">
          {/* TAB 1: VIDEOS / LECTURES */}
          {activeTab === 'videos' && (
            <>
              {isVideosLoading && videos.length === 0 ? (
                <div className="space-y-1 p-1">
                  {Array.from({ length: 7 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 sm:p-2.5 rounded-xl flex items-center gap-2 sm:gap-3 ${
                        isDark ? 'bg-zinc-900/30' : 'bg-zinc-100/60'
                      }`}
                    >
                      <div className="w-4 sm:w-5 flex justify-center shrink-0">
                        <Skeleton className="w-3.5 h-3.5 rounded" />
                      </div>
                      <div className="relative w-24 min-[400px]:w-28 sm:w-32 aspect-video rounded-lg overflow-hidden shrink-0">
                        <Skeleton className="w-full h-full rounded-lg" />
                      </div>
                      <div className="flex-1 min-w-0 pr-1 space-y-1.5">
                        <Skeleton className="h-3.5 sm:h-4 w-5/6 rounded" />
                        <Skeleton className="h-3.5 sm:h-4 w-1/2 rounded" />
                      </div>
                      <div className="flex items-center gap-1 shrink-0 pr-1">
                        <Skeleton className="w-6 h-6 rounded-lg" />
                        <Skeleton className="w-6 h-6 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : videosError ? (
                <div className="p-6 text-center space-y-3">
                  <p className="text-xs text-red-500 font-medium">{videosError}</p>
                </div>
              ) : videos.length === 0 ? (
                <div className={`text-center py-12 space-y-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  <Film className="w-8 h-8 mx-auto opacity-40 mb-2" />
                  <p className="text-xs font-semibold">
                    No public videos found for this channel
                  </p>
                </div>
              ) : (
                videos.map((rawVideo, index) => {
                  const norm = normalizeVideoMetadata(rawVideo) || {};
                  const vidId = norm.videoId || norm.id;
                  const isSaved = savedVideos.some((v) => (v.videoId || v.id) === vidId);

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

              {/* Load More Videos Pagination */}
              {videoNextPageToken && (
                <div className="pt-3 pb-2 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMoreVideos}
                    disabled={isLoadingMoreVideos}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer select-none disabled:opacity-50 ${
                      isDark
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300'
                    }`}
                  >
                    {isLoadingMoreVideos ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading more...</span>
                      </>
                    ) : (
                      <span>Load More Videos</span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 2: PLAYLISTS / COURSES */}
          {activeTab === 'playlists' && (
            <>
              {isPlaylistsLoading && playlists.length === 0 ? (
                <div className="space-y-1 p-1">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 sm:p-2.5 rounded-xl flex items-center gap-2 sm:gap-3 ${
                        isDark ? 'bg-zinc-900/30' : 'bg-zinc-100/60'
                      }`}
                    >
                      <div className="w-4 sm:w-5 flex justify-center shrink-0">
                        <Skeleton className="w-3.5 h-3.5 rounded" />
                      </div>
                      <div className="relative w-24 min-[400px]:w-28 sm:w-32 aspect-video rounded-lg overflow-hidden shrink-0">
                        <Skeleton className="w-full h-full rounded-lg" />
                      </div>
                      <div className="flex-1 min-w-0 pr-1 space-y-1.5">
                        <Skeleton className="h-3.5 sm:h-4 w-5/6 rounded" />
                        <Skeleton className="h-3.5 sm:h-4 w-1/2 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : playlists.length === 0 ? (
                <div className={`text-center py-12 space-y-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  <Folder className="w-8 h-8 mx-auto opacity-40 mb-2" />
                  <p className="text-xs font-semibold">
                    No public playlists found for this channel
                  </p>
                </div>
              ) : (
                playlists.map((pl, index) => {
                  const pid = pl.playlistId || pl.id;

                  return (
                    <div
                      key={pid || index}
                      onClick={() => onPlaylistSelect && onPlaylistSelect(pl)}
                      className={`group p-1.5 sm:p-2.5 rounded-xl transition-all duration-150 flex items-center gap-2 sm:gap-3 cursor-pointer select-none ${
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

                      {/* 16:9 Thumbnail with Playlist Badge Overlay */}
                      <div className={`relative w-24 min-[400px]:w-28 sm:w-32 aspect-video rounded-lg overflow-hidden shrink-0 ${
                        isDark ? 'bg-zinc-900' : 'bg-zinc-200'
                      }`}>
                        {pl.thumbnail ? (
                          <img
                            src={pl.thumbnail}
                            alt={pl.title || 'Playlist Thumbnail'}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-200"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Folder className="w-4 h-4 opacity-40" />
                          </div>
                        )}

                        {/* Playlist Pill Badge */}
                        <div className="absolute bottom-1 right-1 bg-black/85 backdrop-blur-2xs text-white text-[9px] font-semibold px-1.5 py-0.2 rounded flex items-center gap-1 shadow-xs">
                          <Layers className="w-2.5 h-2.5" />
                          <span>{pl.itemCount || 0}</span>
                        </div>

                        {/* Hover Play Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current drop-shadow" />
                        </div>
                      </div>

                      {/* Playlist Details */}
                      <div className="flex-1 min-w-0 pr-1">
                        <h4 className={`text-xs sm:text-sm font-semibold line-clamp-2 leading-snug transition ${
                          isDark ? 'text-zinc-100 group-hover:text-white' : 'text-zinc-900'
                        }`}>
                          {pl.title}
                        </h4>
                        <p className={`text-[11px] font-medium mt-0.5 ${
                          isDark ? 'text-zinc-500' : 'text-zinc-400'
                        }`}>
                          {pl.itemCount || 0} videos
                        </p>
                      </div>

                      {/* Explore CTA Chevron */}
                      <div className="shrink-0 pr-1">
                        <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                          isDark ? 'text-zinc-500 group-hover:text-zinc-200' : 'text-zinc-400 group-hover:text-zinc-800'
                        }`} />
                      </div>
                    </div>
                  );
                })
              )}

              {/* Load More Playlists Pagination */}
              {playlistNextPageToken && (
                <div className="pt-3 pb-2 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMorePlaylists}
                    disabled={isLoadingMorePlaylists}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer select-none disabled:opacity-50 ${
                      isDark
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300'
                    }`}
                  >
                    {isLoadingMorePlaylists ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading more...</span>
                      </>
                    ) : (
                      <span>Load More Playlists</span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
