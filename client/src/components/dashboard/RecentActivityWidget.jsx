import { History, FileText, PlayCircle, ArrowRight, BookOpen, Clock, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import CustomButton from '../common/CustomButton';

export default function RecentActivityWidget({
  watchHistory = [],
  notesHistory = [],
  onOpenVideo,
  onNavigateToHistory,
  onNavigateToNotes
}) {
  const { isDark } = useTheme();

  const recentHistory = (watchHistory || []).slice(0, 10);
  const recentNotes = (notesHistory || []).slice(0, 10);

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    try {
      let date;
      if (typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 2) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className={`rounded-2xl p-4 sm:p-5 md:p-6 transition duration-300 w-full space-y-4 sm:space-y-5 ${
      isDark 
        ? 'bg-zinc-950/40' 
        : 'bg-white/80 shadow-xs'
    }`}>
      {/* ── SECTION HEADER ── */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b ${
        isDark ? 'border-orange-500/15' : 'border-orange-200/70'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isDark 
              ? 'text-orange-500 bg-orange-950/25' 
              : 'text-orange-600 bg-orange-100'
          }`}>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <h3 className={`text-sm sm:text-base md:text-lg font-bold tracking-tight truncate ${
              isDark ? 'text-zinc-100' : 'text-orange-950'
            }`}>
              Recent Activity
            </h3>
            <p className={`text-xs sm:text-[13px] ${isDark ? 'text-zinc-500' : 'text-orange-800/80'}`}>
              Your latest educational lecture streams and generated study outlines
            </p>
          </div>
        </div>
      </div>

      {/* ── 2 COLUMNS: COLUMN 1 (WATCH HISTORY) | COLUMN 2 (GENERATED NOTES) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 items-stretch">

        {/* ══════════════════════════════════════════════════════════════
            COLUMN 1: WATCH HISTORY
           ══════════════════════════════════════════════════════════════ */}
        <div className={`flex flex-col justify-between p-3.5 sm:p-4 md:p-5 rounded-xl ${
          isDark 
            ? 'bg-zinc-900/30' 
            : 'bg-orange-50/50'
        }`}>
          {/* Column Header */}
          <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-orange-500/10 dark:border-orange-500/10">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-orange-500" />
              <span className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
                isDark ? 'text-zinc-200' : 'text-orange-950'
              }`}>
                Watch History
              </span>
            </div>
            <span className={`text-[11px] sm:text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-orange-700'}`}>
              Lectures
            </span>
          </div>

          {/* List */}
          <div className="flex-1 py-3">
            {recentHistory.length === 0 ? (
              <div className={`text-center py-6 px-4 rounded-xl border border-dashed flex flex-col items-center gap-2 ${
                isDark ? 'border-orange-500/20 bg-zinc-950/20' : 'border-orange-200 bg-white/60'
              }`}>
                <Clock className={`w-7 h-7 ${isDark ? 'text-zinc-700' : 'text-orange-300'}`} />
                <div className="space-y-0.5">
                  <p className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-orange-950'}`}>
                    No watch history yet
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-600' : 'text-orange-700'}`}>
                    Watch lectures on Discover to build your study timeline.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[185px] sm:max-h-[215px] custom-scrollbar pr-1">
                {recentHistory.map((item) => {
                  const videoId = item.videoId || item.metadata?.video_id || '';
                  const thumbnail = item.metadata?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                  const title = item.metadata?.title || 'Educational Lecture';
                  const channel = item.metadata?.channel || item.metadata?.author || 'YouTube';
                  const timeAgo = formatRelativeTime(item.openedAt || item.createdAt);

                  return (
                    <div
                      key={item.id || videoId}
                      onClick={() => onOpenVideo && onOpenVideo(item)}
                      className={`group min-h-[48px] p-2 sm:p-2.5 rounded-xl transition-all duration-150 flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none ${
                        isDark 
                          ? 'bg-zinc-950/30 hover:bg-zinc-900/60' 
                          : 'bg-white/70 hover:bg-orange-50/90 shadow-xs'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className={`relative shrink-0 w-16 sm:w-20 aspect-video rounded-lg overflow-hidden ${
                        isDark ? 'bg-zinc-900' : 'bg-orange-100'
                      }`}>
                        <img 
                          src={thumbnail} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                          <PlayCircle className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <h4 className={`text-xs sm:text-sm font-semibold line-clamp-1 group-hover:text-orange-500 transition-colors ${
                          isDark ? 'text-zinc-200' : 'text-orange-950'
                        }`}>
                          {title}
                        </h4>
                        <div className={`flex items-center justify-between text-[11px] sm:text-xs font-medium pt-0.5 ${
                          isDark ? 'text-zinc-500' : 'text-orange-800/80'
                        }`}>
                          <span className="truncate max-w-[100px] min-[380px]:max-w-[140px]">{channel}</span>
                          <span className="shrink-0">{timeAgo}</span>
                        </div>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-2 border-t border-orange-500/10 dark:border-orange-500/10">
            <CustomButton
              variant="secondary"
              size="sm"
              iconRight={ArrowRight}
              onClick={onNavigateToHistory}
              className="w-full justify-between"
            >
              <span>View All Watch History in Library</span>
            </CustomButton>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            COLUMN 2: GENERATED NOTES
           ══════════════════════════════════════════════════════════════ */}
        <div className={`flex flex-col justify-between p-3.5 sm:p-4 md:p-5 rounded-xl ${
          isDark 
            ? 'bg-zinc-900/30' 
            : 'bg-orange-50/50'
        }`}>
          {/* Column Header */}
          <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-orange-500/10 dark:border-orange-500/10">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              <span className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
                isDark ? 'text-zinc-200' : 'text-orange-950'
              }`}>
                Generated Notes
              </span>
            </div>
            <span className={`text-[11px] sm:text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-orange-700'}`}>
              Academic Outlines
            </span>
          </div>

          {/* List */}
          <div className="flex-1 py-3">
            {recentNotes.length === 0 ? (
              <div className={`text-center py-6 px-4 rounded-xl border border-dashed flex flex-col items-center gap-2 ${
                isDark ? 'border-orange-500/20 bg-zinc-950/20' : 'border-orange-200 bg-white/60'
              }`}>
                <BookOpen className={`w-7 h-7 ${isDark ? 'text-zinc-700' : 'text-orange-300'}`} />
                <div className="space-y-0.5">
                  <p className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-orange-950'}`}>
                    No generated notes yet
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-600' : 'text-orange-700'}`}>
                    Summarize and generate academic outlines for any lecture video.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[185px] sm:max-h-[215px] custom-scrollbar pr-1">
                {recentNotes.map((note) => {
                  const videoId = note.metadata?.video_id || '';
                  const thumbnail = note.metadata?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                  const title = note.metadata?.title || 'Academic Outline';
                  const channel = note.metadata?.channel || note.metadata?.author || 'YouTube';
                  const timeAgo = formatRelativeTime(note.createdAt);

                  return (
                    <div
                      key={note.id}
                      onClick={() => onOpenVideo && onOpenVideo(note)}
                      className={`group min-h-[48px] p-2 sm:p-2.5 rounded-xl transition-all duration-150 flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none ${
                        isDark 
                          ? 'bg-zinc-950/30 hover:bg-zinc-900/60' 
                          : 'bg-white/70 hover:bg-orange-50/90 shadow-xs'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className={`relative shrink-0 w-16 sm:w-20 aspect-video rounded-lg overflow-hidden ${
                        isDark ? 'bg-zinc-900' : 'bg-orange-100'
                      }`}>
                        <img 
                          src={thumbnail} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                          loading="lazy"
                        />
                        <div className="absolute top-1 right-1 px-1 py-0.2 rounded text-[8px] font-bold bg-orange-500 text-white shadow">
                          Notes
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <h4 className={`text-xs sm:text-sm font-semibold line-clamp-1 group-hover:text-orange-500 transition-colors ${
                          isDark ? 'text-zinc-200' : 'text-orange-950'
                        }`}>
                          {title}
                        </h4>
                        <div className={`flex items-center justify-between text-[11px] sm:text-xs font-medium pt-0.5 ${
                          isDark ? 'text-zinc-500' : 'text-orange-800/80'
                        }`}>
                          <span className="truncate max-w-[100px] min-[380px]:max-w-[140px]">{channel}</span>
                          <span className="shrink-0">{timeAgo}</span>
                        </div>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-2 border-t border-orange-500/10 dark:border-orange-500/10">
            <CustomButton
              variant="secondary"
              size="sm"
              iconRight={ArrowRight}
              onClick={onNavigateToNotes}
              className="w-full justify-between"
            >
              <span>View All Outlines & Notes in Library</span>
            </CustomButton>
          </div>
        </div>

      </div>
    </div>
  );
}
