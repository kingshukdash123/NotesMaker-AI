import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Award, CalendarDays, BarChart2, Calendar, CheckCircle2, FileText, Video, X, TrendingUp, Flame } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import InfoPopover from '../common/InfoPopover';
import CustomButton from '../common/CustomButton';

export default function StreakCard({
  currentStreak = 0,
  longestStreak = 0,
  weeklyActivity = [],
  heatmapData = {},
  dayMetrics = {}
}) {
  const { isDark } = useTheme();
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);

  // Close floating day details modal on Escape key
  useEffect(() => {
    if (!selectedDay) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedDay(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedDay]);

  // 1. Weekly Consistency (Trailing 7 days, ending today)
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();
  const weekDays = useMemo(() => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayScore = weeklyActivity[6 - i] || 0;
      list.push({
        label: daysOfWeek[d.getDay()],
        active: dayScore > 0,
        score: dayScore,
        date: d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    return list;
  }, [weeklyActivity]);

  // 2. LeetCode-Style Monthly Activity Heatmap Grid (Last 100 Days Records)
  const { monthsData, totalTrackedDays, currentMonthName } = useMemo(() => {
    const now = new Date();
    const todayFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currMonthName = now.toLocaleDateString([], { month: 'short' });

    // Generate the last 6 months (including present month)
    // Past months include all days from the 1st to month end; present month runs from 1st to today.
    const monthGroups = [];
    for (let mOffset = 5; mOffset >= 0; mOffset--) {
      const targetMonthDate = new Date(now.getFullYear(), now.getMonth() - mOffset, 1);
      const targetYear = targetMonthDate.getFullYear();
      const targetMonth = targetMonthDate.getMonth();
      const monthName = targetMonthDate.toLocaleDateString([], { month: 'short' });
      const monthKey = `${targetYear}-${targetMonth}`;

      const isCurrentMonth = mOffset === 0;
      const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const endDay = isCurrentMonth ? now.getDate() : lastDayOfMonth;

      const dates = [];
      for (let day = 1; day <= endDay; day++) {
        dates.push(new Date(targetYear, targetMonth, day));
      }

      monthGroups.push({
        key: monthKey,
        name: monthName,
        year: targetYear,
        dates
      });
    }

    const months = [];
    let trackedDaysCount = 0;

    monthGroups.forEach((group) => {
      const weeks = [];
      let currentWeek = [];

      // Pad leading empty slots before the first day of this month cluster based on day-of-week
      const startDow = group.dates[0].getDay(); // 0: Sun, 6: Sat
      for (let p = 0; p < startDow; p++) {
        currentWeek.push(null);
      }

      group.dates.forEach((dateObj) => {
        const yearStr = dateObj.getFullYear();
        const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dayStr = String(dateObj.getDate()).padStart(2, '0');
        const dateKey = `${yearStr}-${monthStr}-${dayStr}`;

        const isToday = dateKey === todayFormatted;
        const metric = dayMetrics[dateKey] || {
          score: heatmapData[dateKey] || 0,
          level: 0,
          notesCount: 0,
          videosCount: 0,
          tasksCompleted: 0,
          tasksTotal: 0,
        };

        trackedDaysCount++;

        currentWeek.push({
          date: dateKey,
          dayNum: dateObj.getDate(),
          formattedDate: dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
          shortDate: dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          isToday,
          isFuture: false,
          metric
        });

        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      });

      // Pad trailing slots in the final partial week
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push(currentWeek);
      }

      months.push({
        name: group.name,
        year: group.year,
        weeks
      });
    });

    return {
      monthsData: months,
      totalTrackedDays: trackedDaysCount,
      currentMonthName: currMonthName
    };
  }, [heatmapData, dayMetrics]);

  // 3. Trailing 14 days for the score velocity graph
  const { trailing14Days, maxScoreIn14D, avgScoreIn14D } = useMemo(() => {
    const formatDateStr = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const trailingDays = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = formatDateStr(d);
      const metric = dayMetrics[dateStr] || {
        score: heatmapData[dateStr] || 0,
        level: 0,
        notesCount: 0,
        videosCount: 0,
        tasksCompleted: 0,
        tasksTotal: 0,
      };
      trailingDays.push({
        date: dateStr,
        score: metric.score || 0,
        shortDate: d.toLocaleDateString([], { month: 'numeric', day: 'numeric' }),
        dayLabel: daysOfWeek[d.getDay()],
        isToday: i === 0,
        formattedDate: d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        metric
      });
    }

    const max14 = Math.max(...trailingDays.map(d => d.score), 6);
    const sum14 = trailingDays.reduce((acc, curr) => acc + curr.score, 0);
    const avg14 = (sum14 / 14).toFixed(1);

    return { 
      trailing14Days: trailingDays,
      maxScoreIn14D: max14,
      avgScoreIn14D: avg14
    };
  }, [heatmapData, dayMetrics]);

  // Level classification (0 to 4)
  const getLevelFromScore = (score) => {
    if (!score || score <= 0) return 0;
    if (score <= 2) return 1;
    if (score <= 5) return 2;
    if (score <= 8) return 3;
    return 4;
  };

  const getLevelColorClass = (level, isToday, isSelected) => {
    const ring = isSelected 
      ? isDark 
        ? 'ring-2 ring-orange-500 ring-offset-1 ring-offset-zinc-950' 
        : 'ring-2 ring-orange-500 ring-offset-1 ring-offset-white' 
      : isToday 
        ? isDark 
          ? 'ring-1 ring-orange-400 ring-offset-1 ring-offset-zinc-950' 
          : 'ring-1 ring-orange-400 ring-offset-1 ring-offset-white' 
        : '';
    
    if (level === 0) {
      return `${ring} ${
        isDark 
          ? 'bg-zinc-800 border-transparent hover:bg-zinc-700' 
          : 'bg-zinc-200 border border-zinc-300 hover:bg-zinc-300'
      }`;
    }
    if (level === 1) {
      return `${ring} ${
        isDark 
          ? 'bg-orange-500/30 border-orange-500/30 hover:bg-orange-500/45' 
          : 'bg-orange-300 border-orange-400/50 hover:bg-orange-400'
      }`;
    }
    if (level === 2) {
      return `${ring} ${
        isDark 
          ? 'bg-orange-500/60 border-orange-500/50 hover:bg-orange-500/75' 
          : 'bg-orange-400 border-orange-500/80 hover:bg-orange-500'
      }`;
    }
    if (level === 3) {
      return `${ring} ${
        isDark 
          ? 'bg-orange-500/85 border-orange-400 hover:bg-orange-500 shadow-xs shadow-orange-500/20' 
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

  // SVG Area Path for 30-day Score Graph
  const graphWidth = 320;
  const graphHeight = 80;
  const paddingX = 14;
  const paddingY = 12;
  const usableWidth = graphWidth - paddingX * 2;
  const usableHeight = graphHeight - paddingY * 2;

  const points = useMemo(() => {
    return trailing14Days.map((item, idx) => {
      const x = paddingX + (idx / (trailing14Days.length - 1)) * usableWidth;
      const y = graphHeight - paddingY - (item.score / maxScoreIn14D) * usableHeight;
      return { x, y, ...item };
    });
  }, [trailing14Days, maxScoreIn14D, usableWidth, usableHeight]);

  const svgPathD = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [points]);

  const svgAreaD = useMemo(() => {
    if (points.length === 0) return '';
    return `${svgPathD} L ${points[points.length - 1].x} ${graphHeight - paddingY} L ${points[0].x} ${graphHeight - paddingY} Z`;
  }, [svgPathD, points]);

  // Glitch-Free Mouse Tracking on the SVG Container
  const handleGraphMouseMove = useCallback((e) => {
    const svgEl = e.currentTarget;
    const rect = svgEl.getBoundingClientRect();
    const clientX = e.clientX;
    const relativeX = ((clientX - rect.left) / rect.width) * graphWidth;

    let closestIdx = 0;
    let minDistance = Math.abs(relativeX - points[0].x);
    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(relativeX - points[i].x);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = i;
      }
    }
    setHoveredPointIndex(closestIdx);
  }, [points, graphWidth]);

  // Touch Tracking on the SVG Container for mobile & tablet
  const handleGraphTouch = useCallback((e) => {
    if (!e.touches || e.touches.length === 0) return;
    const svgEl = e.currentTarget;
    const rect = svgEl.getBoundingClientRect();
    const clientX = e.touches[0].clientX;
    const relativeX = ((clientX - rect.left) / rect.width) * graphWidth;

    let closestIdx = 0;
    let minDistance = Math.abs(relativeX - points[0].x);
    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(relativeX - points[i].x);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = i;
      }
    }
    setHoveredPointIndex(closestIdx);
  }, [points, graphWidth]);

  const handleGraphMouseLeave = useCallback(() => {
    setHoveredPointIndex(null);
  }, []);

  const handleGraphClick = useCallback(() => {
    if (hoveredPointIndex !== null && points[hoveredPointIndex]) {
      setSelectedDay(points[hoveredPointIndex]);
    }
  }, [hoveredPointIndex, points]);

  const hoveredPoint = hoveredPointIndex !== null ? points[hoveredPointIndex] : null;

  return (
    <div className={`w-full space-y-3 sm:space-y-3.5 ${
      isDark 
        ? 'bg-zinc-950/60 rounded-2xl p-4 sm:p-4.5 transition duration-300 relative shadow-sm' 
        : ''
    }`}>
      {/* ── COMMON HEADER ── */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
        isDark ? 'pb-3 border-b border-orange-500/15' : 'pb-0.5'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isDark 
              ? 'text-orange-500 bg-orange-950/25' 
              : 'text-orange-600 bg-orange-500/10'
          }`}>
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base sm:text-lg font-bold tracking-tight ${
                isDark ? 'text-zinc-100' : 'text-zinc-900'
              }`}>
                Consistency & Streak Tracker
              </h3>
              <InfoPopover title="How Study Streaks Work">
                <p>• <strong>Daily Action</strong>: Watch lectures, generate notes, or complete study targets to maintain your streak.</p>
                <p>• <strong>Midnight Grace Period</strong>: Streak remains active until <strong>11:59 PM</strong> local time.</p>
                <p>• <strong>Best</strong>: Longest streak tracks all-time continuous study days.</p>
                <p>• <strong>Heatmap Depth</strong>: Notes (+4 pts), Targets (+1 to +3 pts), 100% Target Attainment (+3 pts), Lectures (+2 pts), Login (+1 pt).</p>
              </InfoPopover>
            </div>
            <p className={`text-xs sm:text-[13px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Track your daily study streaks, 6-month activity heatmap, and 14-day velocity
            </p>
          </div>
        </div>
      </div>

      {/* ── RESPONSIVE GRID: STREAK STATUS | LEETCODE HEATMAP | GRAPH ── */}
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-12 lg:grid-cols-12 gap-3.5 lg:gap-4 items-stretch">
          
          {/* ── 1. STREAK STATUS COLUMN (Phone: Full | Tablet: 5 cols Row 1 | Desktop: 2 cols) ── */}
          <div className={`col-span-1 sm:col-span-5 lg:col-span-2 sm:order-1 lg:order-1 flex flex-col justify-between p-3 sm:p-3.5 rounded-xl ${
            isDark ? 'bg-zinc-900/30' : 'bg-zinc-100/70'
          }`}>
            {/* Header (h-6 shrink-0) */}
            <div className="h-6 shrink-0 flex items-center gap-1.5">
              <span className={`text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                STREAK STATUS
              </span>
              <InfoPopover title="How Study Streaks Work">
                <p>• <strong>Daily Action</strong>: Watch any lecture, create notes, or complete study targets to keep your streak active.</p>
                <p>• <strong>Midnight Grace Period</strong>: Streak remains active until <strong>11:59 PM</strong> local time.</p>
                <p>• <strong>Best</strong>: Longest streak tracks all-time continuous study days.</p>
              </InfoPopover>
            </div>

            {/* Streak Number & Best Chip */}
            <div className="flex-1 flex flex-row sm:flex-col justify-around sm:justify-center items-center text-center space-y-0 sm:space-y-2 py-2 sm:py-2 gap-3 sm:gap-0">
              <div className="flex flex-col items-center">
                <span className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none ${
                  isDark ? 'text-zinc-100' : 'text-zinc-900'
                }`}>
                  {currentStreak}
                </span>
                <span className={`text-xs sm:text-sm font-bold pt-1 ${
                  isDark ? 'text-orange-400' : 'text-orange-600'
                }`}>
                  {currentStreak === 1 ? 'day streak' : 'days streak'}
                </span>
              </div>

              {/* Best Chip */}
              <div className={`w-fit px-2.5 py-1 sm:py-0.5 rounded-md flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-semibold ${
                isDark ? 'bg-orange-950/25 text-orange-300' : 'bg-zinc-200/80 text-zinc-800'
              }`}>
                <Award className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>Best: <strong className={isDark ? 'text-orange-400' : 'text-orange-600'}>{longestStreak}d</strong></span>
              </div>
            </div>
          </div>

          {/* ── 2. HEATMAP COLUMN (Phone: Full | Tablet: 12 cols Row 2 | Desktop: 6 cols Row 1) ── */}
          <div className={`col-span-1 sm:col-span-12 lg:col-span-6 sm:order-3 lg:order-2 flex flex-col justify-between p-3 sm:p-3.5 rounded-xl ${
            isDark ? 'bg-zinc-900/30' : 'bg-zinc-100/70'
          }`}>
            {/* Header (h-6 shrink-0) */}
            <div className="h-6 shrink-0 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  ACTIVITY HEATMAP (6 Months)
                </span>
                <InfoPopover title="How Heatmap Depth is Calculated">
                  <p>• <strong>AI Notes Generated</strong>: <code>+4 pts</code> each.</p>
                  <p>• <strong>Planner Targets</strong>: <code>+1 to +3 pts</code> by priority.</p>
                  <p>• <strong>100% Target Attainment</strong>: Up to <code>+3 bonus pts</code>.</p>
                  <p>• <strong>Lectures Watched</strong>: <code>+2 pts</code> each.</p>
                  <p>• <strong>Daily Login</strong>: <code>+1 pt</code>.</p>
                </InfoPopover>
              </div>
            </div>

            {/* LeetCode Month-Grouped Grid */}
            <div className="w-full flex-1 flex flex-col justify-center items-center py-1">
              <div className="w-full overflow-x-auto custom-scrollbar flex justify-start min-[480px]:justify-center py-1">
                <div className="flex items-start gap-2 sm:gap-2.5 min-w-max px-0.5">
                {monthsData.map((month, mIdx) => (
                  <div key={mIdx} className="flex flex-col items-center">
                    {/* Columns for this month */}
                    <div className="flex items-center gap-[2.5px] sm:gap-[3px]">
                      {month.weeks.map((week, wIdx) => (
                        <div key={week.map(d => d?.date).join('-') || wIdx} className="flex flex-col gap-[2.5px] sm:gap-[3px]">
                          {week.map((day, dIdx) => {
                            if (!day || day.isFuture) {
                              return <div key={dIdx} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
                            }
                            const level = day.metric.level || getLevelFromScore(day.metric.score);
                            const isSelected = selectedDay?.date === day.date;

                            return (
                              <button
                                key={day.date}
                                type="button"
                                onClick={() => setSelectedDay(day)}
                                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2.5px] sm:rounded-[3px] border transition-all duration-150 cursor-pointer focus:outline-none hover:scale-125 active:scale-95 ${
                                  getLevelColorClass(level, day.isToday, isSelected)
                                }`}
                                title={`${day.formattedDate} • ${getLevelLabel(level)} (${day.metric.score || 0} pts)`}
                                aria-label={`${day.formattedDate} • ${getLevelLabel(level)}`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    {/* Month Label below the columns */}
                    <span className={`text-[10px] sm:text-[11px] font-mono mt-1 font-semibold select-none ${
                      month.name === currentMonthName 
                        ? 'text-orange-500 font-bold' 
                        : isDark ? 'text-zinc-500' : 'text-zinc-400'
                    }`}>
                      {month.name}
                    </span>
                  </div>
                ))}
              </div>
              </div>
            </div>

          </div>

          {/* ── 3. DAILY SCORE GRAPH COLUMN (Phone: Full | Tablet: 7 cols Row 1 | Desktop: 4 cols Row 1) ── */}
          <div className={`col-span-1 sm:col-span-7 lg:col-span-4 sm:order-2 lg:order-3 flex flex-col justify-between p-3 sm:p-3.5 rounded-xl ${
            isDark ? 'bg-zinc-900/30' : 'bg-zinc-100/70'
          }`}>
            {/* Header (h-6 shrink-0) */}
            <div className="h-6 shrink-0 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  SCORE VELOCITY
                </span>
                <InfoPopover title="14-Day Learning Velocity">
                  <p>This graph tracks your daily learning score over the past 14 days, highlighting study consistency and peak focus days.</p>
                </InfoPopover>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`text-[9.5px] sm:text-[10.5px] font-mono px-1.5 sm:px-2 py-0.5 rounded-md font-semibold ${
                  isDark ? 'bg-orange-950/30 text-orange-400' : 'bg-orange-500/10 text-orange-700'
                }`}>
                  Peak: {maxScoreIn14D} pts
                </span>
                <span className={`text-[9.5px] sm:text-[10.5px] font-mono px-1.5 sm:px-2 py-0.5 rounded-md font-semibold ${
                  isDark ? 'bg-zinc-850/70 text-zinc-300' : 'bg-zinc-200/80 text-zinc-700'
                }`}>
                  Avg: {avgScoreIn14D}
                </span>
              </div>
            </div>

            {/* SVG Graph with Container-Level Mouse and Touch Tracking */}
            <div className="w-full flex-1 flex flex-col justify-center items-center relative select-none py-0.5">
              <svg 
                viewBox={`0 0 ${graphWidth} ${graphHeight}`} 
                preserveAspectRatio="none"
                className="w-full h-20 sm:h-22 overflow-visible cursor-crosshair touch-none"
                onMouseMove={handleGraphMouseMove}
                onMouseLeave={handleGraphMouseLeave}
                onTouchStart={handleGraphTouch}
                onTouchMove={handleGraphTouch}
                onClick={handleGraphClick}
              >
                <defs>
                  <linearGradient id="scoreAreaGradCol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Baseline Gridline */}
                <line 
                  x1={paddingX} 
                  y1={graphHeight - paddingY} 
                  x2={graphWidth - paddingX} 
                  y2={graphHeight - paddingY} 
                  stroke={isDark ? 'rgba(249, 115, 22, 0.18)' : '#e4e4e7'} 
                  strokeWidth="1" 
                />

                {/* Gradient Area Fill */}
                <path d={svgAreaD} fill="url(#scoreAreaGradCol)" />

                {/* Glowing Stroke Curve */}
                <path 
                  d={svgPathD} 
                  fill="none" 
                  stroke="#f97316" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />

                {/* Hover Vertical Crosshair Line */}
                {hoveredPoint && (
                  <line
                    x1={hoveredPoint.x}
                    y1={hoveredPoint.y}
                    x2={hoveredPoint.x}
                    y2={graphHeight - paddingY}
                    stroke="#f97316"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.6"
                  />
                )}

                {/* Layer 1: X-axis date labels (cleanly spaced for 14D) */}
                {points.map((pt, idx) => {
                  const shouldShow = idx % 2 === 0 || idx === points.length - 1;
                  if (!shouldShow) return null;
                  return (
                    <text 
                      key={`label-${pt.date}`}
                      x={pt.x} 
                      y={graphHeight - 1} 
                      textAnchor="middle" 
                      fontSize="7" 
                      fill={pt.isToday ? "#ea580c" : isDark ? "#71717a" : "#a1a1aa"} 
                      fontWeight={pt.isToday || pt.score > 0 ? "bold" : "normal"}
                      className="font-mono select-none pointer-events-none"
                    >
                      {pt.shortDate}
                    </text>
                  );
                })}

                {/* Layer 2: Visible Data Points */}
                {points.map((pt, pIdx) => {
                  if (pt.score <= 0 && hoveredPointIndex !== pIdx) return null;
                  const isHovered = hoveredPointIndex === pIdx;
                  const isSelected = selectedDay && selectedDay.date === pt.date;
                  const r = isSelected ? 5.5 : isHovered ? 4.8 : 3;

                  return (
                    <circle 
                      key={`circle-${pt.date}`}
                      cx={pt.x} 
                      cy={pt.y} 
                      r={r}
                      fill={isSelected ? '#f97316' : isHovered ? (isDark ? '#fed7aa' : '#ffedd5') : (isDark ? '#09090b' : '#ffffff')} 
                      stroke="#f97316" 
                      strokeWidth={isSelected ? 2.5 : isHovered ? 2.2 : 1.8}
                      style={{ pointerEvents: 'none', transition: 'r 0.12s ease, fill 0.12s ease' }}
                    />
                  );
                })}

                {/* Tooltip on hover */}
                {hoveredPoint && (
                  <g 
                    transform={`translate(${Math.max(28, Math.min(graphWidth - 28, hoveredPoint.x))}, ${Math.max(16, hoveredPoint.y - 12)})`}
                    style={{ pointerEvents: 'none' }}
                  >
                    <rect
                      x="-22"
                      y="-12"
                      width="44"
                      height="14"
                      rx="3.5"
                      fill={isDark ? '#18181b' : '#ffffff'}
                      stroke="#f97316"
                      strokeWidth="1"
                      className="shadow-xs"
                    />
                    <text
                      x="0"
                      y="-2"
                      textAnchor="middle"
                      fontSize="7.5"
                      fontWeight="bold"
                      fill={isDark ? '#fdba74' : '#c2410c'}
                      className="font-mono select-none"
                    >
                      {hoveredPoint.score} pts
                    </text>
                  </g>
                )}
              </svg>
            </div>

          </div>

        </div>
      </div>

      {/* ── FLOATING DAY DETAILS MODAL (Visible when any square or graph point is clicked) ── */}
      {selectedDay && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedDay(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl p-4 sm:p-5 shadow-2xl animate-in zoom-in-95 duration-150 select-text text-left ${
              isDark 
                ? 'bg-zinc-950 text-zinc-200 shadow-black/90' 
                : 'bg-white text-zinc-900 border border-zinc-200 shadow-xl'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 pb-2.5 mb-3.5 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
                <h4 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  {selectedDay.formattedDate || selectedDay.shortDate}
                </h4>
                {selectedDay.isToday && (
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    isDark ? 'bg-white text-zinc-950' : 'bg-orange-500 text-white'
                  }`}>
                    Today
                  </span>
                )}
              </div>
              <CustomButton
                variant="ghost"
                size="xs"
                onClick={() => setSelectedDay(null)}
                className="!p-1.5 !min-h-0 !rounded-lg"
                aria-label="Close day details"
              >
                <X className="w-4 h-4" />
              </CustomButton>
            </div>

            {/* Activity Level Badge & Score */}
            <div className={`flex items-center justify-between gap-2 mb-3.5 p-2.5 rounded-xl ${
              isDark ? 'bg-orange-950/25' : 'bg-white border border-zinc-200 shadow-xs'
            }`}>
              <span className={`text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Activity Status
              </span>
              <span className={`text-[11px] font-mono px-2.5 py-1 rounded-lg font-bold ${
                isDark 
                  ? 'bg-orange-950/60 text-orange-300 shadow-xs' 
                  : 'bg-zinc-100 text-zinc-900 border border-zinc-200'
              }`}>
                {getLevelLabel(selectedDay.metric?.level || getLevelFromScore(selectedDay.metric?.score || selectedDay.score))} • {selectedDay.metric?.score || selectedDay.score || 0} pts
              </span>
            </div>

            {/* Activity Metrics Grid */}
            <div className="space-y-2">
              <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Day Breakdown
              </span>
              <div className="space-y-2 text-xs">
                {/* Targets */}
                <div className={`flex items-center justify-between p-2.5 rounded-xl ${
                  isDark ? 'bg-zinc-900/40' : 'bg-white border border-zinc-200 shadow-xs'
                }`}>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Study Targets</span>
                  </span>
                  <span className="font-mono font-bold">
                    {selectedDay.metric?.tasksTotal > 0 
                      ? `${selectedDay.metric.tasksCompleted}/${selectedDay.metric.tasksTotal} completed`
                      : <span className="text-zinc-500 font-normal">None</span>}
                  </span>
                </div>

                {/* Notes */}
                <div className={`flex items-center justify-between p-2.5 rounded-xl ${
                  isDark ? 'bg-zinc-900/40' : 'bg-white border border-zinc-200 shadow-xs'
                }`}>
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>AI Notes Generated</span>
                  </span>
                  <span className="font-mono font-bold">
                    {selectedDay.metric?.notesCount > 0 
                      ? `${selectedDay.metric.notesCount} notes`
                      : <span className="text-zinc-500 font-normal">0</span>}
                  </span>
                </div>

                {/* Lectures */}
                <div className={`flex items-center justify-between p-2.5 rounded-xl ${
                  isDark ? 'bg-zinc-900/40' : 'bg-white border border-zinc-200 shadow-xs'
                }`}>
                  <span className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Lectures Watched</span>
                  </span>
                  <span className="font-mono font-bold">
                    {selectedDay.metric?.videosCount > 0 
                      ? `${selectedDay.metric.videosCount} lectures`
                      : <span className="text-zinc-500 font-normal">0</span>}
                  </span>
                </div>

                {(!selectedDay.metric || selectedDay.metric.score === 0) && (!selectedDay.score || selectedDay.score === 0) && (
                  <p className="text-center text-zinc-500 text-xs py-1 italic">
                    No study activity recorded on this day.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer (no top/bottom border) */}
            <div className="pt-3.5 mt-3.5 flex justify-end">
              <CustomButton
                variant="primary"
                size="sm"
                onClick={() => setSelectedDay(null)}
              >
                Close
              </CustomButton>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

