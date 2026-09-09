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
    // On mobile devices, switch tab to daily view when clicking a date in the calendar
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setPlannerTab('daily');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar h-full w-full">
      <div className="w-full p-3.5 sm:p-6 md:p-8 flex-1 flex flex-col min-h-0 space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-300">
        
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-zinc-50' : 'text-zinc-900'} flex items-center gap-2`}>
            <Calendar className="w-5 h-5 text-orange-500" />
            Study Planner
          </h1>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Set study targets, organize lectures, and track your daily checklist alongside the monthly calendar.
          </p>
        </div>

        {/* ── Mobile & Tablet View: Tab Switcher (< lg) ── */}
        <div className="lg:hidden flex border-b pb-px select-none border-zinc-200 dark:border-zinc-900/60">
          <button
            type="button"
            onClick={() => setPlannerTab('daily')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold relative transition cursor-pointer ${
              plannerTab === 'daily' 
                ? isDark ? 'text-zinc-50 font-bold' : 'text-zinc-900 font-bold'
                : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <ClipboardList className={`w-4 h-4 ${plannerTab === 'daily' ? 'text-orange-500' : isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
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
                ? isDark ? 'text-zinc-50 font-bold' : 'text-zinc-900 font-bold'
                : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <CalendarDays className={`w-4 h-4 ${plannerTab === 'monthly' ? 'text-orange-500' : isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
            <span>Monthly Calendar</span>
            {plannerTab === 'monthly' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full animate-fadeIn" />
            )}
          </button>
        </div>

        {/* ── Mobile & Tablet Content Area (< lg) ── */}
        <div className="lg:hidden min-h-0 w-full flex-1 flex flex-col">
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

        {/* ── Desktop View: Side-by-Side (>= lg) ── */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6 min-h-0 w-full flex-1 items-stretch">
          {/* Left Column: Daily Planner Checklist */}
          <div className={`lg:col-span-6 xl:col-span-5 border rounded-2xl p-5 sm:p-6 flex flex-col min-h-[580px] ${
            isDark ? 'bg-zinc-950/40 border-zinc-900/80' : 'bg-white border-zinc-200/80 shadow-xs'
          }`}>
            {isLoading ? (
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
            )}
          </div>

          {/* Right Column: Monthly Calendar View */}
          <div className={`lg:col-span-6 xl:col-span-7 border rounded-2xl p-5 sm:p-6 flex flex-col min-h-[580px] overflow-y-auto custom-scrollbar ${
            isDark ? 'bg-zinc-950/40 border-zinc-900/80' : 'bg-white border-zinc-200/80 shadow-xs'
          }`}>
            <MonthlyCalendar
              monthTasks={monthTasks}
              currentDate={selectedDate}
              onMonthChange={handleMonthChange}
              onSelectDate={handleSelectDateFromCalendar}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
