import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { FileCheck2 } from 'lucide-react';
import VideoActionButtons from '../common/VideoActionButtons';
import { formatTimeAgo, getChannelInitial } from '../../utils/formatters';

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
  const { processedVideoIds } = useApp();
  const metadata = video.metadata || {};

  // Check if notes already exist/processed for this video ID
  const isProcessed = Boolean(processedVideoIds && processedVideoIds.has(video.videoId));
  const channelLetter = getChannelInitial(metadata.channel);
  const timeAgoText = formatTimeAgo(metadata.publishedAt || video.publishedAt);

  return (
    <div className="group flex flex-col h-full cursor-pointer transition duration-150 rounded-xl select-none">
      {/* 16:9 Clean YouTube Thumbnail */}
      <div
        onClick={onOpen}
        className={`relative w-full aspect-video rounded-xl overflow-hidden shrink-0 border shadow-xs ${
          isDark ? 'border-zinc-800/60 bg-zinc-900' : 'border-zinc-200 bg-zinc-100'
        }`}
      >
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

        {/* Live Broadcast Badges (Bottom Right / Top Left) */}
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

      {/* Details Section (Flex-1 to align Action Bar at bottom) */}
      <div className="pt-2.5 px-0.5 flex-1 flex flex-col justify-between min-w-0">
        {/* Top Channel & Title Info */}
        <div className="flex items-start gap-2.5 min-w-0">
          {/* Channel Avatar Circle */}
          <div
            onClick={onOpen}
            className={`w-8 h-8 rounded-full border font-bold flex items-center justify-center shrink-0 text-xs uppercase mt-0.5 select-none ${
              isDark ? 'bg-zinc-800 border-zinc-700/60 text-zinc-300' : 'bg-orange-100 border-orange-200 text-orange-800'
            }`}
          >
            {channelLetter}
          </div>

          {/* Text Info */}
          <div className="flex-1 min-w-0">
            {/* Dynamic title */}
            <h4
              onClick={onOpen}
              className={`text-sm font-bold line-clamp-2 leading-snug transition ${
                isDark ? 'text-zinc-100 group-hover:text-white' : 'text-orange-950 group-hover:text-orange-600'
              }`}
              title={metadata.title || ''}
            >
              {metadata.title || 'Educational Video'}
            </h4>

            {/* 1 Line for Channel Name */}
            <div className="flex items-center gap-1.5 mt-0.5 pb-2 min-w-0">
              <p
                onClick={onOpen}
                className={`text-xs truncate font-medium ${
                  isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-orange-800 hover:text-orange-950'
                }`}
                title={metadata.channel || ''}
              >
                {metadata.channel || 'YouTube Creator'}
              </p>
              {timeAgoText && (
                <>
                  <span className={`text-[10px] shrink-0 ${isDark ? 'text-zinc-600' : 'text-orange-300'}`}>•</span>
                  <span className={`text-[11px] shrink-0 font-normal ${isDark ? 'text-zinc-500' : 'text-orange-900/60'}`}>
                    {timeAgoText}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar Pinned at the Bottom of the Card: Action Buttons first, Notes Icon in last */}
        <div className={`mt-auto pt-2 flex items-center justify-between border-t min-h-[32px] ${
          isDark ? 'border-zinc-800/60' : 'border-orange-100'
        }`}>
          {/* Action Buttons first */}
          <VideoActionButtons
            video={video}
            playlists={playlists}
            isSaved={isSaved}
            onSave={onSave}
            onAddToPlaylist={onAddToPlaylist}
            onCreatePlaylist={onCreatePlaylist}
            onDelete={onDelete}
            popoverPlacement="top"
            popoverAlign="left"
          />

          {/* Notes generated icon in last */}
          {isProcessed ? (
            <span
              title="Notes generated & ready"
              className={`inline-flex items-center justify-center p-1.5 rounded-lg shrink-0 ${
                isDark ? 'text-green-500 bg-green-500/15' : 'text-green-700 bg-green-700/15'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
            </span>
          ) : (
            <div className="w-6.5" />
          )}
        </div>
      </div>
    </div>
  );
}
