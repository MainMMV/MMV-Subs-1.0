import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  User 
} from "firebase/auth";
import { auth } from "../firebase";
import { PaymentItem, GoogleCalendarSyncState } from "../types";
import { formatCurrency } from "../utils/calculations";
import { APP_TIME_ZONE } from "../utils/timezone";

export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope(CALENDAR_SCOPE);
googleProvider.setCustomParameters({
  prompt: "consent",
});

let cachedAccessToken: string | null = null;
let isSigningIn = false;

const STORAGE_KEY_CALENDAR_STATE = "mmv_subs_gcal_state_v1";

/**
 * Initialize Google Calendar Auth state listener
 */
export const initGoogleCalendarAuth = (
  onStateChange: (state: GoogleCalendarSyncState) => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const state: GoogleCalendarSyncState = {
        isConnected: Boolean(cachedAccessToken),
        userEmail: user.email,
        userName: user.displayName,
        userPhoto: user.photoURL,
        lastSyncedAt: getStoredSyncTimestamp(),
        syncedEventCount: getStoredSyncedCount(),
      };
      saveStoredCalendarState(state);
      onStateChange(state);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        const state: GoogleCalendarSyncState = {
          isConnected: false,
          userEmail: null,
          userName: null,
          userPhoto: null,
          lastSyncedAt: getStoredSyncTimestamp(),
          syncedEventCount: getStoredSyncedCount(),
        };
        onStateChange(state);
      }
    }
  });
};

/**
 * Sign in with Google using popup to obtain Calendar access token
 */
export const signInGoogleCalendar = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to obtain Google Calendar access token.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    if (error?.code === "auth/popup-blocked") {
      throw new Error("Popup blocked by browser. Please enable popups or use the direct Phone Calendar export.");
    }
    if (error?.code === "auth/popup-closed-by-user") {
      throw new Error("Google Sign-In window was closed. Please try again.");
    }
    if (error?.code === "auth/unauthorized-domain") {
      throw new Error("This preview domain is not whitelisted in Firebase Auth. Use the Phone Calendar export below for instant reminder sync.");
    }
    if (error?.code === "auth/operation-not-allowed") {
      throw new Error("Google Sign-In is not enabled in Firebase Console. Use the Phone Calendar export below.");
    }
    throw new Error(error?.message || "Failed to sign in with Google Calendar. Please try Phone Calendar export instead.");
  } finally {
    isSigningIn = false;
  }
};

/**
 * Disconnect Google Calendar & clear auth
 */
export const disconnectGoogleCalendar = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  localStorage.removeItem(STORAGE_KEY_CALENDAR_STATE);
};

export const getCalendarAccessToken = (): string | null => {
  return cachedAccessToken;
};

function getStoredSyncTimestamp(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CALENDAR_STATE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.lastSyncedAt || null;
    }
  } catch {
    // fallback
  }
  return null;
}

function getStoredSyncedCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CALENDAR_STATE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.syncedEventCount || 0;
    }
  } catch {
    // fallback
  }
  return 0;
}

function saveStoredCalendarState(state: GoogleCalendarSyncState) {
  try {
    localStorage.setItem(STORAGE_KEY_CALENDAR_STATE, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export interface SyncResult {
  success: boolean;
  totalSynced: number;
  createdCount: number;
  failedCount: number;
  errors: string[];
}

function getNextDayString(dateStr: string): string {
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2] + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Sync active payment items to Google Calendar.
 * Creates clean compliant all-day or timed events with 24h & 2h notification popups.
 */
export async function syncItemsToGoogleCalendar(
  items: PaymentItem[],
  options: {
    syncSubscriptions: boolean;
    syncBills: boolean;
    syncPurchases: boolean;
    selectedItemIds?: string[];
  }
): Promise<SyncResult> {
  let token = getCalendarAccessToken();
  if (!token) {
    // If user is logged in to Firebase but in-memory token is absent, re-acquire
    const reAuth = await signInGoogleCalendar();
    token = reAuth?.accessToken || null;
  }
  if (!token) {
    throw new Error("Google Calendar is not connected. Please sign in with Google or use the Phone Calendar export.");
  }

  const eligibleItems = items.filter((item) => {
    if (options.selectedItemIds && !options.selectedItemIds.includes(item.id)) return false;
    if (item.type === "subscription" && !options.syncSubscriptions) return false;
    if (item.type === "bill" && !options.syncBills) return false;
    if (item.type === "purchase" && !options.syncPurchases) return false;
    if (item.manualStatus === "paid" || item.manualStatus === "skipped") return false;
    return Boolean(item.date);
  });

  let createdCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const item of eligibleItems) {
    try {
      const summary = `${item.name} due (${formatCurrency(item.price, item.currency)})`;
      const description = [
        `Payment reminder generated by MMV Hub`,
        `Item: ${item.name}`,
        `Amount: ${formatCurrency(item.price, item.currency)}`,
        `Type: ${item.type === "subscription" ? "Subscription" : item.type === "bill" ? "Recurring Bill" : "One-time Purchase"}`,
        `Due Date: ${item.date}${item.time ? " at " + item.time : ""}`,
        item.notes ? `Notes: ${item.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      // Prepare RFC compliant date/time range
      const timeZone = APP_TIME_ZONE;
      let startObj: Record<string, string>;
      let endObj: Record<string, string>;

      if (item.time && /^\d{2}:\d{2}$/.test(item.time)) {
        const startIso = `${item.date}T${item.time}:00`;
        const d = new Date(`${item.date}T${item.time}:00`);
        d.setMinutes(d.getMinutes() + 30);
        const endHours = String(d.getHours()).padStart(2, "0");
        const endMinutes = String(d.getMinutes()).padStart(2, "0");
        const endIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${endHours}:${endMinutes}:00`;
        startObj = { dateTime: startIso, timeZone };
        endObj = { dateTime: endIso, timeZone };
      } else {
        // All-day event: Google Calendar requires end.date to be strictly next day (exclusive)
        startObj = { date: item.date };
        endObj = { date: getNextDayString(item.date) };
      }

      const eventPayload = {
        summary,
        description,
        start: startObj,
        end: endObj,
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 1440 }, // 1 day before
            { method: "popup", minutes: 120 },  // 2 hours before
          ],
        },
        extendedProperties: {
          private: {
            mmvSubsId: item.id,
            mmvSubsType: item.type,
          },
        },
      };

      const endpoint = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
      const matching = await fetch(`${endpoint}?privateExtendedProperty=${encodeURIComponent(`mmvSubsId=${item.id}`)}&maxResults=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (matching.status === 401) {
        cachedAccessToken = null;
        throw new Error("Google Calendar session expired. Sign in again to continue.");
      }
      if (!matching.ok) throw new Error(`Could not check existing events (HTTP ${matching.status})`);
      const existing = (await matching.json()) as { items?: { id: string }[] };
      const eventId = existing.items?.[0]?.id;
      const res = await fetch(eventId ? `${endpoint}/${encodeURIComponent(eventId)}` : endpoint, {
        method: eventId ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `HTTP ${res.status}`);
      }

      createdCount++;
    } catch (err: any) {
      if (!cachedAccessToken) throw err;
      failedCount++;
      errors.push(`${item.name}: ${err?.message || "Failed to create event"}`);
    }
  }

  const lastSyncedAt = new Date().toISOString();
  const stateUpdate: GoogleCalendarSyncState = {
    isConnected: true,
    userEmail: auth.currentUser?.email || null,
    userName: auth.currentUser?.displayName || null,
    userPhoto: auth.currentUser?.photoURL || null,
    lastSyncedAt,
    syncedEventCount: createdCount,
  };
  saveStoredCalendarState(stateUpdate);

  return {
    success: failedCount === 0 || createdCount > 0,
    totalSynced: createdCount,
    createdCount,
    failedCount,
    errors,
  };
}
