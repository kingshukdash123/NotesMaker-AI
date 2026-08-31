import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { PlayCircle, Trash2, FolderPlus, Bookmark, Plus, FileCheck2 } from 'lucide-react';

export default function LibraryVideoCard({ 
  video, 
  onOpen, 
  onDelete, 
  onAddToPlaylist,
  playlists = [],
  onSave,
  isSaved,
  onCreatePlaylist
}) {
  const { isDark } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { processedVideoIds } = useApp();
  const metadata = video.metadata || {};
  const menuRef = useRef(null);

  // Close dropdown menu when clicking outside the card
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if notes already exist/processed for this video ID
  const isProcessed = video.notesReady || (processedVideoIds && processedVideoIds.has(video.videoId));

  return (
    <div className={`group border rounded-xl transition duration-300 shadow-md relative flex flex-col justify-between ${
      isDark ? 'border-zinc-900 hover:border-zinc-800 bg-zinc-950/40' : 'border-orange-200/90 hover:border-orange-300 bg-white'
    } ${isMenuOpen ? 'z-50 shadow-xl' : 'z-10'}`}>
      
      {/* 16:9 Thumbnail Area with rounded top borders */}
      <div className={`relative w-full aspect-video border-b overflow-hidden shrink-0 rounded-t-xl ${
        isDark ? 'bg-zinc-900 border-zinc-900/60' : 'bg-orange-50 border-orange-100'
      }`}>
        {metadata.thumbnail ? (
          <img
            src={metadata.thumbnail}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.01] transition duration-300"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-zinc-900 text-zinc-700' : 'bg-orange-50 text-orange-300'}`}>
            <PlayCircle className="w-6 h-6" />
          </div>
        )}

        {/* Play Overlay */}
        <div 
          onClick={onOpen}
          className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10 cursor-pointer"
        >
          <PlayCircle className="w-8 h-8 text-orange-500 bg-black/80 rounded-full p-0.5 shadow-md scale-95 group-hover:scale-100 transition-transform duration-250" />
        </div>
      </div>

      {/* Info Area */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <h4 
            onClick={onOpen}
            className={`text-xs sm:text-sm font-bold group-hover:text-orange-500 cursor-pointer transition line-clamp-2 leading-snug ${
              isDark ? 'text-zinc-150' : 'text-orange-950'
            }`}
          >
            {metadata.title || 'Saved Video'}
          </h4>
          <p className={`text-[10px] sm:text-xs font-semibold truncate ${
            isDark ? 'text-zinc-450' : 'text-orange-800'
          }`}>
            {metadata.channel || 'YouTube Video'}
          </p>
        </div>

        {/* Action strip: Left (Process complete icon) & Right (Save, Playlist, Delete buttons) */}
        <div className={`flex items-center justify-between pt-2 border-t min-h-[28px] ${
          isDark ? 'border-zinc-900/60' : 'border-orange-100'
        }`}>
          {/* Left side: Process Complete Icon */}
          <div className="flex items-center">
            {isProcessed ? (
              <div 
                className="flex items-center text-orange-500 hover:text-orange-400 transition cursor-help"
                title="Notes ready"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="w-3.5" />
            )}
          </div>

          {/* Right side: Action buttons */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Save/Bookmark Button */}
            {onSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave();
                }}
                className={`btn-icon ${isSaved ? '!text-orange-500 bg-orange-500/10' : ''}`}
                title={isSaved ? "Saved to Library" : "Save to Library"}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            )}

            {/* Add to Playlist button & dropdown */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className={`btn-icon ${isMenuOpen ? '!text-orange-500 bg-orange-500/10' : ''}`}
                title="Add to Playlist"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              
              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className={`absolute right-0 bottom-8 w-40 border shadow-2xl rounded-xl p-1.5 z-[70] animate-in fade-in slide-in-from-bottom-1 duration-100 ${
                  isDark ? 'bg-zinc-950 border-zinc-850 text-zinc-200' : 'bg-white border-orange-200 text-orange-950'
                }`}>
                  
                  {/* Scrollable list of existing playlists */}
                  {playlists.length > 0 ? (
                    <div className="space-y-0.5 max-h-24 overflow-y-auto custom-scrollbar mb-1 pb-1 border-b border-inherit">
                      {playlists.map((pl) => {
                        const isInPlaylist = video.playlistIds?.includes(pl.id);
                        return (
                          <button
                            key={pl.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToPlaylist(video.videoId, pl.id, isInPlaylist, video);
                              setIsMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-[9px] font-bold text-left transition cursor-pointer ${
                              isInPlaylist 
                                ? 'text-orange-500 bg-orange-500/15' 
                                : isDark
                                  ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                                  : 'text-orange-950/80 hover:text-orange-900 hover:bg-orange-50'
                            }`}
                          >
                            <span className="truncate pr-2">{pl.name}</span>
                            <span>{isInPlaylist ? '✓' : '+'}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-1 text-[8px] font-bold text-zinc-500 select-none">
                      No playlists found
                    </div>
                  )}

                  {/* Quick Playlist Creation Input inside Dropdown */}
                  {onCreatePlaylist ? (
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const name = newPlaylistName.trim();
                        if (!name) return;
                        setIsCreating(true);
                        try {
                          await onCreatePlaylist(name);
                          setNewPlaylistName('');
                        } catch (err) {
                          console.error('Failed to quick create playlist:', err);
                        } finally {
                          setIsCreating(false);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 mt-1"
                    >
                      <input
                        type="text"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder="New playlist..."
                        disabled={isCreating}
                        className={`flex-1 px-1.5 py-0.5 text-[8px] font-bold border rounded outline-none ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-orange-50/50 border-orange-200 text-orange-950'
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={isCreating || !newPlaylistName.trim()}
                        className="btn-primary !p-1 !rounded-md shrink-0"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </form>
                  ) : null}

                </div>
              )}
            </div>

            {/* Delete Button */}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="btn-icon hover:!text-red-500"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
