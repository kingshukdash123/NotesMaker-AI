import Skeleton from '../common/Skeleton';
import VideoGridSkeleton from './VideoGridSkeleton';

export default function LibrarySkeleton() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar h-full w-full">
      <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
        
        {/* Page Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded-md bg-orange-500/20" />
              <Skeleton className="h-7 w-40 rounded-lg bg-zinc-900/80" />
            </div>
            <Skeleton className="h-3.5 w-64 rounded bg-zinc-900/50" />
          </div>

          <Skeleton className="h-9 w-32 rounded-xl bg-orange-950/20 border-orange-900/30" />
        </div>

        {/* Sub-tab Switcher Skeleton */}
        <div className="flex border-b border-zinc-900 gap-1 sm:gap-4 overflow-x-auto pb-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-3">
              <Skeleton className="w-4 h-4 rounded bg-zinc-900/60" />
              <Skeleton className="h-4 w-20 rounded bg-zinc-900/60" />
            </div>
          ))}
        </div>

        {/* Video Card Grid Skeleton */}
        <VideoGridSkeleton count={8} layout="grid" />

      </div>
    </div>
  );
}
