import { useState, useEffect, useCallback } from 'react';
import { usePlanner } from '../hooks/usePlanner';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';

// Subcomponents
import DailyPlanner from '../components/planner/DailyPlanner';
import MonthlyCalendar from '../components/planner/MonthlyCalendar';
import { DailyPlannerSkeleton } from '../components/skeletons/PlannerSkeleton';

// Icons
import { Calendar, ClipboardList, CalendarDays } from 'lucide-react';

export default function PlannerPage() {
  const { isDark } = useTheme();
  const { plannerTab, setPlannerTab } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const {
    tasks,
    monthTasks,
    isLoading,
    fetchTasksByDate,
    fetchTasksByMonth,
    addTask,
    toggleTask,
    removeTask,
    updateTask
  } = usePlanner();

  // Format date helper: YYYY-MM-DD local
  const formatDateStr = useCallback((d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const selectedDateStr = formatDateStr(selectedDate);

  // Fetch tasks when selected date changes
  useEffect(() => {
    fetchTasksByDate(selectedDateStr);
  }, [selectedDateStr, fetchTasksByDate]);

  // Fetch month tasks when year/month changes
  useEffect(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    // First day of current month, padded back 7 days for safety
    const startDate = new Date(year, month, 1);
    startDate.setDate(startDate.getDate() - 7);
    
    // Last day of current month, padded forward 7 days for safety
    const endDate = new Date(year, month + 1, 0);
    endDate.setDate(endDate.getDate() + 7);

    fetchTasksByMonth(formatDateStr(startDate), formatDateStr(endDate));
  }, [selectedDate, fetchTasksByMonth, formatDateStr]);

  // Daily Planner callbacks
  const handleAddTask = async (title, priority) => {
    await addTask(title, selectedDateStr, priority);
  };

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(selectedDate.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + 1);
    setSelectedDate(next);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date());
  };

  // Monthly Calendar callbacks
  const handleMonthChange = (newMonthDate) => {
    setSelectedDate(newMonthDate);
  };

  const handleSelectDateFromCalendar = (dateObj) => {
    setSelectedDate(dateObj);
    setPlannerTab('daily'); // Switch to daily view for the selected day
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar h-full w-full">
      <div className="max-w-4xl w-full mx-auto p-3.5 sm:p-6 md:p-8 flex-1 flex flex-col min-h-0 space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-300">
        
        {/* Page Header */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-50 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Study Planner
          </h2>
          <p className="text-xs text-zinc-450">
            Set study targets, organise lectures, and track your daily checklist.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-900/60 pb-px select-none">
          <button
            type="button"
            onClick={() => setPlannerTab('daily')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold relative transition cursor-pointer ${
              plannerTab === 'daily' 
                ? isDark ? 'text-zinc-50 font-bold' : 'text-orange-950 font-bold'
                : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-orange-950/60 hover:text-orange-900'
            }`}
          >
            <ClipboardList className={`w-4 h-4 ${plannerTab === 'daily' ? 'text-orange-500' : isDark ? 'text-zinc-500' : 'text-orange-600'}`} />
            <span>Daily Targets</span>
            {plannerTab === 'daily' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full animate-fadeIn" />
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setPlannerTab('monthly')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold relative transition cursor-pointer ${
              plannerTab === 'monthly' 
                ? isDark ? 'text-zinc-50 font-bold' : 'text-orange-950 font-bold'
                : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-orange-950/60 hover:text-orange-900'
            }`}
          >
            <CalendarDays className={`w-4 h-4 ${plannerTab === 'monthly' ? 'text-orange-500' : isDark ? 'text-zinc-500' : 'text-orange-600'}`} />
            <span>Monthly Calendar</span>
            {plannerTab === 'monthly' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full animate-fadeIn" />
            )}
          </button>
        </div>

        {/* Sub-tab view content pane */}
        <div className="min-h-0 w-full flex-1 flex flex-col">
          {plannerTab === 'daily' && (
            isLoading ? (
              <DailyPlannerSkeleton />
            ) : (
              <DailyPlanner
                tasks={tasks}
                selectedDate={selectedDate}
                onAddTask={handleAddTask}
                onToggleTask={toggleTask}
                onDeleteTask={removeTask}
                onUpdateTask={updateTask}
                onPrevDay={handlePrevDay}
                onNextDay={handleNextDay}
                onSetToday={handleSetToday}
              />
            )
          )}

          {plannerTab === 'monthly' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              <MonthlyCalendar
                monthTasks={monthTasks}
                currentDate={selectedDate}
                onMonthChange={handleMonthChange}
                onSelectDate={handleSelectDateFromCalendar}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
