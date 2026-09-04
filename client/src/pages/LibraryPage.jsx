import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  getUserPlaylists, 
  getUserSavedVideos, 
  createPlaylist, 
  deletePlaylist,
  removeVideoFromLibrary,
  saveVideoToLibrary,
  addVideoToPlaylist,
  removeVideoFromPlaylist
} from '../services/firebase/libraryService';

// Sub-components
import SavedVideosTab from '../components/library/SavedVideosTab';
import PlaylistsTab from '../components/library/PlaylistsTab';
import HistoryTab from '../components/library/HistoryTab';
import NotesTab from '../components/library/NotesTab';
import CreatePlaylistModal from '../components/library/CreatePlaylistModal';

import LibrarySkeleton from '../components/skeletons/LibrarySkeleton';

// Icons
import { Library, Bookmark, Folder, Clock, FileText } from 'lucide-react';

export default function LibraryPage() {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const { 
    libraryTab, 
    setLibraryTab, 
    loadVideo, 
    setActiveSection 
  } = useApp();

  const [savedVideos, setSavedVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  const fetchLibraryData = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [videosData, playlistsData] = await Promise.all([
        getUserSavedVideos(currentUser.uid),
        getUserPlaylists(currentUser.uid)
      ]);
      setSavedVideos(videosData);
      setPlaylists(playlistsData);
    } catch (err) {
      console.error('Error fetching library records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchLibraryData();
  }, [fetchLibraryData]);

  // Playlist CRUD operations
  const handleCreatePlaylist = async (name) => {
    if (!currentUser) return;
    try {
      const newPlaylistId = await createPlaylist(currentUser.uid, name);
      setPlaylists(prev => [
        { id: newPlaylistId, name, videoCount: 0, userId: currentUser.uid, createdAt: new Date() },
        ...prev
      ]);
    } catch (err) {
      console.error('Error creating playlist:', err);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!currentUser) return;
    try {
      await deletePlaylist(currentUser.uid, playlistId);
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    } catch (err) {
      console.error('Error deleting playlist:', err);
    }
  };

  // Video operations
  const handleRemoveVideo = async (videoId) => {
    if (!currentUser) return;
    try {
      await removeVideoFromLibrary(currentUser.uid, videoId);
      setSavedVideos(prev => prev.filter(v => v.videoId !== videoId));
      fetchLibraryData();
    } catch (err) {
      console.error('Error removing video:', err);
    }
  };

  // Toggle Save/Bookmark state of a video in library
  const handleToggleSaveVideo = async (video) => {
    if (!currentUser) return;
    const isCurrentlySaved = savedVideos.some(v => v.videoId === video.videoId);
    try {
      if (isCurrentlySaved) {
        await removeVideoFromLibrary(currentUser.uid, video.videoId);
        setSavedVideos(prev => prev.filter(v => v.videoId !== video.videoId));
      } else {
        const metadata = video.metadata || {
          title: video.title || 'YouTube Video',
          channel: video.channel || 'Unknown Creator',
          thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`
        };
        await saveVideoToLibrary(
          currentUser.uid,
          video.videoId,
          video.videoUrl || `https://www.youtube.com/watch?v=${video.videoId}`,
          metadata
        );
        setSavedVideos(prev => [
          ...prev,
          {
            videoId: video.videoId,
            videoUrl: video.videoUrl || `https://www.youtube.com/watch?v=${video.videoId}`,
            metadata,
          }
        ]);
      }
    } catch (err) {
      console.error('Error toggling video save:', err);
    }
  };

  const handleTogglePlaylistAssociation = async (videoId, playlistId, alreadyAssociated, videoData = null) => {
    if (!currentUser) return;
    try {
      const videoEntry = {
        videoId,
        videoUrl: videoData?.videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
        metadata: videoData?.metadata || {
          title: videoData?.title || 'YouTube Video',
          channel: videoData?.channel || 'Unknown Creator',
          thumbnail: videoData?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
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
        await addVideoToPlaylist(currentUser.uid, videoId, playlistId, videoData);
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

  // Click handler to load a video into the unified VideoContentPage
  const handleOpenVideo = (video) => {
    loadVideo(video.videoId, video.videoUrl, video.metadata, video.id, video.result);
  };

  if (isLoading) {
    return <LibrarySkeleton />;
  }

  const subTabs = [
    { id: 'history', label: 'Watch History', icon: Clock },
    { id: 'notes', label: 'Outlines & Notes', icon: FileText },
    { id: 'saved', label: 'Saved Videos', icon: Bookmark },
    { id: 'playlists', label: 'Playlists', icon: Folder },
  ];

  return (
    <div className="flex-1 w-full h-full flex flex-col min-h-0 overflow-hidden">
      <div className="max-w-7xl w-full mx-auto p-3.5 sm:p-6 md:p-8 flex-1 flex flex-col min-h-0 space-y-4 sm:space-y-5 pb-2 sm:pb-4 animate-in fade-in duration-300">
        
        {/* Page Header (Pinned) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-50 flex items-center gap-2">
              <Library className="w-5 h-5 text-orange-500" />
              Your Library
            </h2>
            <p className="text-xs text-zinc-450">
              Manage saved playlists, study history logs, and generated notes archive.
            </p>
          </div>
        </div>

        {/* Modal for creating playlists */}
        <CreatePlaylistModal
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
          onCreate={handleCreatePlaylist}
        />

        {/* Library Sub-navigation tab bar (Pinned) */}
        <div className="flex border-b border-zinc-900/60 pb-px overflow-x-auto select-none custom-scrollbar flex-nowrap shrink-0">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = libraryTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLibraryTab(tab.id)}
                title={tab.label}
                aria-label={tab.label}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-3 text-xs font-semibold relative transition shrink-0 cursor-pointer ${
                  isActive 
                    ? isDark ? 'text-zinc-50 font-bold' : 'text-orange-950 font-bold'
                    : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-orange-950/60 hover:text-orange-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-500' : isDark ? 'text-zinc-500' : 'text-orange-600'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full animate-fadeIn" />
                )}
              </button>
            );
          })}
        </div>

        {/* Library Sub-tab Content Pane */}
        <div className="min-h-0 w-full flex-1 flex flex-col overflow-hidden">
          {libraryTab === 'history' && (
            <HistoryTab 
              onOpenVideo={handleOpenVideo} 
              playlists={playlists}
              onTogglePlaylistAssociation={handleTogglePlaylistAssociation}
              onCreatePlaylist={handleCreatePlaylist}
              onToggleSave={handleToggleSaveVideo}
              savedVideos={savedVideos}
            />
          )}

          {libraryTab === 'notes' && (
            <NotesTab 
              onOpenVideo={handleOpenVideo} 
              playlists={playlists}
              onTogglePlaylistAssociation={handleTogglePlaylistAssociation}
              onCreatePlaylist={handleCreatePlaylist}
              onToggleSave={handleToggleSaveVideo}
              savedVideos={savedVideos}
            />
          )}
          
          {libraryTab === 'saved' && (
            <SavedVideosTab
              savedVideos={savedVideos}
              playlists={playlists}
              isLoading={isLoading}
              onOpenVideo={handleOpenVideo}
              onRemoveVideo={handleRemoveVideo}
              onTogglePlaylistAssociation={handleTogglePlaylistAssociation}
              onNavigateToDiscover={() => setActiveSection('discover')}
              onCreatePlaylist={handleCreatePlaylist}
              onToggleSave={handleToggleSaveVideo}
            />
          )}

          {libraryTab === 'playlists' && (
            <PlaylistsTab
              playlists={playlists}
              savedVideos={savedVideos}
              onCreatePlaylistOpen={() => setIsPlaylistModalOpen(true)}
              onDeletePlaylist={handleDeletePlaylist}
              onOpenVideo={handleOpenVideo}
              onRemoveVideo={handleRemoveVideo}
              onTogglePlaylistAssociation={handleTogglePlaylistAssociation}
              onCreatePlaylist={handleCreatePlaylist}
              onToggleSave={handleToggleSaveVideo}
            />
          )}
        </div>

      </div>
    </div>
  );
}
