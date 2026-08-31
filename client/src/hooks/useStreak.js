import { useMemo } from 'react';

/**
 * Custom hook to calculate streak metrics and learning activity heatmap data
 * from the user's notes history.
 * @param {Array} notesHistory - Array of notes documents containing `createdAtDate` or `createdAt` Timestamps
 */
export function useStreak(notesHistory = []) {
  return useMemo(() => {
    if (!notesHistory || notesHistory.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalVideosProcessed: 0,
        weeklyActivity: Array(7).fill(0),
        heatmapData: {}
      };
    }

    // 1. Extract and normalize study dates to YYYY-MM-DD local format
    const activeDates = new Set();
    const dateCounts = {};

    notesHistory.forEach(note => {
      if (note.date) {
        activeDates.add(note.date);
        dateCounts[note.date] = (dateCounts[note.date] || 0) + 1;
        return;
      }

      let date;
      if (note.createdAtDate instanceof Date) {
        date = note.createdAtDate;
      } else if (note.createdAt && typeof note.createdAt.toDate === 'function') {
        date = note.createdAt.toDate();
      } else if (note.createdAt) {
        date = new Date(note.createdAt);
      } else {
        return;
      }

      // Format as YYYY-MM-DD local
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      activeDates.add(dateStr);
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    });

    const uniqueSortedDates = Array.from(activeDates).sort((a, b) => new Date(b) - new Date(a));

    // Helper: subtract days from a date and return YYYY-MM-DD string
    const subtractDays = (date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() - days);
      const year = result.getFullYear();
      const month = String(result.getMonth() + 1).padStart(2, '0');
      const day = String(result.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Formatted strings for today and yesterday
    const todayStr = subtractDays(new Date(), 0);
    const yesterdayStr = subtractDays(new Date(), 1);

    // 2. Compute Current Streak
    let currentStreak = 0;
    let checkDateStr = todayStr;

    // If they haven't studied today, check if they studied yesterday to keep the streak alive
    if (!activeDates.has(todayStr) && activeDates.has(yesterdayStr)) {
      checkDateStr = yesterdayStr;
    }

    // Calculate streak back in time
    if (activeDates.has(checkDateStr)) {
      currentStreak = 1;
      let daysBack = 1;
      while (true) {
        const prevDayStr = subtractDays(checkDateStr, daysBack);
        if (activeDates.has(prevDayStr)) {
          currentStreak++;
          daysBack++;
        } else {
          break;
        }
      }
    }

    // 3. Compute Longest Streak
    let longestStreak = 0;
    if (uniqueSortedDates.length > 0) {
      // Sort in ascending order for forward streak calculation
      const ascDates = [...uniqueSortedDates].reverse();
      let tempStreak = 1;
      longestStreak = 1;

      for (let i = 1; i < ascDates.length; i++) {
        const prevDate = new Date(ascDates[i - 1]);
        const currDate = new Date(ascDates[i]);
        const diffTime = Math.abs(currDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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

    // 4. Compute Weekly Activity (Last 7 Days, ending today)
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const dateStr = subtractDays(new Date(), i);
      weeklyActivity.push(dateCounts[dateStr] || 0);
    }

    return {
      currentStreak,
      longestStreak,
      totalVideosProcessed: notesHistory.length,
      weeklyActivity,
      heatmapData: dateCounts
    };
  }, [notesHistory]);
}
