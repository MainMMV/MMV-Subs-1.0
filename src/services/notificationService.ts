import { PaymentItem, InAppNotification } from "../types";
import { formatCurrency } from "../utils/calculations";
import { tashkentDateKey } from "../utils/timezone";
import { getPaymentReminderDate } from "./paymentReminderSchedule";

const STORAGE_KEYS = {
  READ_IDS: "mmv_subs_read_notifications_v1",
  DISMISSED_IDS: "mmv_subs_dismissed_notifications_v1",
  LAST_PUSHED_LOG: "mmv_subs_last_pushed_log_v1",
  PUSH_PREF: "mmv_subs_browser_push_enabled_v1",
};

/**
 * Scan payment items and build normalized in-app notifications
 */
export function generateInAppNotifications(
  items: PaymentItem[],
  now: Date = new Date()
): InAppNotification[] {
  const readIds = getStoredIds(STORAGE_KEYS.READ_IDS);
  const dismissedIds = getStoredIds(STORAGE_KEYS.DISMISSED_IDS);

  const notifications: InAppNotification[] = [];

  items.forEach((item) => {
    // If marked paid or skipped for this cycle, no pending notification
    if (item.manualStatus === "paid" || item.manualStatus === "skipped") return;
    if (!item.date) return;

    const [year, month, day] = item.date.split("-").map(Number);
    const [todayYear, todayMonth, todayDay] = tashkentDateKey(now).split("-").map(Number);
    const daysUntilDue = Math.round((Date.UTC(year, month - 1, day) - Date.UTC(todayYear, todayMonth - 1, todayDay)) / 86_400_000);

    const configured = item.reminders || [];
    if (configured.length) {
      const inAppReminders = configured.filter((reminder) => reminder.enabled && reminder.channel !== "telegram");
      if (!inAppReminders.some((reminder) => getPaymentReminderDate(item, reminder) <= now)) return;
    } else if (daysUntilDue > 1) {
      return;
    }

    let urgency: "overdue" | "due_today" | "upcoming" | null = null;

    if (daysUntilDue < 0) {
      urgency = "overdue";
    } else if (daysUntilDue === 0) {
      urgency = "due_today";
    } else {
      urgency = "upcoming";
    }

    if (!urgency) return;

    const notifId = `notif-${item.id}-${item.date}`;
    if (dismissedIds.has(notifId)) return;

    notifications.push({
      id: notifId,
      itemId: item.id,
      itemName: item.name,
      itemType: item.type,
      price: item.price,
      currency: item.currency,
      dueDate: item.date,
      daysUntilDue,
      urgency,
      createdAt: now.toISOString(),
      read: readIds.has(notifId),
      dismissed: false,
    });
  });

  // Sort by urgency: overdue first, then due today, then upcoming nearest
  return notifications.sort((a, b) => {
    const urgencyScore = { overdue: 0, due_today: 1, upcoming: 2 };
    if (urgencyScore[a.urgency] !== urgencyScore[b.urgency]) {
      return urgencyScore[a.urgency] - urgencyScore[b.urgency];
    }
    return a.daysUntilDue - b.daysUntilDue;
  });
}

export function getActiveInAppAlertKeys(items: PaymentItem[], now: Date = new Date()): Array<{ key: string; sound: "notification" | "reminder" }> {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  return generateInAppNotifications(items, now).flatMap((notification) => {
    const item = itemsById.get(notification.itemId);
    const configured = item?.reminders?.filter((reminder) => reminder.enabled && reminder.channel !== "telegram") || [];
    if (configured.length && item) {
      return configured
        .filter((reminder) => getPaymentReminderDate(item, reminder).getTime() <= now.getTime())
        .map((reminder) => ({ key: `${notification.id}:${reminder.id}`, sound: "reminder" as const }));
    }
    return [{
      key: `${notification.id}:${notification.urgency}`,
      sound: notification.urgency === "upcoming" ? "notification" as const : "reminder" as const,
    }];
  });
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(id: string) {
  const readIds = getStoredIds(STORAGE_KEYS.READ_IDS);
  readIds.add(id);
  localStorage.setItem(STORAGE_KEYS.READ_IDS, JSON.stringify(Array.from(readIds)));
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead(notifications: InAppNotification[]) {
  const readIds = getStoredIds(STORAGE_KEYS.READ_IDS);
  notifications.forEach((n) => readIds.add(n.id));
  localStorage.setItem(STORAGE_KEYS.READ_IDS, JSON.stringify(Array.from(readIds)));
}

/**
 * Dismiss a notification
 */
export function dismissNotification(id: string) {
  const dismissedIds = getStoredIds(STORAGE_KEYS.DISMISSED_IDS);
  dismissedIds.add(id);
  localStorage.setItem(STORAGE_KEYS.DISMISSED_IDS, JSON.stringify(Array.from(dismissedIds)));
}

/**
 * Request browser notification permission
 */
export async function requestBrowserPushPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }
  const perm = await Notification.requestPermission();
  if (perm === "granted") {
    localStorage.setItem(STORAGE_KEYS.PUSH_PREF, "true");
  }
  return perm;
}

export function isBrowserPushEnabled(): boolean {
  if (!("Notification" in window)) return false;
  return Notification.permission === "granted" && localStorage.getItem(STORAGE_KEYS.PUSH_PREF) !== "false";
}

export function setBrowserPushEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEYS.PUSH_PREF, enabled ? "true" : "false");
}

/**
 * Trigger native browser notification for high-priority due payments
 * Includes 12-hour deduplication to prevent alert spamming.
 */
export function triggerBrowserDueAlerts(notifications: InAppNotification[]) {
  if (!isBrowserPushEnabled()) return;

  const urgentItems = notifications.filter(
    (n) => n.urgency === "due_today" || (n.urgency === "upcoming" && n.daysUntilDue <= 1)
  );

  if (urgentItems.length === 0) return;

  const lastPushedMap: Record<string, number> = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LAST_PUSHED_LOG);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  })();

  const nowMs = Date.now();
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;

  urgentItems.slice(0, 3).forEach((item) => {
    const lastTime = lastPushedMap[item.id] || 0;
    if (nowMs - lastTime < TWELVE_HOURS) {
      return; // Already notified recently
    }

    try {
      const title = item.urgency === "due_today"
        ? `Payment Due Today: ${item.itemName}`
        : `Payment Due Tomorrow: ${item.itemName}`;

      const body = `${formatCurrency(item.price, item.currency)} is due on ${item.dueDate}. Open MMV Hub to review.`;

      const notification = new Notification(title, {
        body,
        icon: "/pwa-192x192.png",
        tag: item.id,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      lastPushedMap[item.id] = nowMs;
    } catch (e) {
      console.warn("Could not dispatch browser notification:", e);
    }
  });

  try {
    localStorage.setItem(STORAGE_KEYS.LAST_PUSHED_LOG, JSON.stringify(lastPushedMap));
  } catch {
    // ignore
  }
}

function getStoredIds(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // fallback
  }
  return new Set();
}
