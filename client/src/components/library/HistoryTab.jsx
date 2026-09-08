import { useEffect } from 'react';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import LibraryVideoCard from './LibraryVideoCard';
import VideoGridSkeleton from '../skeletons/VideoGridSkeleton';
import { Trash2, Clock } from 'lucide-react';

export default function HistoryTab({ 
  onOpenVideo, 
  playlists = [], 
  onTogglePlaylistAssociation,
  onCreatePlaylist,
  onToggleSave,
  savedVideos = []
}) {
  const { 
    history = [], 
    isLoading = false, 
    fetchHistory, 
    deleteItem, 
    clearAll 
  } = useWatchHistory();

  const { showConfirm } = useApp();
  const { isDark } = useTheme();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleClearAll = async () => {
    const confirmed = await showConfirm('Are you sure you want to clear your entire watch history?');
    if (confirmed) {
      await clearAll();
    }
  };

  const handleOpenItem = (item) => {
    if (onOpenVideo) {
      onOpenVideo({
        videoId: item.videoId,
        videoUrl: item.videoUrl,
        metadata: item.metadata,
      });
    }
  };

  if (isLoading) {
    return <VideoGridSkeleton count={8} layout="grid" />;
  }

  if (history.length === 0) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 ${isDark ? 'bg-zinc-950/20 border border-zinc-900' : 'bg-white border border-zinc-200/80 shadow-xs'} rounded-2xl py-16 gap-4 animate-in fade-in duration-300`}>
        <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-zinc-900 text-zinc-500' : 'bg-zinc-100 text-zinc-600'} flex items-center justify-center`}>
          <Clock className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-900'} font-sans`}>No watch history yet</h3>
          <p className={`text-[10px] sm:text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'} max-w-xs mx-auto leading-relaxed`}>
            Videos you open or process will appear here so you can easily resume studying later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Tab control bar (Pinned) */}
      <div className={`flex items-center justify-between border-b ${isDark ? 'border-zinc-900/50' : 'border-zinc-200/80'} pb-2 shrink-0`}>
        <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>WATCH HISTORY</span>
        <button
          type="button"
          onClick={handleClearAll}
          className="btn-danger-subtle px-2.5 py-1 text-[10px] font-bold !rounded-lg"
          title="Clear entire history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      {/* History Grid (Only Grid is Scrollable!) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {history.map((item) => {
            const videoObject = {
              videoId: item.videoId,
              videoUrl: item.videoUrl,
              metadata: item.metadata,
            };

            return (
              <LibraryVideoCard
                key={item.id}
                video={videoObject}
                playlists={playlists}
                onOpen={() => handleOpenItem(item)}
                onDelete={async () => {
                  const confirmed = await showConfirm('Are you sure you want to remove this video from your watch history?');
                  if (confirmed) {
                    deleteItem(item.id);
                  }
                }}
                onAddToPlaylist={onTogglePlaylistAssociation}
                onCreatePlaylist={onCreatePlaylist}
                onSave={() => onToggleSave(videoObject)}
                isSaved={savedVideos.some(v => v.videoId === item.videoId)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
