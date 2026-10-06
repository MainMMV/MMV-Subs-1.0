import { LocalNotifications, type LocalNotificationSchema } from "@capacitor/local-notifications";
import { isNativeApp } from "./deviceCalendar";
import type { ItemReminder, PaymentItem } from "../types";
import type { Habit, HabitLog } from "../types/habit";
import { formatCurrency } from "../utils/calculations";
import { tashkentDateTime } from "../utils/timezone";
import { planHabitReminders } from "./habitReminderSchedule";

const STORAGE_KEY = "mmv_subs_scheduled_device_ids_v1";
const HABITS_STORAGE_KEY = "mmv_subs_habits_v2";
const HABIT_LOGS_STORAGE_KEY = "mmv_subs_habit_logs_v2";

function storedJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function notificationId(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 1;
}

function reminderDate(item: PaymentItem, reminder: ItemReminder): Date {
  const date = tashkentDateTime(item.date, reminder.exactTime || item.time || "09:00");
  if (reminder.timing === "on_date") return date;
  const direction = reminder.timing === "before" ? -1 : 1;
  const amount = Math.max(0, reminder.duration) * direction;
  const unitMilliseconds = reminder.unit === "weeks"
    ? 7 * 86_400_000
    : reminder.unit === "days"
      ? 86_400_000
      : reminder.unit === "hours"
        ? 3_600_000
        : 60_000;
  return new Date(date.getTime() + amount * unitMilliseconds);
}

export async function enableDeviceReminders(): Promise<boolean> {
  if (!isNativeApp()) return false;
  const { display } = await LocalNotifications.requestPermissions();
  return display === "granted";
}

export async function areDeviceRemindersEnabled(): Promise<boolean> {
  if (!isNativeApp()) return false;
  const { display } = await LocalNotifications.checkPermissions();
  return display === "granted";
}

export async function syncDeviceReminders(
  items: PaymentItem[],
  habits?: Habit[],
  habitLogs?: Record<string, Record<string, HabitLog>>,
): Promise<number> {
  if (!isNativeApp()) return 0;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== "granted") return 0;
  const previous: number[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const notifications: LocalNotificationSchema[] = [];
  const now = Date.now();
  for (const item of items) {
    if (!item.date || item.manualStatus === "paid" || item.manualStatus === "skipped") continue;
    const configured = item.reminders?.filter((reminder) => reminder.enabled && reminder.channel !== "telegram") || [];
    const reminders: ItemReminder[] = item.reminders?.length ? configured : [{
      id: "due", timing: "on_date", duration: 0, unit: "days",
      exactTime: item.time || "09:00", channel: "in_app", enabled: true,
    }];
    for (const reminder of reminders) {
      const at = reminderDate(item, reminder);
      if (Number.isNaN(at.getTime()) || at.getTime() <= now) continue;
      notifications.push({
        id: notificationId(`${item.id}:${item.date}:${reminder.id}`),
        title: `${item.name} payment reminder`,
        body: `${formatCurrency(item.price, item.currency)} due ${item.date}`,
        schedule: { at, allowWhileIdle: true },
        extra: { itemId: item.id },
      });
    }
  }
  const currentHabits = habits ?? storedJson<Habit[]>(HABITS_STORAGE_KEY, []);
  const currentHabitLogs = habitLogs ?? storedJson<Record<string, Record<string, HabitLog>>>(HABIT_LOGS_STORAGE_KEY, {});
  for (const reminder of planHabitReminders(currentHabits, currentHabitLogs, new Date())) {
    notifications.push({
      id: notificationId(`habit:${reminder.key}`),
      title: reminder.title,
      body: reminder.body,
      schedule: { at: reminder.at, allowWhileIdle: true },
      extra: { habitId: reminder.habitId, page: "habits" },
    });
  }
  if (previous.length) await LocalNotifications.cancel({ notifications: previous.map((id) => ({ id })) });
  // Android limits pending alarms. The nearest reminders are the most useful.
  const nearest = notifications.sort((a, b) => a.schedule!.at!.getTime() - b.schedule!.at!.getTime()).slice(0, 64);
  if (nearest.length) await LocalNotifications.schedule({ notifications: nearest });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nearest.map((notification) => notification.id)));
  return nearest.length;
}
