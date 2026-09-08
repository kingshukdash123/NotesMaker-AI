import Skeleton from '../common/Skeleton';
import { useTheme } from '../../context/ThemeContext';

export default function DashboardSkeleton() {
  const { isDark } = useTheme();

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar h-full w-full">
      <div className="w-full p-3 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-5 md:space-y-6 animate-in fade-in duration-300">
        
        {/* ── 1. TOP HERO: 1ST COL (GREETING & QUOTE - 2/3) | 2ND COL (TIME & DATE - 1/3) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 lg:gap-6 items-stretch w-full">
          {/* 1st Column: Greetings & Motivational Quote (2/3 width) */}
          <div className="md:col-span-2 flex flex-col justify-between space-y-3 h-full">
            <div>
              <Skeleton className="h-7 sm:h-8 md:h-9 w-56 sm:w-72 md:w-80 rounded-xl" />
              <Skeleton className="h-3.5 sm:h-4 w-4/5 sm:w-5/6 rounded-md mt-2" />
            </div>

            {/* Motivational Quote Card Skeleton */}
            <div className="p-2 sm:p-2.5 mt-auto flex items-start gap-2.5 sm:gap-3 bg-transparent">
              <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shrink-0 mt-0.5 bg-transparent">
                <Skeleton className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm bg-orange-500/30" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-3.5 w-11/12 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            </div>
          </div>
          
          {/* 2nd Column: Date and Time Widget (1/3 width) */}
          <div className="md:col-span-1 flex flex-col justify-center">
            <div className="h-full rounded-2xl p-3.5 sm:p-4 md:p-5 flex flex-col justify-center items-center text-center bg-transparent">
              {/* Clock Display Skeleton */}
              <div className="flex items-baseline justify-center gap-1 sm:gap-1.5">
                <Skeleton className="h-8 sm:h-10 md:h-8 lg:h-12 w-24 sm:w-32 md:w-24 lg:w-40 rounded-xl" />
                <Skeleton className="h-6 sm:h-7 md:h-6 lg:h-9 w-10 sm:w-12 rounded-lg bg-orange-500/30" />
                <Skeleton className="h-3.5 sm:h-4 w-6 sm:w-8 rounded ml-1" />
              </div>

              {/* Full Calendar Date Skeleton */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-3">
                <Skeleton className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-orange-500/30 shrink-0" />
                <Skeleton className="h-3.5 sm:h-4 w-36 sm:w-44 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. WEEKLY METRICS STATS RIBBON (FULL WIDTH) ── */}
        <div className={`w-full space-y-3 sm:space-y-3.5 ${
          isDark ? 'bg-zinc-950/40 rounded-2xl p-4 sm:p-5 md:p-6' : ''
        }`}>
          {/* Section Header */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
            isDark ? 'pb-3 border-b border-orange-500/15' : 'pb-0.5'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-orange-950/25' : 'bg-zinc-100'
              }`}>
                <Skeleton className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-orange-500/30" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 sm:h-5 w-40 sm:w-48 rounded" />
                <Skeleton className="h-3 w-52 sm:w-64 rounded" />
              </div>
            </div>
            {/* Week / Month Filter Toggle */}
            <Skeleton className="h-6 sm:h-7 w-24 sm:w-28 rounded-xl shrink-0 self-start sm:self-auto" />
          </div>

          {/* 4-Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4 w-full pt-0.5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div 
                key={idx} 
                className={`rounded-xl p-3 sm:p-3.5 md:p-4 flex flex-col justify-between min-h-[105px] sm:min-h-[118px] md:min-h-[126px] ${
                  isDark ? 'bg-zinc-900/30' : 'bg-zinc-100/70'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <Skeleton className="h-3 w-16 sm:w-20 rounded" />
                  <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl" />
                </div>
                <div className="my-0.5 sm:my-1">
                  <Skeleton className="h-7 sm:h-8 md:h-9 w-12 sm:w-16 rounded-lg" />
                </div>
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-24 rounded" />
                  <Skeleton className="h-3.5 sm:h-4 w-10 sm:w-14 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. STATUS STREAK (FULL WIDTH) ── */}
        <div className={`w-full space-y-3 sm:space-y-3.5 ${
          isDark ? 'bg-zinc-950/60 rounded-2xl p-4 sm:p-4.5 shadow-sm' : ''
        }`}>
          {/* Common Header */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            isDark ? 'pb-3 border-b border-orange-500/15' : 'pb-0.5'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-orange-950/25' : 'bg-zinc-100'
              }`}>
                <Skeleton className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-orange-500/30" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 sm:h-5 w-44 sm:w-56 rounded" />
                <Skeleton className="h-3 w-56 sm:w-72 rounded" />
              </div>
            </div>
          </div>

          {/* Responsive Grid: Streak Status | Heatmap | Score Velocity */}
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-12 lg:grid-cols-12 gap-3.5 lg:gap-4 items-stretch">
              
              {/* 1. Streak Status Column (Phone: Full | Tablet: 5 cols Row 1 | Desktop: 2 cols) */}
              <div className={`col-span-1 sm:col-span-5 lg:col-span-2 sm:order-1 lg:order-1 flex flex-col justify-between p-3 sm:p-3.5 rounded-xl ${
                isDark ? 'bg-zinc-900/30' : 'bg-zinc-100/70'
              }`}>
                <Skeleton className="h-3 w-20 rounded" />
                <div className="flex-1 flex flex-row sm:flex-col justify-around sm:justify-center items-center text-center space-y-0 sm:space-y-2 py-2 gap-3 sm:gap-0">
                  <div className="flex flex-col items-center gap-1">
                    <Skeleton className="h-10 sm:h-12 w-12 rounded-xl" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
              </div>

              {/* 2. Heatmap Column (Phone: Full | Tablet: 12 cols Row 2 | Desktop: 6 cols Row 1) */}
              <div className={`col-span-1 sm:col-span-12 lg:col-span-6 sm:order-3 lg:order-2 flex flex-col justify-between p-3 sm:p-3.5 rounded-xl ${
                isDark ? 'bg-zinc-900/30' : 'bg-zinc-100/70'
              }`}>
                <Skeleton className="h-3 w-36 rounded" />
                <div className="w-full flex-1 flex flex-col justify-center items-center py-1">
                  <div className="w-full overflow-x-auto custom-scrollbar flex justify-start min-[480px]:justify-center py-1">
                    <div className="flex items-start gap-2 sm:gap-2.5 min-w-max px-0.5">
                      {Array.from({ length: 6 }).map((_, mIdx) => (
                        <div key={mIdx} className="flex flex-col items-center">
                          <div className="flex items-center gap-[2.5px] sm:gap-[3px]">
                            {Array.from({ length: 3 }).map((_, w) => (
                              <div key={w} className="flex flex-col gap-[2.5px] sm:gap-[3px]">
                                {Array.from({ length: 7 }).map((_, d) => (
                                  <div 
                                    key={d} 
                                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2.5px] sm:rounded-[3px] ${
                                      isDark ? 'bg-zinc-800/60' : 'bg-zinc-200'
                                    }`} 
                                  />
                                ))}
                              </div>
                            ))}
                          </div>
                          <Skeleton className="h-2.5 w-6 rounded mt-1.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Daily Score Graph Column (Phone: Full | Tablet: 7 cols Row 1 | Desktop: 4 cols Row 1) */}
              <div className={`col-span-1 sm:col-span-7 lg:col-span-4 sm:order-2 lg:order-3 flex flex-col justify-between p-3 sm:p-3.5 rounded-xl ${
                isDark ? 'bg-zinc-900/30' : 'bg-zinc-100/70'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3 w-28 rounded" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-4 w-16 rounded-md" />
                    <Skeleton className="h-4 w-12 rounded-md" />
                  </div>
                </div>
                <div className="w-full flex-1 flex flex-col justify-center items-center py-1">
                  <div className={`w-full h-20 sm:h-22 rounded-xl ${
                    isDark ? 'bg-zinc-900/40' : 'bg-zinc-100'
                  }`} />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── 4. STUDY PLANNER: 7-DAY COMPLETION RATE GRAPH | TODAY'S PLANS (ROW LAYOUT) ── */}
        <div className={`w-full space-y-3 sm:space-y-3.5 ${
          isDark ? 'bg-zinc-950/40 rounded-2xl p-4 sm:p-5 md:p-6' : ''
        }`}>
          {/* Section Header */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            isDark ? 'pb-3.5 border-b border-orange-500/15' : 'pb-0.5'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-orange-950/25' : 'bg-zinc-100'
              }`}>
                <Skeleton className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-orange-500/30" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 sm:h-5 w-44 sm:w-52 rounded" />
                <Skeleton className="h-3 w-56 sm:w-72 rounded" />
              </div>
            </div>
          </div>

          {/* 2-Column Row: Left (Target History 7D) | Right (Today's Targets) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 items-stretch pt-1">
            
            {/* Left Column: Target History (7D) - lg:col-span-6 */}
            <div className={`lg:col-span-6 flex flex-col justify-between p-3.5 sm:p-4 md:p-5 rounded-xl ${
              isDark ? 'bg-zinc-900/30' : 'bg-zinc-100/70'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-200/80 dark:border-orange-500/10">
                <Skeleton className="h-3.5 w-32 rounded" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2.5 w-8 rounded" />
                  <Skeleton className="h-2.5 w-8 rounded" />
                  <Skeleton className="h-2.5 w-8 rounded" />
                </div>
              </div>
              
              {/* 7-Day Stacked Bars Skeleton */}
              <div className="py-3 sm:py-4 flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3 items-end h-28 sm:h-32 md:h-36">
                  {Array.from({ length: 7 }).map((_, dIdx) => (
                    <div key={dIdx} className="flex flex-col items-center h-full justify-end">
                      <Skeleton className="h-2.5 w-5 rounded mb-1 sm:mb-1.5" />
                      <div className={`w-full max-w-[22px] sm:max-w-[26px] h-20 sm:h-24 md:h-28 rounded-lg p-0.5 border ${
                        dIdx === 6 
                          ? isDark ? 'border-orange-500/50 bg-zinc-900/60' : 'border-orange-500 bg-orange-500/10'
                          : isDark ? 'border-orange-500/10 bg-zinc-900/30' : 'border-zinc-200 bg-zinc-100'
                      }`}>
                        <Skeleton className="w-full h-full rounded-md" />
                      </div>
                      <Skeleton className="h-2.5 w-6 rounded mt-1 sm:mt-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Today's Targets - lg:col-span-6 */}
            <div className={`lg:col-span-6 flex flex-col justify-between p-3.5 sm:p-4 md:p-5 rounded-xl ${
              isDark ? 'bg-zinc-900/30' : 'bg-zinc-100/70'
            }`}>
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200/80 dark:border-orange-500/10">
                <Skeleton className="h-3.5 w-28 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              
              {/* Targets List */}
              <div className="flex-1 flex flex-col justify-start py-2.5 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`min-h-[44px] px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl flex items-center justify-between gap-2.5 ${
                      isDark ? 'bg-zinc-900/30' : 'hover:bg-zinc-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                      <Skeleton className="h-3.5 w-3/4 rounded" />
                    </div>
                    <Skeleton className="h-4 w-10 rounded shrink-0" />
                  </div>
                ))}
              </div>

              {/* Footer Button Link */}
              <div className="pt-2 border-t border-zinc-200/80 dark:border-orange-500/10">
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            </div>

          </div>
        </div>

        {/* ── 5. RECENT ACTIVITY: WATCH HISTORY | GENERATED NOTES (FULL WIDTH) ── */}
        <div className={`w-full space-y-3 sm:space-y-3.5 ${
          isDark ? 'bg-zinc-950/40 rounded-2xl p-4 sm:p-5 md:p-6' : ''
        }`}>
          {/* Section Header */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            isDark ? 'pb-3 border-b border-orange-500/15' : 'pb-0.5'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-orange-950/25' : 'bg-zinc-100'
              }`}>
                <Skeleton className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-orange-500/30" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 sm:h-5 w-32 sm:w-36 rounded" />
                <Skeleton className="h-3 w-48 sm:w-64 rounded" />
              </div>
            </div>
          </div>

          {/* 2 Columns: Col 1 (Watch History) | Col 2 (Generated Notes) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 items-stretch">
            
            {/* Col 1: Watch History */}
            <div className={`flex flex-col justify-between p-3.5 sm:p-4 md:p-5 rounded-xl ${
              isDark ? 'bg-zinc-900/30' : 'bg-zinc-100/70'
            }`}>
              <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-zinc-200/80 dark:border-orange-500/10">
                <Skeleton className="h-3.5 w-28 rounded" />
                <Skeleton className="h-3 w-14 rounded" />
              </div>
              <div className="space-y-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`min-h-[48px] p-2 sm:p-2.5 rounded-xl flex items-center gap-2.5 sm:gap-3 ${
                      isDark ? 'bg-zinc-950/30' : 'hover:bg-zinc-50/80'
                    }`}
                  >
                    <Skeleton className="w-16 sm:w-20 aspect-video rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <Skeleton className="h-3.5 w-4/5 rounded" />
                      <Skeleton className="h-2.5 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-zinc-200/80 dark:border-orange-500/10">
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            </div>

            {/* Col 2: Generated Notes */}
            <div className={`flex flex-col justify-between p-3.5 sm:p-4 md:p-5 rounded-xl ${
              isDark ? 'bg-zinc-900/30' : 'bg-zinc-100/70'
            }`}>
              <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-zinc-200/80 dark:border-orange-500/10">
                <Skeleton className="h-3.5 w-28 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <div className="space-y-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`min-h-[48px] p-2 sm:p-2.5 rounded-xl flex items-center gap-2.5 sm:gap-3 ${
                      isDark ? 'bg-zinc-950/30' : 'hover:bg-zinc-50/80'
                    }`}
                  >
                    <Skeleton className="w-16 sm:w-20 aspect-video rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <Skeleton className="h-3.5 w-4/5 rounded" />
                      <Skeleton className="h-2.5 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-zinc-200/80 dark:border-orange-500/10">
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
