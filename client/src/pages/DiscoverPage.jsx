import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { searchYouTube } from '../services/server/api';
import SearchBar from '../components/discover/SearchBar';
import VideoGrid from '../components/discover/VideoGrid';
import VideoContentPage from './VideoContentPage';
import { extractYouTubeVideoId, extractYouTubePlaylistId } from '../utils/router';

// Icons
import { AlertCircle, Search } from 'lucide-react';
import YouTubeIcon from '../components/common/YouTubeIcon';

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
    setActivePlaylistSummary,
    savedVideos,
    userPlaylists,
    handleToggleSaveVideo,
    handleTogglePlaylistAssociation,
    handleCreatePlaylist,
    handleSavePlaylistToLibrary,
  } = useApp();

  const [inputQuery, setInputQuery] = useState(searchQuery || '');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

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
      setActivePlaylistSummary({ title: 'Imported Playlist', channel: 'YouTube' });
      setActivePlaylistId(detectedPlaylistId);
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
  }, [searchCategory, searchType, loadVideo, setSearchQuery, setActivePlaylistId, setActivePlaylistSummary]);

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

  // Handle Video card click
  const handleVideoSelect = (video) => {
    loadVideo(video.videoId, `https://www.youtube.com/watch?v=${video.videoId}`, video);
  };

  // Handle Playlist card click -> Open Global Playlist Drawer and sync URL
  const handlePlaylistSelect = (playlist) => {
    const pid = playlist.playlistId || playlist.id;
    setActivePlaylistSummary(playlist);
    setActivePlaylistId(pid);
  };

  // If a video is selected, render the unified watch page
  if (activeVideoId) {
    return <VideoContentPage />;
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col min-h-0 overflow-hidden">
      <div className="w-full p-3.5 sm:p-6 md:p-8 flex-1 flex flex-col min-h-0 space-y-4 sm:space-y-6 pb-2 sm:pb-4 animate-in fade-in duration-300">
        {/* Page Header (Pinned) */}
        <div className="flex items-center justify-between gap-2 shrink-0">
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
            <YouTubeIcon className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <span>Powered by YouTube</span>
          </div>
        </div>

        {/* Search Bar section (Pinned) */}
        <div className="shrink-0">
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
          <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-3 shrink-0">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search Results Grid (Scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 -mr-1 pb-4">
          <VideoGrid
            videos={results}
            isLoading={isLoading}
            onVideoClick={handleVideoSelect}
            onPlaylistClick={handlePlaylistSelect}
            hasSearched={hasSearched}
            savedVideos={savedVideos}
            playlists={userPlaylists}
            onSaveVideo={handleToggleSaveVideo}
            onSavePlaylistToLibrary={handleSavePlaylistToLibrary}
            onTogglePlaylistAssociation={handleTogglePlaylistAssociation}
            onCreatePlaylist={handleCreatePlaylist}
          />
        </div>
      </div>
    </div>
  );
}
