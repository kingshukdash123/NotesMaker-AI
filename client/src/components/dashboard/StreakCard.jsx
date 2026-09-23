import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Award, 
  CalendarDays, 
  BarChart2, 
  Calendar, 
  CheckCircle2, 
  FileText, 
  Video, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Flame 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import InfoPopover from '../common/InfoPopover';
import CustomButton from '../common/CustomButton';

export default function StreakCard({
  currentStreak = 0,
  longestStreak = 0,
  weeklyActivity = [],
  heatmapData = {},
  dayMetrics = {},
  userSignupDate = null
}) {
  const { isDark } = useTheme();
  const { currentUser, userProfile } = useAuth();
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  const heatmapScrollRef = useRef(null);
  const graphContainerRef = useRef(null);

  // Close floating day details modal on Escape key
  useEffect(() => {
    if (!selectedDay) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedDay(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedDay]);

  // Helper to parse dates from various formats (Firestore Timestamp, ISO string, Date, millis)
  const parseDate = useCallback((val) => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val?.toDate === 'function') {
      const d = val.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof val === 'number' || typeof val === 'string') {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }, []);

  const formatDateStr = useCallback((d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

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

  // Auto-scroll heatmap to the rightmost (current month) on mobile / small devices by default
  useEffect(() => {
    const el = heatmapScrollRef.current;
    if (!el) return;

    const scrollToRight = () => {
      if (el.scrollWidth > el.clientWidth) {
        el.scrollLeft = el.scrollWidth;
      }
    };

    scrollToRight();
    const timer = setTimeout(scrollToRight, 100);
    return () => clearTimeout(timer);
  }, [monthsData]);

  // 3. Score Velocity Timeline (Tracked continuously from User's Signup Day to Today)
  const { 
    timelineDays, 
    maxScore, 
    avgScore, 
    activeDaysCount,
    signupFormattedDate, 
    totalDaysSinceSignup 
  } = useMemo(() => {
    const now = new Date();
    const todayNorm = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const rawSignup = userSignupDate || userProfile?.createdAt || currentUser?.metadata?.creationTime;
    const parsedSignup = parseDate(rawSignup);

    // If no signup date is found, check if there is an earliest date in dayMetrics, else fallback to 14 days ago
    let startNorm;
    if (parsedSignup) {
      startNorm = new Date(parsedSignup.getFullYear(), parsedSignup.getMonth(), parsedSignup.getDate());
      // Guard against future clock skew
      if (startNorm > todayNorm) {
        startNorm = new Date(todayNorm);
      }
    } else {
      const metricDates = Object.keys(dayMetrics).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
      if (metricDates.length > 0) {
        const [y, m, d] = metricDates[0].split('-').map(Number);
        startNorm = new Date(y, m - 1, d);
      } else {
        startNorm = new Date(todayNorm);
        startNorm.setDate(todayNorm.getDate() - 13);
      }
    }

    const signupFormatted = startNorm.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

    // Collect all days from signup day up to today
    const days = [];
    const iter = new Date(startNorm);

    while (iter <= todayNorm) {
      const dateStr = formatDateStr(iter);
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
        score: metric.score || 0,
        shortDate: iter.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        dayLabel: daysOfWeek[iter.getDay()],
        isToday: iter.getTime() === todayNorm.getTime(),
        isSignupDay: iter.getTime() === startNorm.getTime(),
        formattedDate: iter.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        metric
      });

      iter.setDate(iter.getDate() + 1);
    }

    // Ensure at least 2 points for SVG curve drawing if user signed up today
    if (days.length === 1) {
      const yesterday = new Date(todayNorm);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDateStr(yesterday);
      const yesterdayMetric = dayMetrics[yesterdayStr] || {
        score: heatmapData[yesterdayStr] || 0,
        level: 0,
        notesCount: 0,
        videosCount: 0,
        tasksCompleted: 0,
        tasksTotal: 0,
      };
      days.unshift({
        date: yesterdayStr,
        score: yesterdayMetric.score || 0,
        shortDate: yesterday.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        dayLabel: daysOfWeek[yesterday.getDay()],
        isToday: false,
        isSignupDay: false,
        formattedDate: yesterday.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        metric: yesterdayMetric
      });
    }

    const max = Math.max(...days.map(d => d.score), 6);
    const sum = days.reduce((acc, curr) => acc + curr.score, 0);
    const avg = days.length > 0 ? (sum / days.length).toFixed(1) : '0.0';
    const activeCount = days.filter(d => d.score > 0).length;

    return {
      timelineDays: days,
      maxScore: max,
      avgScore: avg,
      activeDaysCount: activeCount,
      signupFormattedDate: signupFormatted,
      totalDaysSinceSignup: days.length
    };
  }, [userSignupDate, userProfile?.createdAt, currentUser?.metadata?.creationTime, dayMetrics, heatmapData, parseDate, formatDateStr]);

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

  // SVG Area Path for Score Velocity Graph (LeetCode Contest Rating Chart Style)
  const graphWidth = 340;
  const graphHeight = 84;
  const paddingX = 16;
  const paddingY = 14;
  const usableWidth = graphWidth - paddingX * 2;
  const usableHeight = graphHeight - paddingY * 2;

  const points = useMemo(() => {
    if (timelineDays.length === 0) return [];
    const baselineY = graphHeight - paddingY;
    const topY = paddingY;

    if (timelineDays.length === 1) {
      const item = timelineDays[0];
      const x = graphWidth / 2;
      const y = Math.min(baselineY, Math.max(topY, baselineY - (item.score / maxScore) * usableHeight));
      return [{ x, y, ...item, index: 0 }];
    }
    return timelineDays.map((item, idx) => {
      const x = paddingX + (idx / (timelineDays.length - 1)) * usableWidth;
      const y = Math.min(baselineY, Math.max(topY, baselineY - (item.score / maxScore) * usableHeight));
      return { x, y, ...item, index: idx };
    });
  }, [timelineDays, maxScore, usableWidth, usableHeight, graphHeight, paddingY]);

  // Smooth Monotone Cubic Spline (Fritsch-Carlson) - Guarantees NO overshoot below baseline
  const svgPathD = useMemo(() => {
    const n = points.length;
    if (n === 0) return '';
    if (n === 1) return `M ${points[0].x} ${points[0].y}`;
    if (n === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

    const baselineY = graphHeight - paddingY;
    const topY = paddingY;

    // 1. Calculate secant slopes (delta)
    const dxs = [];
    const dys = [];
    const deltas = [];
    for (let i = 0; i < n - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      dxs.push(dx);
      dys.push(dy);
      deltas.push(dx !== 0 ? dy / dx : 0);
    }

    // 2. Initialize tangents (m)
    const m = new Array(n);
    m[0] = deltas[0];
    for (let i = 1; i < n - 1; i++) {
      if (deltas[i - 1] * deltas[i] <= 0) {
        // Local extremum (peak or valley/baseline) -> tangent must be 0
        m[i] = 0;
      } else {
        m[i] = (deltas[i - 1] + deltas[i]) / 2;
      }
    }
    m[n - 1] = deltas[n - 2];

    // 3. Fritsch-Carlson monotonicity adjustment
    for (let i = 0; i < n - 1; i++) {
      if (deltas[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
      } else {
        const alpha = m[i] / deltas[i];
        const beta = m[i + 1] / deltas[i];
        const dist = alpha * alpha + beta * beta;
        if (dist > 9) {
          const tau = 3 / Math.sqrt(dist);
          m[i] = tau * alpha * deltas[i];
          m[i + 1] = tau * beta * deltas[i];
        }
      }
    }

    // 4. Build SVG cubic Bezier path with strict baseline clamping
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 0; i < n - 1; i++) {
      const dx = dxs[i];
      const p1 = points[i];
      const p2 = points[i + 1];

      const cp1x = p1.x + dx / 3;
      let cp1y = p1.y + (m[i] * dx) / 3;
      const cp2x = p2.x - dx / 3;
      let cp2y = p2.y - (m[i + 1] * dx) / 3;

      // Strict clamping to prevent going below baseline or above top padding
      cp1y = Math.min(baselineY, Math.max(topY, cp1y));
      cp2y = Math.min(baselineY, Math.max(topY, cp2y));

      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }

    return d;
  }, [points, graphHeight, paddingY]);

  const svgAreaD = useMemo(() => {
    if (points.length === 0) return '';
    const baselineY = graphHeight - paddingY;
    return `${svgPathD} L ${points[points.length - 1].x.toFixed(2)} ${baselineY} L ${points[0].x.toFixed(2)} ${baselineY} Z`;
  }, [svgPathD, points, graphHeight, paddingY]);

  // Smart Milestone Ticks for X-Axis (LeetCode Style)
  const milestoneTicks = useMemo(() => {
    if (points.length <= 4) return points;
    const ticks = [];
    ticks.push(points[0]);

    if (points.length <= 10) {
      for (let i = 2; i < points.length - 1; i += 2) {
        ticks.push(points[i]);
      }
    } else if (points.length <= 30) {
      const step = Math.floor(points.length / 4);
      for (let i = step; i < points.length - 1; i += step) {
        ticks.push(points[i]);
      }
    } else {
      const step = Math.floor(points.length / 5);
      for (let i = step; i < points.length - 1; i += step) {
        ticks.push(points[i]);
      }
    }

    if (points.length > 1) {
      ticks.push(points[points.length - 1]);
    }
    return ticks;
  }, [points]);

  // Glitch-Free Mouse Tracking on the SVG Container (LeetCode Style)
  const handleGraphMouseMove = useCallback((e) => {
    if (points.length === 0) return;
    const el = graphContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
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
    if (!e.touches || e.touches.length === 0 || points.length === 0) return;
    const el = graphContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
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

  // LeetCode Contest Signature Markers & Active State
  const peakPoint = useMemo(() => {
    if (!points || points.length === 0) return null;
    let maxPt = points[0];
    for (let i = 1; i < points.length; i++) {
      if (points[i].score > maxPt.score) {
        maxPt = points[i];
      }
    }
    return maxPt.score > 0 ? maxPt : null;
  }, [points]);

  const activeDisplayPoint = useMemo(() => {
    if (hoveredPointIndex !== null && points[hoveredPointIndex]) {
      return points[hoveredPointIndex];
    }
    if (selectedDay) {
      const match = points.find(p => p.date === selectedDay.date);
      if (match) return match;
    }
    return points.length > 0 ? points[points.length - 1] : null;
  }, [hoveredPointIndex, points, selectedDay]);

  const displayDelta = useMemo(() => {
    if (!activeDisplayPoint) return { text: '', isPositive: null };
    const idx = activeDisplayPoint.index;
    if (idx > 0 && points[idx - 1]) {
      const prevScore = points[idx - 1].score;
      const diff = activeDisplayPoint.score - prevScore;
      if (diff > 0) return { text: `+${diff}`, isPositive: true };
      if (diff < 0) return { text: `${diff}`, isPositive: false };
      return { text: '0', isPositive: null };
    }
    return { text: '', isPositive: null };
  }, [activeDisplayPoint, points]);

  const startYearOrDate = useMemo(() => {
    if (points.length === 0) return '';
    const firstDate = new Date(points[0].date);
    const lastDate = new Date(points[points.length - 1].date);
    if (!isNaN(firstDate.getFullYear()) && !isNaN(lastDate.getFullYear()) && firstDate.getFullYear() !== lastDate.getFullYear()) {
      return `${firstDate.getFullYear()}`;
    }
    return points[0].shortDate;
  }, [points]);

  const endYearOrDate = useMemo(() => {
    if (points.length === 0) return '';
    const firstDate = new Date(points[0].date);
    const lastDate = new Date(points[points.length - 1].date);
    if (!isNaN(firstDate.getFullYear()) && !isNaN(lastDate.getFullYear()) && firstDate.getFullYear() !== lastDate.getFullYear()) {
      return `${lastDate.getFullYear()}`;
    }
    return points[points.length - 1].shortDate;
  }, [points]);

  return (
    <div className={`w-full space-y-3 sm:space-y-3.5 rounded-2xl p-3.5 sm:p-4.5 md:p-5 transition duration-300 relative ${
      isDark 
        ? 'bg-zinc-950/60 shadow-sm' 
        : 'bg-white shadow-xs'
    }`}>
      {/* ── COMMON HEADER ── */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 sm:pb-3 ${
        isDark ? 'border-b border-orange-500/15' : ''
      }`}>
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
            isDark 
              ? 'text-orange-500 bg-orange-950/25' 
              : 'text-orange-600 bg-orange-500/10'
          }`}>
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className={`text-sm sm:text-base md:text-lg font-bold tracking-tight ${
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
                  ACTIVITY HEATMAP
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
              <div ref={heatmapScrollRef} className="w-full overflow-x-auto custom-scrollbar flex justify-start min-[480px]:justify-center py-1">
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
                                title={`${day.formattedDate} • ${day.metric.score || 0} pts`}
                                aria-label={`${day.formattedDate} • ${day.metric.score || 0} pts`}
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
            {/* LeetCode Contest Rating Style Header: Score + Trend | Date + Session | App Status Breakdown */}
            <div className="flex items-start justify-between gap-2 select-none">
              {/* Left: Score & Trend */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase truncate ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    Score Velocity
                  </span>
                  <InfoPopover title="Learning Score Velocity (Since Signup)">
                    <p>• <strong>Tracking Window</strong>: Tracks daily score momentum from your account signup date (<strong>{signupFormattedDate}</strong>) to today.</p>
                    <p>• <strong>Contest-Style Rating</strong>: Hover or drag along the curve to trace your daily score trajectory, delta changes, and focus level.</p>
                    <p>• <strong>Click to Inspect</strong>: Tap any point to open the complete Day Breakdown modal.</p>
                  </InfoPopover>
                </div>

                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight leading-none ${
                    isDark ? 'text-zinc-100' : 'text-zinc-900'
                  }`}>
                    {activeDisplayPoint ? activeDisplayPoint.score : 0}
                  </span>
                  {displayDelta.text && (
                    <span className={`text-xs sm:text-sm font-bold flex items-center leading-none ${
                      displayDelta.isPositive === true
                        ? 'text-emerald-500'
                        : displayDelta.isPositive === false
                        ? 'text-rose-500'
                        : 'text-zinc-400'
                    }`}>
                      {displayDelta.isPositive === true ? (
                        <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />
                      ) : displayDelta.isPositive === false ? (
                        <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />
                      ) : (
                        <Minus className="w-3 h-3 mr-0.5 inline" />
                      )}
                      {displayDelta.text}
                    </span>
                  )}
                </div>
              </div>

              {/* Center: Date */}
              <div className="flex flex-col text-center min-w-0 px-1">
                <span className={`text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase truncate ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  Date
                </span>
                <span className={`text-xs sm:text-sm font-bold font-mono tracking-tight truncate mt-0.5 leading-none ${
                  isDark ? 'text-zinc-200' : 'text-zinc-800'
                }`}>
                  {activeDisplayPoint?.shortDate || 'Today'}
                </span>
              </div>

              {/* Right: Targets & Notes Solved/Completed */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    Targets
                  </span>
                  <span className={`text-xs sm:text-sm font-bold font-mono mt-0.5 leading-none ${
                    isDark ? 'text-zinc-100' : 'text-zinc-900'
                  }`}>
                    {activeDisplayPoint?.metric?.tasksTotal > 0
                      ? `${activeDisplayPoint.metric.tasksCompleted}/${activeDisplayPoint.metric.tasksTotal}`
                      : activeDisplayPoint?.metric?.tasksCompleted > 0
                      ? `${activeDisplayPoint.metric.tasksCompleted}`
                      : '0/0'}
                  </span>
                </div>

                <div className="flex flex-col items-end">
                  <span className={`text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    Notes
                  </span>
                  <span className={`text-xs sm:text-sm font-bold font-mono mt-0.5 leading-none ${
                    isDark ? 'text-zinc-100' : 'text-zinc-900'
                  }`}>
                    {activeDisplayPoint?.metric?.notesCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* SVG Graph with Container-Level Mouse and Touch Tracking */}
            <div 
              ref={graphContainerRef}
              className="w-full flex-1 flex flex-col justify-center items-center relative select-none pt-2 pb-0.5 group"
            >
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
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Baseline Gridline */}
                <line 
                  x1={paddingX} 
                  y1={graphHeight - paddingY} 
                  x2={graphWidth - paddingX} 
                  y2={graphHeight - paddingY} 
                  stroke={isDark ? 'rgba(249, 115, 22, 0.15)' : '#e4e4e7'} 
                  strokeWidth="1" 
                />

                {/* Gradient Area Fill */}
                <path d={svgAreaD} fill="url(#scoreAreaGradCol)" />

                {/* Glowing Stroke Curve */}
                <path 
                  d={svgPathD} 
                  fill="none" 
                  stroke="#f97316" 
                  strokeWidth="2.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />

                {/* Peak Point White Marker Dot (LeetCode Signature Marker) */}
                {peakPoint && (
                  <circle 
                    cx={peakPoint.x} 
                    cy={peakPoint.y} 
                    r="3.2" 
                    fill="#ffffff" 
                    stroke="#f97316" 
                    strokeWidth="1.2"
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Active Hover / Touch Vertical Crosshair Line (LeetCode Style) */}
                {hoveredPoint && (
                  <line
                    x1={hoveredPoint.x}
                    y1={paddingY - 4}
                    x2={hoveredPoint.x}
                    y2={graphHeight - paddingY}
                    stroke="#f97316"
                    strokeWidth="1.2"
                    opacity="0.85"
                  />
                )}

                {/* Active Hover / Touch Circular Node with LeetCode Glow Halo */}
                {hoveredPoint && (
                  <g style={{ pointerEvents: 'none' }}>
                    {/* Outer Glow Halo Ring */}
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="7.5"
                      fill="#f97316"
                      fillOpacity="0.25"
                    />
                    {/* Middle Accent Circle */}
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="4.5"
                      fill="#f97316"
                    />
                    {/* Center Core Dot */}
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="2"
                      fill="#ffffff"
                    />
                  </g>
                )}
              </svg>

              {/* Bottom Timeline Axis Labels (LeetCode Style) */}
              <div className="w-full flex items-center justify-between px-2 pt-1 text-[9px] sm:text-[10px] font-mono select-none">
                <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>
                  {startYearOrDate}
                </span>
                {points.length > 25 && (
                  <span className={`hidden min-[480px]:inline ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}>
                    {points[Math.floor(points.length / 2)]?.shortDate}
                  </span>
                )}
                <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>
                  {endYearOrDate}
                </span>
              </div>
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

            {/* Activity Score Badge */}
            <div className={`flex items-center justify-between gap-2 mb-3.5 p-2.5 rounded-xl ${
              isDark ? 'bg-orange-950/25' : 'bg-white border border-zinc-200 shadow-xs'
            }`}>
              <span className={`text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Activity Score
              </span>
              <span className={`text-[11px] font-mono px-2.5 py-1 rounded-lg font-bold ${
                isDark 
                  ? 'bg-orange-950/60 text-orange-300 shadow-xs' 
                  : 'bg-zinc-100 text-zinc-900 border border-zinc-200'
              }`}>
                {selectedDay.metric?.score || selectedDay.score || 0} pts
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

