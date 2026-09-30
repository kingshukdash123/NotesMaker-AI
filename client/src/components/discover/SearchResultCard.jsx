import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { User, Clock, Eye } from 'lucide-react';
import YouTubeIcon from '../common/YouTubeIcon';
import VideoActionButtons from '../common/VideoActionButtons';
import LiveBadge from '../common/LiveBadge';
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
  const { openChannelExplorer } = useApp() || {};

  const norm = normalizeVideoMetadata(video) || {};
  const currentVideoId = norm.videoId || '';
  const channelLetter = getChannelInitial(norm.channel);
  const timeAgoText = norm.timeAgoText;
  const viewsText = norm.viewsText;
  const durationText = (!norm.isLive && norm.durationFormatted && norm.durationFormatted !== '0:00' && norm.durationFormatted !== '00:00' && norm.durationFormatted !== '0:00:00') ? norm.durationFormatted : '';
  const descriptionText = norm.description;

  return (
    <div
      onClick={onOpen}
      className={`group flex flex-col sm:flex-row gap-3 sm:gap-4.5 cursor-pointer rounded-2xl p-3 sm:p-3.5 transition duration-150 select-none ${isDark
          ? 'bg-zinc-900/40 hover:bg-zinc-900/70 text-zinc-100'
          : 'bg-zinc-100/70 hover:bg-zinc-100 text-zinc-900'
        }`}
    >
      {/* 16:9 Thumbnail Column */}
      <div className={`relative w-full sm:w-64 md:w-72 lg:w-76 aspect-video rounded-xl overflow-hidden shrink-0 ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'
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
          <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-100 text-zinc-400'
            }`}>
            <span className="text-xs font-semibold">Video</span>
          </div>
        )}

        {/* Bottom-Right: Live Badge / Duration Timestamp / Watch */}
        {norm.isLive ? (
          <div className="absolute bottom-1.5 right-1.5 z-20">
            <LiveBadge size="sm" />
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

      {/* Right Content / Info Column */}
      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div>
          {/* Full-width Title (2 lines on phone view) */}
          <h3
            className={`text-sm sm:text-base md:text-lg font-bold line-clamp-2 leading-snug transition ${isDark ? 'text-zinc-100 group-hover:text-white' : 'text-zinc-900'
              }`}
            title={norm.title || ''}
          >
            {norm.title || 'Educational Video'}
          </h3>

          {/* ── Mobile Layout (< sm): Channel/Ago-Views on Left, Actions & YouTube on Right ── */}
          <div className="flex sm:hidden items-center justify-between gap-2 min-w-0 mt-1.5">
            {/* Left: Channel + Ago & Views */}
            <div className="min-w-0">
              {/* Channel Row */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (openChannelExplorer) {
                    openChannelExplorer(norm.channelId, norm.channel);
                  }
                }}
                className="flex items-center gap-1.5 min-w-0 cursor-pointer group/channel"
                title={`Explore channel: ${norm.channel || 'YouTube Creator'}`}
              >
                <User className={`w-3.5 h-3.5 shrink-0 transition-colors ${isDark ? 'text-zinc-500 group-hover/channel:text-zinc-200' : 'text-zinc-400 group-hover/channel:text-zinc-700'}`} />
                <p className={`text-xs font-medium truncate max-w-[150px] transition-colors ${isDark ? 'text-zinc-400 group-hover/channel:text-zinc-200 group-hover/channel:underline' : 'text-zinc-600 group-hover/channel:text-zinc-900 group-hover/channel:underline'
                  }`}>
                  {norm.channel || 'YouTube Creator'}
                </p>
              </div>

              {/* Time Ago & Views */}
              {(timeAgoText || viewsText) && (
                <div className={`flex items-center gap-2 text-xs font-medium mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-500'
                  }`}>
                  {timeAgoText && (
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{timeAgoText}</span>
                    </span>
                  )}
                  {viewsText && (
                    <span className="flex items-center gap-1 shrink-0">
                      <Eye className="w-3 h-3 shrink-0" />
                      <span>{viewsText}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Actions: Buttons & YouTube */}
            <div className="flex items-center gap-1 shrink-0">
              <VideoActionButtons
                video={norm}
                playlists={playlists}
                isSaved={isSaved}
                onSave={onSave}
                onAddToPlaylist={onAddToPlaylist}
                onCreatePlaylist={onCreatePlaylist}
                popoverPlacement="bottom"
                popoverAlign="right"
              />

              {/* YouTube link at extreme right */}
              {currentVideoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${currentVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`p-1.5 rounded-lg transition-all flex items-center justify-center shrink-0 opacity-80 hover:opacity-100 ${isDark
                      ? 'hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                      : 'hover:bg-zinc-200/70 text-zinc-500 hover:text-zinc-900'
                    }`}
                  title="Watch on YouTube"
                  aria-label="Watch on YouTube"
                >
                  <YouTubeIcon className="w-4 h-4 transition-transform hover:scale-110" />
                </a>
              )}
            </div>
          </div>

          {/* ── Larger Devices Layout (>= sm): Channel -> Ago/Views -> Action Buttons -> Description ── */}
          <div className="hidden sm:block">
            {/* Channel Row */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (openChannelExplorer) {
                  openChannelExplorer(norm.channelId, norm.channel);
                }
              }}
              className="flex items-center gap-1.5 min-w-0 mt-1.5 cursor-pointer group/channel inline-flex"
              title={`Explore channel: ${norm.channel || 'YouTube Creator'}`}
            >
              <User className={`w-3.5 h-3.5 shrink-0 transition-colors ${isDark ? 'text-zinc-500 group-hover/channel:text-zinc-200' : 'text-zinc-400 group-hover/channel:text-zinc-700'}`} />
              <p className={`text-xs font-medium truncate max-w-[320px] transition-colors ${isDark ? 'text-zinc-400 group-hover/channel:text-zinc-200 group-hover/channel:underline' : 'text-zinc-600 group-hover/channel:text-zinc-900 group-hover/channel:underline'
                }`}>
                {norm.channel || 'YouTube Creator'}
              </p>
            </div>

            {/* Time Ago & Views */}
            {(timeAgoText || viewsText) && (
              <div className={`flex items-center gap-2.5 text-xs font-medium mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'
                }`}>
                {timeAgoText && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{timeAgoText}</span>
                  </span>
                )}
                {viewsText && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span>{viewsText}</span>
                  </span>
                )}
              </div>
            )}

            {/* Action Bar: Placed between Ago-Views and Description */}
            <div className="flex items-center justify-between gap-2 mt-2 pt-0.5">
              <div className="flex items-center gap-1.5">
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
              </div>

              {/* YouTube Link on extreme right of Action Bar */}
              {currentVideoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${currentVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`p-1.5 rounded-lg transition-all flex items-center justify-center shrink-0 opacity-80 hover:opacity-100 ${isDark
                      ? 'hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                      : 'hover:bg-zinc-200/70 text-zinc-500 hover:text-zinc-900'
                    }`}
                  title="Watch on YouTube"
                  aria-label="Watch on YouTube"
                >
                  <YouTubeIcon className="w-4 h-4 transition-transform hover:scale-110" />
                </a>
              )}
            </div>

            {/* Description Snippet (2-line clamped on sm+) */}
            {descriptionText && (
              <p className={`line-clamp-2 mt-2 text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                {descriptionText}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

