import assert from "node:assert/strict";
import test from "node:test";
import type { Habit } from "../types/habit";
import { planHabitReminders } from "./habitReminderSchedule";

const habit: Habit = {
  id: "habit-1", name: "Read", icon: "Book", color: "#059669", category: "Study",
  type: "yes_no", scheduleType: "daily", startDate: "2026-01-01", order: 1,
  isPinned: false, isPaused: false, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
  reminders: [{ id: "morning", time: "09:00", incompleteOnly: true, enabled: true }],
};

test("plans enabled habit reminders for the APK", () => {
  const result = planHabitReminders([habit], {}, new Date("2026-10-06T00:00:00Z"), 0);
  assert.equal(result.length, 1);
  assert.equal(result[0].at.toISOString(), "2026-10-06T04:00:00.000Z");
});

test("does not remind after today's habit is complete", () => {
  const logs = { "habit-1": { "2026-10-06": { id: "log", habitId: "habit-1", date: "2026-10-06", status: "completed" as const, completed: true } } };
  assert.equal(planHabitReminders([habit], logs, new Date("2026-10-06T00:00:00Z"), 0).length, 0);
});

test("does not schedule paused habits", () => {
  assert.equal(planHabitReminders([{ ...habit, isPaused: true }], {}, new Date("2026-10-06T00:00:00Z"), 1).length, 0);
});
