import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import LibraryVideoCard from './LibraryVideoCard';
import { Folder, FolderOpen, Plus, Trash2, BookOpen } from 'lucide-react';

export default function PlaylistsTab({ 
  playlists = [], 
  savedVideos = [],
  onCreatePlaylistOpen,
  onDeletePlaylist,
  onOpenVideo,
  onTogglePlaylistAssociation,
  onCreatePlaylist,
  onToggleSave
}) {
  const { isDark } = useTheme();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(playlists[0]?.id || null);
  const { showConfirm } = useApp();

  // Fallback selected playlist if current is deleted or empty
  const activePlaylistId = playlists.some(pl => pl.id === selectedPlaylistId)
    ? selectedPlaylistId
    : (playlists[0]?.id || null);

  const activePlaylist = playlists.find(pl => pl.id === activePlaylistId);

  // Directly use the videos array belonging to the active playlist
  const playlistVideos = activePlaylist?.videos || [];

  const handleDeletePlaylist = async (id, e) => {
    e.stopPropagation();
    const confirmed = await showConfirm('Are you sure you want to delete this playlist?');
    if (confirmed) {
      await onDeletePlaylist(id);
      if (activePlaylistId === id) {
        setSelectedPlaylistId(null);
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-stretch animate-in fade-in duration-300">
      
      {/* Playlists Left Navigation Sidebar */}
      <div className="w-full md:w-56 shrink-0 flex flex-col gap-2.5 sm:gap-3">
        <div className="flex items-center justify-between px-1">
          <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${isDark ? 'text-zinc-500' : 'text-orange-800'}`}>PLAYLISTS</span>
          <button
            type="button"
            onClick={onCreatePlaylistOpen}
            className="btn-icon !text-orange-500"
            title="Create Playlist"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
        </div>

        {playlists.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-zinc-900 rounded-xl text-[10px] text-zinc-550">
            No playlists created.
          </div>
        ) : (
          <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 select-none custom-scrollbar">
            {playlists.map((pl) => {
              const isActive = activePlaylistId === pl.id;
              const count = pl.videos?.length ?? pl.videoCount ?? 0;
              return (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPlaylistId(pl.id)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition ${
                    isActive 
                      ? isDark 
                        ? 'bg-zinc-900/60 text-zinc-100 font-bold border border-zinc-800' 
                        : 'bg-orange-100 text-orange-700 font-bold border border-orange-300 shadow-xs'
                      : isDark
                        ? 'text-zinc-450 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
                        : 'text-orange-950/70 hover:text-orange-900 hover:bg-orange-50/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isActive ? <FolderOpen className="w-4 h-4 text-orange-500" /> : <Folder className={`w-4 h-4 ${isDark ? 'text-zinc-600' : 'text-orange-400'}`} />}
                    <span className="truncate pr-1">{pl.name}</span>
                    <span className="text-[10px] opacity-60">({count})</span>
                  </div>
                  
                  {isActive && (
                    <button
                      type="button"
                      onClick={(e) => handleDeletePlaylist(pl.id, e)}
                      className="btn-icon hover:!text-red-500 !p-1"
                      title="Delete Playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Playlist Videos Content Pane */}
      <div className="flex-1 min-w-0">
        {activePlaylist ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900/50 pb-2">
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-400">
                {activePlaylist.name} ({playlistVideos.length})
              </h3>
            </div>

            {playlistVideos.length === 0 ? (
              <div className="text-center py-16 border border-zinc-900 rounded-2xl bg-zinc-950/20 text-zinc-550 flex flex-col items-center justify-center gap-2">
                <BookOpen className="w-8 h-8 text-zinc-800" />
                <p className="text-[11px] font-bold text-zinc-400">This playlist is empty</p>
                <p className="text-[10px] max-w-xs mx-auto leading-relaxed">
                  Use the playlist icon on any video to add it directly to this playlist.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
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
        ) : (
          <div className="text-center py-16 border border-zinc-900 rounded-2xl bg-zinc-950/20 text-zinc-550 flex flex-col items-center justify-center gap-2">
            <FolderOpen className="w-8 h-8 text-zinc-800" />
            <p className="text-[11px] font-bold text-zinc-400">No playlist selected</p>
            <p className="text-[10px] max-w-xs mx-auto leading-relaxed">
              Create a new playlist on the left and select it to manage videos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
