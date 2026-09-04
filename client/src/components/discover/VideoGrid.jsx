import { useTheme } from '../../context/ThemeContext';
import SearchResultCard from './SearchResultCard';
import SearchResultPlaylistCard from './SearchResultPlaylistCard';
import VideoGridSkeleton from '../skeletons/VideoGridSkeleton';
import { Film } from 'lucide-react';

export default function VideoGrid({
  videos = [],
  isLoading = false,
  onVideoClick,
  onPlaylistClick,
  hasSearched = false,
  savedVideos = [],
  playlists = [],
  onSaveVideo,
  onTogglePlaylistAssociation,
  onCreatePlaylist
}) {
  const { isDark } = useTheme();

  if (isLoading) {
    return <VideoGridSkeleton count={8} layout="list" />;
  }

  if (videos.length === 0) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-2xl py-16 gap-4 ${
        isDark ? 'bg-zinc-950/20 border-zinc-900' : 'bg-orange-50/40 border-orange-100'
      }`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          isDark ? 'bg-zinc-900 text-zinc-500' : 'bg-orange-100 text-orange-400'
        }`}>
          <Film className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className={`text-xs sm:text-sm font-bold ${
            isDark ? 'text-zinc-300' : 'text-orange-950'
          }`}>
            {hasSearched ? "No matching lectures or courses found" : "Explore educational lectures & courses"}
          </h3>
          <p className={`text-[10px] sm:text-xs max-w-xs mx-auto leading-relaxed ${
            isDark ? 'text-zinc-500' : 'text-orange-900/60'
          }`}>
            {hasSearched
              ? "Try adjusting your search terms or choosing a different content filter."
              : "Search for concepts, full course playlists, or specific video subjects to get started."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full">
      {videos.map((item) => {
        // If item is a Playlist
        if (item.mediaType === 'playlist' || (item.playlistId && !item.videoId)) {
          return (
            <SearchResultPlaylistCard
              key={item.playlistId || item.id}
              playlist={item}
              onOpen={() => onPlaylistClick && onPlaylistClick(item)}
            />
          );
        }

        // Otherwise item is a Video / Live Stream
        const isSaved = savedVideos.some(v => v.videoId === item.videoId);
        const matchSaved = savedVideos.find(v => v.videoId === item.videoId);

        const videoObject = {
          videoId: item.videoId,
          videoUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
          isLive: item.isLive,
          mediaType: item.mediaType,
          description: item.description || '',
          metadata: {
            title: item.title,
            channel: item.channel,
            thumbnail: item.thumbnail,
            description: item.description || '',
            is_live: item.isLive,
          },
          playlistIds: matchSaved?.playlistIds || []
        };

        return (
          <SearchResultCard
            key={item.videoId || item.id}
            video={videoObject}
            playlists={playlists}
            isSaved={isSaved}
            onOpen={() => onVideoClick(item)}
            onSave={() => onSaveVideo(item)}
            onAddToPlaylist={(videoId, playlistId, alreadyAssociated) =>
              onTogglePlaylistAssociation(videoId, playlistId, alreadyAssociated, item)
            }
            onCreatePlaylist={onCreatePlaylist}
          />
        );
      })}
    </div>
  );
}
