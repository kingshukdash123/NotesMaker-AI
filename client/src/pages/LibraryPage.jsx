import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  togglePlaylistVideoWatched,
  setAllPlaylistVideosWatched,
} from '../services/firebase/libraryService';

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
    savedVideos,
    userPlaylists: playlists,
    isLibraryLoading: isLoading,
    handleToggleSaveVideo,
    handleRemoveVideo,
    handleTogglePlaylistAssociation,
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleRenamePlaylist,
  } = useApp();

  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  // Playlist Modal Trigger
  const handleOpenCreatePlaylistModal = () => {
    setIsPlaylistModalOpen(true);
  };



  const handleTogglePlaylistVideoWatched = async (playlistId, videoId, isWatched) => {
    if (!currentUser) return;
    try {
      await togglePlaylistVideoWatched(currentUser.uid, playlistId, videoId, isWatched);
    } catch (err) {
      console.error('Error toggling playlist video watched status:', err);
    }
  };

  const handleSetAllPlaylistVideosWatched = async (playlistId, isWatched) => {
    if (!currentUser) return;
    try {
      await setAllPlaylistVideosWatched(currentUser.uid, playlistId, isWatched);
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
