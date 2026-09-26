import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || "ai-studio-mmvsubs-7f61226f-682f-4402-823f-82cb55675031");

export const syncToFirebase = async (subscriptions: any, telegramConfig: any) => {
  try {
    let user = auth.currentUser;
    if (!user) {
      const cred = await signInAnonymously(auth);
      user = cred.user;
    }
    const syncRef = doc(db, `users/${user.uid}/sync/data`);
    await setDoc(syncRef, {
      subscriptions,
      telegramConfig,
      updatedAt: new Date().toISOString()
    });
    console.log("Synced to Firebase backend for Telegram Cron jobs");
  } catch (error: any) {
    if (error?.code === 'auth/admin-restricted-operation' || error?.code === 'auth/operation-not-allowed') {
      console.warn("⚠️ Firebase Sync Skipped: Anonymous Authentication is disabled.");
      console.warn("To enable background Telegram reminders, please open your Firebase Console -> Authentication -> Sign-in method -> Enable 'Anonymous'.");
    } else {
      console.warn("⚠️ Firebase sync skipped:", error?.message || error);
    }
  }
};
