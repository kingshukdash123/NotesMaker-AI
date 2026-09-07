import { useMemo } from 'react';

/**
 * Normalizes any timestamp, Date, or Firestore Timestamp object to local YYYY-MM-DD string.
 */
function toLocalDateStr(dateVal) {
  if (!dateVal) return null;
  let date;
  if (typeof dateVal === 'string') {
    // If already in YYYY-MM-DD format (10 chars), return directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
    date = new Date(dateVal);
  } else if (dateVal instanceof Date) {
    date = dateVal;
  } else if (dateVal && typeof dateVal.toDate === 'function') {
    date = dateVal.toDate();
  } else if (typeof dateVal === 'number') {
    date = new Date(dateVal);
  } else {
    return null;
  }

  if (isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats date by subtracting days from today in local time.
 */
function subtractDaysFromToday(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Custom hook to calculate streak metrics, dual-factor heatmap learning scores,
 * and daily activity breakdowns.
 *
 * @param {Object|Array} options - Either an options object or notesHistory array for backward compatibility
 * @param {Array} [options.notesHistory] - List of generated notes
 * @param {Array} [options.watchHistory] - List of watched lectures
 * @param {Array} [options.plannerTasks] - List of planner tasks across range
 * @param {Array} [options.activityHistory] - List of daily login events
 */
export function useStreak(options = {}) {
  // Support either options object or legacy array
  const {
    notesHistory = [],
    watchHistory = [],
    plannerTasks = [],
    activityHistory = []
  } = Array.isArray(options) ? { notesHistory: options } : options;

  return useMemo(() => {
    const dayMetrics = {};

    const getOrInitMetric = (dateStr) => {
      if (!dayMetrics[dateStr]) {
        dayMetrics[dateStr] = {
          date: dateStr,
          score: 0,
          level: 0,
          notesCount: 0,
          videosCount: 0,
          tasksCompleted: 0,
          tasksTotal: 0,
          hasLogin: false,
        };
      }
      return dayMetrics[dateStr];
    };

    // 1. Process Notes (+4 pts each)
    (notesHistory || []).forEach(note => {
      const dateStr = toLocalDateStr(note.createdAtDate || note.createdAt || note.date);
      if (dateStr) {
        const metric = getOrInitMetric(dateStr);
        metric.notesCount += 1;
        metric.score += 4;
      }
    });

    // 2. Process Watch History (+2 pts each)
    (watchHistory || []).forEach(item => {
      const dateStr = toLocalDateStr(item.openedAt || item.createdAt || item.date);
      if (dateStr) {
        const metric = getOrInitMetric(dateStr);
        metric.videosCount += 1;
        metric.score += 2;
      }
    });

    // 3. Process Daily Logins (+1 pt each)
    (activityHistory || []).forEach(act => {
      const dateStr = toLocalDateStr(act.date || act.createdAt);
      if (dateStr) {
        const metric = getOrInitMetric(dateStr);
        if (!metric.hasLogin) {
          metric.hasLogin = true;
          metric.score += 1;
        }
      }
    });

    // 4. Process Planner Tasks (Dual-factor: Priority weights + Completion rate % bonus)
    // Group tasks by date first
    const tasksByDate = {};
    (plannerTasks || []).forEach(task => {
      const dateStr = toLocalDateStr(task.date || task.createdAt);
      if (dateStr) {
        if (!tasksByDate[dateStr]) tasksByDate[dateStr] = [];
        tasksByDate[dateStr].push(task);
      }
    });

    Object.entries(tasksByDate).forEach(([dateStr, tasks]) => {
      const metric = getOrInitMetric(dateStr);
      metric.tasksTotal = tasks.length;
      
      let completedCount = 0;
      let priorityScore = 0;

      tasks.forEach(t => {
        if (t.completed) {
          completedCount += 1;
          // Priority weights: high = 3, medium = 2, low = 1
          const p = (t.priority || 'medium').toLowerCase();
          const pWeight = p === 'high' ? 3 : p === 'low' ? 1 : 2;
          priorityScore += pWeight;
        }
      });

      metric.tasksCompleted = completedCount;
      metric.score += priorityScore;

      // Completion Rate Bonus: up to +3 pts if all planned tasks are completed
      if (metric.tasksTotal > 0 && completedCount > 0) {
        const completionRate = completedCount / metric.tasksTotal;
        const attainmentBonus = Math.round(completionRate * 3);
        metric.score += attainmentBonus;
      }
    });

    // 5. Map Scores to 5 Discrete Visual Levels (0 to 4)
    // Level 0: 0 pts
    // Level 1: 1 - 2 pts (light)
    // Level 2: 3 - 5 pts (moderate)
    // Level 3: 6 - 8 pts (deep focus)
    // Level 4: 9+ pts (masterclass)
    const activeDates = new Set();
    const heatmapScores = {};

    Object.entries(dayMetrics).forEach(([dateStr, metric]) => {
      if (metric.score > 0) {
        activeDates.add(dateStr);
        if (metric.score <= 2) {
          metric.level = 1;
        } else if (metric.score <= 5) {
          metric.level = 2;
        } else if (metric.score <= 8) {
          metric.level = 3;
        } else {
          metric.level = 4;
        }
      } else {
        metric.level = 0;
      }
      heatmapScores[dateStr] = metric.score;
    });

    // 6. Streak Calculation with Midnight Grace Period
    const todayStr = subtractDaysFromToday(0);
    const yesterdayStr = subtractDaysFromToday(1);

    let currentStreak = 0;
    let anchorDate = null;

    if (activeDates.has(todayStr)) {
      anchorDate = todayStr;
    } else if (activeDates.has(yesterdayStr)) {
      // Grace period active: student hasn't studied today yet, but streak is preserved from yesterday!
      anchorDate = yesterdayStr;
    }

    if (anchorDate) {
      currentStreak = 1;
      let daysBack = 1;
      const anchorBaseDate = new Date();
      if (anchorDate === yesterdayStr) {
        anchorBaseDate.setDate(anchorBaseDate.getDate() - 1);
      }

      while (true) {
        const prev = new Date(anchorBaseDate);
        prev.setDate(prev.getDate() - daysBack);
        const y = prev.getFullYear();
        const m = String(prev.getMonth() + 1).padStart(2, '0');
        const d = String(prev.getDate()).padStart(2, '0');
        const prevDateStr = `${y}-${m}-${d}`;

        if (activeDates.has(prevDateStr)) {
          currentStreak++;
          daysBack++;
        } else {
          break;
        }
      }
    }

    // 7. Longest Streak Calculation
    let longestStreak = 0;
    const sortedActiveDates = Array.from(activeDates).sort();

    if (sortedActiveDates.length > 0) {
      let tempStreak = 1;
      longestStreak = 1;

      for (let i = 1; i < sortedActiveDates.length; i++) {
        const prev = new Date(sortedActiveDates[i - 1]);
        const curr = new Date(sortedActiveDates[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }

        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      }
    }

    // 8. Trailing 7 Days Activity for the Weekly Consistency Row
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const dateStr = subtractDaysFromToday(i);
      const metric = dayMetrics[dateStr];
      weeklyActivity.push(metric ? metric.score : 0);
    }

    return {
      currentStreak,
      longestStreak,
      totalStudyDays: activeDates.size,
      totalVideosProcessed: (notesHistory || []).length,
      weeklyActivity,
      heatmapData: heatmapScores,
      dayMetrics
    };
  }, [notesHistory, watchHistory, plannerTasks, activityHistory]);
}
