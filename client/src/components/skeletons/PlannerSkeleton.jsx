import Skeleton from '../common/Skeleton';

export function DailyPlannerSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-in fade-in duration-300">
      {/* Date Header Switcher Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-zinc-950/40 border border-zinc-900">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-xl bg-zinc-900/80" />
          <Skeleton className="h-8 w-40 rounded-xl bg-zinc-900/80" />
          <Skeleton className="w-8 h-8 rounded-xl bg-zinc-900/80" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-xl bg-zinc-900/70" />
          <Skeleton className="h-8 w-24 rounded-xl bg-orange-950/20 border-orange-900/30" />
        </div>
      </div>

      {/* Progress Bar Skeleton */}
      <div className="p-3 rounded-xl bg-zinc-950/30 border border-zinc-900/60 space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-28 rounded bg-zinc-900/60" />
          <Skeleton className="h-3 w-10 rounded bg-zinc-900/60" />
        </div>
        <Skeleton className="h-2 w-full rounded-full bg-zinc-900/80" />
      </div>

      {/* Task Checklist Items Skeleton */}
      <div className="flex-1 overflow-hidden space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900/80 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-5 h-5 rounded-lg bg-zinc-900/80 shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-3/5' : 'w-4/5'} rounded bg-zinc-900/80`} />
              </div>
              <Skeleton className="h-5 w-16 rounded-full bg-zinc-900/60 shrink-0 hidden sm:block" />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Skeleton className="w-6 h-6 rounded-lg bg-zinc-900/60" />
              <Skeleton className="w-6 h-6 rounded-lg bg-zinc-900/60" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Input Skeleton */}
      <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-900 flex items-center gap-3">
        <Skeleton className="h-9 flex-1 rounded-xl bg-zinc-900/70" />
        <Skeleton className="h-9 w-28 rounded-xl bg-orange-500/30" />
      </div>
    </div>
  );
}

export function MonthlyCalendarSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-in fade-in duration-300">
      {/* Month Navigation Header Skeleton */}
      <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-zinc-950/40 border border-zinc-900">
        <Skeleton className="h-7 w-36 rounded-lg bg-zinc-900/80" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-xl bg-zinc-900/80" />
          <Skeleton className="w-8 h-8 rounded-xl bg-zinc-900/80" />
        </div>
      </div>

      {/* Weekday Columns Header */}
      <div className="grid grid-cols-7 gap-1 text-center py-1">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
          <div key={day} className="text-[10px] font-mono font-bold text-zinc-600">
            {day}
          </div>
        ))}
      </div>

      {/* 35 Calendar Day Cells Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 35 }).map((_, i) => (
          <div 
            key={i} 
            className="h-16 sm:h-20 p-2 rounded-xl bg-zinc-950/30 border border-zinc-900/60 flex flex-col justify-between"
          >
            <Skeleton className="w-4 h-4 rounded bg-zinc-900/70" />
            <div className="flex gap-1">
              {i % 3 === 0 && <Skeleton className="w-2 h-2 rounded-full bg-orange-500/30" />}
              {i % 2 === 0 && <Skeleton className="w-2 h-2 rounded-full bg-zinc-800" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
