import type { Habit, HabitLog } from "../types/habit";
import { isHabitScheduledOnDate } from "../utils/habitCalculations";
import { tashkentDateKey, tashkentDateTime } from "../utils/timezone";

export interface PlannedHabitReminder {
  key: string;
  habitId: string;
  title: string;
  body: string;
  at: Date;
}

function dateKeyAfter(today: string, offset: number): string {
  const noon = tashkentDateTime(today, "12:00");
  return tashkentDateKey(new Date(noon.getTime() + offset * 86_400_000));
}

export function planHabitReminders(
  habits: Habit[],
  logs: Record<string, Record<string, HabitLog>>,
  now = new Date(),
  daysAhead = 30,
): PlannedHabitReminder[] {
  const today = tashkentDateKey(now);
  const planned: PlannedHabitReminder[] = [];

  for (const habit of habits) {
    if (habit.isPaused) continue;
    const reminders = habit.reminders?.filter((reminder) => reminder.enabled) || [];
    for (let offset = 0; offset <= daysAhead; offset++) {
      const dateKey = dateKeyAfter(today, offset);
      if (!isHabitScheduledOnDate(habit, dateKey)) continue;
      const log = logs[habit.id]?.[dateKey];
      const isComplete = Boolean(log?.completed || log?.status === "completed");

      for (const reminder of reminders) {
        const dayOfWeek = tashkentDateTime(dateKey, "12:00").getUTCDay();
        if (reminder.days?.length && !reminder.days.includes(dayOfWeek)) continue;
        if (reminder.incompleteOnly && isComplete) continue;
        const at = tashkentDateTime(dateKey, reminder.time || "09:00");
        if (at.getTime() <= now.getTime()) continue;
        planned.push({
          key: `${habit.id}:${dateKey}:${reminder.id}`,
          habitId: habit.id,
          title: habit.name,
          body: reminder.incompleteOnly ? "Your habit is still waiting for today." : "Time for your habit.",
          at,
        });
      }
    }
  }

  return planned;
}
