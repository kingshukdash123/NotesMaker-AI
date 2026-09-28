import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { searchYouTube, fetchYouTubePlaylistItems } from '../services/server/api';
import SearchBar from '../components/discover/SearchBar';
import VideoGrid from '../components/discover/VideoGrid';
import PlaylistBrowserDrawer from '../components/discover/PlaylistBrowserDrawer';
import VideoContentPage from './VideoContentPage';
import {
  getUserPlaylists,
  getUserSavedVideos,
  saveVideoToLibrary,
  removeVideoFromLibrary,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  createPlaylist,
  createPlaylistWithVideos
} from '../services/firebase/libraryService';
import { PlaylistModel, SavedVideoModel } from '../models';
import { extractYouTubeVideoId, extractYouTubePlaylistId } from '../utils/router';
import { formatVideoDuration } from '../utils/formatters';

// Icons
import { AlertCircle, Search } from 'lucide-react';

export default function DiscoverPage() {
  const { currentUser, userProfile } = useAuth();
  const { isDark } = useTheme();
  const {
    activeVideoId,
    loadVideo,
    searchQuery,
    setSearchQuery,
    searchCategory,
    setSearchCategory,
    searchType,
    setSearchType,
    activePlaylistId,
    setActivePlaylistId,
    openUpgradeModal,
    openAuthModal,
  } = useApp();

  const [inputQuery, setInputQuery] = useState(searchQuery || '');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  // Playlist Browser Drawer state (Option A)
  const [isPlaylistDrawerOpen, setIsPlaylistDrawerOpen] = useState(Boolean(activePlaylistId));
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(activePlaylistId || null);
  const [selectedPlaylistSummary, setSelectedPlaylistSummary] = useState(null);

  // Sync drawer with activePlaylistId from URL
  useEffect(() => {
    if (activePlaylistId) {
      setSelectedPlaylistId(activePlaylistId);
      setIsPlaylistDrawerOpen(true);
    } else {
      setIsPlaylistDrawerOpen(false);
      setSelectedPlaylistId(null);
      setSelectedPlaylistSummary(null);
    }
  }, [activePlaylistId]);

  // Library info for card interactions (Saving, Playlists dropdown)
  const [savedVideos, setSavedVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  // Keep inputQuery synced with AppContext searchQuery on popstate/navigation
  useEffect(() => {
    setInputQuery(searchQuery || '');
  }, [searchQuery]);

  // React ref for smooth auto-focus on DiscoverPage
  const searchInputRef = useRef(null);
  useEffect(() => {
    if (!activeVideoId && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeVideoId]);

  const handleSearch = useCallback(async (query, cat = searchCategory, stype = searchType, setSearchedFlag = true) => {
    const rawInput = (typeof query === 'string' ? query : '').trim();
    if (!rawInput) return;

    // 1. SMART PASTE INTERCEPTION: Playlist URL
    const detectedPlaylistId = extractYouTubePlaylistId(rawInput);
    if (detectedPlaylistId) {
      setSelectedPlaylistId(detectedPlaylistId);
      setSelectedPlaylistSummary({ title: 'Imported Playlist', channel: 'YouTube' });
      setIsPlaylistDrawerOpen(true);
      return;
    }

    // 2. SMART PASTE INTERCEPTION: Direct Video or Live Stream URL
    const detectedVideoId = extractYouTubeVideoId(rawInput);
    if (detectedVideoId) {
      loadVideo(detectedVideoId, rawInput.startsWith('http') ? rawInput : `https://www.youtube.com/watch?v=${detectedVideoId}`);
      return;
    }

    // 3. TEXT SEARCH QUERY
    setIsLoading(true);
    setError('');
    if (setSearchedFlag) {
      setHasSearched(true);
      setSearchQuery(rawInput);
    }

    try {
      const data = await searchYouTube(rawInput, cat || 'all', '', stype || 'all');
      setResults(data.items || []);
    } catch (err) {
      console.error('YouTube search failed:', err);
      setError(err.message || 'Failed to fetch search results from YouTube. Check server settings.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchCategory, searchType, loadVideo, setSearchQuery]);

  // Handle clearing the search query and resetting to clean empty state
  const handleClearSearch = useCallback(() => {
    setInputQuery('');
    setSearchQuery('');
    setHasSearched(false);
    setError('');
    setResults([]);
  }, [setSearchQuery]);

  const handleInputChange = (val) => {
    setInputQuery(val);
    if (!val) {
      handleClearSearch();
    }
  };

  // Initial search on mount / deep-link query detection
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (searchQuery && searchQuery.trim()) {
      handleSearch(searchQuery, searchCategory, searchType, true);
    }
  }, [searchQuery, searchCategory, searchType, handleSearch]);

  // Fetch library info for saving / playlists
  useEffect(() => {
    const fetchLibraryInfo = async () => {
      if (!currentUser) return;
      try {
        const [videosData, playlistsData] = await Promise.all([
          getUserSavedVideos(currentUser.uid),
          getUserPlaylists(currentUser.uid)
        ]);

        setSavedVideos(videosData);
        setPlaylists(playlistsData);
      } catch (err) {
        console.error('Error fetching library info in Discover:', err);
      }
    };
    fetchLibraryInfo();
  }, [currentUser]);

  // Handle Video card click
  const handleVideoSelect = (video) => {
    loadVideo(video.videoId, `https://www.youtube.com/watch?v=${video.videoId}`, video);
  };

  // Handle Playlist card click -> Open Option A Drawer and sync URL
  const handlePlaylistSelect = (playlist) => {
    const pid = playlist.playlistId || playlist.id;
    setSelectedPlaylistId(pid);
    setSelectedPlaylistSummary(playlist);
    setActivePlaylistId(pid);
    setIsPlaylistDrawerOpen(true);
  };

  // Close Drawer and clear URL playlist parameter
  const handleClosePlaylistDrawer = () => {
    setIsPlaylistDrawerOpen(false);
    setActivePlaylistId('');
    setSelectedPlaylistId(null);
    setSelectedPlaylistSummary(null);
  };

  // Handle Lecture select inside Playlist Drawer
  const handleDrawerVideoSelect = (video) => {
    setIsPlaylistDrawerOpen(false);
    setActivePlaylistId('');
    setSelectedPlaylistId(null);
    setSelectedPlaylistSummary(null);
    loadVideo(video.videoId, `https://www.youtube.com/watch?v=${video.videoId}`, video);
  };

  // Batch import complete playlist into user's Library with all pages in strict sequence
  const handleSavePlaylistToLibrary = async (playlistData, currentVideos = []) => {
    if (!currentUser) {
      openAuthModal?.('login', 'Sign in to save playlists to your library.');
      return;
    }
    if (!playlistData) return;

    const targetPlaylistId = playlistData.playlistId || playlistData.id || selectedPlaylistId;
    if (!targetPlaylistId) return;

    let orderedVideos = Array.isArray(currentVideos) && currentVideos.length > 0 ? [...currentVideos] : [];

    // Fetch complete playlist across all pages in strict sequence
    try {
      const fullPlaylist = await fetchYouTubePlaylistItems(targetPlaylistId, '', true);
      if (fullPlaylist?.videos && fullPlaylist.videos.length > 0) {
        orderedVideos = fullPlaylist.videos;
      }
    } catch (err) {
      console.warn('Could not fetch complete playlist via fetchAll, using currently loaded sequence:', err);
    }

    if (orderedVideos.length === 0) {
      throw new Error('No videos found to save.');
    }

    const playlistTitle = playlistData.title || selectedPlaylistSummary?.title || 'Course Playlist';
    const created = await createPlaylistWithVideos(currentUser.uid, playlistTitle, orderedVideos, targetPlaylistId);

    const newModel = new PlaylistModel({
      id: created.id,
      name: created.name,
      videos: created.videos,
      sourcePlaylistId: targetPlaylistId,
      userId: currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    setPlaylists(prev => [
      newModel,
      ...prev.filter(pl => pl.id !== created.id && pl.sourcePlaylistId !== targetPlaylistId)
    ]);
  };

  // Toggle Save/Bookmark state of a search result card
  const handleToggleSaveVideo = async (video) => {
    if (!currentUser) {
      openAuthModal?.('login', 'Sign in to save videos to your library.');
      return;
    }
    const targetVideoId = video?.videoId || video?.id;
    if (!targetVideoId) return;

    const isCurrentlySaved = savedVideos.some(v => (v.videoId || v.id) === targetVideoId);
    try {
      if (isCurrentlySaved) {
        await removeVideoFromLibrary(currentUser.uid, targetVideoId);
        setSavedVideos(prev => prev.filter(v => (v.videoId || v.id) !== targetVideoId));
      } else {
        const rawMeta = video.metadata || video;
        const metadataToSave = {
          title: rawMeta.title || video.title || 'YouTube Video',
          channel: rawMeta.channel || video.channel || 'YouTube Creator',
          thumbnail: rawMeta.thumbnail || video.thumbnail || `https://img.youtube.com/vi/${targetVideoId}/hqdefault.jpg`,
          duration: Number(rawMeta.duration || video.duration || 0) || 0,
          duration_formatted: rawMeta.duration_formatted || rawMeta.durationFormatted || video.durationFormatted || '',
          publishedAt: rawMeta.publishedAt || video.publishedAt || '',
          description: rawMeta.description || video.description || '',
          view_count: rawMeta.view_count || rawMeta.viewCount || video.viewCount || '',
          is_live: Boolean(rawMeta.is_live || rawMeta.isLive || video.isLive),
        };
        const videoUrlToSave = video.videoUrl || `https://www.youtube.com/watch?v=${targetVideoId}`;

        await saveVideoToLibrary(
          currentUser.uid,
          targetVideoId,
          videoUrlToSave,
          metadataToSave
        );

        const newSavedModel = new SavedVideoModel({
          id: `${currentUser.uid}_${targetVideoId}`,
          userId: currentUser.uid,
          videoId: targetVideoId,
          videoUrl: videoUrlToSave,
          metadata: metadataToSave,
          savedAt: new Date(),
        });

        setSavedVideos(prev => [
          newSavedModel,
          ...prev.filter(v => (v.videoId || v.id) !== targetVideoId)
        ]);
      }
    } catch (err) {
      console.error('Failed to toggle save video in Discover:', err);
    }
  };



  // Handle adding/removing video from a playlist in Discover
  const handleTogglePlaylistAssociation = async (videoId, playlistId, alreadyAssociated, video) => {
    if (!currentUser) return;

    try {
      const rawMeta = video?.metadata || video || {};
      const durationSec = Number(rawMeta.duration || video?.duration || rawMeta.duration_seconds || video?.duration_seconds || 0) || 0;
      let durationFmt = String(rawMeta.duration_formatted || rawMeta.durationFormatted || video?.durationFormatted || video?.duration_formatted || '').trim();
      if (!durationFmt && durationSec > 0) {
        durationFmt = formatVideoDuration(durationSec);
      }

      const videoEntry = {
        videoId,
        videoUrl: video?.videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
        duration: durationSec,
        durationFormatted: durationFmt,
        metadata: {
          title: rawMeta.title || video?.title || 'YouTube Video',
          channel: rawMeta.channel || video?.channel || 'Unknown Creator',
          thumbnail: rawMeta.thumbnail || video?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          duration: durationSec,
          duration_formatted: durationFmt,
          durationFormatted: durationFmt,
          publishedAt: rawMeta.publishedAt || video?.publishedAt || '',
          description: rawMeta.description || video?.description || '',
          view_count: rawMeta.view_count || rawMeta.viewCount || video?.viewCount || '',
          is_live: Boolean(rawMeta.is_live || rawMeta.isLive || video?.isLive),
        },
        addedAt: new Date().toISOString(),
      };

      if (alreadyAssociated) {
        await removeVideoFromPlaylist(currentUser.uid, videoId, playlistId);
        setPlaylists(prev => prev.map(pl => {
          if (pl.id === playlistId) {
            const updatedVideos = (pl.videos || []).filter(v => (v.videoId || v.id) !== videoId);
            return { ...pl, videos: updatedVideos, videoCount: updatedVideos.length };
          }
          return pl;
        }));
      } else {
        await addVideoToPlaylist(currentUser.uid, videoId, playlistId, videoEntry);
        setPlaylists(prev => prev.map(pl => {
          if (pl.id === playlistId) {
            const existing = pl.videos || [];
            const updatedVideos = existing.some(v => (v.videoId || v.id) === videoId) ? existing : [...existing, videoEntry];
            return { ...pl, videos: updatedVideos, videoCount: updatedVideos.length };
          }
          return pl;
        }));
      }
    } catch (err) {
      console.error('Error toggling playlist association:', err);
    }
  };

  const handleCreatePlaylist = async (name) => {
    if (!currentUser) return;

    try {
      const id = await createPlaylist(currentUser.uid, name);
      setPlaylists(prev => [
        { id, name, videoCount: 0, userId: currentUser.uid, createdAt: new Date() },
        ...prev
      ]);
    } catch (err) {
      console.error('Error creating playlist in Discover:', err);
    }
  };


  // If a video is selected, render the unified watch page instead of the search list
  if (activeVideoId) {
    return <VideoContentPage />;
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar h-full w-full">
      <div className="w-full p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-300">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2 sm:gap-2.5 truncate ${
              isDark ? 'text-zinc-100' : 'text-zinc-900'
            }`}>
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 shrink-0" />
              <span className="truncate">Discover Lectures</span>
            </h1>
          </div>

          {/* Powered by YouTube Attribution */}
          <div className={`inline-flex items-center gap-1 sm:gap-1.5 text-[9px] min-[380px]:text-[9.5px] sm:text-xs font-medium shrink-0 whitespace-nowrap ${
            isDark 
              ? 'text-zinc-400' 
              : 'text-zinc-500'
          }`}>
            <svg className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
              <polygon fill="#FFFFFF" points="9.545,15.568 15.818,12 9.545,8.432" />
            </svg>
            <span>Powered by YouTube</span>
          </div>
        </div>

        {/* Search Bar section */}
        <div>
          <SearchBar
            autoFocus
            inputRef={searchInputRef}
            value={inputQuery}
            onChange={handleInputChange}
            onClear={handleClearSearch}
            onSubmit={() => handleSearch(inputQuery, searchCategory, searchType, true)}
            placeholder="Search lectures, topics, course playlists (or paste any YouTube video / playlist link)..."
          />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search Results Grid */}
        <div className="space-y-4">
          <VideoGrid
            videos={results}
            isLoading={isLoading}
            onVideoClick={handleVideoSelect}
            onPlaylistClick={handlePlaylistSelect}
            hasSearched={hasSearched}
            savedVideos={savedVideos}
            playlists={playlists}
            onSaveVideo={handleToggleSaveVideo}
            onSavePlaylistToLibrary={handleSavePlaylistToLibrary}
            onTogglePlaylistAssociation={handleTogglePlaylistAssociation}
            onCreatePlaylist={handleCreatePlaylist}
          />

        </div>
      </div>

      {/* Playlist Browser Drawer (Option A) */}
      <PlaylistBrowserDrawer
        key={selectedPlaylistId || 'none'}
        isOpen={isPlaylistDrawerOpen}
        playlistId={selectedPlaylistId}
        playlistSummary={selectedPlaylistSummary}
        userPlaylists={playlists}
        savedVideos={savedVideos}
        onClose={handleClosePlaylistDrawer}
        onVideoSelect={handleDrawerVideoSelect}
        onSaveToLibrary={handleSavePlaylistToLibrary}
        onSaveVideo={handleToggleSaveVideo}
        onTogglePlaylistAssociation={handleTogglePlaylistAssociation}
        onCreatePlaylist={handleCreatePlaylist}
      />
    </div>
  );
}
