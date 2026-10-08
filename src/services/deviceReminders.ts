import { LocalNotifications, type LocalNotificationSchema } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { isNativeApp } from "./deviceCalendar";
import type { ItemReminder, PaymentItem } from "../types";
import type { Habit, HabitLog } from "../types/habit";
import { formatCurrency } from "../utils/calculations";
import { planHabitReminders } from "./habitReminderSchedule";
import { getPaymentReminderDate } from "./paymentReminderSchedule";

const STORAGE_KEY = "mmv_subs_scheduled_device_ids_v1";
const HABITS_STORAGE_KEY = "mmv_subs_habits_v2";
const HABIT_LOGS_STORAGE_KEY = "mmv_subs_habit_logs_v2";
const PAYMENT_CHANNEL_ID = "mmv_payments_v1";
const HABIT_CHANNEL_ID = "mmv_habits_v1";

async function ensureReminderChannels() {
  await Promise.all([
    LocalNotifications.createChannel({
      id: PAYMENT_CHANNEL_ID,
      name: "Payment reminders",
      description: "Upcoming and overdue payment alerts",
      importance: 4,
      sound: "mmv_payment_reminder.wav",
    }),
    LocalNotifications.createChannel({
      id: HABIT_CHANNEL_ID,
      name: "Habit reminders",
      description: "Scheduled habit alerts",
      importance: 4,
      sound: "mmv_habit_reminder.wav",
    }),
  ]);
}

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
  if (Capacitor.getPlatform() === "android") await ensureReminderChannels();
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
      const at = getPaymentReminderDate(item, reminder);
      if (Number.isNaN(at.getTime()) || at.getTime() <= now) continue;
      notifications.push({
        id: notificationId(`${item.id}:${item.date}:${reminder.id}`),
        title: `${item.name} payment reminder`,
        body: `${formatCurrency(item.price, item.currency)} due ${item.date}`,
        channelId: PAYMENT_CHANNEL_ID,
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
      channelId: HABIT_CHANNEL_ID,
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
