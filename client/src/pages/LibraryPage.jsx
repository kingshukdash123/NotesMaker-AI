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
  removeVideoFromPlaylist,
  togglePlaylistVideoWatched,
  setAllPlaylistVideosWatched,
  renamePlaylist
} from '../services/firebase/libraryService';
import { PlaylistModel, SavedVideoModel } from '../models';
import { formatVideoDuration } from '../utils/formatters';

// Sub-components
import SavedVideosTab from '../components/library/SavedVideosTab';
import PlaylistsTab from '../components/library/PlaylistsTab';
import HistoryTab from '../components/library/HistoryTab';
import NotesTab from '../components/library/NotesTab';
import CreatePlaylistModal from '../components/library/CreatePlaylistModal';

// Icons
import { Library, Bookmark, Folder, Clock, FileText } from 'lucide-react';

export default function LibraryPage() {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const { 
    libraryTab, 
    setLibraryTab, 
    loadVideo, 
    setActiveSection,
    openAuthModal,
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
  const handleOpenCreatePlaylistModal = () => {
    setIsPlaylistModalOpen(true);
  };

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

  const handleRenamePlaylist = async (playlistId, newName) => {
    if (!currentUser) return;
    try {
      await renamePlaylist(currentUser.uid, playlistId, newName);
      setPlaylists(prev => prev.map(p => (p.id === playlistId ? { ...p, name: newName } : p)));
    } catch (err) {
      console.error('Error renaming playlist:', err);
    }
  };

  // Video Actions
  const handleRemoveVideo = async (videoId) => {
    if (!currentUser || !videoId) return;
    const cleanVideoId = String(videoId).trim();
    try {
      await removeVideoFromLibrary(currentUser.uid, cleanVideoId);
      setSavedVideos(prev => prev.filter(v => (v.videoId || v.id) !== cleanVideoId));
    } catch (err) {
      console.error('Error removing video from library:', err);
    }
  };

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

        const newModel = new SavedVideoModel({
          id: `${currentUser.uid}_${targetVideoId}`,
          userId: currentUser.uid,
          videoId: targetVideoId,
          videoUrl: videoUrlToSave,
          metadata: metadataToSave,
          savedAt: new Date(),
        });

        setSavedVideos(prev => [
          newModel,
          ...prev.filter(v => (v.videoId || v.id) !== targetVideoId)
        ]);
      }
    } catch (err) {
      console.error('Error toggling video save in Library:', err);
    }
  };



  const handleTogglePlaylistAssociation = async (videoId, playlistId, alreadyAssociated, videoData = null) => {
    if (!currentUser) return;

    try {
      const rawMeta = videoData?.metadata || videoData || {};
      const durationSec = Number(rawMeta.duration || videoData?.duration || rawMeta.duration_seconds || videoData?.duration_seconds || 0) || 0;
      let durationFmt = String(rawMeta.duration_formatted || rawMeta.durationFormatted || videoData?.durationFormatted || videoData?.duration_formatted || '').trim();
      if (!durationFmt && durationSec > 0) {
        durationFmt = formatVideoDuration(durationSec);
      }

      const videoEntry = {
        videoId,
        videoUrl: videoData?.videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
        duration: durationSec,
        durationFormatted: durationFmt,
        metadata: {
          title: rawMeta.title || videoData?.title || 'YouTube Video',
          channel: rawMeta.channel || videoData?.channel || 'Unknown Creator',
          thumbnail: rawMeta.thumbnail || videoData?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          duration: durationSec,
          duration_formatted: durationFmt,
          durationFormatted: durationFmt,
          publishedAt: rawMeta.publishedAt || videoData?.publishedAt || '',
          description: rawMeta.description || videoData?.description || '',
          view_count: rawMeta.view_count || rawMeta.viewCount || videoData?.viewCount || '',
          is_live: Boolean(rawMeta.is_live || rawMeta.isLive || videoData?.isLive),
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

  const handleTogglePlaylistVideoWatched = async (playlistId, videoId, isWatched) => {
    if (!currentUser) return;
    try {
      // Persist to Firestore first (strictly within playlist, NO watch history)
      await togglePlaylistVideoWatched(currentUser.uid, playlistId, videoId, isWatched);

      // Only update UI after successful write
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id !== playlistId) return pl;
          const updatedVideos = (pl.videos || []).map((v) => {
            if (v.videoId === videoId) {
              return {
                ...v,
                watched: Boolean(isWatched),
                watchedAt: isWatched ? new Date().toISOString() : null,
              };
            }
            return v;
          });
          return { ...pl, videos: updatedVideos };
        })
      );
    } catch (err) {
      console.error('Error toggling playlist video watched status:', err);
    }
  };

  const handleSetAllPlaylistVideosWatched = async (playlistId, isWatched) => {
    if (!currentUser) return;
    try {
      // Persist to Firestore first
      await setAllPlaylistVideosWatched(currentUser.uid, playlistId, isWatched);

      // Only update UI after successful write
      const nowIso = new Date().toISOString();
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id !== playlistId) return pl;
          const updatedVideos = (pl.videos || []).map((v) => ({
            ...v,
            watched: Boolean(isWatched),
            watchedAt: isWatched ? (v.watchedAt || nowIso) : null,
          }));
          return { ...pl, videos: updatedVideos };
        })
      );
    } catch (err) {
      console.error('Error updating all playlist videos watched status:', err);
    }
  };

  // Click handler to load a video into the unified VideoContentPage
  const handleOpenVideo = (video) => {
    loadVideo(video.videoId, video.videoUrl, video.metadata, video.id, video.result);
  };

  const subTabs = [
    { id: 'history', label: 'Watch History', mobileLabel: 'History', icon: Clock },
    { id: 'notes', label: 'Outlines & Notes', mobileLabel: 'Notes', icon: FileText },
    { id: 'saved', label: 'Saved Videos', mobileLabel: 'Saved', icon: Bookmark },
    { id: 'playlists', label: 'Playlists', mobileLabel: 'Playlists', icon: Folder },
  ];

  return (
    <div className="flex-1 w-full h-full flex flex-col min-h-0 overflow-hidden">
      <div className="w-full p-3.5 sm:p-6 md:p-8 flex-1 flex flex-col min-h-0 space-y-4 sm:space-y-5 pb-2 sm:pb-4 animate-in fade-in duration-300">
        
        {/* Page Header (Pinned) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2 sm:gap-2.5 ${
              isDark ? 'text-zinc-50' : 'text-zinc-900'
            }`}>
              <Library className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
              <span>Your Library</span>
            </h1>
          </div>
        </div>

        {/* Modal for creating playlists */}
        <CreatePlaylistModal
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
          onCreate={handleCreatePlaylist}
        />

        {/* Library Sub-navigation tab bar (Pinned) */}
        <div className={`flex border-b pb-px overflow-x-auto select-none custom-scrollbar flex-nowrap shrink-0 ${
          isDark ? 'border-zinc-900/60' : 'border-zinc-200/80'
        }`}>
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
                className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-xs font-semibold relative transition shrink-0 cursor-pointer ${
                  isActive 
                    ? isDark ? 'text-zinc-50 font-bold' : 'text-zinc-900 font-bold'
                    : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-4 sm:h-4 shrink-0 transition-colors ${
                  isActive 
                    ? 'text-orange-500' 
                    : isDark ? 'text-zinc-400' : 'text-zinc-400'
                }`} />
                <span className="sm:hidden font-medium text-[11px] leading-tight text-center">{tab.mobileLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 inset-x-0 sm:left-0 sm:right-0 h-0.5 bg-orange-500 rounded-full animate-fadeIn" />
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
              isLoading={isLoading}
              onCreatePlaylistOpen={handleOpenCreatePlaylistModal}
              onDeletePlaylist={handleDeletePlaylist}
              onOpenVideo={handleOpenVideo}
              onRemoveVideo={handleRemoveVideo}
              onTogglePlaylistAssociation={handleTogglePlaylistAssociation}
              onCreatePlaylist={handleCreatePlaylist}
              onToggleSave={handleToggleSaveVideo}
              onToggleVideoWatched={handleTogglePlaylistVideoWatched}
              onSetAllVideosWatched={handleSetAllPlaylistVideosWatched}
              onRenamePlaylist={handleRenamePlaylist}
            />
          )}
        </div>

      </div>
    </div>
  );
}
