import { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import InfoPopover from '../common/InfoPopover';
import CustomButton from '../common/CustomButton';
import { CheckCircle2, FileText, Video, X } from 'lucide-react';

export default function ActivityHeatmap({ 
  heatmapData = {}, 
  dayMetrics = {} 
}) {
  const { isDark } = useTheme();
  const [selectedDay, setSelectedDay] = useState(null);
  const scrollContainerRef = useRef(null);

  // Generate date array from today's date of previous year to current day (365 days / 1 year)
  const today = useMemo(() => new Date(), []);

  const formatDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = useMemo(() => formatDateStr(today), [today]);

  const startDate = useMemo(() => {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }, [today]);

  // Build grid data
  const { weeks } = useMemo(() => {
    const days = [];
    const curr = new Date(startDate);
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    while (curr <= end) {
      const dateStr = formatDateStr(curr);
      const metric = dayMetrics[dateStr] || {
        score: heatmapData[dateStr] || 0,
        level: 0,
        notesCount: 0,
        videosCount: 0,
        tasksCompleted: 0,
        tasksTotal: 0,
      };

      days.push({
        date: dateStr,
        dayOfWeek: curr.getDay(),
        formattedDate: curr.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        isToday: dateStr === todayStr,
        metric
      });

      curr.setDate(curr.getDate() + 1);
    }

    const weekCols = [];
    let currentWeek = [];

    // Pad leading empty slots before the first day based on day-of-week (Sunday = 0)
    if (days.length > 0) {
      const startDow = days[0].dayOfWeek;
      for (let p = 0; p < startDow; p++) {
        currentWeek.push(null);
      }
    }

    days.forEach((dayObj) => {
      currentWeek.push(dayObj);
      if (currentWeek.length === 7) {
        weekCols.push(currentWeek);
        currentWeek = [];
      }
    });

    // Pad trailing slots in the final partial week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weekCols.push(currentWeek);
    }

    return { weeks: weekCols };
  }, [startDate, today, todayStr, heatmapData, dayMetrics]);

  // Auto-scroll to current week on mobile touch screens
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, []);

  const getLevelFromScore = (score) => {
    if (!score || score <= 0) return 0;
    if (score <= 2) return 1;
    if (score <= 5) return 2;
    if (score <= 8) return 3;
    return 4;
  };

  const getLevelColorClass = (level, isToday, isSelected) => {
    const ring = isSelected 
      ? isDark ? 'ring-2 ring-[#39d353] ring-offset-1 ring-offset-black' : 'ring-2 ring-[#26a641] ring-offset-1 ring-offset-white' 
      : '';
    
    if (level === 0) {
      return `${ring} ${
        isDark 
          ? 'bg-[#2d333b] hover:bg-[#373e47]' 
          : 'bg-[#ebedf0] hover:bg-[#dfe1e5]'
      }`;
    }
    if (level === 1) {
      return `${ring} ${
        isDark 
          ? 'bg-[#0e4429] hover:bg-[#125835]' 
          : 'bg-[#9be9a8] hover:bg-[#82dc90]'
      }`;
    }
    if (level === 2) {
      return `${ring} ${
        isDark 
          ? 'bg-[#006d32] hover:bg-[#00863d]' 
          : 'bg-[#40c463] hover:bg-[#34b655]'
      }`;
    }
    if (level === 3) {
      return `${ring} ${
        isDark 
          ? 'bg-[#26a641] hover:bg-[#2ebd49]' 
          : 'bg-[#30a14e] hover:bg-[#278e43]'
      }`;
    }
    return `${ring} ${
      isDark 
        ? 'bg-[#39d353] hover:bg-[#50df68]' 
        : 'bg-[#216e39] hover:bg-[#195a2d]'
    }`;
  };

  const getLevelLabel = (level) => {
    switch (level) {
      case 1: return 'Light Activity';
      case 2: return 'Moderate Study';
      case 3: return 'Deep Focus';
      case 4: return 'Masterclass Day';
      default: return 'Rest Day';
    }
  };

  return (
    <div className={`glass-panel rounded-2xl p-5 sm:p-6 transition duration-300 space-y-4 border ${
      isDark ? 'border-zinc-900 bg-zinc-950/40 hover:border-zinc-850' : 'border-zinc-200/80 bg-white shadow-xs'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
            isDark ? 'text-zinc-500' : 'text-zinc-500'
          }`}>
            STUDY CONSISTENCY HEATMAP
          </h4>
          <InfoPopover title="How Heatmap Depth is Calculated">
            <p>• <strong>AI Notes Generated</strong>: <code>+4 pts</code> each.</p>
            <p>• <strong>Planner Targets</strong>: <code>+1 to +3 pts</code> by priority (High = 3, Med = 2, Low = 1).</p>
            <p>• <strong>100% Target Attainment</strong>: Finishing all daily targets awards up to <code>+3 bonus pts</code>.</p>
            <p>• <strong>Lectures Watched</strong>: <code>+2 pts</code> each.</p>
            <p>• <strong>Daily Study Bonus</strong>: <code>+1 pt</code> on active days.</p>
            <div className="pt-1 font-semibold text-emerald-500">
              Tap or hover on any day square to inspect the full breakdown!
            </div>
          </InfoPopover>
        </div>

        <span className={`text-[10px] font-mono ${
          isDark ? 'text-zinc-600' : 'text-zinc-400'
        }`}>
          Last 1 Year (365 Days)
        </span>
      </div>

      {/* Heatmap Grid Scroll Container */}
      <div 
        ref={scrollContainerRef}
        className="flex items-start gap-2.5 overflow-x-auto pb-2 pr-2 custom-scrollbar w-full touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Left Day Labels */}
        <div className={`flex flex-col justify-between h-[105px] text-[9px] font-mono pt-1 shrink-0 select-none ${
          isDark ? 'text-zinc-600' : 'text-zinc-400 font-medium'
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
              {week.map((day, dayIdx) => {
                if (!day) {
                  return <div key={`empty-${weekIdx}-${dayIdx}`} className="w-3.5 h-3.5" />;
                }
                const level = day.metric.level || getLevelFromScore(day.metric.score);
                const isSelected = selectedDay && selectedDay.date === day.date;

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`w-3.5 h-3.5 rounded-[3px] transition-all duration-150 cursor-pointer focus:outline-none ${
                      getLevelColorClass(level, day.isToday, isSelected)
                    }`}
                    title={`${day.formattedDate} • ${day.metric.score || 0} pts`}
                    aria-label={`${day.formattedDate} • ${day.metric.score || 0} pts`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Tap-to-Inspect Card for Touch & Desktop */}
      {selectedDay && (
        <div className={`rounded-xl p-3 sm:p-3.5 transition animate-in fade-in zoom-in-95 duration-150 flex items-start justify-between gap-3 ${
          isDark ? 'bg-zinc-900/70 text-zinc-200' : 'bg-white border border-zinc-200 shadow-xs text-zinc-900'
        }`}>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold">{selectedDay.formattedDate}</span>
              {selectedDay.isToday && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                  isDark ? 'bg-white text-zinc-950' : 'bg-zinc-900 text-white'
                }`}>
                  Today
                </span>
              )}
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 border border-zinc-200 text-zinc-800'
              }`}>
                {selectedDay.metric.score || 0} pts
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-450 pt-0.5">
              {selectedDay.metric.tasksTotal > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Targets: <strong>{selectedDay.metric.tasksCompleted}/{selectedDay.metric.tasksTotal}</strong> completed</span>
                </span>
              )}
              {selectedDay.metric.notesCount > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span>Notes: <strong>{selectedDay.metric.notesCount}</strong> generated</span>
                </span>
              )}
              {selectedDay.metric.videosCount > 0 && (
                <span className="flex items-center gap-1">
                  <Video className="w-3 h-3 text-sky-500 shrink-0" />
                  <span>Lectures: <strong>{selectedDay.metric.videosCount}</strong> watched</span>
                </span>
              )}
              {selectedDay.metric.score === 0 && (
                <span className="text-zinc-500 italic">No study sessions recorded on this day.</span>
              )}
            </div>
          </div>

          <CustomButton
            variant="ghost"
            size="xs"
            onClick={() => setSelectedDay(null)}
            className="!p-1.5 !min-h-0 !rounded-md"
            aria-label="Close day details"
          >
            <X className="w-3.5 h-3.5" />
          </CustomButton>
        </div>
      )}

      {/* Heatmap Legend */}
      <div className={`flex items-center justify-between text-[9px] font-mono pt-2 border-t flex-wrap gap-2 ${
        isDark ? 'text-zinc-500 border-zinc-800/30' : 'text-zinc-500 border-zinc-200'
      }`}>
        <span>Less active</span>
        <div className="flex items-center gap-1">
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isDark ? 'bg-[#2d333b]' : 'bg-[#ebedf0]'}`} title="Level 0: 0 pts" />
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isDark ? 'bg-[#0e4429]' : 'bg-[#9be9a8]'}`} title="Level 1: 1-2 pts" />
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isDark ? 'bg-[#006d32]' : 'bg-[#40c463]'}`} title="Level 2: 3-5 pts" />
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isDark ? 'bg-[#26a641]' : 'bg-[#30a14e]'}`} title="Level 3: 6-8 pts" />
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isDark ? 'bg-[#39d353]' : 'bg-[#216e39]'}`} title="Level 4: 9+ pts" />
        </div>
        <span>More active</span>
      </div>
    </div>
  );
}
