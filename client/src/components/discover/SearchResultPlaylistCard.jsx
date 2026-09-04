import { ListVideo, Play } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getChannelInitial } from '../../utils/formatters';

export default function SearchResultPlaylistCard({ playlist, onOpen }) {
  const { isDark } = useTheme();
  const channelLetter = getChannelInitial(playlist.channel);

  return (
    <div
      onClick={() => onOpen(playlist)}
      className={`group flex flex-col sm:flex-row gap-3 sm:gap-4.5 cursor-pointer rounded-2xl p-2 sm:p-2.5 transition duration-150 select-none border border-transparent ${
        isDark 
          ? 'hover:bg-zinc-900/40 hover:border-zinc-850' 
          : 'hover:bg-orange-50/60 hover:border-orange-100'
      }`}
    >
      {/* Thumbnail Column with YouTube Playlist Stack Overlay */}
      <div className={`relative w-full sm:w-64 md:w-76 lg:w-88 aspect-video rounded-xl overflow-hidden shrink-0 border shadow-xs ${
        isDark ? 'border-zinc-800/60 bg-zinc-900' : 'border-orange-200/80 bg-orange-50'
      }`}>
        {playlist.thumbnail ? (
          <img
            src={playlist.thumbnail}
            alt={playlist.title}
            className="w-full h-full object-cover transition-transform duration-250 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            isDark ? 'bg-zinc-900 text-zinc-600' : 'bg-orange-50 text-orange-400'
          }`}>
            <ListVideo className="w-10 h-10" />
          </div>
        )}

        {/* Right-Side Playlist Badge Panel (YouTube Signature Style) */}
        <div className="absolute top-0 right-0 bottom-0 w-[38%] bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-1 z-10 select-none">
          <ListVideo className="w-5 h-5 sm:w-6 sm:h-6 text-white/90" />
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-white/90">
            Playlist
          </span>
        </div>

        {/* Play All Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center z-20">
          <div className="flex items-center gap-1.5 text-white text-xs font-bold uppercase tracking-wider bg-black/75 px-3 py-1.5 rounded-lg shadow-md">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play All</span>
          </div>
        </div>
      </div>

      {/* Info Column */}
      <div className="flex-1 flex flex-col min-w-0 justify-start py-0.5">
        <h3 className={`text-sm sm:text-base md:text-lg font-semibold line-clamp-2 leading-snug transition ${
          isDark ? 'text-zinc-100 group-hover:text-white' : 'text-orange-950 group-hover:text-orange-600'
        }`}>
          {playlist.title}
        </h3>

        {/* Channel Row */}
        <div className="flex items-center gap-2 mt-2 sm:mt-2.5">
          <div className={`w-6 h-6 rounded-full border font-bold flex items-center justify-center shrink-0 text-[10px] uppercase select-none ${
            isDark ? 'bg-zinc-800 border-zinc-700/60 text-zinc-300' : 'bg-orange-100 border-orange-200 text-orange-800'
          }`}>
            {channelLetter}
          </div>
          <p className={`text-xs font-medium truncate ${
            isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-orange-800 hover:text-orange-950'
          }`}>
            {playlist.channel}
          </p>
        </div>

        {/* Action Link: View Full Playlist */}
        <p className="text-xs font-semibold text-orange-500 mt-2 sm:mt-3 flex items-center gap-1 group-hover:underline">
          <span>View full playlist</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </p>

        {/* Description Snippet */}
        {playlist.description && (
          <p className={`mt-2 text-xs line-clamp-1 sm:line-clamp-2 leading-relaxed ${
            isDark ? 'text-zinc-500' : 'text-orange-900/60'
          }`}>
            {playlist.description}
          </p>
        )}
      </div>
    </div>
  );
}
