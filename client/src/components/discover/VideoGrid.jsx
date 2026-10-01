import { useTheme } from '../../context/ThemeContext';
import SearchResultCard from './SearchResultCard';
import SearchResultPlaylistCard from './SearchResultPlaylistCard';
import VideoGridSkeleton from '../skeletons/VideoGridSkeleton';
import { Film } from 'lucide-react';
import { normalizeVideoMetadata } from '../../models';

export default function VideoGrid({
  videos = [],
  isLoading = false,
  onVideoClick,
  onPlaylistClick,
  hasSearched = false,
  savedVideos = [],
  playlists = [],
  onSaveVideo,
  onSavePlaylistToLibrary,
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
        isDark ? 'bg-zinc-950/20 border-zinc-900' : 'bg-white border-zinc-200 shadow-xs'
      }`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          isDark ? 'bg-zinc-900 text-zinc-500' : 'bg-zinc-100 text-zinc-400'
        }`}>
          <Film className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className={`text-xs sm:text-sm font-bold ${
            isDark ? 'text-zinc-300' : 'text-zinc-900'
          }`}>
            {hasSearched ? "No matching lectures or courses found" : "Explore educational lectures & courses"}
          </h3>
          <p className={`text-[10px] sm:text-xs max-w-xs mx-auto leading-relaxed ${
            isDark ? 'text-zinc-500' : 'text-zinc-500'
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
              userPlaylists={playlists}
              onSaveToLibrary={onSavePlaylistToLibrary}
              onOpen={() => onPlaylistClick && onPlaylistClick(item)}
            />
          );
        }

        // Otherwise item is a Video / Live Stream
        const normalized = normalizeVideoMetadata(item) || {};
        const rawVidId = normalized.videoId;
        const isSaved = savedVideos.some(v => (v.videoId || v.id) === rawVidId);
        const assignedPlaylistIds = playlists
          .filter(p => (p.videos || []).some(v => (v.videoId || v.id) === rawVidId))
          .map(p => p.id);
        normalized.playlistIds = assignedPlaylistIds;

        return (
          <SearchResultCard
            key={rawVidId}
            video={normalized}
            playlists={playlists}
            isSaved={isSaved}
            onOpen={() => onVideoClick(normalized)}
            onSave={() => onSaveVideo(normalized)}
            onAddToPlaylist={(videoId, playlistId, alreadyAssociated) =>
              onTogglePlaylistAssociation(videoId, playlistId, alreadyAssociated, normalized)
            }
            onCreatePlaylist={onCreatePlaylist}
          />
        );
      })}
    </div>
  );
}

