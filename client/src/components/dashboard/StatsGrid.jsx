import { useState, useMemo } from 'react';
import { Video, FileText, Calendar, TrendingUp, TrendingDown, Minus, BarChart3, Zap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import InfoPopover from '../common/InfoPopover';
import CustomButton from '../common/CustomButton';

const toLocalDateStr = (dateVal) => {
  if (!dateVal) return null;
  let d;
  if (typeof dateVal.toDate === 'function') {
    d = dateVal.toDate();
  } else if (dateVal instanceof Date) {
    d = dateVal;
  } else if (typeof dateVal === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
    d = new Date(dateVal);
  } else if (typeof dateVal === 'number') {
    d = new Date(dateVal);
  } else {
    return null;
  }
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function StatsGrid({ 
  notesHistory = [], 
  watchHistory = [], 
  heatmapData = {},
  dayMetrics = {}
}) {
  const { isDark } = useTheme();
  const [timeframe, setTimeframe] = useState('week'); // 'week' | 'month'
  
  // Rolling time windows:
  // Week: Past 7 days (0 to 6) vs Prior 7 days (7 to 13)
  // Month: Past 30 days (0 to 29) vs Prior 30 days (30 to 59)
  const { currentPeriodDates, prevPeriodDates, daysCount } = useMemo(() => {
    const current = new Set();
    const prev = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = timeframe === 'month' ? 30 : 7;

    for (let i = 0; i < count; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const str = toLocalDateStr(d);
      if (str) current.add(str);
    }

    for (let i = count; i < count * 2; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const str = toLocalDateStr(d);
      if (str) prev.add(str);
    }

    return { 
      currentPeriodDates: current, 
      prevPeriodDates: prev,
      daysCount: count
    };
  }, [timeframe]);

  // 1. Videos learned in current period vs previous period
  const { currentVideos, prevVideos } = useMemo(() => {
    let thisCount = 0;
    let prevCount = 0;
    const thisSet = new Set();
    const prevSet = new Set();

    (watchHistory || []).forEach(w => {
      const dStr = toLocalDateStr(w.openedAt || w.createdAt || w.date || w.watchedAt || w.timestamp);
      const id = w.videoId || w.metadata?.video_id || w.id;
      if (currentPeriodDates.has(dStr)) {
        if (id) thisSet.add(id);
        thisCount++;
      } else if (prevPeriodDates.has(dStr)) {
        if (id) prevSet.add(id);
        prevCount++;
      }
    });

    if (dayMetrics) {
      let dmThis = 0;
      let dmPrev = 0;
      currentPeriodDates.forEach(d => {
        dmThis += dayMetrics[d]?.videosCount || 0;
      });
      prevPeriodDates.forEach(d => {
        dmPrev += dayMetrics[d]?.videosCount || 0;
      });
      thisCount = Math.max(thisCount, thisSet.size, dmThis);
      prevCount = Math.max(prevCount, prevSet.size, dmPrev);
    }

    return {
      currentVideos: Math.max(thisSet.size, thisCount),
      prevVideos: Math.max(prevSet.size, prevCount)
    };
  }, [watchHistory, dayMetrics, currentPeriodDates, prevPeriodDates]);

  // 2. Notes generated in current period vs previous period
  const { currentNotes, prevNotes } = useMemo(() => {
    let thisCount = 0;
    let prevCount = 0;

    (notesHistory || []).forEach(n => {
      const dStr = toLocalDateStr(n.createdAtDate || n.createdAt || n.date || n.timestamp);
      if (currentPeriodDates.has(dStr)) {
        thisCount++;
      } else if (prevPeriodDates.has(dStr)) {
        prevCount++;
      }
    });

    if (dayMetrics) {
      let dmThis = 0;
      let dmPrev = 0;
      currentPeriodDates.forEach(d => {
        dmThis += dayMetrics[d]?.notesCount || 0;
      });
      prevPeriodDates.forEach(d => {
        dmPrev += dayMetrics[d]?.notesCount || 0;
      });
      thisCount = Math.max(thisCount, dmThis);
      prevCount = Math.max(prevCount, dmPrev);
    }

    return {
      currentNotes: thisCount,
      prevNotes: prevCount
    };
  }, [notesHistory, dayMetrics, currentPeriodDates, prevPeriodDates]);

  // 3. Active study days in current period vs previous period
  const { currentActiveDays, prevActiveDays } = useMemo(() => {
    let thisCount = 0;
    let prevCount = 0;

    currentPeriodDates.forEach(dStr => {
      const score = dayMetrics?.[dStr]?.score || heatmapData?.[dStr] || 0;
      if (score > 0) thisCount++;
    });

    prevPeriodDates.forEach(dStr => {
      const score = dayMetrics?.[dStr]?.score || heatmapData?.[dStr] || 0;
      if (score > 0) prevCount++;
    });

    return {
      currentActiveDays: thisCount,
      prevActiveDays: prevCount
    };
  }, [dayMetrics, heatmapData, currentPeriodDates, prevPeriodDates]);

  // 4. Cumulative learning score in current period vs previous period
  const { currentScore, prevScore } = useMemo(() => {
    let thisScore = 0;
    let prevScoreVal = 0;

    currentPeriodDates.forEach(dStr => {
      const score = dayMetrics?.[dStr]?.score || heatmapData?.[dStr] || 0;
      thisScore += score;
    });

    prevPeriodDates.forEach(dStr => {
      const score = dayMetrics?.[dStr]?.score || heatmapData?.[dStr] || 0;
      prevScoreVal += score;
    });

    return {
      currentScore: thisScore,
      prevScore: prevScoreVal
    };
  }, [dayMetrics, heatmapData, currentPeriodDates, prevPeriodDates]);

  // Render comparison badge
  const renderComparisonBadge = (current, previous, unit = '') => {
    const diff = current - previous;
    const hasIncreased = diff > 0;
    const hasDecreased = diff < 0;
    // const periodLabel = timeframe === 'month' ? 'vs last mo' : 'vs last wk';
    const periodName = timeframe === 'month' ? 'month' : 'week';

    if (hasIncreased) {
      return (
        <span 
          title={`This ${periodName}: ${current}${unit ? ` ${unit}` : ''} | Last ${periodName}: ${previous}${unit ? ` ${unit}` : ''}`}
          className={`inline-flex items-center gap-0.5 sm:gap-1 text-[9.5px] sm:text-[11px] font-mono font-semibold px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 ${
            isDark 
              ? 'bg-emerald-950/40 text-emerald-400' 
              : 'bg-emerald-100/80 text-emerald-800'
          }`}
        >
          <TrendingUp className="w-2.5 h-2.5 shrink-0" />
          <span>+{diff}{unit ? `${unit}` : ''}</span>
        </span>
      );
    }

    if (hasDecreased) {
      return (
        <span 
          title={`This ${periodName}: ${current}${unit ? ` ${unit}` : ''} | Last ${periodName}: ${previous}${unit ? ` ${unit}` : ''}`}
          className={`inline-flex items-center gap-0.5 sm:gap-1 text-[9.5px] sm:text-[11px] font-mono font-semibold px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 ${
            isDark 
              ? 'bg-rose-950/40 text-rose-400' 
              : 'bg-rose-100/80 text-rose-800'
          }`}
        >
          <TrendingDown className="w-2.5 h-2.5 shrink-0" />
          <span>{diff}{unit ? `${unit}` : ''}</span>
        </span>
      );
    }

    return (
      <span 
        title={`This ${periodName}: ${current}${unit ? ` ${unit}` : ''} | Last ${periodName}: ${previous}${unit ? ` ${unit}` : ''}`}
        className={`inline-flex items-center gap-0.5 sm:gap-1 text-[9.5px] sm:text-[11px] font-mono font-medium px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 ${
          isDark 
            ? 'bg-zinc-800/50 text-zinc-400' 
            : 'bg-orange-100/60 text-zinc-600'
        }`}
      >
        <Minus className="w-2.5 h-2.5 shrink-0" />
        <span>0</span>
      </span>
    );
  };

  const stats = [
    {
      title: 'VIDEOS LEARNED',
      value: currentVideos,
      sub: timeframe === 'month' ? 'lectures this month' : 'lectures this week',
      icon: Video,
      badge: renderComparisonBadge(currentVideos, prevVideos)
    },
    {
      title: 'NOTES GENERATED',
      value: currentNotes,
      sub: timeframe === 'month' ? 'outlines this month' : 'outlines this week',
      icon: FileText,
      badge: renderComparisonBadge(currentNotes, prevNotes)
    },
    {
      title: 'STUDY DAYS ACTIVE',
      value: currentActiveDays,
      unit: `/ ${daysCount}d`,
      sub: 'days active',
      icon: Calendar,
      badge: renderComparisonBadge(currentActiveDays, prevActiveDays, 'd')
    },
    {
      title: 'LEARNING SCORE',
      value: currentScore,
      unit: 'pts',
      sub: 'score earned',
      icon: Zap,
      badge: renderComparisonBadge(currentScore, prevScore, 'pts')
    }
  ];

  return (
    <div className={`rounded-2xl p-4 sm:p-5 md:p-6 transition duration-300 w-full space-y-3.5 sm:space-y-4 relative overflow-hidden ${
      isDark 
        ? 'bg-zinc-950/40' 
        : 'bg-white/80 shadow-xs'
    }`}>
      {/* ── COMMON HEADER ── */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b ${
        isDark ? 'border-orange-500/15' : 'border-orange-200/70'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isDark 
              ? 'text-orange-500 bg-orange-950/25' 
              : 'text-orange-600 bg-orange-100'
          }`}>
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-sm sm:text-base md:text-lg font-bold tracking-tight truncate ${
                isDark ? 'text-zinc-100' : 'text-orange-950'
              }`}>
                {timeframe === 'month' ? 'Monthly Learning Metrics' : 'Weekly Learning Metrics'}
              </h3>
              <InfoPopover title={timeframe === 'month' ? 'Monthly Metrics & Prior Month Comparison' : 'Weekly Metrics & Prior Week Comparison'}>
                <p>• <strong>{timeframe === 'month' ? '30-Day Rolling Window' : '7-Day Rolling Window'}</strong>: Compares your activity over the past {timeframe === 'month' ? '30' : '7'} days against the previous {timeframe === 'month' ? '30' : '7'}-day period.</p>
                <p>• <strong>Videos Learned</strong>: Count of unique educational lectures studied.</p>
                <p>• <strong>Notes Generated</strong>: Academic outlines created with AI.</p>
                <p>• <strong>Study Days Active</strong>: Total active study days recorded in the period.</p>
                <p>• <strong>Learning Score</strong>: Cumulative focus score and activity points earned.</p>
              </InfoPopover>
            </div>
            <p className={`text-xs sm:text-[13px] ${isDark ? 'text-zinc-500' : 'text-orange-800/80'}`}>
              {timeframe === 'month' 
                ? 'Performance over past 30 days vs previous month' 
                : 'Performance over past 7 days vs previous week'}
            </p>
          </div>
        </div>

        {/* Right side of header: Week / Month Filter Toggle */}
        <div className="flex items-center self-start sm:self-auto shrink-0 pt-0.5 sm:pt-0">
          <div className={`flex items-center p-0.5 rounded-xl ${
            isDark ? 'bg-zinc-900/80' : 'bg-orange-100/70'
          }`}>
            <CustomButton
              variant={timeframe === 'week' ? 'primary' : 'ghost'}
              size="xs"
              onClick={() => setTimeframe('week')}
              className="text-xs sm:text-sm px-3 sm:px-3.5 py-1 min-h-[26px] sm:min-h-[28px] rounded-lg"
            >
              Week
            </CustomButton>
            <CustomButton
              variant={timeframe === 'month' ? 'primary' : 'ghost'}
              size="xs"
              onClick={() => setTimeframe('month')}
              className="text-xs sm:text-sm px-3 sm:px-3.5 py-1 min-h-[26px] sm:min-h-[28px] rounded-lg"
            >
              Month
            </CustomButton>
          </div>
        </div>
      </div>

      {/* ── 4-METRIC GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4 w-full pt-0.5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx} 
              className={`rounded-xl p-3 sm:p-3.5 md:p-4 flex flex-col justify-between transition duration-200 relative overflow-hidden group hover:scale-[1.01] min-h-[105px] sm:min-h-[118px] md:min-h-[126px] ${
                isDark 
                  ? 'bg-zinc-900/30' 
                  : 'bg-orange-50/50'
              }`}
            >
              {/* Card Top: Title & Category Icon */}
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase truncate pr-1 ${
                  isDark ? 'text-zinc-400' : 'text-orange-700'
                }`}>
                  {stat.title}
                </span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                  isDark 
                    ? 'text-orange-500 bg-orange-950/25 shadow-xs' 
                    : 'text-orange-600 bg-orange-100 shadow-xs'
                }`}>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                </div>
              </div>

              {/* Card Body: Numeric Value */}
              <div className="space-y-0.5 my-0.5 sm:my-1">
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
                    isDark ? 'text-zinc-100' : 'text-orange-950'
                  }`}>
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className={`text-xs sm:text-sm font-semibold ${
                      isDark ? 'text-zinc-500' : 'text-orange-700'
                    }`}>
                      {stat.unit}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer: Subtitle & Comparison Badge */}
              <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-1 pt-0.5">
                <span className={`text-[11px] sm:text-xs md:text-[13px] leading-tight font-medium truncate ${
                  isDark ? 'text-zinc-400' : 'text-orange-800'
                }`}>
                  {stat.sub}
                </span>
                <div className="self-start min-[380px]:self-auto">
                  {stat.badge}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
