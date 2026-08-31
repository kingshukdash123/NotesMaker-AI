import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { searchYouTube } from '../services/server/api';
import SearchBar from '../components/discover/SearchBar';
import VideoGrid from '../components/discover/VideoGrid';
import VideoContentPage from './VideoContentPage';
import {
  getUserPlaylists,
  getUserSavedVideos,
  saveVideoToLibrary,
  removeVideoFromLibrary,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  createPlaylist
} from '../services/firebase/libraryService';

// Icons
import { AlertCircle, Search } from 'lucide-react';

export default function DiscoverPage() {
  const { currentUser } = useAuth();
  const { activeVideoId, loadVideo } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  // Library info for card interactions (Saving, Playlists dropdown)
  const [savedVideos, setSavedVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  const handleSearch = useCallback(async (query, setSearchedFlag = true) => {
    const q = (typeof query === 'string' ? query : '').trim();
    if (!q) return;

    setIsLoading(true);
    setError('');
    if (setSearchedFlag) {
      setHasSearched(true);
    }

    try {
      const data = await searchYouTube(q, 'all');
      setResults(data.items || []);
    } catch (err) {
      console.error('YouTube search failed:', err);
      setError(err.message || 'Failed to fetch search results from YouTube. Check server settings.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial search on mount
  useEffect(() => {
    handleSearch("education lectures", false);
  }, [handleSearch]);

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

  const handleVideoSelect = (video) => {
    // Navigates to VideoContentPage by setting AppContext active video state
    loadVideo(video.videoId, `https://www.youtube.com/watch?v=${video.videoId}`, video);
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
          thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`
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
      const isCurrentlySaved = savedVideos.some(v => v.videoId === videoId);

      if (!isCurrentlySaved) {
        // First save the video to library
        const metadata = {
          title: video.title || 'YouTube Video',
          channel: video.channel || 'Unknown Creator',
          thumbnail: video.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        };
        await saveVideoToLibrary(
          currentUser.uid,
          videoId,
          `https://www.youtube.com/watch?v=${videoId}`,
          metadata
        );
        // Add to local state
        setSavedVideos(prev => [
          ...prev,
          {
            videoId,
            videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
            metadata,
            playlistIds: [playlistId]
          }
        ]);
      }

      if (alreadyAssociated) {
        await removeVideoFromPlaylist(currentUser.uid, videoId, playlistId);
        setSavedVideos(prev => prev.map(v => {
          if (v.videoId === videoId) {
            return {
              ...v,
              playlistIds: v.playlistIds?.filter(id => id !== playlistId) || []
            };
          }
          return v;
        }));
      } else {
        await addVideoToPlaylist(currentUser.uid, videoId, playlistId);
        setSavedVideos(prev => prev.map(v => {
          if (v.videoId === videoId) {
            return {
              ...v,
              playlistIds: [...(v.playlistIds || []), playlistId]
            };
          }
          return v;
        }));
      }

      // Update playlists count locally
      setPlaylists(prev => prev.map(pl => {
        if (pl.id === playlistId) {
          return { ...pl, videoCount: alreadyAssociated ? Math.max(pl.videoCount - 1, 0) : (pl.videoCount || 0) + 1 };
        }
        return pl;
      }));
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

  // If a video is selected, render the unified watch page instead of the search list
  if (activeVideoId) {
    return <VideoContentPage />;
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar h-full w-full">
      <div className="max-w-7xl mx-auto p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-300">
        {/* Page Header */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-550 flex items-center gap-2">
            <Search className="w-5 h-5 text-orange-500" />
            Discover Lectures
          </h2>
          <p className="text-xs text-zinc-450">
            Find high-quality educational videos to outline, transcribe, and study.
          </p>
        </div>

        {/* Search Bar section */}
        <div className="space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={() => handleSearch(searchQuery)}
            placeholder="Search for courses, lectures, or topics..."
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
            hasSearched={hasSearched}
            savedVideos={savedVideos}
            playlists={playlists}
            onSaveVideo={handleToggleSaveVideo}
            onTogglePlaylistAssociation={handleTogglePlaylistAssociation}
            onCreatePlaylist={handleCreatePlaylist}
          />
        </div>
      </div>
    </div>
  );
}
