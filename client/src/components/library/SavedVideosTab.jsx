import LibraryVideoCard from './LibraryVideoCard';
import { BookOpen } from 'lucide-react';

export default function SavedVideosTab({ 
  savedVideos = [], 
  playlists = [],
  onOpenVideo, 
  onRemoveVideo, 
  onTogglePlaylistAssociation,
  onNavigateToDiscover,
  onCreatePlaylist,
  onToggleSave
}) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-in fade-in duration-300">
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
  );
}
