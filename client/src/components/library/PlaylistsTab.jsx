import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import LibraryVideoCard from './LibraryVideoCard';
import { Folder, FolderOpen, Plus, Trash2, BookOpen, ListVideo, ArrowLeft } from 'lucide-react';

export default function PlaylistsTab({ 
  playlists = [], 
  savedVideos = [],
  onCreatePlaylistOpen,
  onDeletePlaylist,
  onOpenVideo,
  onRemoveVideo,
  onTogglePlaylistAssociation,
  onCreatePlaylist,
  onToggleSave
}) {
  const { isDark } = useTheme();
  const { showConfirm } = useApp();

  const [isDesktop, setIsDesktop] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );

  // Phone view: no playlist chosen by default (null). Desktop: default to first playlist.
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(() => 
    (typeof window !== 'undefined' && window.innerWidth >= 768) ? (playlists[0]?.id || null) : null
  );
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'videos'

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      // If switching to desktop and nothing was chosen, select first playlist
      if (desktop && !selectedPlaylistId && playlists.length > 0) {
        setSelectedPlaylistId(playlists[0].id);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedPlaylistId, playlists]);

  // On desktop: fallback to first playlist if valid. On phone: respect null (no default selection)
  const activePlaylistId = selectedPlaylistId && playlists.some(pl => pl.id === selectedPlaylistId)
    ? selectedPlaylistId
    : (isDesktop ? (playlists[0]?.id || null) : null);

  const activePlaylist = playlists.find(pl => pl.id === activePlaylistId);

  // Directly use the videos array belonging to the active playlist
  const playlistVideos = activePlaylist?.videos || [];

  const handleDeletePlaylist = async (id, e) => {
    if (e) e.stopPropagation();
    const confirmed = await showConfirm('Are you sure you want to delete this playlist? All videos inside will be removed from this playlist.');
    if (confirmed) {
      await onDeletePlaylist(id);
      if (activePlaylistId === id) {
        const remaining = playlists.filter(p => p.id !== id);
        setSelectedPlaylistId(isDesktop ? (remaining[0]?.id || null) : null);
        setMobileView('list');
      }
    }
  };

  const handleSelectPlaylist = (id) => {
    setSelectedPlaylistId(id);
    setMobileView('videos');
  };

  const handleBackToPlaylists = () => {
    setMobileView('list');
    setSelectedPlaylistId(null);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-5 lg:gap-6 items-stretch min-h-0 h-full overflow-hidden animate-in fade-in duration-300">
      
      {/* Playlists Left Navigation Sidebar Panel (Separately Scrollable & Toggled on Mobile) */}
      <div className={`w-full md:w-64 lg:w-72 shrink-0 flex flex-col min-h-0 h-full rounded-2xl border transition-colors ${
        mobileView === 'videos' ? 'hidden md:flex' : 'flex'
      } ${
        isDark ? 'bg-zinc-950/80 border-zinc-800/80 shadow-inner' : 'bg-white border-orange-200 shadow-xs'
      }`}>
        {/* Pinned Header */}
        <div className={`flex items-center justify-between p-3.5 pb-2.5 border-b shrink-0 ${
          isDark ? 'border-zinc-800/60' : 'border-orange-100'
        }`}>
          <div className="flex items-center gap-2">
            <ListVideo className="w-4 h-4 text-orange-500 shrink-0" />
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-zinc-300' : 'text-orange-950'
            }`}>
              Playlists
            </span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-orange-100 text-orange-800'
            }`}>
              {playlists.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onCreatePlaylistOpen}
            className="btn-primary px-2.5 py-1 !rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Create New Playlist"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>New</span>
          </button>
        </div>

        {/* Separately Scrollable Playlist List */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {playlists.length === 0 ? (
            <div className={`text-center py-8 px-3 rounded-xl border border-dashed text-xs space-y-1 ${
              isDark ? 'border-zinc-800 text-zinc-500' : 'border-orange-200 text-orange-900/60'
            }`}>
              <Folder className="w-6 h-6 mx-auto opacity-40 mb-1" />
              <p className="font-semibold">No playlists created yet</p>
              <p className="text-[11px] opacity-75">Click "New" above to organize your lectures.</p>
            </div>
          ) : (
            playlists.map((pl) => {
              const isActive = activePlaylistId === pl.id;
              const count = pl.videos?.length ?? pl.videoCount ?? 0;
              return (
                <div
                  key={pl.id}
                  onClick={() => handleSelectPlaylist(pl.id)}
                  title={pl.name}
                  className={`group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer shrink-0 transition-all duration-150 ${
                    isActive 
                      ? isDark 
                        ? 'bg-zinc-900/90 text-zinc-100 font-bold border border-zinc-700/80 shadow-xs' 
                        : 'bg-orange-100/90 text-orange-950 font-bold border border-orange-300 shadow-2xs'
                      : isDark
                        ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
                        : 'text-orange-950/80 hover:text-orange-950 hover:bg-orange-50/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {isActive ? (
                      <FolderOpen className={`w-4 h-4 shrink-0 ${isDark ? 'text-zinc-200' : 'text-orange-600'}`} />
                    ) : (
                      <Folder className={`w-4 h-4 shrink-0 transition ${
                        isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-orange-400 group-hover:text-orange-600'
                      }`} />
                    )}
                    <span className="truncate flex-1 min-w-0 font-semibold leading-tight">
                      {pl.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                      isActive
                        ? isDark
                          ? 'bg-zinc-800 text-zinc-200 border border-zinc-700/80'
                          : 'bg-orange-200/90 text-orange-900'
                        : isDark
                          ? 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-300'
                          : 'bg-orange-100/60 text-orange-800/80 group-hover:bg-orange-100'
                    }`}>
                      {count}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleDeletePlaylist(pl.id, e)}
                      className={`p-1 rounded-md transition shrink-0 ${
                        isActive
                          ? 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10'
                          : 'opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                      title="Delete Playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Playlist Videos Content Pane (Toggled on Mobile) */}
      <div className={`flex-1 min-w-0 h-full flex flex-col min-h-0 space-y-3 sm:space-y-4 ${
        mobileView === 'list' ? 'hidden md:flex' : 'flex'
      }`}>
        {activePlaylist ? (
          <>
            {/* Active Playlist Header (Pinned / Non-scrollable - Only Playlist Name + Mobile Back Button) */}
            <div className={`px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl flex items-center gap-3 shrink-0 transition-colors ${
              isDark ? 'bg-zinc-950/80' : 'bg-white shadow-xs'
            }`}>
              {/* Mobile Back Button to choose another playlist */}
              <button
                type="button"
                onClick={handleBackToPlaylists}
                className={`md:hidden p-1.5 -ml-1 rounded-xl transition flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer ${
                  isDark
                    ? 'text-zinc-300 hover:text-white'
                    : 'text-orange-950 hover:text-orange-800'
                }`}
                title="Back to playlists"
                aria-label="Back to playlists list"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-orange-500" />
              </button>

              {/* Only show the playlist name here */}
              <h2 className={`text-base sm:text-lg font-bold truncate leading-snug flex-1 min-w-0 ${
                isDark ? 'text-zinc-100' : 'text-orange-950'
              }`} title={activePlaylist.name}>
                {activePlaylist.name}
              </h2>
            </div>

            {/* Only Video Grid is Scrollable! */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
              {playlistVideos.length === 0 ? (
                <div className={`text-center py-16 border rounded-2xl flex flex-col items-center justify-center gap-2.5 p-6 ${
                  isDark ? 'border-zinc-800/80 bg-zinc-950/40 text-zinc-400' : 'border-orange-200 bg-white text-orange-900 shadow-xs'
                }`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isDark ? 'bg-zinc-900 text-zinc-600' : 'bg-orange-50 text-orange-400'
                  }`}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <p className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-orange-950'}`}>
                      This playlist is currently empty
                    </p>
                    <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-orange-800/80'}`}>
                      Browse lectures in the Discover tab and click the three-dots menu or playlist icon to add videos to "{activePlaylist.name}".
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {playlistVideos.map((video) => (
                    <LibraryVideoCard
                      key={video.videoId}
                      video={video}
                      playlists={playlists}
                      onOpen={() => onOpenVideo(video)}
                      onDelete={() => onTogglePlaylistAssociation(video.videoId, activePlaylist.id, true, video)}
                      onAddToPlaylist={onTogglePlaylistAssociation}
                      onCreatePlaylist={onCreatePlaylist}
                      onSave={() => onToggleSave(video)}
                      isSaved={savedVideos.some(v => v.videoId === video.videoId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={`text-center py-16 border rounded-2xl flex flex-col items-center justify-center gap-2 p-6 ${
            isDark ? 'border-zinc-800/80 bg-zinc-950/40 text-zinc-400' : 'border-orange-200 bg-white text-orange-900 shadow-xs'
          }`}>
            <FolderOpen className="w-8 h-8 text-orange-500 opacity-60" />
            <p className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-orange-950'}`}>
              No playlist selected
            </p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-orange-800/80'}`}>
              Select a playlist from the left or create a new one to view and manage its lectures.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
