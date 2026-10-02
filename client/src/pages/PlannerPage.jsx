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
    // On mobile/tablet viewports (< lg), switch tab to daily view when clicking a date in calendar
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setPlannerTab('daily');
    }
  };

  const subTabs = [
    { id: 'daily', label: 'Daily Targets', icon: ClipboardList },
    { id: 'monthly', label: 'Monthly Calendar', icon: CalendarDays },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden lg:overflow-y-auto custom-scrollbar h-full w-full">
      <div className="w-full p-3.5 sm:p-6 md:p-8 flex-1 flex flex-col min-h-0 space-y-3.5 sm:space-y-6 animate-in fade-in duration-300 overflow-hidden lg:overflow-visible">
        
        {/* Page Header (Pinned) */}
        <div className="space-y-1 shrink-0">
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-zinc-50' : 'text-zinc-900'} flex items-center gap-2 sm:gap-2.5`}>
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 shrink-0" />
            <span>Study Planner</span>
          </h1>
        </div>

        {/* ── Mobile & Tablet View: Sub-navigation Tab Bar (< lg) ── */}
        <div className={`lg:hidden flex border-b pb-px overflow-x-auto select-none custom-scrollbar flex-nowrap shrink-0 ${
          isDark ? 'border-zinc-900/60' : 'border-zinc-200/80'
        }`}>
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = plannerTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPlannerTab(tab.id)}
                title={tab.label}
                aria-label={tab.label}
                className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs md:text-sm font-semibold relative transition shrink-0 cursor-pointer ${
                  isActive 
                    ? isDark ? 'text-zinc-50 font-bold' : 'text-zinc-900 font-bold'
                    : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 transition-colors ${
                  isActive 
                    ? 'text-orange-500' 
                    : isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`} />
                <span className="font-medium sm:font-semibold leading-tight text-center whitespace-nowrap">{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-orange-500 rounded-full animate-fadeIn" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Mobile & Tablet Content Area (< lg) ── */}
        <div className="lg:hidden min-h-0 w-full flex-1 flex flex-col overflow-hidden">
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
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
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
            {/* Desktop Column Header */}
            <div className={`flex items-center justify-between pb-3.5 mb-3.5 border-b shrink-0 ${
              isDark ? 'border-zinc-900' : 'border-zinc-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isDark ? 'bg-zinc-850 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                }`}>
                  <ClipboardList className="w-4 h-4" />
                </div>
                <h2 className={`text-sm sm:text-base font-bold tracking-tight ${
                  isDark ? 'text-zinc-100' : 'text-zinc-900'
                }`}>
                  Daily Targets
                </h2>
              </div>
            </div>

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
            {/* Desktop Column Header */}
            <div className={`flex items-center justify-between pb-3.5 mb-3.5 border-b shrink-0 ${
              isDark ? 'border-zinc-900' : 'border-zinc-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isDark ? 'bg-zinc-850 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                }`}>
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h2 className={`text-sm sm:text-base font-bold tracking-tight ${
                  isDark ? 'text-zinc-100' : 'text-zinc-900'
                }`}>
                  Monthly Calendar
                </h2>
              </div>
            </div>

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
