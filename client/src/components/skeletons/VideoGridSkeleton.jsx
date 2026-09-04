import { useTheme } from '../../context/ThemeContext';
import Skeleton from '../common/Skeleton';

export default function VideoGridSkeleton({ count = 8, layout = 'grid' }) {
  const { isDark } = useTheme();

  if (layout === 'list') {
    return (
      <div className="flex flex-col gap-3 sm:gap-4 w-full animate-in fade-in duration-300">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`flex flex-col sm:flex-row gap-3 sm:gap-4.5 rounded-2xl p-2 sm:p-2.5 border transition duration-150 select-none ${
              isDark
                ? 'bg-zinc-950/20 border-zinc-900/60'
                : 'bg-white/60 border-orange-100/80 shadow-xs'
            }`}
          >
            {/* 16:9 Thumbnail Skeleton Column */}
            <div
              className={`relative w-full sm:w-64 md:w-76 lg:w-88 aspect-video rounded-xl overflow-hidden shrink-0 border ${
                isDark ? 'border-zinc-800/60 bg-zinc-900' : 'border-orange-100 bg-orange-50/50'
              }`}
            >
              <Skeleton className="w-full h-full rounded-none border-0" />
            </div>

            {/* Right Info Column (Matches SearchResultCard) */}
            <div className="flex-1 flex flex-col justify-start py-0.5 min-w-0">
              {/* Dual-line Title Skeleton */}
              <div className="space-y-1.5">
                <Skeleton className="h-4.5 sm:h-5 w-4/5 rounded-md" />
                <Skeleton className="h-4 sm:h-4.5 w-3/5 rounded-md" />
              </div>

              {/* Channel Row Skeleton */}
              <div className="flex items-center gap-2 mt-2">
                {/* Channel Avatar */}
                <Skeleton className="w-5.5 h-5.5 rounded-full shrink-0" />

                {/* Channel Name */}
                <Skeleton className="h-3.5 w-28 sm:w-36 rounded" />

                {/* Dot Separator */}
                <span className={`text-xs ${isDark ? 'text-zinc-700' : 'text-orange-200'}`}>•</span>

                {/* Time Ago */}
                <Skeleton className="h-3 w-16 rounded" />
              </div>

              {/* Action Bar Below Channel Name */}
              <div
                className={`flex items-center gap-8 sm:gap-10 mt-2.5 pt-2 border-t ${
                  isDark ? 'border-zinc-800/60' : 'border-orange-100'
                }`}
              >
                {/* Action Buttons Cluster */}
                <div className="flex items-center gap-1">
                  <Skeleton className="w-7 h-7 rounded-lg" />
                  <Skeleton className="w-7 h-7 rounded-lg" />
                </div>

                {/* Video Processed Notes Icon */}
                <Skeleton className="w-7 h-7 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`flex flex-col rounded-xl overflow-hidden border shadow-xs ${
            isDark
              ? 'bg-zinc-950/40 border-zinc-900/80'
              : 'bg-white border-orange-100/80 shadow-xs'
          }`}
        >
          {/* 16:9 Thumbnail Skeleton */}
          <div
            className={`relative w-full aspect-video ${
              isDark ? 'bg-zinc-900/50' : 'bg-orange-50/60'
            }`}
          >
            <Skeleton className="w-full h-full rounded-none border-0" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-9 h-9 rounded-full border flex items-center justify-center opacity-40 ${
                  isDark
                    ? 'bg-zinc-900/80 border-zinc-800/60'
                    : 'bg-orange-100 border-orange-200'
                }`}
              >
                <div
                  className={`w-0 h-0 border-t-4 border-t-transparent border-l-7 border-b-4 border-b-transparent ml-0.5 ${
                    isDark ? 'border-l-zinc-600' : 'border-l-orange-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Info Area Skeleton */}
          <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              {/* Dual-line title placeholder */}
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded-md" />

              {/* Channel name placeholder */}
              <div className="pt-0.5">
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
            </div>

            {/* Action strip placeholder */}
            <div
              className={`flex items-center justify-between pt-2 border-t min-h-[28px] ${
                isDark ? 'border-zinc-900/60' : 'border-orange-100'
              }`}
            >
              {/* Left buttons silhouette */}
              <div className="flex items-center gap-1">
                <Skeleton className="w-6 h-6 rounded-lg" />
                <Skeleton className="w-6 h-6 rounded-lg" />
              </div>

              {/* Right icon silhouette */}
              <Skeleton className="w-6 h-6 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
