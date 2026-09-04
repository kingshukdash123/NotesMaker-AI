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
import { extractYouTubeVideoId, extractYouTubePlaylistId } from '../utils/router';

// Icons
import { AlertCircle, Search, Layers, Video, ListVideo, Radio } from 'lucide-react';

const FILTER_TYPES = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'video', label: 'Videos', icon: Video },
  { id: 'playlist', label: 'Playlists', icon: ListVideo },
  { id: 'live', label: 'Live Streams', icon: Radio },
];

export default function DiscoverPage() {
  const { currentUser } = useAuth();
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
    if (!currentUser || !playlistData) return;
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
    const created = await createPlaylistWithVideos(currentUser.uid, playlistTitle, orderedVideos);

    setPlaylists(prev => [
      {
        id: created.id,
        name: created.name,
        videoCount: created.videoCount,
        userId: currentUser.uid,
        createdAt: new Date(),
        videos: created.videos
      },
      ...prev
    ]);
  };

  // Toggle Save/Bookmark state of a search result card
  const handleToggleSaveVideo = async (video) => {
    if (!currentUser) return;
    const isCurrentlySaved = savedVideos.some(v => v.videoId === video.videoId);
    try {
      if (isCurrentlySaved) {
        await removeVideoFromLibrary(currentUser.uid, video.videoId);
        setSavedVideos(prev => prev.filter(v => v.videoId !== video.videoId));
      } else {
        const metadata = {
          title: video.title || 'YouTube Video',
          channel: video.channel || 'Unknown Creator',
          thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`,
          is_live: video.isLive
        };
        await saveVideoToLibrary(
          currentUser.uid,
          video.videoId,
          `https://www.youtube.com/watch?v=${video.videoId}`,
          metadata
        );
        setSavedVideos(prev => [
          ...prev,
          {
            videoId: video.videoId,
            videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
            metadata,
            playlistIds: []
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to toggle save video:', err);
    }
  };

  // Handle adding/removing video from a playlist in Discover
  const handleTogglePlaylistAssociation = async (videoId, playlistId, alreadyAssociated, video) => {
    if (!currentUser) return;
    try {
      const videoEntry = {
        videoId,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        metadata: {
          title: video.title || 'YouTube Video',
          channel: video.channel || 'Unknown Creator',
          thumbnail: video.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        },
        addedAt: new Date().toISOString(),
      };

      if (alreadyAssociated) {
        await removeVideoFromPlaylist(currentUser.uid, videoId, playlistId);
        setPlaylists(prev => prev.map(pl => {
          if (pl.id === playlistId) {
            const updatedVideos = (pl.videos || []).filter(v => v.videoId !== videoId);
            return { ...pl, videos: updatedVideos, videoCount: updatedVideos.length };
          }
          return pl;
        }));
      } else {
        await addVideoToPlaylist(currentUser.uid, videoId, playlistId, videoEntry);
        setPlaylists(prev => prev.map(pl => {
          if (pl.id === playlistId) {
            const existing = pl.videos || [];
            const updatedVideos = existing.some(v => v.videoId === videoId) ? existing : [...existing, videoEntry];
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
      console.error('Failed to create playlist in Discover:', err);
    }
  };

  // Change content type filter
  const handleFilterTypeChange = (newType) => {
    setSearchType(newType);
    const targetQuery = inputQuery.trim() || searchQuery.trim();
    if (targetQuery) {
      handleSearch(targetQuery, searchCategory, newType, true);
    }
  };

  // If a video is selected, render the unified watch page instead of the search list
  if (activeVideoId) {
    return <VideoContentPage />;
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar h-full w-full">
      <div className="max-w-7xl mx-auto p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-300">
        {/* Page Header */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100 flex items-center gap-2">
            <Search className="w-5 h-5 text-orange-500" />
            Discover Lectures & Courses
          </h2>
          <p className="text-xs text-zinc-400">
            Find high-quality academic lectures, full course playlists, and live masterclasses to outline, transcribe, and study.
          </p>
        </div>

        {/* Search Bar section */}
        <div className="space-y-3">
          <SearchBar
            value={inputQuery}
            onChange={handleInputChange}
            onClear={handleClearSearch}
            onSubmit={() => handleSearch(inputQuery, searchCategory, searchType, true)}
            placeholder="Search lectures, topics, course playlists (or paste any YouTube video / playlist link)..."
          />

          {/* Filter Chips: All, Videos, Playlists, Live Streams */}
          <div className="flex items-center gap-2 overflow-x-auto py-1.5 px-0.5 custom-scrollbar text-xs">
            {FILTER_TYPES.map((filter) => {
              const Icon = filter.icon;
              const isActive = (searchType || 'all') === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => handleFilterTypeChange(filter.id)}
                  className={`px-3.5 py-1.5 !rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer hover:!transform-none hover:!translate-y-0 ${
                    isActive
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-current' : isDark ? 'text-zinc-400' : 'text-orange-700'}`} />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
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
        onClose={handleClosePlaylistDrawer}
        onVideoSelect={handleDrawerVideoSelect}
        onSaveToLibrary={handleSavePlaylistToLibrary}
      />
    </div>
  );
}
