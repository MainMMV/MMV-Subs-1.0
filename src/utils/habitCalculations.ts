import { Habit, HabitLog, HabitStatus, HabitStreakInfo, HabitAnalytics } from "../types/habit";

/**
 * Format a Date object to YYYY-MM-DD
 */
export const formatDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Parse YYYY-MM-DD string into a local Date
 */
export const parseDateStr = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Check if a habit is scheduled on a given date
 */
export const isHabitScheduledOnDate = (habit: Habit, dateStr: string): boolean => {
  if (habit.startDate && dateStr < habit.startDate) return false;
  if (habit.endDate && dateStr > habit.endDate) return false;
  if (habit.isPaused && habit.pausedAt && dateStr >= habit.pausedAt.slice(0, 10)) {
    return false;
  }

  const d = parseDateStr(dateStr);
  const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  switch (habit.scheduleType) {
    case "daily":
      return true;
    case "weekdays":
      return habit.weekdays ? habit.weekdays.includes(dayOfWeek) : true;
    case "weekly_frequency":
    case "monthly_frequency":
    case "flexible":
      return true;
    case "custom_interval": {
      const interval = habit.customIntervalDays || 2;
      const start = parseDateStr(habit.startDate || dateStr);
      const diffTime = d.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays % interval === 0;
    }
    case "specific_dates":
      return habit.specificDates ? habit.specificDates.includes(dateStr) : false;
    case "weekday_weekend":
      if (isWeekend) {
        return habit.weekendSchedule ?? true;
      } else {
        return habit.weekdaySchedule ?? true;
      }
    default:
      return true;
  }
};

/**
 * Determine the visual/functional status of a habit for a date cell
 */
export const getHabitStatusForDate = (
  habit: Habit,
  log: HabitLog | undefined,
  dateStr: string,
  todayStr: string
): HabitStatus => {
  const isScheduled = isHabitScheduledOnDate(habit, dateStr);

  if (log) {
    if (log.status === "skipped") return "skipped";
    if (log.completed) return "completed";
    if (log.value !== undefined && habit.targetValue && log.value > 0) {
      if (log.value >= habit.targetValue) return "completed";
      return "partial";
    }
    if (log.checklistProgress && habit.checklists && habit.checklists.length > 0) {
      const completedCount = Object.values(log.checklistProgress).filter(Boolean).length;
      if (completedCount === habit.checklists.length) return "completed";
      if (completedCount > 0) return "partial";
    }
  }

  if (dateStr > todayStr) {
    return isScheduled ? "future" : "unscheduled";
  }

  if (!isScheduled) {
    return "unscheduled";
  }

  if (dateStr < todayStr) {
    return "missed";
  }

  // Today and not completed yet
  return "unscheduled";
};

/**
 * Calculate Streaks with Skip-Protection and Paused-Day Protection
 */
export const calculateHabitStreak = (
  habit: Habit,
  logs: Record<string, HabitLog>,
  todayStr: string
): HabitStreakInfo => {
  let currentStreak = 0;
  let longestStreak = 0;
  let streakStartDate: string | null = null;
  const history: { startDate: string; endDate: string; length: number }[] = [];

  const start = parseDateStr(habit.startDate || "2024-01-01");
  const today = parseDateStr(todayStr);

  // Traverse backwards from yesterday/today
  let curr = new Date(today);
  let countingCurrent = true;
  let tempLength = 0;
  let tempEndDate: string | null = null;
  let tempStartDate: string | null = null;

  // Check today first
  const todayLog = logs[todayStr];
  const todayScheduled = isHabitScheduledOnDate(habit, todayStr);
  const todayCompleted = todayLog?.completed || todayLog?.status === "completed";
  const todaySkipped = todayLog?.status === "skipped";

  if (todayCompleted) {
    currentStreak++;
    streakStartDate = todayStr;
    tempLength = 1;
    tempEndDate = todayStr;
    tempStartDate = todayStr;
  } else if (todaySkipped) {
    // Skip protection: maintain streak
    streakStartDate = todayStr;
  }

  // Move to yesterday
  curr.setDate(curr.getDate() - 1);

  // Look back up to 365 days
  for (let i = 0; i < 365; i++) {
    if (curr < start) break;
    const dateStr = formatDateStr(curr);
    const log = logs[dateStr];
    const isScheduled = isHabitScheduledOnDate(habit, dateStr);

    if (!isScheduled) {
      // Unscheduled or paused day does not break streak
      curr.setDate(curr.getDate() - 1);
      continue;
    }

    const isDone = log?.completed || log?.status === "completed";
    const isSkipped = log?.status === "skipped";

    if (isDone) {
      if (countingCurrent) {
        currentStreak++;
        streakStartDate = dateStr;
      }
      tempLength++;
      if (!tempEndDate) tempEndDate = dateStr;
      tempStartDate = dateStr;
    } else if (isSkipped) {
      // Skip protection: streak continues unbroken
      if (countingCurrent && tempLength > 0) {
        streakStartDate = dateStr;
      }
    } else {
      // Missed day breaks current streak
      if (countingCurrent) {
        countingCurrent = false;
      }
      if (tempLength > 0 && tempStartDate && tempEndDate) {
        history.push({
          startDate: tempStartDate,
          endDate: tempEndDate,
          length: tempLength,
        });
        if (tempLength > longestStreak) {
          longestStreak = tempLength;
        }
        tempLength = 0;
        tempEndDate = null;
        tempStartDate = null;
      }
    }

    curr.setDate(curr.getDate() - 1);
  }

  if (tempLength > longestStreak) {
    longestStreak = tempLength;
  }
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const milestones = [7, 30, 100, 365].map((d) => ({
    days: d,
    achieved: longestStreak >= d,
  }));

  return {
    currentStreak,
    longestStreak,
    streakStartDate,
    history,
    milestones,
  };
};

/**
 * Calculate Detailed Analytics for a single habit
 */
export const calculateHabitAnalytics = (
  habit: Habit,
  logs: Record<string, HabitLog>,
  todayStr: string
): HabitAnalytics => {
  const today = parseDateStr(todayStr);
  const start = parseDateStr(habit.startDate || todayStr);

  let totalExpected = 0;
  let totalCompletions = 0;
  let totalTrackedDays = 0;
  let totalProgressValue = 0;
  let measurableDaysCount = 0;

  const weekdayCounts: Record<number, { completed: number; expected: number }> = {
    0: { completed: 0, expected: 0 },
    1: { completed: 0, expected: 0 },
    2: { completed: 0, expected: 0 },
    3: { completed: 0, expected: 0 },
    4: { completed: 0, expected: 0 },
    5: { completed: 0, expected: 0 },
    6: { completed: 0, expected: 0 },
  };

  // Inspect last 90 days for trends
  let firstHalfCompletions = 0;
  let firstHalfExpected = 0;
  let secondHalfCompletions = 0;
  let secondHalfExpected = 0;

  let weeklyExpected = 0;
  let weeklyCompletions = 0;
  let monthlyExpected = 0;
  let monthlyCompletions = 0;

  const curr = new Date(today);
  const daysToTrack = 90;

  for (let i = 0; i < daysToTrack; i++) {
    if (curr < start) break;
    const dateStr = formatDateStr(curr);
    const dayOfWeek = curr.getDay();
    const isScheduled = isHabitScheduledOnDate(habit, dateStr);
    const log = logs[dateStr];

    if (log) {
      totalTrackedDays++;
      if (log.value !== undefined) {
        totalProgressValue += log.value;
        measurableDaysCount++;
      }
    }

    if (isScheduled) {
      totalExpected++;
      weekdayCounts[dayOfWeek].expected++;

      if (i < 7) weeklyExpected++;
      if (i < 30) monthlyExpected++;

      if (i < 45) {
        secondHalfExpected++;
      } else {
        firstHalfExpected++;
      }

      if (log?.completed || log?.status === "completed") {
        totalCompletions++;
        weekdayCounts[dayOfWeek].completed++;
        if (i < 7) weeklyCompletions++;
        if (i < 30) monthlyCompletions++;

        if (i < 45) {
          secondHalfCompletions++;
        } else {
          firstHalfCompletions++;
        }
      }
    }

    curr.setDate(curr.getDate() - 1);
  }

  const completionRate = totalExpected > 0 ? Math.round((totalCompletions / totalExpected) * 100) : 0;
  const weeklyCompletionRate = weeklyExpected > 0 ? Math.round((weeklyCompletions / weeklyExpected) * 100) : 0;
  const monthlyCompletionRate = monthlyExpected > 0 ? Math.round((monthlyCompletions / monthlyExpected) * 100) : 0;

  // Weekday consistency
  const weekdayConsistency: Record<number, number> = {};
  let bestDayIndex = 0;
  let bestDayScore = -1;
  let mostMissedIndex = 0;
  let lowestDayScore = 101;

  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (let d = 0; d < 7; d++) {
    const { completed, expected } = weekdayCounts[d];
    const pct = expected > 0 ? Math.round((completed / expected) * 100) : 0;
    weekdayConsistency[d] = pct;

    if (expected > 0) {
      if (pct > bestDayScore) {
        bestDayScore = pct;
        bestDayIndex = d;
      }
      if (pct < lowestDayScore) {
        lowestDayScore = pct;
        mostMissedIndex = d;
      }
    }
  }

  // Trend detection
  const firstRate = firstHalfExpected > 0 ? firstHalfCompletions / firstHalfExpected : 0;
  const secondRate = secondHalfExpected > 0 ? secondHalfCompletions / secondHalfExpected : 0;
  let trend: "increasing" | "stable" | "decreasing" = "stable";
  if (secondRate - firstRate > 0.08) trend = "increasing";
  else if (firstRate - secondRate > 0.08) trend = "decreasing";

  return {
    completionRate,
    totalCompletions,
    totalExpected,
    totalTrackedDays,
    consistencyScore: completionRate,
    averageProgress: measurableDaysCount > 0 ? Math.round((totalProgressValue / measurableDaysCount) * 10) / 10 : 0,
    trend,
    bestDay: bestDayScore >= 0 ? weekdayNames[bestDayIndex] : "None yet",
    mostMissedDay: lowestDayScore <= 100 ? weekdayNames[mostMissedIndex] : "None",
    weekdayConsistency,
    weeklyCompletionRate,
    monthlyCompletionRate,
  };
};

/**
 * Check if all scheduled habits were completed on a given date
 */
export const isPerfectDay = (
  habits: Habit[],
  allLogs: Record<string, Record<string, HabitLog>>,
  dateStr: string
): boolean => {
  const activeHabits = habits.filter((h) => !h.isPaused);
  const scheduledHabits = activeHabits.filter((h) => isHabitScheduledOnDate(h, dateStr));
  if (scheduledHabits.length === 0) return false;

  return scheduledHabits.every((habit) => {
    const habitLogs = allLogs[habit.id] || {};
    const log = habitLogs[dateStr];
    return log?.completed || log?.status === "completed";
  });
};

/**
 * Generate 365-day calendar heatmap data
 */
export const generateYearActivityHeatmap = (
  habits: Habit[],
  allLogs: Record<string, Record<string, HabitLog>>,
  year: number
): { date: string; count: number; totalScheduled: number; level: number }[] => {
  const result: { date: string; count: number; totalScheduled: number; level: number }[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const curr = new Date(start);

  while (curr <= end) {
    const dateStr = formatDateStr(curr);
    let count = 0;
    let scheduled = 0;

    habits.forEach((habit) => {
      if (isHabitScheduledOnDate(habit, dateStr)) {
        scheduled++;
        const log = allLogs[habit.id]?.[dateStr];
        if (log?.completed || log?.status === "completed") {
          count++;
        }
      }
    });

    let level = 0;
    if (scheduled > 0) {
      const ratio = count / scheduled;
      if (ratio === 0) level = 0;
      else if (ratio < 0.35) level = 1;
      else if (ratio < 0.7) level = 2;
      else if (ratio < 1) level = 3;
      else level = 4;
    }

    result.push({
      date: dateStr,
      count,
      totalScheduled: scheduled,
      level,
    });

    curr.setDate(curr.getDate() + 1);
  }

  return result;
};
