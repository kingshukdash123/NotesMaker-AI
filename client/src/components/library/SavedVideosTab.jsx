import LibraryVideoCard from './LibraryVideoCard';
import VideoGridSkeleton from '../skeletons/VideoGridSkeleton';
import { BookOpen } from 'lucide-react';

export default function SavedVideosTab({ 
  savedVideos = [], 
  playlists = [],
  isLoading = false,
  onOpenVideo, 
  onRemoveVideo, 
  onTogglePlaylistAssociation,
  onNavigateToDiscover,
  onCreatePlaylist,
  onToggleSave
}) {
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden space-y-3 sm:space-y-4 animate-in fade-in duration-300">
        <div className="border-b border-zinc-900/50 pb-2 shrink-0">
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-550">
            SAVED VIDEOS
          </span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
          <VideoGridSkeleton count={8} layout="grid" />
        </div>
      </div>
    );
  }

  if (savedVideos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-950/20 border border-zinc-900 rounded-2xl py-16 gap-4 animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs sm:text-sm font-bold text-zinc-300">Your library is empty</h3>
          <p className="text-[10px] sm:text-xs text-zinc-550 max-w-xs mx-auto leading-relaxed">
            Save educational videos from the Discover page to build your study collection.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToDiscover}
          className="btn-primary px-4 py-2 text-xs font-bold"
        >
          Go to Discover
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Saved Videos Header (Pinned) */}
      <div className="flex items-center justify-between border-b border-zinc-900/50 pb-2 shrink-0">
        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-550">
          SAVED VIDEOS
        </span>
      </div>

      {/* Grid listing (Only Grid is Scrollable!) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {savedVideos.map((video) => (
            <LibraryVideoCard
              key={video.videoId}
              video={video}
              playlists={playlists}
              onOpen={() => onOpenVideo(video)}
              onDelete={() => onRemoveVideo(video.videoId)}
              onAddToPlaylist={onTogglePlaylistAssociation}
              onCreatePlaylist={onCreatePlaylist}
              onSave={() => onToggleSave(video)}
              isSaved={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
