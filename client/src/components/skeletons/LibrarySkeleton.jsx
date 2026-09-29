import Skeleton from '../common/Skeleton';
import VideoGridSkeleton from './VideoGridSkeleton';
import { useTheme } from '../../context/ThemeContext';

export default function LibrarySkeleton() {
  const { isDark } = useTheme();

  return (
    <div className="flex-1 w-full h-full flex flex-col min-h-0 overflow-hidden">
      <div className="w-full p-3.5 sm:p-6 md:p-8 flex-1 flex flex-col min-h-0 space-y-4 sm:space-y-5 pb-2 sm:pb-4 animate-in fade-in duration-300">
        
        {/* Page Header Skeleton (Pinned) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Skeleton className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-orange-500/20" />
            <Skeleton className="h-7 sm:h-8 w-44 rounded-lg" />
          </div>
        </div>

        {/* Sub-tab Switcher Skeleton (Pinned) */}
        <div className={`flex border-b pb-px overflow-x-auto select-none custom-scrollbar flex-nowrap shrink-0 ${
          isDark ? 'border-zinc-900/60' : 'border-zinc-200/80'
        }`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 shrink-0">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-4 w-20 sm:w-24 rounded" />
            </div>
          ))}
        </div>

        {/* Video Card Grid Skeleton (Scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
          <VideoGridSkeleton count={8} layout="grid" />
        </div>

      </div>
    </div>
  );
}
