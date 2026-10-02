import Skeleton from '../common/Skeleton';
import { useTheme } from '../../context/ThemeContext';

export function TaskListSkeleton({ count = 4 }) {
  const { isDark } = useTheme();
  return (
    <div className="space-y-1.5 sm:space-y-2 animate-in fade-in duration-200">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={`min-h-[38px] sm:min-h-[42px] px-3 py-1.5 sm:py-2 rounded-xl flex items-center justify-between gap-2.5 select-none ${
            isDark 
              ? 'bg-zinc-900/30' 
              : 'bg-zinc-100/60 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Skeleton className="w-4 h-4 rounded-full shrink-0" />
            <Skeleton className={`h-3.5 ${i % 2 === 0 ? 'w-2/5' : 'w-3/5'} rounded-md`} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
            <Skeleton className="w-6 h-6 rounded-lg shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DailyPlannerSkeleton() {
  const { isDark } = useTheme();
  return (
    <div className="flex-1 flex flex-col min-h-0 h-full w-full overflow-hidden animate-in fade-in duration-300">
      {/* 1. Date Header Skeleton */}
      <div className={`shrink-0 flex items-center justify-between gap-2 sm:gap-4 border-b pb-3 px-2 sm:px-3 ${
        isDark ? 'border-zinc-900' : 'border-zinc-200'
      }`}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="w-5 h-5 rounded-full shrink-0" />
          <Skeleton className="h-3.5 w-8 rounded-md" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="w-7 h-7 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="w-7 h-7 rounded-lg" />
        </div>
      </div>

      {/* 2. Input Bar Skeleton */}
      <div className="shrink-0 mt-4 sm:mt-5 mb-4 sm:mb-5 px-0.5 flex items-center gap-2">
        <Skeleton className="h-9 sm:h-10 flex-1 rounded-xl" />
        <Skeleton className="h-9 sm:h-10 w-24 rounded-xl" />
        <Skeleton className="h-9 sm:h-10 w-10 sm:w-24 rounded-xl" />
      </div>

      {/* 3. Task List Skeleton */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-1 space-y-1.5 sm:space-y-2">
        <TaskListSkeleton count={4} />
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
