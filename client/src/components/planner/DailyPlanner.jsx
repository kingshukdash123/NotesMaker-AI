import TaskItem from './TaskItem';
import AddTaskForm from './AddTaskForm';
import { CalendarDays, ChevronLeft, ChevronRight, CheckCircle2, ClipboardList } from 'lucide-react';
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

  const todoTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const today = new Date();
  const isToday = dateObj.getDate() === today.getDate() &&
                  dateObj.getMonth() === today.getMonth() &&
                  dateObj.getFullYear() === today.getFullYear();

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full w-full space-y-4 animate-in fade-in duration-300">
      
      {/* Date Navigation Header */}
      <div className={`shrink-0 flex items-center justify-between gap-4 border-b pb-3 ${
        isDark ? 'border-zinc-900' : 'border-orange-200/80'
      }`}>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <CalendarDays className="w-4.5 h-4.5 text-orange-500 shrink-0" />
          <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-orange-950'}`}>
            {formattedDateHeading}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevDay}
            className="btn-icon"
            title="Previous Day"
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
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Task Lists (TO DO & DONE) - Scrollable Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-1 py-1 space-y-6">
        {tasks.length === 0 ? (
          /* Empty State */
          <div className={`text-center py-16 border rounded-2xl flex flex-col items-center justify-center gap-3 ${
            isDark ? 'border-zinc-900 bg-zinc-950/20 text-zinc-400' : 'border-orange-200 bg-orange-50/30 text-orange-950'
          }`}>
            <ClipboardList className={`w-10 h-10 ${isDark ? 'text-zinc-700' : 'text-orange-300'}`} />
            <div className="space-y-1">
              <p className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>Nothing planned for this day</p>
              <p className={`text-[10px] max-w-xs mx-auto leading-relaxed ${isDark ? 'text-zinc-500' : 'text-orange-700'}`}>
                Add study goals, lecture revisions, or homework targets to keep track of your schedule.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Incomplete / To Do Section */}
            {todoTasks.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 px-1">
                  <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
                    isDark ? 'text-zinc-500' : 'text-orange-800'
                  }`}>
                    TO DO ({todoTasks.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {todoTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onDelete={onDeleteTask}
                      onUpdate={onUpdateTask}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed / Done Section */}
            {completedTasks.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 px-1">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-600' : 'text-orange-600'}`} />
                  <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
                    isDark ? 'text-zinc-500' : 'text-orange-800'
                  }`}>
                    COMPLETED ({completedTasks.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onDelete={onDeleteTask}
                      onUpdate={onUpdateTask}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task input form footer - Fixed at bottom */}
      <div className={`shrink-0 pt-4 border-t ${isDark ? 'border-zinc-900/60' : 'border-orange-200/80'}`}>
        <AddTaskForm onAddTask={onAddTask} />
      </div>
    </div>
  );
}
