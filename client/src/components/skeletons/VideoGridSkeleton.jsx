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
            className="flex flex-col sm:flex-row gap-3 sm:gap-4.5 rounded-2xl p-2 sm:p-2.5 transition duration-150 select-none"
          >
            {/* 16:9 Thumbnail Skeleton Column */}
            <div
              className={`relative w-full sm:w-64 md:w-76 lg:w-88 aspect-video rounded-xl overflow-hidden shrink-0 border ${
                isDark ? 'border-zinc-800/60 bg-zinc-900' : 'border-zinc-200 bg-zinc-100'
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
                <span className={`text-xs ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`}>•</span>

                {/* Time Ago */}
                <Skeleton className="h-3 w-16 rounded" />
              </div>

              {/* Action Bar Below Channel Name */}
              <div
                className={`flex items-center gap-8 sm:gap-10 mt-2.5 pt-2 border-t ${
                  isDark ? 'border-zinc-800/40' : 'border-zinc-200/60'
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
          className={`flex flex-col h-full rounded-xl select-none ${
            isDark
              ? 'bg-zinc-900/40'
              : 'bg-zinc-100/70'
          }`}
        >
          {/* 16:9 Thumbnail Skeleton */}
          <div
            className={`relative w-full aspect-video rounded-t-xl overflow-hidden shrink-0 ${
              isDark ? 'bg-zinc-900' : 'bg-zinc-200'
            }`}
          >
            <Skeleton className="w-full h-full rounded-none border-0" />
          </div>

          {/* Details Section Skeleton */}
          <div className="p-3 flex-1 flex flex-col justify-between gap-2.5 min-w-0">
            {/* Title & Channel Stack */}
            <div className="space-y-1.5 min-w-0">
              {/* Dual-line title placeholder */}
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-3/5 rounded-md" />

              {/* Channel Row Placeholder */}
              <div className="flex items-center gap-1.5 pt-1 min-w-0">
                <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
                <Skeleton className="h-3 w-24 rounded" />
                <span className={`text-[10px] ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`}>•</span>
                <Skeleton className="h-3 w-12 rounded" />
              </div>
            </div>

            {/* Action Bar Placeholder */}
            <div className="mt-auto pt-1.5 flex items-center justify-between min-h-[28px]">
              {/* Left action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <Skeleton className="w-6.5 h-6.5 rounded-lg" />
                <Skeleton className="w-6.5 h-6.5 rounded-lg" />
              </div>

              {/* Right status icon placeholder */}
              <Skeleton className="w-6.5 h-6.5 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
