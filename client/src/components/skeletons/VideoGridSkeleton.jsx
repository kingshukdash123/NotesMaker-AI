import Skeleton from '../common/Skeleton';

export default function VideoGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          className="flex flex-col bg-zinc-950/40 border border-zinc-900/80 rounded-xl overflow-hidden shadow-lg"
        >
          {/* 16:9 Thumbnail Skeleton */}
          <div className="relative w-full aspect-video bg-zinc-900/50">
            <Skeleton className="w-full h-full rounded-none border-0" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-9 h-9 rounded-full bg-zinc-900/80 border border-zinc-800/60 flex items-center justify-center opacity-40">
                <div className="w-0 h-0 border-t-4 border-t-transparent border-l-7 border-l-zinc-600 border-b-4 border-b-transparent ml-0.5" />
              </div>
            </div>
          </div>

          {/* Info Area Skeleton */}
          <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              {/* Dual-line title placeholder */}
              <Skeleton className="h-4 w-full rounded-md bg-zinc-900/80" />
              <Skeleton className="h-4 w-3/4 rounded-md bg-zinc-900/60" />
              
              {/* Channel name placeholder */}
              <div className="pt-0.5">
                <Skeleton className="h-3 w-1/3 rounded bg-zinc-900/50" />
              </div>
            </div>

            {/* Action strip placeholder */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60 min-h-[28px]">
              {/* Left icon silhouette */}
              <Skeleton className="w-4 h-4 rounded-full bg-zinc-900/60" />

              {/* Right buttons silhouette */}
              <div className="flex items-center gap-1.5 ml-auto">
                <Skeleton className="w-6 h-6 rounded-lg bg-zinc-900/60" />
                <Skeleton className="w-6 h-6 rounded-lg bg-zinc-900/60" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
