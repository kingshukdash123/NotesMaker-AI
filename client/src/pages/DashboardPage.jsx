import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { getUserNotes } from '../services/firebase/notesService';
import { getUserActivity } from '../services/firebase/activityService';
import { useStreak } from '../hooks/useStreak';

// Components
import StreakCard from '../components/dashboard/StreakCard';
import StatsGrid from '../components/dashboard/StatsGrid';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';
import MotivationalQuote from '../components/dashboard/MotivationalQuote';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';

// Icons
import { Award, PlayCircle, BookOpen, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, getUserDisplayName } = useAuth();
  const { loadVideo } = useApp();
  const { isDark } = useTheme();
  const [notesHistory, setNotesHistory] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const [notesData, activityData] = await Promise.all([
          getUserNotes(currentUser.uid),
          getUserActivity(currentUser.uid)
        ]);
        setNotesHistory(notesData);
        setActivityHistory(activityData);
      } catch (err) {
        console.error('Error fetching dashboard history:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [currentUser]);

  // Combine note processing events and login activity events for streak & heatmap calculations
  const combinedHistory = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    return [
      ...notesHistory.map(n => ({ createdAt: n.createdAt })),
      ...activityHistory.map(a => ({ date: a.date })),
      { date: todayStr }
    ];
  }, [notesHistory, activityHistory]);

  const {
    currentStreak,
    longestStreak,
    weeklyActivity,
    heatmapData
  } = useStreak(combinedHistory);

  const displayName = getUserDisplayName(currentUser);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Get last 4 processed videos for "Recent Activity" list
  const recentSessions = notesHistory.slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar h-full w-full">
      <div className="max-w-5xl mx-auto p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-300">
        
        {/* Top Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className={`text-lg sm:text-2xl font-black tracking-tight ${
              isDark ? 'text-zinc-50' : 'text-orange-950'
            }`}>
              Welcome back, {displayName} 👋
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-450' : 'text-orange-800'}`}>
              {notesHistory.length > 0 
                ? `You've studied ${notesHistory.length} educational videos. Let's keep learning!`
                : "Ready to start your learning journey? Head over to the Discover tab to find your first video."}
            </p>
          </div>
          
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold w-fit shrink-0 select-none border ${
            isDark 
              ? 'bg-orange-950/20 border-orange-900/30 text-orange-400 shadow-sm shadow-orange-500/5' 
              : 'bg-orange-100 border-orange-300 text-orange-700 shadow-xs'
          }`}>
            <Award className="w-4 h-4 animate-bounce" />
            <span>Streak: {currentStreak} Days</span>
          </div>
        </div>

        {/* Quotes Board */}
        <MotivationalQuote />

        {/* Performance Grid: Streak + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="md:col-span-1">
            <StreakCard 
              currentStreak={currentStreak} 
              longestStreak={longestStreak} 
              weeklyActivity={weeklyActivity} 
            />
          </div>
          
          <div className="md:col-span-2 flex flex-col gap-4 sm:gap-6">
            <StatsGrid 
              notesHistory={notesHistory} 
              heatmapData={heatmapData} 
            />
            
            <div>
              <ActivityHeatmap heatmapData={heatmapData} />
            </div>
          </div>
        </div>

        {/* Recent Study Sessions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 ${
              isDark ? 'text-zinc-500' : 'text-orange-700'
            }`}>
              <PlayCircle className="w-4 h-4 text-orange-500" />
              RECENT STUDY SESSIONS
            </h3>
          </div>

          {recentSessions.length === 0 ? (
            <div className={`rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 border ${
              isDark 
                ? 'border-zinc-900 bg-zinc-950/20' 
                : 'border-orange-200/90 bg-orange-50/60 shadow-xs'
            }`}>
              <BookOpen className={`w-10 h-10 ${isDark ? 'text-zinc-700' : 'text-orange-400'}`} />
              <div className="space-y-1">
                <p className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-orange-900'}`}>No study sessions recorded yet</p>
                <p className={`text-[10px] max-w-xs mx-auto ${isDark ? 'text-zinc-650' : 'text-orange-700'}`}>
                  Find some educational videos on the Discover page to generate summaries and take structured notes.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentSessions.map((session) => {
                const videoId = session.metadata?.video_id || '';
                return (
                  <div
                    key={session.id}
                    onClick={() => loadVideo(videoId, session.videoUrl, session.metadata, session.id, session.result)}
                    className={`group rounded-xl p-3.5 cursor-pointer flex gap-3.5 transition duration-300 min-w-0 border ${
                      isDark 
                        ? 'border-zinc-900 hover:border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/40' 
                        : 'border-orange-200/90 hover:border-orange-300 bg-white hover:bg-orange-50/70 shadow-xs'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className={`relative shrink-0 w-24 aspect-video rounded-lg overflow-hidden border ${
                      isDark ? 'bg-zinc-900 border-zinc-850' : 'bg-orange-100 border-orange-200'
                    }`}>
                      {session.metadata?.thumbnail ? (
                        <img 
                          src={session.metadata.thumbnail} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-300"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${
                          isDark ? 'bg-zinc-950 text-zinc-600' : 'bg-orange-100 text-orange-400'
                        }`}>
                          <PlayCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="space-y-1 min-w-0">
                        <h4 className={`text-xs font-bold line-clamp-2 leading-tight transition min-w-0 ${
                          isDark 
                            ? 'text-zinc-200 group-hover:text-orange-400' 
                            : 'text-orange-950 group-hover:text-orange-600'
                        }`}>
                          {session.metadata?.title || 'Academic Study Session'}
                        </h4>
                        <p className={`text-[10px] truncate font-semibold ${
                          isDark ? 'text-zinc-550' : 'text-orange-700'
                        }`}>
                          {session.metadata?.channel || 'YouTube Video'}
                        </p>
                      </div>
                      
                      <div className={`flex items-center justify-between text-[9px] font-semibold pt-1 ${
                        isDark ? 'text-zinc-600' : 'text-orange-600'
                      }`}>
                        <span>Notes Generated</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-orange-500 shrink-0" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
