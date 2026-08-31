import { Flame, Award, CalendarDays } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function StreakCard({ currentStreak = 0, longestStreak = 0, weeklyActivity = [] }) {
  const { isDark } = useTheme();
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Align weekly activity (last 7 days) to correct day letters.
  // weeklyActivity contains 7 numbers, where index 6 is today.
  const today = new Date();
  const weekDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    weekDays.push({
      label: daysOfWeek[d.getDay()],
      active: weeklyActivity[6 - i] > 0,
      count: weeklyActivity[6 - i]
    });
  }

  return (
    <div className={`glass-panel border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-full transition duration-300 ${
      isDark ? 'border-zinc-800 hover:border-zinc-700/80' : 'border-orange-200/90 hover:border-orange-300 shadow-sm'
    }`}>
      {/* Background Glow */}
      <div className="absolute -right-16 -top-16 w-36 h-36 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="space-y-6">
        {/* Card Title & Icon */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
            isDark ? 'text-zinc-500' : 'text-orange-700'
          }`}>
            STREAK STATUS
          </span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
            isDark 
              ? 'bg-orange-950/25 border-orange-900/35 text-orange-500' 
              : 'bg-orange-100 border-orange-300 text-orange-600 shadow-xs'
          }`}>
            <Flame className="w-4.5 h-4.5 animate-pulse" />
          </div>
        </div>

        {/* Big Numbers */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold tracking-tight ${
              isDark ? 'text-zinc-155' : 'text-orange-950'
            }`}>
              {currentStreak}
            </span>
            <span className={`text-xs font-semibold ${
              isDark ? 'text-zinc-400' : 'text-orange-800'
            }`}>
              {currentStreak === 1 ? 'day study streak' : 'day study streak'}
            </span>
          </div>
          <p className={`text-[11px] flex items-center gap-1 ${
            isDark ? 'text-zinc-500' : 'text-orange-700'
          }`}>
            <Award className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-600' : 'text-orange-500'}`} />
            Longest streak: <span className={`font-bold ${isDark ? 'text-zinc-400' : 'text-orange-900'}`}>{longestStreak} days</span>
          </p>
        </div>

        {/* Weekly Consistency Visualizer */}
        <div className={`space-y-2 pt-2 border-t ${
          isDark ? 'border-zinc-900/60' : 'border-orange-200/70'
        }`}>
          <h4 className={`text-[10px] font-mono font-bold flex items-center gap-1.5 ${
            isDark ? 'text-zinc-400' : 'text-orange-800'
          }`}>
            <CalendarDays className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'text-orange-600'}`} />
            WEEKLY CONSISTENCY
          </h4>
          <div className="flex justify-between items-center gap-1 py-1">
            {weekDays.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                <div 
                  className={`w-full aspect-square max-w-[28px] rounded-lg border transition flex items-center justify-center text-[10px] font-bold ${
                    day.active 
                      ? isDark
                        ? 'bg-orange-500/25 border-orange-500 text-orange-400 shadow-md shadow-orange-500/10'
                        : 'bg-orange-500 border-orange-400 text-white shadow-xs'
                      : isDark
                        ? 'bg-zinc-900/40 border-zinc-800 text-zinc-650'
                        : 'bg-orange-50/90 border-orange-200 text-orange-800/80'
                  }`}
                  title={day.active ? `${day.count} video(s) processed` : 'No activity'}
                >
                  {day.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

