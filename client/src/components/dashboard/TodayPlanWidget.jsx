import { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { 
  CalendarDays,
  ClipboardList, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  PlusCircle, 
  BarChart2,
  Crown,
  Check,
  Loader2,
  Flame,
  Clock,
  ArrowDown
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import InfoPopover from '../common/InfoPopover';
import CustomButton from '../common/CustomButton';

export default function TodayPlanWidget({
  tasks = [],
  monthTasks = [],
  onToggleTask,
  onNavigateToPlanner
}) {
  const { isDark } = useTheme();
  const [togglingTaskIds, setTogglingTaskIds] = useState(new Set());

  const handleTaskToggle = async (taskId, currentStatus, e) => {
    if (e) e.stopPropagation();
    if (togglingTaskIds.has(taskId)) return;
    setTogglingTaskIds(prev => new Set(prev).add(taskId));
    try {
      if (onToggleTask) {
        await onToggleTask(taskId, currentStatus);
      }
    } catch (err) {
      console.error('Failed to toggle task in TodayPlanWidget:', err);
    } finally {
      setTogglingTaskIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  // ── 1. 7-DAY STACKED BAR DATA ENGINE ──
  const { 
    last7DaysData, 
    totalWeekTasks, 
    completedWeekTasks, 
    avgCompletionRate,
    todayRate,
    maxDailyTasks
  } = useMemo(() => {
    const days = [];
    let weekTotal = 0;
    let weekCompleted = 0;
    let tRate = null;
    let maxTasks = 3; // Baseline max scale
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const isToday = i === 0;

      // Use today's live tasks if available, otherwise filter from monthTasks
      let dayTasks = [];
      if (isToday && tasks && tasks.length > 0) {
        dayTasks = tasks;
      } else {
        dayTasks = (monthTasks || []).filter(t => {
          const tDate = (t.date || '').slice(0, 10);
          return tDate === dateStr;
        });
      }

      const total = dayTasks.length;
      const completed = dayTasks.filter(t => t.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : null;

      if (isToday) {
        tRate = rate;
      }

      weekTotal += total;
      weekCompleted += completed;
      if (total > maxTasks) {
        maxTasks = total;
      }

      // Priority counts for this day
      const dayPriority = {
        high: { total: 0, completed: 0 },
        medium: { total: 0, completed: 0 },
        low: { total: 0, completed: 0 }
      };

      dayTasks.forEach(t => {
        const p = (t.priority || 'medium').toLowerCase();
        const pKey = p === 'high' ? 'high' : p === 'low' ? 'low' : 'medium';
        dayPriority[pKey].total += 1;
        if (t.completed) dayPriority[pKey].completed += 1;
      });

      days.push({
        date: dateStr,
        dayName: d.toLocaleDateString([], { weekday: 'short' }),
        shortDate: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        isToday,
        total,
        completed,
        rate,
        hasTasks: total > 0,
        priority: dayPriority
      });
    }

    const avgRate = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

    return {
      last7DaysData: days,
      totalWeekTasks: weekTotal,
      completedWeekTasks: weekCompleted,
      avgCompletionRate: avgRate,
      todayRate: tRate,
      maxDailyTasks: maxTasks
    };
  }, [tasks, monthTasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const isAllCompleted = totalTasks > 0 && completedTasks === totalTasks;

  // Pending tasks come first (newly undone tasks at top), completed tasks come last (newly done tasks at bottom)
  const sortedTasks = useMemo(() => {
    const pending = (tasks || []).filter(t => !t.completed);
    const completed = (tasks || []).filter(t => t.completed);
    return [...pending, ...completed];
  }, [tasks]);

  // ── FLIP Smooth Layout Animation for Reordering ──
  const itemRefs = useRef(new Map());
  const prevPositions = useRef(new Map());

  useLayoutEffect(() => {
    itemRefs.current.forEach((el, id) => {
      if (!el) return;
      const prevPos = prevPositions.current.get(id);
      const newPos = el.getBoundingClientRect();

      if (prevPos) {
        const deltaY = prevPos.top - newPos.top;
        if (Math.abs(deltaY) > 0.5) {
          el.style.transform = `translateY(${deltaY}px)`;
          el.style.transition = 'none';

          void el.offsetHeight;

          requestAnimationFrame(() => {
            el.style.transition = 'transform 380ms cubic-bezier(0.25, 1, 0.5, 1)';
            el.style.transform = '';
          });
        }
      }
    });

    const nextPositions = new Map();
    itemRefs.current.forEach((el, id) => {
      if (el) {
        nextPositions.set(id, el.getBoundingClientRect());
      }
    });
    prevPositions.current = nextPositions;
  }, [sortedTasks]);

  const getPriorityBadge = (priority = 'medium') => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'high') {
      return (
        <div 
          title="High Priority" 
          aria-label="High Priority"
          className={`w-6 h-6 rounded-full relative select-none shrink-0 ${
            isDark 
              ? 'bg-rose-950/40 text-rose-400' 
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          <Flame size={14} className="text-rose-500 absolute inset-0 m-auto" />
        </div>
      );
    }
    if (p === 'low') {
      return (
        <div 
          title="Low Priority" 
          aria-label="Low Priority"
          className={`w-6 h-6 rounded-full relative select-none shrink-0 ${
            isDark 
              ? 'bg-sky-950/40 text-sky-400' 
              : 'bg-sky-100 text-sky-700'
          }`}
        >
          <ArrowDown size={14} className="text-sky-500 absolute inset-0 m-auto" />
        </div>
      );
    }
    return (
      <div 
        title="Medium Priority" 
        aria-label="Medium Priority"
        className={`w-6 h-6 rounded-full relative select-none shrink-0 ${
          isDark 
            ? 'bg-amber-950/40 text-amber-400' 
            : 'bg-amber-100 text-amber-800'
        }`}
      >
        <Clock size={14} className="text-amber-500 absolute inset-0 m-auto" />
      </div>
    );
  };

  return (
    <div className={`w-full space-y-3 sm:space-y-3.5 rounded-2xl p-3.5 sm:p-4.5 md:p-5 transition duration-300 relative overflow-hidden ${
      isDark 
        ? 'bg-zinc-950/40 shadow-sm' 
        : 'bg-white shadow-xs'
    }`}>
      
      {/* ── COMMON HEADER ── */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 sm:pb-3 ${
        isDark ? 'border-b border-zinc-800/30' : 'border-b border-zinc-200'
      }`}>
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
            isDark 
              ? 'text-zinc-300 bg-zinc-800/80' 
              : 'text-zinc-700 bg-zinc-100'
          }`}>
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className={`text-sm sm:text-base md:text-lg font-bold tracking-tight truncate ${
                isDark ? 'text-zinc-100' : 'text-zinc-900'
              }`}>
                Study Planner & Targets
              </h3>
              <InfoPopover title="7-Day History & Targets">
                <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0" /><strong>High Priority</strong>: Critical tasks & exam prep.</p>
                <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0" /><strong>Medium Priority</strong>: Daily chapters & lectures.</p>
                <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500 inline-block shrink-0" /><strong>Low Priority</strong>: Revision & quick tasks.</p>
                <p>• <strong>Stacked Bar Graph</strong>: Visualizes your daily targets stacked by priority.</p>
                <p>• <strong>Solid vs Translucent</strong>: Solid blocks indicate completed tasks; translucent blocks indicate pending tasks.</p>
              </InfoPopover>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW LAYOUT: COLUMN 1 (CLEAN STACKED BARS) | COLUMN 2 (TODAY'S TARGETS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-4.5 items-stretch pt-0.5">

        {/* ══════════════════════════════════════════════════════════════
            COLUMN 1 (LEFT): TARGET HISTORY (SIMPLE CLEAN STACKED BAR GRAPH)
           ══════════════════════════════════════════════════════════════ */}
        <div className={`lg:col-span-6 flex flex-col justify-between p-3.5 sm:p-4 rounded-xl ${
          isDark 
            ? 'bg-zinc-900/30' 
            : 'bg-zinc-100/70'
        }`}>
          {/* Subheader with Priority Legend & Info */}
          <div className={`flex items-center justify-between gap-2 pb-2.5 ${
            isDark ? 'border-b border-zinc-800/30' : 'border-b border-zinc-200'
          }`}>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 shrink-0" />
              <span className={`text-[11px] sm:text-sm font-bold uppercase tracking-wider ${
                isDark ? 'text-zinc-200' : 'text-zinc-800'
              }`}>
                Target History
              </span>
              {/* <InfoPopover title="Priority Levels">
                <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0" /><strong>High</strong>: Critical study tasks</p>
                <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0" /><strong>Medium</strong>: Core learning targets</p>
                <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500 inline-block shrink-0" /><strong>Low</strong>: Quick review & practice</p>
              </InfoPopover> */}
            </div>

            {/* Simple Clean Legend (Hidden on phone, tucked in info icon) */}
            {/* <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 text-[10px] sm:text-xs font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>High</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Med</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Low</span>
              </span>
            </div> */}
          </div>

          {/* ── 7-DAY STACKED BARS ── */}
          <div className="py-3 sm:py-4 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3 items-end h-28 sm:h-32 md:h-36 select-none">
              {last7DaysData.map((day) => {
                const hasTasks = day.hasTasks;
                const total = day.total;
                const completed = day.completed;
                const isPerfect = hasTasks && completed === total;

                // Priority counts
                const high = day.priority.high;
                const med = day.priority.medium;
                const low = day.priority.low;

                // Tooltip text
                const tooltipText = hasTasks
                  ? `${day.isToday ? 'Today' : day.dayName} (${day.shortDate}): ${completed}/${total} completed\n• High: ${high.completed}/${high.total}\n• Med: ${med.completed}/${med.total}\n• Low: ${low.completed}/${low.total}`
                  : `${day.isToday ? 'Today' : day.dayName} (${day.shortDate}): No targets set`;

                return (
                  <div 
                    key={day.date}
                    className="flex flex-col items-center h-full justify-end group cursor-pointer"
                    title={tooltipText}
                  >
                    {/* Top Completion Indicator */}
                    <div className="mb-1 sm:mb-1.5 text-center h-3.5 sm:h-4 flex items-center justify-center">
                      {hasTasks ? (
                        <span className={`text-[9.5px] sm:text-[10.5px] md:text-[11px] font-mono font-bold transition-colors ${
                          isPerfect 
                            ? 'text-emerald-500 font-extrabold' 
                            : completed > 0 
                              ? isDark ? 'text-zinc-300' : 'text-zinc-700'
                              : isDark ? 'text-zinc-500' : 'text-zinc-400'
                        }`}>
                          {completed}/{total}
                        </span>
                      ) : (
                        <span className={`text-[9.5px] sm:text-[10.5px] md:text-[11px] font-mono ${isDark ? 'text-zinc-650' : 'text-zinc-300'}`}>
                          —
                        </span>
                      )}
                    </div>

                    {/* Stacked Vertical Bar */}
                    <div className={`w-full max-w-[22px] sm:max-w-[26px] h-20 sm:h-24 md:h-28 rounded-lg overflow-hidden flex flex-col-reverse justify-start p-0.5 transition-all duration-150 ${
                      day.isToday 
                        ? isDark ? 'bg-zinc-800/50 shadow-xs' : 'bg-zinc-200/80'
                        : isDark ? 'border border-zinc-800/60 bg-zinc-900/30 group-hover:border-zinc-700' : 'border border-zinc-200/80 bg-white group-hover:border-zinc-300'
                    }`}>
                      {hasTasks ? (
                        <div className="w-full h-full flex flex-col-reverse rounded-md overflow-hidden transition-all duration-300 gap-0.5">
                          {/* Low Priority Segment (Bottom) */}
                          {low.total > 0 && (
                            <div 
                              className={`w-full rounded-xs flex items-center justify-center transition-all duration-300 overflow-hidden ${
                                low.completed === low.total
                                  ? 'bg-sky-500'
                                  : low.completed > 0
                                    ? 'bg-sky-500/25'
                                    : 'bg-sky-500/15'
                              }`}
                              style={{ height: `${(low.total / total) * 100}%` }}
                            >
                              {low.completed === low.total && low.completed > 0 && (
                                <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-white stroke-[3] shrink-0" />
                              )}
                            </div>
                          )}

                          {/* Med Priority Segment (Middle) */}
                          {med.total > 0 && (
                            <div 
                              className={`w-full rounded-xs flex items-center justify-center transition-all duration-300 overflow-hidden ${
                                med.completed === med.total
                                  ? 'bg-amber-500'
                                  : med.completed > 0
                                    ? 'bg-amber-500/25'
                                    : 'bg-amber-500/15'
                              }`}
                              style={{ height: `${(med.total / total) * 100}%` }}
                            >
                              {med.completed === med.total && med.completed > 0 && (
                                <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-white stroke-[3] shrink-0" />
                              )}
                            </div>
                          )}

                          {/* High Priority Segment (Top) */}
                          {high.total > 0 && (
                            <div 
                              className={`w-full rounded-xs flex items-center justify-center transition-all duration-300 overflow-hidden ${
                                high.completed === high.total
                                  ? 'bg-rose-500'
                                  : high.completed > 0
                                    ? 'bg-rose-500/25'
                                    : 'bg-rose-500/15'
                              }`}
                              style={{ height: `${(high.total / total) * 100}%` }}
                            >
                              {high.completed === high.total && high.completed > 0 && (
                                <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-white stroke-[3] shrink-0" />
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-1 rounded bg-zinc-700/20" />
                      )}
                    </div>

                    {/* Day Name Label */}
                    <div className="mt-1 sm:mt-1.5 text-center flex flex-col items-center">
                      <span className={`text-[10px] sm:text-[11px] md:text-xs font-mono block ${
                        day.isToday 
                          ? 'text-zinc-100 font-bold' 
                          : isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-900'
                      }`}>
                        {day.isToday ? 'Today' : day.dayName}
                      </span>
                      <div className="h-2.5 sm:h-3 flex items-center justify-center mt-0.5">
                        {isPerfect && (
                          <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400/30" />
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            COLUMN 2 (RIGHT): TODAY'S TARGETS (STARTS FROM TOP, NO STATUS BAR)
           ══════════════════════════════════════════════════════════════ */}
        <div className={`lg:col-span-6 flex flex-col justify-between p-3.5 sm:p-4 md:p-5 rounded-xl ${
          isDark 
            ? 'bg-zinc-900/30' 
            : 'bg-zinc-100/70'
        }`}>
          {/* Subheader */}
          <div className={`flex items-center justify-between pb-2.5 ${
            isDark ? 'border-b border-zinc-800/30' : 'border-b border-zinc-200'
          }`}>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-zinc-400" />
              <span className={`text-[11px] sm:text-sm font-bold uppercase tracking-wider ${
                isDark ? 'text-zinc-200' : 'text-zinc-800'
              }`}>
                Today's Targets
              </span>
            </div>

            {totalTasks > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Compact Circular Progress Ring Starting at Top (12 o'clock) */}
                <div className="relative w-5 h-5 sm:w-5.5 sm:h-5.5 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      className={isDark ? "stroke-zinc-800" : "stroke-zinc-200"}
                      strokeWidth="3.5"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      className={`transition-all duration-300 ease-out ${
                        isAllCompleted ? "stroke-emerald-500" : "stroke-zinc-500 dark:stroke-zinc-400"
                      }`}
                      strokeDasharray={`${percentComplete} 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  {isAllCompleted && (
                    <Check className="absolute w-2.5 h-2.5 text-emerald-500 stroke-[3]" />
                  )}
                </div>

                <span className={`text-[11px] sm:text-xs font-mono font-bold ${
                  isAllCompleted 
                    ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                    : isDark ? 'text-zinc-300' : 'text-zinc-700'
                }`}>
                  {percentComplete}%
                </span>
              </div>
            )}
          </div>

          {/* Task List (Starts from the top) */}
          <div className="flex-1 flex flex-col justify-start py-2.5 space-y-2 overflow-y-auto max-h-[190px] custom-scrollbar">
            {totalTasks === 0 ? (
              <div className={`text-center py-6 px-4 rounded-xl border border-dashed flex flex-col items-center gap-2 my-auto ${
                isDark ? 'border-zinc-800 bg-zinc-950/20' : 'border-zinc-200 bg-white/60'
              }`}>
                <ClipboardList className={`w-7 h-7 ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`} />
                <div className="space-y-0.5">
                  <p className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-800'}`}>
                    No targets planned for today
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
                    Plan a lecture or revision session to keep your streak burning.
                  </p>
                </div>
                <CustomButton
                  variant="primary"
                  size="sm"
                  icon={PlusCircle}
                  onClick={onNavigateToPlanner}
                  className="mt-1"
                >
                  Add First Target
                </CustomButton>
              </div>
            ) : (
              sortedTasks.map((task) => {
                const isTaskToggling = togglingTaskIds.has(task.id);
                return (
                  <div
                    key={task.id}
                    ref={(el) => {
                      if (el) {
                        itemRefs.current.set(task.id, el);
                      } else {
                        itemRefs.current.delete(task.id);
                      }
                    }}
                    className="will-change-transform"
                  >
                    <div
                      onClick={() => !isTaskToggling && handleTaskToggle(task.id, task.completed)}
                      className={`group min-h-[44px] px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl transition duration-150 flex items-center justify-between gap-2.5 select-none ${
                        isTaskToggling ? 'cursor-wait opacity-80' : 'cursor-pointer'
                      } ${
                        task.completed
                          ? isDark 
                            ? 'bg-zinc-950/40 text-zinc-500' 
                            : 'bg-zinc-200/50 text-zinc-400'
                          : isDark
                            ? 'bg-zinc-900/30 hover:bg-zinc-900/60 text-zinc-200'
                            : 'bg-white/80 hover:bg-white text-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          disabled={isTaskToggling}
                          onClick={(e) => handleTaskToggle(task.id, task.completed, e)}
                          className={`p-1.5 -m-1.5 text-zinc-400 shrink-0 focus:outline-none transition-transform ${
                            isTaskToggling ? 'cursor-wait' : 'cursor-pointer active:scale-90'
                          }`}
                          aria-label={task.completed ? "Mark as incomplete" : "Mark as completed"}
                        >
                          {isTaskToggling ? (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                          ) : task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                          )}
                        </button>

                        <span className={`text-xs sm:text-sm font-medium truncate ${
                          task.completed ? 'line-through opacity-70' : ''
                        }`}>
                          {task.title}
                        </span>
                      </div>

                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Section 2 Footer Link */}
          <div className={`pt-2 ${
            isDark ? 'border-t border-zinc-800/30' : 'border-t border-zinc-200'
          }`}>
            <CustomButton
              variant="secondary"
              size="sm"
              iconRight={ArrowRight}
              onClick={onNavigateToPlanner}
              className="w-full justify-between"
            >
              <span>Open Full Study Planner</span>
            </CustomButton>
          </div>

        </div>

      </div>
    </div>
  );
}
