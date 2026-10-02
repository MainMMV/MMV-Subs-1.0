import { Capacitor } from "@capacitor/core";
import { CapacitorCalendar } from "@ebarooni/capacitor-calendar";
import type { PaymentItem } from "../types";
import { formatCurrency } from "../utils/calculations";

const STORAGE_KEY = "mmv_subs_device_calendar_events_v1";

export const isNativeApp = () => Capacitor.isNativePlatform();

export interface DeviceCalendar {
  id: string;
  title: string;
  account: string;
}

export async function requestDeviceCalendars(): Promise<DeviceCalendar[]> {
  if (!isNativeApp()) return [];
  const { result: permission } = await CapacitorCalendar.requestFullCalendarAccess();
  if (permission !== "granted") throw new Error("Calendar access was not granted. Enable it in Android settings and try again.");
  const { result } = await CapacitorCalendar.listCalendars();
  return result.map((calendar) => ({
    id: calendar.id,
    title: calendar.title || "Calendar",
    account: calendar.accountName || calendar.ownerAccount || "On this device",
  }));
}

function readEventIds(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export async function addToDeviceCalendar(items: PaymentItem[], calendarId: string): Promise<{ added: number; updated: number; errors: string[] }> {
  if (!isNativeApp()) throw new Error("Device calendar is available in the Android app.");
  if (!calendarId) throw new Error("Choose a calendar first.");
  const ids = readEventIds();
  let added = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const item of items) {
    if (!item.date || item.manualStatus === "paid" || item.manualStatus === "skipped") continue;
    try {
      const start = new Date(`${item.date}T${item.time || "09:00"}:00`);
      if (Number.isNaN(start.getTime())) throw new Error("Invalid due date or time");
      const key = `${calendarId}:${item.id}`;
      const event = {
        calendarId,
        title: `${item.name} due (${formatCurrency(item.price, item.currency)})`,
        description: `MMV Hub payment reminder${item.notes ? `\n${item.notes}` : ""}`,
        startDate: start.getTime(),
        endDate: start.getTime() + 30 * 60_000,
        alerts: [-1440, -120],
      };
      if (ids[key]) {
        await CapacitorCalendar.modifyEvent({ id: ids[key], ...event });
        updated++;
      } else {
        const result = await CapacitorCalendar.createEvent(event);
        if (!result.id) throw new Error("Calendar did not return an event ID");
        ids[key] = result.id;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        added++;
      }
    } catch (error) {
      errors.push(`${item.name}: ${error instanceof Error ? error.message : "Calendar error"}`);
    }
  }
  return { added, updated, errors };
}
