import type { ItemReminder, PaymentItem } from "../types";
import { tashkentDateKey, tashkentDateTime } from "../utils/timezone";

export interface PaymentReminderOccurrence {
  id: string;
  item: PaymentItem;
  reminder: ItemReminder;
  at: Date;
  dateKey: string;
}

export function getPaymentReminderDate(item: PaymentItem, reminder: ItemReminder): Date {
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

export function getPaymentReminderOccurrences(items: PaymentItem[]): PaymentReminderOccurrence[] {
  return items
    .filter((item) => item.manualStatus !== "paid" && item.manualStatus !== "skipped")
    .flatMap((item) => (item.reminders || [])
    .filter((reminder) => reminder.enabled)
    .map((reminder) => {
      const at = getPaymentReminderDate(item, reminder);
      return {
        id: `${item.id}:${reminder.id}`,
        item,
        reminder,
        at,
        dateKey: tashkentDateKey(at),
      };
    })
    .filter((occurrence) => !Number.isNaN(occurrence.at.getTime())));
}

export function describePaymentReminder(reminder: ItemReminder): string {
  if (reminder.timing === "on_date") return "On payment date";
  const unit = reminder.duration === 1 ? reminder.unit.replace(/s$/, "") : reminder.unit;
  return `${reminder.duration} ${unit} ${reminder.timing}`;
}
