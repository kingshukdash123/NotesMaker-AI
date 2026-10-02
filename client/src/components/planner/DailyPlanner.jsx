import { useState, useMemo, useRef, useLayoutEffect } from 'react';
import TaskItem from './TaskItem';
import AddTaskForm from './AddTaskForm';
import { TaskListSkeleton } from '../skeletons/PlannerSkeleton';
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Check, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function DailyPlanner({
  tasks = [],
  selectedDate, // Date object or formatted string
  isLoading = false,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onPrevDay,
  onNextDay,
  onSetToday
}) {
  const { isDark } = useTheme();
  const [activeMenuTaskId, setActiveMenuTaskId] = useState(null);
  // Format current date heading beautifully: e.g. "Saturday, Aug 29"
  const dateObj = new Date(selectedDate);
  const formattedDateHeading = dateObj.toLocaleDateString([], { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const percentComplete = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const isAllCompleted = totalTasks > 0 && completedCount === totalTasks;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const selectedStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  const isToday = selectedStr === todayStr;

  // Pending tasks come first (newly undone tasks at top), completed tasks come last (newly done tasks at bottom)
  const sortedTasks = useMemo(() => {
    const pending = (tasks || []).filter(t => !t.completed);
    const completed = (tasks || []).filter(t => t.completed);
    return [...pending, ...completed];
  }, [tasks]);

  // ── FLIP (First, Last, Invert, Play) Smooth Layout Animation for Reordering ──
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
          // Invert: snap element to previous location
          el.style.transform = `translateY(${deltaY}px)`;
          el.style.transition = 'none';

          // Force reflow
          void el.offsetHeight;

          // Play: animate smoothly to new destination
          requestAnimationFrame(() => {
            el.style.transition = 'transform 380ms cubic-bezier(0.25, 1, 0.5, 1)';
            el.style.transform = '';
          });
        }
      }
    });

    // Save positions for next render
    const nextPositions = new Map();
    itemRefs.current.forEach((el, id) => {
      if (el) {
        nextPositions.set(id, el.getBoundingClientRect());
      }
    });
    prevPositions.current = nextPositions;
  }, [sortedTasks]);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full w-full overflow-hidden">
      
      {/* 1. Date Navigation Header (Card Header) */}
      <div className={`shrink-0 flex items-center justify-between gap-2 sm:gap-4 border-b pb-3 px-2 sm:px-3 ${
        isDark ? 'border-zinc-900' : 'border-zinc-200'
      }`}>
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <h3 className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
            {formattedDateHeading}
          </h3>
          {isLoading ? (
            <div className="flex items-center gap-1.5 sm:gap-2 ml-2 sm:ml-3 shrink-0">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 shrink-0" />
            </div>
          ) : totalTasks > 0 ? (
            <div className="flex items-center gap-1.5 sm:gap-2 ml-2 sm:ml-3 shrink-0">
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
          ) : null}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onPrevDay}
            className={`p-1.5 rounded-lg transition cursor-pointer select-none ${
              isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800'
            }`}
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={onSetToday}
            className="btn-secondary px-2.5 py-1 text-[10px] sm:text-xs font-bold !rounded-lg"
          >
            {isToday ? 'Today' : 'Go Today'}
          </button>

          <button
            type="button"
            onClick={onNextDay}
            className={`p-1.5 rounded-lg transition cursor-pointer select-none ${
              isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800'
            }`}
            title="Next Day"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Task Input Form (With balanced gaps before and after) */}
      <div className="shrink-0 mt-4 sm:mt-5 mb-4 sm:mb-5 px-0.5">
        <AddTaskForm onAddTask={onAddTask} />
      </div>

      {/* 3. Unified Task List (Scrollable Area) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-1 space-y-1.5 sm:space-y-2">
        {isLoading ? (
          <TaskListSkeleton count={4} />
        ) : tasks.length === 0 ? (
          /* Empty State */
          <div className={`text-center py-8 sm:py-12 border rounded-2xl flex flex-col items-center justify-center gap-2.5 ${
            isDark ? 'border-zinc-900 bg-zinc-950/20 text-zinc-400' : 'border-zinc-200 bg-white text-zinc-600 shadow-xs'
          }`}>
            <ClipboardList className={`w-8 h-8 sm:w-10 sm:h-10 ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`} />
            <div className="space-y-1">
              <p className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-900'}`}>Nothing planned for this day</p>
              <p className={`text-[10px] max-w-xs mx-auto leading-relaxed ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                Add study goals, lecture revisions, or homework targets above to keep track of your schedule.
              </p>
            </div>
          </div>
        ) : (
          sortedTasks.map((task) => {
          const isMenuOpen = activeMenuTaskId === task.id;
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
              className="relative will-change-transform"
              style={{ zIndex: isMenuOpen ? 50 : 1 }}
            >
              <TaskItem
                task={task}
                isMenuOpen={isMenuOpen}
                onToggleMenu={(isOpen) => setActiveMenuTaskId(isOpen ? task.id : null)}
                onToggle={onToggleTask}
                onDelete={onDeleteTask}
                onUpdate={onUpdateTask}
              />
            </div>
          );
        })
        )}
      </div>
    </div>
  );
}
