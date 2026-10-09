import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { CloudData } from "./services/cloudData";
import firebaseConfig from "../firebase-applet-config.json";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || "ai-studio-mmvsubs-7f61226f-682f-4402-823f-82cb55675031");

/**
 * Keeps the data required by the separate Telegram worker in Firestore.
 * Telegram credentials are intentionally not required by the worker: its one
 * bot token belongs only in the worker's environment variables.
 */
export const syncToFirebase = async (data: CloudData) => {
  try {
    let user = auth.currentUser;
    if (!user) {
      const cred = await signInAnonymously(auth);
      user = cred.user;
    }
    const syncRef = doc(db, `users/${user.uid}/sync/data`);
    const { botToken: _ignoredBotToken, ...safeTelegramConfig } = data.telegramConfig;
    await setDoc(syncRef, {
      ...data,
      telegramConfig: safeTelegramConfig,
      // Kept for compatibility with the first server-cron implementation.
      subscriptions: data.items,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log("Synced to Firebase backend for Telegram Cron jobs");
    return true;
  } catch (error: any) {
    if (error?.code === 'auth/admin-restricted-operation' || error?.code === 'auth/operation-not-allowed') {
      console.warn("⚠️ Firebase Sync Skipped: Anonymous Authentication is disabled.");
      console.warn("To enable background Telegram reminders, please open your Firebase Console -> Authentication -> Sign-in method -> Enable 'Anonymous'.");
    } else {
      console.warn("⚠️ Firebase sync skipped:", error?.message || error);
    }
    return false;
  }
};

export async function readCloudData(user: User): Promise<Partial<CloudData> | null> {
  const snapshot = await getDoc(doc(db, `users/${user.uid}/sync/data`));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    items: Array.isArray(data.items) ? data.items : [],
    history: Array.isArray(data.history) ? data.history : [],
    habits: Array.isArray(data.habits) ? data.habits : [],
    habitLogs: data.habitLogs && typeof data.habitLogs === "object" ? data.habitLogs : {},
    goals: Array.isArray(data.goals) ? data.goals : [],
    telegramConfig: data.telegramConfig,
    displayCurrency: data.displayCurrency,
    exchangeRateUsdToUzs: data.exchangeRateUsdToUzs,
    theme: data.theme,
  } as Partial<CloudData>;
}

export const requestTelegramTest = async (chatId: string): Promise<void> => {
  let user = auth.currentUser;
  if (!user) user = (await signInAnonymously(auth)).user;
  await setDoc(doc(db, `users/${user.uid}/sync/data`), {
    telegramTestRequest: { id: crypto.randomUUID(), chatId, requestedAt: new Date().toISOString() },
  }, { merge: true });
};
