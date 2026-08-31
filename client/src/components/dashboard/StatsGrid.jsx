import { Video, FileText, Calendar, TrendingUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function StatsGrid({ notesHistory = [], heatmapData = {} }) {
  const { isDark } = useTheme();
  const totalVideos = notesHistory.length;
  
  // Calculate total notes (in this app, each notesHistory item corresponds to a generated note document)
  const totalNotes = notesHistory.filter(n => n.result?.draft_notes || n.result?.final_notes).length;

  // Calculate unique study days (size of the heatmapData keys)
  const totalStudyDays = Object.keys(heatmapData).length;

  // Calculate weekly average (total videos / number of active weeks, fallback to 1)
  const uniqueWeeks = new Set();
  Object.keys(heatmapData).forEach(dateStr => {
    const date = new Date(dateStr);
    // Get simple week identifier: YYYY-WW
    const year = date.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
    const resultWeek = Math.ceil(( date.getDay() + 1 + numberOfDays) / 7);
    uniqueWeeks.add(`${year}-${resultWeek}`);
  });
  
  const totalWeeks = Math.max(uniqueWeeks.size, 1);
  const weeklyAverage = (totalVideos / totalWeeks).toFixed(1);

  const stats = [
    {
      title: 'VIDEOS LEARNED',
      value: totalVideos,
      sub: 'videos processed',
      icon: Video,
    },
    {
      title: 'NOTES GENERATED',
      value: totalNotes,
      sub: 'academic outlines',
      icon: FileText,
    },
    {
      title: 'TOTAL STUDY DAYS',
      value: totalStudyDays,
      sub: 'days with study activity',
      icon: Calendar,
    },
    {
      title: 'WEEKLY AVERAGE',
      value: weeklyAverage,
      sub: 'videos per active week',
      icon: TrendingUp,
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div 
            key={idx} 
            className={`glass-panel border rounded-2xl p-3.5 sm:p-4.5 space-y-2.5 sm:space-y-3 transition duration-300 relative overflow-hidden ${
              isDark ? 'border-zinc-800 hover:border-zinc-700/80' : 'border-orange-200/90 hover:border-orange-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[8px] sm:text-[9px] font-mono font-bold tracking-wider uppercase truncate pr-1 ${
                isDark ? 'text-zinc-550' : 'text-orange-700'
              }`}>
                {stat.title}
              </span>
              <div className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg flex items-center justify-center border shrink-0 ${
                isDark 
                  ? 'text-orange-500 bg-orange-950/20 border-orange-900/30' 
                  : 'text-orange-600 bg-orange-100 border-orange-300 shadow-xs'
              }`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </div>
            </div>

            <div className="space-y-0.5">
              <span className={`text-xl sm:text-2xl font-black tracking-tight block ${
                isDark ? 'text-zinc-150' : 'text-orange-950'
              }`}>
                {stat.value}
              </span>
              <span className={`text-[9px] sm:text-[10px] block leading-none font-medium truncate ${
                isDark ? 'text-zinc-500' : 'text-orange-800'
              }`}>
                {stat.sub}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

