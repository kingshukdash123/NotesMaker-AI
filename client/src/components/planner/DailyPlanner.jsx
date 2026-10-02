import { useMemo } from 'react';
import TaskItem from './TaskItem';
import AddTaskForm from './AddTaskForm';
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function DailyPlanner({
  tasks = [],
  selectedDate, // Date object or formatted string
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onPrevDay,
  onNextDay,
  onSetToday
}) {
  const { isDark } = useTheme();
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

  // Show non-completed (pending) tasks first, completed tasks last.
  // Secondary sort by priority: High -> Med -> Low
  const sortedTasks = useMemo(() => {
    const priorityWeight = { high: 3, medium: 2, med: 2, low: 1 };
    return [...(tasks || [])].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const pA = priorityWeight[(a.priority || 'medium').toLowerCase()] || 2;
      const pB = priorityWeight[(b.priority || 'medium').toLowerCase()] || 2;
      return pB - pA;
    });
  }, [tasks]);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full w-full space-y-3 sm:space-y-3.5 animate-in fade-in duration-300 overflow-hidden">
      
      {/* 1. Date Navigation Header */}
      <div className={`shrink-0 flex items-center justify-between gap-2 sm:gap-4 border-b pb-2.5 sm:pb-3 ${
        isDark ? 'border-zinc-900' : 'border-zinc-200'
      }`}>
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <h3 className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
            {formattedDateHeading}
          </h3>
          {totalTasks > 0 && (
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
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onPrevDay}
            className="btn-icon"
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
            className="btn-icon"
            title="Next Day"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Unified Task List (Single clean scrollable list matching dashboard) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-1 py-1 space-y-2">
        {tasks.length === 0 ? (
          /* Empty State */
          <div className={`text-center py-10 sm:py-14 border rounded-2xl flex flex-col items-center justify-center gap-3 ${
            isDark ? 'border-zinc-900 bg-zinc-950/20 text-zinc-400' : 'border-zinc-200 bg-white text-zinc-600 shadow-xs'
          }`}>
            <ClipboardList className={`w-9 h-9 sm:w-10 sm:h-10 ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`} />
            <div className="space-y-1">
              <p className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-900'}`}>Nothing planned for this day</p>
              <p className={`text-[10px] max-w-xs mx-auto leading-relaxed ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                Add study goals, lecture revisions, or homework targets below to keep track of your schedule.
              </p>
            </div>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
              onUpdate={onUpdateTask}
            />
          ))
        )}
      </div>

      {/* 3. Task input form (Fixed at bottom) */}
      <div className={`shrink-0 pt-3 sm:pt-4 pb-1 sm:pb-0 border-t ${isDark ? 'border-zinc-900/60' : 'border-zinc-200'}`}>
        <AddTaskForm onAddTask={onAddTask} />
      </div>
    </div>
  );
}
