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

  // Generate date array for the last 12 weeks (84 days) ending on today's week.
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
  
  const totalDaysToShow = 12 * 7;
  const startDate = new Date();
  startDate.setDate(today.getDate() - (totalDaysToShow - 1 - (6 - currentDayOfWeek)));

  const formatDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDateStr(today);

  // Build grid data
  const { weeks } = useMemo(() => {
    const grid = [];
    for (let i = 0; i < totalDaysToShow; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = formatDateStr(currentDate);
      const metric = dayMetrics[dateStr] || {
        score: heatmapData[dateStr] || 0,
        level: 0,
        notesCount: 0,
        videosCount: 0,
        tasksCompleted: 0,
        tasksTotal: 0,
      };

      grid.push({
        date: dateStr,
        dayOfWeek: currentDate.getDay(),
        formattedDate: currentDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        isToday: dateStr === todayStr,
        isFuture: currentDate > today,
        metric
      });
    }

    const weekCols = [];
    for (let w = 0; w < 12; w++) {
      weekCols.push(grid.slice(w * 7, (w + 1) * 7));
    }

    return { weeks: weekCols };
  }, [heatmapData, dayMetrics, todayStr]);

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
      ? isDark ? 'ring-2 ring-orange-500 ring-offset-1 ring-offset-black' : 'ring-2 ring-orange-500 ring-offset-1 ring-offset-white' 
      : isToday 
        ? isDark ? 'ring-1 ring-orange-400/80' : 'ring-1 ring-orange-400/80 ring-offset-1 ring-offset-white' 
        : '';
    
    if (level === 0) {
      return `${ring} ${
        isDark 
          ? 'bg-zinc-900/60 border-zinc-900 hover:border-zinc-800' 
          : 'bg-zinc-200 border border-zinc-300 hover:bg-zinc-300'
      }`;
    }
    if (level === 1) {
      return `${ring} ${
        isDark 
          ? 'bg-orange-500/25 border-orange-500/20 hover:bg-orange-500/40' 
          : 'bg-orange-300 border-orange-400/50 hover:bg-orange-400'
      }`;
    }
    if (level === 2) {
      return `${ring} ${
        isDark 
          ? 'bg-orange-500/50 border-orange-500/35 hover:bg-orange-500/65' 
          : 'bg-orange-400 border-orange-500/80 hover:bg-orange-500'
      }`;
    }
    if (level === 3) {
      return `${ring} ${
        isDark 
          ? 'bg-orange-500/80 border-orange-400 hover:bg-orange-500 shadow-xs shadow-orange-500/20' 
          : 'bg-orange-500 border-orange-600 hover:bg-orange-600 shadow-xs'
      }`;
    }
    return `${ring} ${
      isDark 
        ? 'bg-orange-500 border-orange-300 shadow-sm shadow-orange-500/40' 
        : 'bg-orange-600 border-orange-700 shadow-sm text-white'
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
            <p>• <strong>Daily Login</strong>: <code>+1 pt</code>.</p>
            <div className="pt-1 font-semibold text-orange-500">
              Tap or hover on any day square to inspect the full breakdown!
            </div>
          </InfoPopover>
        </div>

        <span className={`text-[10px] font-mono ${
          isDark ? 'text-zinc-600' : 'text-zinc-400'
        }`}>
          Last 12 Weeks (84 Days)
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
              {week.map((day) => {
                const level = day.metric.level || getLevelFromScore(day.metric.score);
                const isSelected = selectedDay && selectedDay.date === day.date;

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    disabled={day.isFuture}
                    className={`w-3.5 h-3.5 rounded-[3px] border transition-all duration-150 cursor-pointer focus:outline-none ${
                      day.isFuture 
                        ? 'opacity-20 cursor-not-allowed bg-zinc-900/20 border-transparent' 
                        : getLevelColorClass(level, day.isToday, isSelected)
                    }`}
                    title={`${day.formattedDate} • ${getLevelLabel(level)} (${day.metric.score || 0} pts)`}
                    aria-label={`${day.formattedDate} • ${getLevelLabel(level)}`}
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
                  isDark ? 'bg-white text-zinc-950' : 'bg-orange-500 text-white'
                }`}>
                  Today
                </span>
              )}
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                isDark ? 'bg-orange-950/40 text-orange-400' : 'bg-zinc-100 border border-zinc-200 text-zinc-800'
              }`}>
                {getLevelLabel(selectedDay.metric.level || getLevelFromScore(selectedDay.metric.score))} ({selectedDay.metric.score || 0} pts)
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
                  <FileText className="w-3 h-3 text-orange-500 shrink-0" />
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
        isDark ? 'text-zinc-500 border-zinc-900/80' : 'text-zinc-500 border-zinc-200/80'
      }`}>
        <span>Less active</span>
        <div className="flex items-center gap-1">
          <div className={`w-2.5 h-2.5 rounded-[2px] border ${isDark ? 'bg-zinc-900/60 border-zinc-900' : 'bg-zinc-200 border-zinc-300'}`} title="Level 0: 0 pts" />
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isDark ? 'bg-orange-500/25' : 'bg-orange-300'}`} title="Level 1: 1-2 pts" />
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isDark ? 'bg-orange-500/50' : 'bg-orange-400'}`} title="Level 2: 3-5 pts" />
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isDark ? 'bg-orange-500/80' : 'bg-orange-500'}`} title="Level 3: 6-8 pts" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-orange-500 shadow-xs" title="Level 4: 9+ pts" />
        </div>
        <span>More active</span>
      </div>
    </div>
  );
}
