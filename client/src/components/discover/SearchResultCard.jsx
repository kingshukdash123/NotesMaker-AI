import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { FileCheck2 } from 'lucide-react';
import VideoActionButtons from '../common/VideoActionButtons';
import { formatTimeAgo, getChannelInitial } from '../../utils/formatters';

export default function SearchResultCard({
  video,
  onOpen,
  onAddToPlaylist,
  playlists = [],
  onSave,
  isSaved,
  onCreatePlaylist
}) {
  const { isDark } = useTheme();
  const { processedVideoIds } = useApp();
  const metadata = video.metadata || {};

  const isProcessed = Boolean(processedVideoIds && processedVideoIds.has(video.videoId));
  const channelLetter = getChannelInitial(metadata.channel);
  const timeAgoText = formatTimeAgo(metadata.publishedAt || video.publishedAt);

  return (
    <div 
      onClick={onOpen}
      className={`group flex flex-col sm:flex-row gap-3 sm:gap-4.5 cursor-pointer rounded-2xl p-2 sm:p-2.5 transition duration-150 select-none border border-transparent ${
        isDark 
          ? 'hover:bg-zinc-900/40 hover:border-zinc-850' 
          : 'hover:bg-orange-50/60 hover:border-orange-100'
      }`}
    >
      {/* 16:9 Thumbnail Column */}
      <div className={`relative w-full sm:w-64 md:w-76 lg:w-88 aspect-video rounded-xl overflow-hidden shrink-0 border shadow-xs ${
        isDark ? 'border-zinc-800/60 bg-zinc-900' : 'border-zinc-200 bg-zinc-100'
      }`}>
        {metadata.thumbnail ? (
          <img
            src={metadata.thumbnail}
            alt={metadata.title || ''}
            className="w-full h-full object-cover transition-transform duration-250 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            isDark ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-100 text-zinc-400'
          }`}>
            <span className="text-xs font-semibold">Video</span>
          </div>
        )}

        {/* Live Broadcast / Watch Badge (Bottom Right) */}
        {(video.isLive || video.mediaType === 'live') ? (
          <div className="absolute bottom-1.5 right-1.5 z-20 bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>LIVE</span>
          </div>
        ) : video.mediaType === 'live_archive' ? (
          <div className="absolute bottom-1.5 right-1.5 z-20 bg-purple-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-md tracking-wider">
            <span>LIVE ARCHIVE</span>
          </div>
        ) : (
          <div className="absolute bottom-1.5 right-1.5 z-20 bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition">
            <span>Watch</span>
          </div>
        )}
      </div>

      {/* Right Content / Info Column (YouTube Search List Style) */}
      <div className="flex-1 flex flex-col min-w-0 justify-start py-0.5">
        {/* Full-width Title */}
        <h3 
          className={`text-sm sm:text-base md:text-lg font-semibold line-clamp-2 leading-snug transition ${
            isDark ? 'text-zinc-100 group-hover:text-white' : 'text-orange-950 group-hover:text-orange-600'
          }`}
          title={metadata.title || ''}
        >
          {metadata.title || 'Educational Video'}
        </h3>

        {/* Channel Row */}
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-5.5 h-5.5 rounded-full border font-bold flex items-center justify-center shrink-0 text-[10px] uppercase select-none ${
            isDark ? 'bg-zinc-800 border-zinc-700/60 text-zinc-300' : 'bg-orange-100 border-orange-200 text-orange-800'
          }`}>
            {channelLetter}
          </div>

          <p className={`text-xs font-medium truncate max-w-[200px] sm:max-w-[320px] ${
            isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-orange-800 hover:text-orange-950'
          }`}>
            {metadata.channel || 'YouTube Creator'}
          </p>

          {timeAgoText && (
            <>
              <span className={`text-xs ${isDark ? 'text-zinc-600' : 'text-orange-300'}`}>•</span>
              <span className={`text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-orange-900/60'}`}>
                {timeAgoText}
              </span>
            </>
          )}
        </div>

        {/* Action Bar Below Channel Name: Action Buttons first, Processed Icon last */}
        <div className={`flex items-center gap-8 sm:gap-10 mt-2.5 pt-2 border-t ${
          isDark ? 'border-zinc-800/60' : 'border-orange-100'
        }`}>
          {/* Action Buttons Cluster first */}
          <VideoActionButtons
            video={video}
            playlists={playlists}
            isSaved={isSaved}
            onSave={onSave}
            onAddToPlaylist={onAddToPlaylist}
            onCreatePlaylist={onCreatePlaylist}
            popoverPlacement="bottom"
            popoverAlign="left"
          />

          {/* Video Processed Icon in last */}
          {isProcessed && (
            <span
              title="Notes generated & ready"
              className={`inline-flex items-center justify-center p-1.5 rounded-lg shrink-0 ${
                isDark ? 'text-green-500 bg-green-500/15' : 'text-green-700 bg-green-700/15'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
