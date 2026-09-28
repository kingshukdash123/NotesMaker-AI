import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { FileCheck2, ExternalLink, User } from 'lucide-react';
import VideoActionButtons from '../common/VideoActionButtons';
import { normalizeVideoMetadata } from '../../models';
import { getChannelInitial } from '../../utils/formatters';

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
  
  const norm = normalizeVideoMetadata(video) || {};
  const currentVideoId = norm.videoId || '';
  const isProcessed = Boolean(processedVideoIds && processedVideoIds.has(currentVideoId));
  const channelLetter = getChannelInitial(norm.channel);
  const timeAgoText = norm.timeAgoText;
  const viewsText = norm.viewsText;
  const durationText = norm.durationFormatted;
  const descriptionText = norm.description;

  return (
    <div 
      onClick={onOpen}
      className={`group flex flex-col sm:flex-row gap-3 sm:gap-4.5 cursor-pointer rounded-2xl p-3 sm:p-3.5 transition duration-150 select-none ${
        isDark 
          ? 'bg-zinc-900/40 hover:bg-zinc-900/70 text-zinc-100' 
          : 'bg-zinc-100/70 hover:bg-zinc-100 text-zinc-900'
      }`}
    >
      {/* 16:9 Thumbnail Column */}
      <div className={`relative w-full sm:w-64 md:w-72 lg:w-76 aspect-video rounded-xl overflow-hidden shrink-0 ${
        isDark ? 'bg-zinc-900' : 'bg-zinc-200'
      }`}>
        {norm.thumbnail ? (
          <img
            src={norm.thumbnail}
            alt={norm.title || 'Educational Lecture Thumbnail'}
            className="w-full h-full object-cover transition-transform duration-250 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            isDark ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-100 text-zinc-400'
          }`}>
            <span className="text-xs font-semibold">Video</span>
          </div>
        )}

        {/* Live Broadcast / Duration Badge (Bottom Right) */}
        {norm.isLive ? (
          <div className="absolute bottom-1.5 right-1.5 z-20 bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>LIVE</span>
          </div>
        ) : norm.isLiveArchive ? (
          <div className="absolute bottom-1.5 right-1.5 z-20 bg-purple-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-md tracking-wider">
            <span>LIVE ARCHIVE</span>
          </div>
        ) : durationText ? (
          <div className="absolute bottom-1.5 right-1.5 z-20 bg-black/90 backdrop-blur-2xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm tracking-wide">
            <span>{durationText}</span>
          </div>
        ) : (
          <div className="absolute bottom-1.5 right-1.5 z-20 bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition">
            <span>Watch</span>
          </div>
        )}
      </div>

      {/* Right Content / Info Column (Matching screenshot layout) */}
      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div>
          {/* Full-width Title */}
          <h3 
            className={`text-sm sm:text-base md:text-lg font-bold line-clamp-1 leading-snug transition ${
              isDark ? 'text-zinc-100 group-hover:text-white' : 'text-zinc-900'
            }`}
            title={norm.title || ''}
          >
            {norm.title || 'Educational Video'}
          </h3>

          {/* Channel Row + YouTube External Link */}
          <div className="flex items-center justify-between gap-2 mt-1.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <User className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
              <p className={`text-xs font-medium truncate max-w-[200px] sm:max-w-[320px] ${
                isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600'
              }`}>
                {norm.channel || 'YouTube Creator'}
              </p>

              {timeAgoText && (
                <>
                  <span className={`text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}>•</span>
                  <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {timeAgoText}
                  </span>
                </>
              )}

              {viewsText && (
                <>
                  <span className={`text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}>•</span>
                  <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {viewsText}
                  </span>
                </>
              )}
            </div>

            {/* Direct YouTube link for attribution */}
            {currentVideoId && (
              <a
                href={`https://www.youtube.com/watch?v=${currentVideoId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`p-1 rounded-md text-[11px] transition flex items-center gap-1 opacity-70 hover:opacity-100 shrink-0 ${
                  isDark ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                }`}
                title="Open video on YouTube"
                aria-label="Open on YouTube"
              >
                <span className="hidden sm:inline">YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Description Snippet */}
          {descriptionText && (
            <p className={`mt-2 text-xs line-clamp-2 leading-relaxed ${
              isDark ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              {descriptionText}
            </p>
          )}
        </div>

        {/* Action Bar at the bottom left */}
        <div className="flex items-center gap-2 mt-3 sm:mt-auto pt-1">
          <VideoActionButtons
            video={norm}
            playlists={playlists}
            isSaved={isSaved}
            onSave={onSave}
            onAddToPlaylist={onAddToPlaylist}
            onCreatePlaylist={onCreatePlaylist}
            popoverPlacement="bottom"
            popoverAlign="left"
          />

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

