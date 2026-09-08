import Skeleton from '../common/Skeleton';
import { useTheme } from '../../context/ThemeContext';

export function DailyPlannerSkeleton() {
  const { isDark } = useTheme();
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-in fade-in duration-300">
      {/* Date Header Switcher Skeleton */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl ${isDark ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-zinc-200 shadow-xs'} border`}>
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-xl" />
          <Skeleton className="h-8 w-40 rounded-xl" />
          <Skeleton className="w-8 h-8 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>

      {/* Progress Bar Skeleton */}
      <div className={`p-3 rounded-xl ${isDark ? 'bg-zinc-950/30 border-zinc-900/60' : 'bg-white border-zinc-200 shadow-xs'} border space-y-2`}>
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Task Checklist Items Skeleton */}
      <div className="flex-1 overflow-hidden space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className={`p-3.5 rounded-xl ${isDark ? 'bg-zinc-950/40 border-zinc-900/80' : 'bg-white border-zinc-200 shadow-xs'} border flex items-center justify-between gap-3`}
          >
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-5 h-5 rounded-lg shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-3/5' : 'w-4/5'} rounded`} />
              </div>
              <Skeleton className="h-5 w-16 rounded-full shrink-0 hidden sm:block" />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Skeleton className="w-6 h-6 rounded-lg" />
              <Skeleton className="w-6 h-6 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Input Skeleton */}
      <div className={`p-3 rounded-2xl ${isDark ? 'bg-zinc-950/80 border-zinc-900' : 'bg-white border-zinc-200 shadow-xs'} border flex items-center gap-3`}>
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}

export function MonthlyCalendarSkeleton() {
  const { isDark } = useTheme();
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-in fade-in duration-300">
      {/* Month Navigation Header Skeleton */}
      <div className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl ${isDark ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-zinc-200 shadow-xs'} border`}>
        <Skeleton className="h-7 w-36 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-xl" />
          <Skeleton className="w-8 h-8 rounded-xl" />
        </div>
      </div>

      {/* Weekday Columns Header */}
      <div className="grid grid-cols-7 gap-1 text-center py-1">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
          <div key={day} className={`text-[10px] font-mono font-bold ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* 35 Calendar Day Cells Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 35 }).map((_, i) => (
          <div 
            key={i} 
            className={`h-16 sm:h-20 p-2 rounded-xl ${isDark ? 'bg-zinc-950/30 border-zinc-900/60' : 'bg-white border-zinc-200 shadow-xs'} border flex flex-col justify-between`}
          >
            <Skeleton className="w-4 h-4 rounded" />
            <div className="flex gap-1">
              {i % 3 === 0 && <Skeleton className="w-2 h-2 rounded-full" />}
              {i % 2 === 0 && <Skeleton className="w-2 h-2 rounded-full" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
