import Skeleton from '../common/Skeleton';

export default function DashboardSkeleton() {
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar h-full w-full">
      <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
        
        {/* 1. Top Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Skeleton className="h-7 sm:h-8 w-56 sm:w-72 rounded-lg bg-zinc-900/80" />
            <Skeleton className="h-3.5 w-64 sm:w-96 rounded bg-zinc-900/50 mt-1" />
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-950/20 border border-orange-900/30 w-fit shrink-0">
            <Skeleton className="w-4 h-4 rounded-full bg-orange-500/30" />
            <Skeleton className="h-3.5 w-24 rounded bg-orange-500/20" />
          </div>
        </div>

        {/* 2. Motivational Quotes Board */}
        <div className="glass-panel border border-zinc-800 rounded-2xl p-5 relative overflow-hidden flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-950/20 border border-orange-900/30 flex items-center justify-center shrink-0 mt-0.5">
            <Skeleton className="w-4 h-4 rounded bg-orange-500/30" />
          </div>
          <div className="space-y-2 flex-1 min-w-0 pr-6">
            <Skeleton className="h-4 w-11/12 rounded bg-zinc-900/80" />
            <Skeleton className="h-3 w-32 rounded bg-zinc-900/40" />
          </div>
        </div>

        {/* 3. Performance Grid: Streak + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 3a. StreakCard (Left Column: md:col-span-1) */}
          <div className="md:col-span-1">
            <div className="glass-panel border border-zinc-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-full space-y-6">
              {/* Background Glow placeholder */}
              <div className="space-y-6">
                {/* Card Title & Icon */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-500">
                    STREAK STATUS
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-orange-950/25 border border-orange-900/35 flex items-center justify-center">
                    <Skeleton className="w-4.5 h-4.5 rounded-full bg-orange-500/30" />
                  </div>
                </div>

                {/* Big Numbers */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <Skeleton className="h-9 w-14 rounded-lg bg-zinc-900/90" />
                    <Skeleton className="h-3.5 w-28 rounded bg-zinc-900/60" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Skeleton className="w-3.5 h-3.5 rounded-full bg-zinc-900/60" />
                    <Skeleton className="h-3 w-36 rounded bg-zinc-900/40" />
                  </div>
                </div>

                {/* Weekly Consistency Visualizer */}
                <div className="space-y-2 pt-2 border-t border-zinc-900/60">
                  <h4 className="text-[10px] font-mono font-bold text-zinc-400 flex items-center gap-1.5">
                    <Skeleton className="w-3.5 h-3.5 rounded bg-zinc-900/60" />
                    WEEKLY CONSISTENCY
                  </h4>
                  <div className="flex justify-between items-center gap-1 py-1">
                    {daysOfWeek.map((label, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="w-full aspect-square max-w-[28px] rounded-lg border border-zinc-800 bg-zinc-900/40 flex items-center justify-center text-[10px] font-bold text-zinc-650">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 3b. Right Column: StatsGrid + ActivityHeatmap (md:col-span-2 flex flex-col gap-6) */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {/* StatsGrid: 4 metric cards (grid grid-cols-2 md:grid-cols-4 gap-4) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'VIDEOS LEARNED', sub: 'videos processed' },
                { title: 'NOTES GENERATED', sub: 'academic outlines' },
                { title: 'TOTAL STUDY DAYS', sub: 'days with study activity' },
                { title: 'WEEKLY AVERAGE', sub: 'videos per active week' }
              ].map((stat, i) => (
                <div key={i} className="glass-panel border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
                      {stat.title}
                    </span>
                    <div className="p-1.5 rounded-lg border border-orange-900/30 bg-orange-950/20 text-orange-500">
                      <Skeleton className="w-3.5 h-3.5 rounded bg-orange-500/30" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-6 w-12 rounded bg-zinc-900/90" />
                    <span className="text-[9px] text-zinc-600 font-semibold block truncate">
                      {stat.sub}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* ActivityHeatmap */}
            <div>
              <div className="glass-panel border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div>
                  <h4 className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-500">
                    STUDY CONSISTENCY HEATMAP
                  </h4>
                  <Skeleton className="h-3 w-48 rounded bg-zinc-900/40 mt-1" />
                </div>

                {/* Heatmap 12 weeks of 7-day columns */}
                <div className="overflow-x-auto pb-2 custom-scrollbar">
                  <div className="inline-flex gap-2">
                    {/* Day-of-week labels */}
                    <div className="flex flex-col gap-1.5 pt-4 text-[9px] font-mono font-bold text-zinc-600 select-none">
                      <span className="h-3 leading-3">Sun</span>
                      <span className="h-3 leading-3">Mon</span>
                      <span className="h-3 leading-3">Tue</span>
                      <span className="h-3 leading-3">Wed</span>
                      <span className="h-3 leading-3">Thu</span>
                      <span className="h-3 leading-3">Fri</span>
                      <span className="h-3 leading-3">Sat</span>
                    </div>

                    {/* 12 Week Columns */}
                    <div className="flex gap-1.5">
                      {Array.from({ length: 12 }).map((_, weekIdx) => (
                        <div key={weekIdx} className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-mono font-bold text-zinc-650 h-3 leading-3 text-center">
                            {weekIdx % 3 === 0 ? 'W' + (weekIdx + 1) : ''}
                          </span>
                          <div className="flex flex-col gap-1.5">
                            {Array.from({ length: 7 }).map((_, dayIdx) => (
                              <Skeleton 
                                key={dayIdx} 
                                className="w-3.5 h-3.5 rounded-sm bg-zinc-900/70 border-0" 
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-900/80">
                  <Skeleton className="h-3 w-28 rounded bg-zinc-900/50" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono">Less</span>
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-sm bg-zinc-900 border border-zinc-800" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-orange-500/20 border border-orange-500/10" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-orange-500/50 border border-orange-500/30" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-orange-500 border border-orange-400" />
                    </div>
                    <span className="text-[9px] font-mono">More</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Recent Study Sessions (grid grid-cols-1 sm:grid-cols-2 gap-4) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-500 flex items-center gap-1.5">
              <Skeleton className="w-4 h-4 rounded bg-orange-500/30" />
              RECENT STUDY SESSIONS
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="border border-zinc-900 rounded-xl p-3.5 bg-zinc-950/40 flex gap-3.5 min-w-0"
              >
                {/* Horizontal thumbnail skeleton (w-24 aspect-video) */}
                <div className="relative shrink-0 w-24 aspect-video rounded-lg overflow-hidden bg-zinc-900/70 border border-zinc-800/40">
                  <Skeleton className="w-full h-full rounded-none border-0" />
                </div>

                {/* Text content skeleton */}
                <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                  <div className="space-y-1.5 min-w-0">
                    <Skeleton className="h-3.5 w-full rounded bg-zinc-900/80" />
                    <Skeleton className="h-3 w-2/3 rounded bg-zinc-900/50" />
                  </div>
                  
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-2.5 w-20 rounded bg-zinc-900/40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
