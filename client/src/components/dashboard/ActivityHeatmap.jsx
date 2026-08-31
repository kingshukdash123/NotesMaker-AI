import { useTheme } from '../../context/ThemeContext';

export default function ActivityHeatmap({ heatmapData = {} }) {
  const { isDark } = useTheme();
  
  // Generate date array for the last 12 weeks (84 days) ending on today's week.
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
  
  // Start date should be Sunday of the week 11 weeks ago
  const totalDaysToShow = 12 * 7;
  const startDate = new Date();
  startDate.setDate(today.getDate() - (totalDaysToShow - 1 - (6 - currentDayOfWeek))); // Align grid ending on Saturday of current week

  const grid = [];
  
  // Format helper
  const formatDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Build the 84-day list
  for (let i = 0; i < totalDaysToShow; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = formatDateStr(currentDate);
    const count = heatmapData[dateStr] || 0;
    
    grid.push({
      date: dateStr,
      dayOfWeek: currentDate.getDay(),
      count,
      formattedDate: currentDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    });
  }

  // Group by week (column-first ordering, so we map 12 weeks of 7 days)
  const weeks = [];
  for (let w = 0; w < 12; w++) {
    weeks.push(grid.slice(w * 7, (w + 1) * 7));
  }

  // Get color scale class based on video processed count
  const getScaleClass = (count) => {
    if (count === 0) {
      return isDark 
        ? 'bg-zinc-900 border-zinc-950/20' 
        : 'bg-orange-100/70 border-orange-200/60 hover:bg-orange-200/70';
    }
    if (count === 1) {
      return isDark 
        ? 'bg-orange-500/20 border-orange-500/10 hover:bg-orange-500/35' 
        : 'bg-orange-300 border-orange-400/50 hover:bg-orange-400';
    }
    if (count === 2) {
      return isDark 
        ? 'bg-orange-500/50 border-orange-500/30 hover:bg-orange-500/65' 
        : 'bg-orange-400 border-orange-500 hover:bg-orange-500';
    }
    return 'bg-orange-500 border-orange-400 hover:bg-orange-400';
  };

  return (
    <div className={`glass-panel border rounded-2xl p-5 transition duration-300 space-y-4 ${
      isDark ? 'border-zinc-800 hover:border-zinc-700/80' : 'border-orange-200/90 hover:border-orange-300 shadow-sm'
    }`}>
      <div>
        <h4 className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
          isDark ? 'text-zinc-500' : 'text-orange-700'
        }`}>
          STUDY CONSISTENCY HEATMAP
        </h4>
        <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-orange-800'}`}>
          Your learning activity over the past 12 weeks.
        </p>
      </div>

      <div className="flex items-start gap-2.5 sm:gap-3 overflow-x-auto py-2 pr-2 custom-scrollbar w-full">
        {/* Left Day Labels */}
        <div className={`flex flex-col justify-between h-[105px] text-[9px] font-mono pt-1 shrink-0 select-none ${
          isDark ? 'text-zinc-550' : 'text-orange-700/90 font-bold'
        }`}>
          <span>Sun</span>
          <span>Tue</span>
          <span>Thu</span>
          <span>Sat</span>
        </div>

        {/* Heatmap Grid */}
        <div className="flex gap-[3.5px] shrink-0">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[3.5px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`w-3.5 h-3.5 rounded-[3px] border transition-colors duration-200 cursor-pointer ${getScaleClass(day.count)}`}
                  title={`${day.count} video(s) learned on ${day.formattedDate}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className={`flex items-center justify-between text-[9px] font-mono pt-2 border-t flex-wrap gap-2 ${
        isDark ? 'text-zinc-500 border-zinc-900/65' : 'text-orange-700 font-bold border-orange-200/70'
      }`}>
        <span>Less active</span>
        <div className="flex items-center gap-1">
          <div className={`w-2.5 h-2.5 rounded-[2px] border ${
            isDark ? 'bg-zinc-900 border-zinc-950/20' : 'bg-orange-100/70 border-orange-200/60'
          }`} title="0 study videos" />
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isDark ? 'bg-orange-500/20' : 'bg-orange-300'}`} title="1 study video" />
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isDark ? 'bg-orange-500/50' : 'bg-orange-400'}`} title="2 study videos" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-orange-500" title="3+ study videos" />
        </div>
        <span>More active</span>
      </div>
    </div>
  );
}
