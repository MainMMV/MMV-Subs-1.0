export const APP_TIME_ZONE = "Asia/Tashkent";

export function tashkentDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function formatTashkentDateTime(date: Date | string, locale = "en-GB"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function tashkentDateTime(dateKey: string, time = "00:00"): Date {
  return new Date(`${dateKey}T${time}:00+05:00`);
}
