import LibraryVideoCard from '../library/LibraryVideoCard';
import VideoGridSkeleton from '../skeletons/VideoGridSkeleton';
import { Film } from 'lucide-react';

export default function VideoGrid({ 
  videos = [], 
  isLoading = false, 
  onVideoClick,
  hasSearched = false,
  savedVideos = [],
  playlists = [],
  onSaveVideo,
  onTogglePlaylistAssociation,
  onCreatePlaylist
}) {
  if (isLoading) {
    return <VideoGridSkeleton count={8} />;
  }

  if (videos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-950/20 border border-zinc-900 rounded-2xl py-16 gap-4">
        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
          <Film className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs sm:text-sm font-bold text-zinc-300">
            {hasSearched ? "No matching lectures found" : "Explore educational lectures"}
          </h3>
          <p className="text-[10px] sm:text-xs text-zinc-550 max-w-xs mx-auto leading-relaxed">
            {hasSearched 
              ? "Try adjusting your search terms or choosing a different subject filter." 
              : "Search for concepts, courses, or specific video subjects to get started."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {videos.map((video) => {
        const isSaved = savedVideos.some(v => v.videoId === video.videoId);
        const matchSaved = savedVideos.find(v => v.videoId === video.videoId);
        
        const videoObject = {
          videoId: video.videoId,
          videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
          metadata: {
            title: video.title,
            channel: video.channel,
            thumbnail: video.thumbnail
          },
          playlistIds: matchSaved?.playlistIds || []
        };

        return (
          <LibraryVideoCard
            key={video.videoId}
            video={videoObject}
            playlists={playlists}
            isSaved={isSaved}
            onOpen={() => onVideoClick(video)}
            onSave={() => onSaveVideo(video)}
            onAddToPlaylist={(videoId, playlistId, alreadyAssociated) => 
              onTogglePlaylistAssociation(videoId, playlistId, alreadyAssociated, video)
            }
            onCreatePlaylist={onCreatePlaylist}
          />
        );
      })}
    </div>
  );
}
