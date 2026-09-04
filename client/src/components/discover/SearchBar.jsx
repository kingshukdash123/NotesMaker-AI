import { useMemo } from 'react';
import { Search, X, PlayCircle, ListVideo } from 'lucide-react';
import { extractYouTubeVideoId, extractYouTubePlaylistId } from '../../utils/router';
import { useTheme } from '../../context/ThemeContext';

export default function SearchBar({
  value = '',
  onChange,
  onSubmit,
  onClear,
  placeholder = "Search for courses, lectures, or topics (or paste any YouTube video / playlist link)..."
}) {
  const { isDark } = useTheme();
  const isPlaylistUrl = useMemo(() => Boolean(extractYouTubePlaylistId(value)), [value]);
  const isVideoUrl = useMemo(() => !isPlaylistUrl && Boolean(extractYouTubeVideoId(value)), [value, isPlaylistUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit();
  };

  const handleClear = () => {
    if (onChange) onChange('');
    if (onClear) onClear();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && value) {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative group space-y-2">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        {isPlaylistUrl ? (
          <ListVideo className="absolute left-4 w-4 h-4 text-orange-500 transition duration-200 shrink-0 pointer-events-none" />
        ) : isVideoUrl ? (
          <PlayCircle className="absolute left-4 w-4 h-4 text-orange-500 transition duration-200 shrink-0 pointer-events-none" />
        ) : (
          <Search className={`absolute left-4 w-4 h-4 transition duration-200 shrink-0 pointer-events-none ${
            isDark ? 'text-zinc-500 group-focus-within:text-orange-500' : 'text-orange-900/40 group-focus-within:text-orange-600'
          }`} />
        )}

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full rounded-2xl pl-11 pr-36 sm:pr-44 py-3 text-xs sm:text-sm transition font-medium focus:outline-none focus:ring-1 ${
            isDark
              ? 'bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-700 focus:ring-zinc-700'
              : 'bg-white border border-orange-200 text-orange-950 placeholder-orange-900/40 focus:border-orange-400 focus:ring-orange-400 shadow-xs'
          }`}
        />

        {/* Right Action Cluster: Clear button + Submit button (Unified to prevent overlap) */}
        <div className="absolute right-1.5 sm:right-2 flex items-center gap-1.5 shrink-0">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className={`p-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                isDark
                  ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80'
                  : 'text-orange-900/50 hover:text-orange-950 hover:bg-orange-100'
              }`}
              aria-label="Clear search input"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            className="btn-primary px-3 sm:px-4 py-1.5 sm:py-2 !rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {isPlaylistUrl ? (
              <span>Open Playlist</span>
            ) : isVideoUrl ? (
              <span>Open Video</span>
            ) : (
              <span>Search</span>
            )}
          </button>
        </div>
      </div>

      {/* Smart Paste Detection Pill */}
      {(isPlaylistUrl || isVideoUrl) && (
        <div className={`flex items-start sm:items-center gap-2 text-[11px] font-medium px-3.5 py-1.5 rounded-xl border animate-in fade-in duration-200 ${
          isDark
            ? 'bg-orange-500/10 border-orange-500/25 text-orange-300'
            : 'bg-orange-50 border-orange-200 text-orange-900 shadow-2xs'
        }`}>
          <span className="relative flex h-2 w-2 shrink-0 mt-1 sm:mt-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
          </span>
          <span className="leading-relaxed">
            {isPlaylistUrl
              ? 'YouTube Playlist URL detected — Click "Open Playlist" to browse all lectures.'
              : 'Direct YouTube Video URL detected — Click "Open Video" to jump straight to study workspace.'}
          </span>
        </div>
      )}
    </form>
  );
}

