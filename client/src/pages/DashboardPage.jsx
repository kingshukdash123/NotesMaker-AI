import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { getUserNotes } from '../services/firebase/notesService';
import { getUserActivity } from '../services/firebase/activityService';
import { getUserWatchHistory } from '../services/firebase/historyService';
import { getTasksByDate, getTasksByMonth, toggleTaskStatus } from '../services/firebase/plannerService';
import { useStreak } from '../hooks/useStreak';

// Components
import StreakCard from '../components/dashboard/StreakCard';
import StatsGrid from '../components/dashboard/StatsGrid';
import MotivationalQuote from '../components/dashboard/MotivationalQuote';
import TodayPlanWidget from '../components/dashboard/TodayPlanWidget';
import RecentActivityWidget from '../components/dashboard/RecentActivityWidget';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';

// Icons
import { Clock, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, getUserDisplayName } = useAuth();
  const { 
    loadVideo, 
    setActiveSection, 
    setLibraryTab, 
    setPlannerTab 
  } = useApp();
  const { isDark } = useTheme();

  const [notesHistory, setNotesHistory] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [monthTasks, setMonthTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live ticking date and time with seconds
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { timeHoursMinutes, timeSeconds, timePeriod, fullDateString } = useMemo(() => {
    let hours = currentTime.getHours();
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');

    const fullDate = currentTime.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return {
      timeHoursMinutes: `${hoursStr}:${minutes}`,
      timeSeconds: seconds,
      timePeriod: period,
      fullDateString: fullDate
    };
  }, [currentTime]);

  // Helper for today's local date string
  const todayStr = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 6-month range for planner tasks
  const sixMonthsAgoStr = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Fetch all dashboard data concurrently
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [notesData, activityData, watchData, tasksTodayData, tasksRangeData] = await Promise.all([
          getUserNotes(currentUser.uid),
          getUserActivity(currentUser.uid),
          getUserWatchHistory(currentUser.uid),
          getTasksByDate(currentUser.uid, todayStr),
          getTasksByMonth(currentUser.uid, sixMonthsAgoStr, todayStr)
        ]);
        setNotesHistory(notesData || []);
        setActivityHistory(activityData || []);
        setWatchHistory(watchData || []);
        setTodayTasks(tasksTodayData || []);
        setMonthTasks(tasksRangeData || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser, todayStr, sixMonthsAgoStr]);

  // Compute Streak and Dual-Factor Heatmap Depth Data
  const {
    currentStreak,
    longestStreak,
    weeklyActivity,
    heatmapData,
    dayMetrics
  } = useStreak({
    notesHistory,
    watchHistory,
    plannerTasks: monthTasks,
    activityHistory
  });

  // Task check/uncheck toggle handler
  const handleToggleTask = useCallback(async (taskId, currentStatus) => {
    try {
      await toggleTaskStatus(taskId, currentStatus);
      setTodayTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t));
      setMonthTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t));
    } catch (err) {
      console.error('Failed to toggle task status:', err);
    }
  }, []);

  // Cross-page navigation handlers
  const handleNavigateToDiscover = useCallback(() => {
    setActiveSection('discover');
  }, [setActiveSection]);

  const handleNavigateToPlanner = useCallback(() => {
    setPlannerTab('daily');
    setActiveSection('planner');
  }, [setPlannerTab, setActiveSection]);

  const handleNavigateToHistory = useCallback(() => {
    setLibraryTab('history');
    setActiveSection('library');
  }, [setLibraryTab, setActiveSection]);

  const handleNavigateToNotes = useCallback(() => {
    setLibraryTab('notes');
    setActiveSection('library');
  }, [setLibraryTab, setActiveSection]);

  const handleOpenVideo = useCallback((item) => {
    const videoId = item.videoId || item.metadata?.video_id || '';
    const videoUrl = item.videoUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '');
    loadVideo(videoId, videoUrl, item.metadata, item.id, item.result);
  }, [loadVideo]);

  const displayName = getUserDisplayName(currentUser);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar h-full w-full">
      <div className="w-full p-3 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-5 md:space-y-6 animate-in fade-in duration-300">
        
        {/* ── TOP HERO: 1ST COL (GREETING & QUOTE - 2/3) | 2ND COL (TIME & DATE - 1/3) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 lg:gap-6 items-stretch w-full">
          {/* 1st Column: Greetings & Motivational Quote (2/3 width) */}
          <div className="md:col-span-2 flex flex-col justify-between space-y-3 h-full">
            <div>
              <h2 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-2 ${
                isDark ? 'text-zinc-50' : 'text-zinc-900'
              }`}>
                Welcome back, {displayName} 👋
              </h2>
              <p className={`text-xs sm:text-sm md:text-base mt-1 sm:mt-1.5 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {notesHistory.length > 0 || watchHistory.length > 0 
                  ? `You've engaged with ${Math.max(notesHistory.length, watchHistory.length)} educational lectures. Let's make today productive!`
                  : "Ready to start your learning journey? Explore educational videos or set daily study targets."}
              </p>
            </div>

            <MotivationalQuote className="w-full mt-auto" />
          </div>
          
          {/* 2nd Column: Date and Time Widget (1/3 width) */}
          <div className="md:col-span-1 flex flex-col justify-center">
            <div className={`h-full rounded-2xl p-3.5 sm:p-4 md:p-5 flex flex-col justify-center items-center text-center select-none bg-transparent ${
              isDark ? 'text-zinc-100' : 'text-zinc-900'
            }`}>
              {/* Clock Display with Seconds */}
              <div className="flex items-baseline justify-center font-mono">
                <span className={`text-3xl sm:text-4xl md:text-3xl lg:text-5xl font-black tracking-tight leading-none ${
                  isDark ? 'text-zinc-100' : 'text-zinc-900'
                }`}>
                  {timeHoursMinutes}
                </span>
                <span className="text-xl sm:text-2xl md:text-xl lg:text-3xl font-black text-orange-500 leading-none">
                  :{timeSeconds}
                </span>
                <span className="text-[10px] sm:text-xs md:text-[11px] lg:text-sm font-bold uppercase tracking-wider ml-1 sm:ml-1.5 leading-none text-orange-500">
                  {timePeriod}
                </span>
              </div>

              {/* Full Calendar Date */}
              <div className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-xs lg:text-sm font-medium mt-2.5 sm:mt-3 ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" />
                <span>{fullDateString}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── WEEKLY METRICS STATS RIBBON (FULL WIDTH) ── */}
        <StatsGrid 
          notesHistory={notesHistory} 
          watchHistory={watchHistory} 
          heatmapData={heatmapData} 
          dayMetrics={dayMetrics}
          onNavigateToDiscover={handleNavigateToDiscover}
          onNavigateToNotes={handleNavigateToNotes}
          onNavigateToPlanner={handleNavigateToPlanner}
        />

        {/* ── STATUS STREAK (FULL WIDTH) ── */}
        <StreakCard 
          currentStreak={currentStreak} 
          longestStreak={longestStreak} 
          weeklyActivity={weeklyActivity} 
          heatmapData={heatmapData} 
          dayMetrics={dayMetrics} 
        />

        {/* ── STUDY PLANNER: 7-DAY COMPLETION RATE GRAPH | TODAY'S PLANS (ROW LAYOUT) ── */}
        <TodayPlanWidget 
          tasks={todayTasks} 
          monthTasks={monthTasks}
          onToggleTask={handleToggleTask} 
          onNavigateToPlanner={handleNavigateToPlanner} 
        />

        {/* ── RECENT ACTIVITY: WATCH HISTORY | GENERATED NOTES (FULL WIDTH) ── */}
        <RecentActivityWidget 
          watchHistory={watchHistory} 
          notesHistory={notesHistory} 
          onOpenVideo={handleOpenVideo} 
          onNavigateToHistory={handleNavigateToHistory} 
          onNavigateToNotes={handleNavigateToNotes} 
        />

      </div>
    </div>
  );
}
