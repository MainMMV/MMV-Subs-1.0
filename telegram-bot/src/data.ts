import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type DocumentReference } from "firebase-admin/firestore";
import { GoogleAuth } from "google-auth-library";
import type { Goal, Habit, LocalClock, PaymentItem, UserData } from "./types.js";

const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!rawServiceAccount) throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured.");

const serviceAccount = JSON.parse(rawServiceAccount);
const app = getApps()[0] ?? initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
const databaseId = process.env.FIRESTORE_DATABASE_ID || "ai-studio-mmvsubs-7f61226f-682f-4402-823f-82cb55675031";
export const db = getFirestore(app, databaseId);

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function ensureFirestoreApiEnabled(): Promise<void> {
  if (process.env.AUTO_ENABLE_FIRESTORE_API !== "true") return;

  const projectId = serviceAccount.project_id as string;
  const servicePath = `projects/${projectId}/services/firestore.googleapis.com`;
  const serviceUrl = `https://serviceusage.googleapis.com/v1/${servicePath}`;
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();

  const readState = async () => {
    const response = await client.request<{ state?: string }>({ url: serviceUrl });
    return response.data.state;
  };

  try {
    if (await readState() === "ENABLED") {
      console.log("Cloud Firestore API is enabled.");
      return;
    }
  } catch (error) {
    console.warn("Could not read Cloud Firestore API state; attempting enable directly.");
  }

  await client.request({ url: `${serviceUrl}:enable`, method: "POST" });
  console.log("Cloud Firestore API enable request submitted.");

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await wait(3_000);
    if (await readState() === "ENABLED") {
      console.log("Cloud Firestore API is enabled.");
      return;
    }
  }

  throw new Error("Cloud Firestore API enable operation did not finish within 60 seconds.");
}

export interface UserState {
  uid: string;
  ref: DocumentReference;
  data: UserData;
}

export function getLocalClock(now = new Date(), timeZone = process.env.TIME_ZONE || "Asia/Tashkent"): LocalClock {
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23",
  }).formatToParts(now).reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  const weekday = ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as Record<string, number>)[values.weekday];
  return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}`, weekday };
}

export async function listUserStates(): Promise<UserState[]> {
  // A collection-group documentId filter requires a full document path, not
  // the shared leaf ID "data". Read the small sync group and filter the leaf
  // ID in memory so every users/{uid}/sync/data document is discovered.
  const snapshot = await db.collectionGroup("sync").get();
  return snapshot.docs.filter((doc) => doc.id === "data").map((doc) => ({
    uid: doc.ref.parent.parent?.id || "unknown",
    ref: doc.ref,
    data: doc.data() as UserData,
  }));
}

export async function findUserByChatId(chatId: string | number): Promise<UserState | undefined> {
  const target = String(chatId);
  const snapshot = await db.collectionGroup("sync")
    .where("telegramConfig.chatId", "==", target)
    .limit(1)
    .get();
  const doc = snapshot.docs[0];
  if (!doc) return undefined;
  const data = doc.data() as UserData;
  if (!data.telegramConfig?.isEnabled) return undefined;
  return { uid: doc.ref.parent.parent?.id || "unknown", ref: doc.ref, data };
}

export function allItems(data: UserData): PaymentItem[] {
  return data.items || data.subscriptions || [];
}

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount) + ` ${currency}`;
}

export function addCalendarDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function daysBetween(fromDate: string, toDate: string): number {
  const [fy, fm, fd] = fromDate.split("-").map(Number);
  const [ty, tm, td] = toDate.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

export function isHabitScheduled(habit: Habit, clock: LocalClock): boolean {
  if (habit.isPaused || clock.date < habit.startDate || (habit.endDate && clock.date > habit.endDate)) return false;
  const isWeekend = clock.weekday === 0 || clock.weekday === 6;
  switch (habit.scheduleType) {
    case "weekdays": return habit.weekdays ? habit.weekdays.includes(clock.weekday) : true;
    case "custom_interval": return daysBetween(habit.startDate, clock.date) % Math.max(1, habit.customIntervalDays || 2) === 0;
    case "specific_dates": return habit.specificDates?.includes(clock.date) ?? false;
    case "weekday_weekend": return isWeekend ? (habit.weekendSchedule ?? true) : (habit.weekdaySchedule ?? true);
    default: return true;
  }
}

export function isHabitComplete(data: UserData, habit: Habit, date: string): boolean {
  const log = data.habitLogs?.[habit.id]?.[date];
  if (!log) return false;
  if (log.completed) return true;
  return Boolean(habit.targetValue && (log.value || 0) >= habit.targetValue);
}

export async function markHabitDone(state: UserState, habitId: string, date: string) {
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(state.ref);
    const live = snapshot.data() as UserData | undefined;
    if (!live) throw new Error("Your synced data was not found.");
    const habits = live.habits || [];
    const habit = habits.find((item) => item.id === habitId);
    if (!habit) throw new Error("This habit no longer exists.");
    const logs = { ...(live.habitLogs || {}) };
    const habitLogs = { ...(logs[habitId] || {}) };
    habitLogs[date] = {
      ...(habitLogs[date] || {}), id: `log-${habitId}-${date}`, habitId, date,
      status: "completed", completed: true,
      value: habit.targetValue || habitLogs[date]?.value || 1,
      completedAt: new Date().toISOString(),
    };
    logs[habitId] = habitLogs;
    transaction.update(state.ref, { habitLogs: logs, updatedAt: new Date().toISOString() });
  });
}

export async function wasDelivered(state: UserState, key: string): Promise<boolean> {
  return (await state.ref.collection("telegramDelivery").doc(key).get()).exists;
}

export async function rememberDelivery(state: UserState, key: string, details: Record<string, unknown>) {
  await state.ref.collection("telegramDelivery").doc(key).set({ ...details, sentAt: new Date().toISOString() });
}

export function activeGoals(goals: Goal[]) { return goals.filter((goal) => !goal.isCompleted); }
