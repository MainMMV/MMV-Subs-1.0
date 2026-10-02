import cron from "node-cron";
import fs from "fs";
import path from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Initialize Firebase Admin only if explicit service account credentials are provided
let db: Firestore | null = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON environment variable:", e);
    }

    if (serviceAccount) {
      // Read databaseId from firebase-applet-config.json if available
      let databaseId: string | undefined;
      try {
        const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
        if (fs.existsSync(configPath)) {
          const configContent = JSON.parse(fs.readFileSync(configPath, "utf-8"));
          databaseId = configContent.firestoreDatabaseId;
        }
      } catch (err) {
        console.warn("Could not read firebase-applet-config.json for databaseId:", err);
      }

      const app = getApps().length > 0 
        ? getApps()[0] 
        : initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id
          });

      db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
      console.log("Firebase Admin initialized for cron jobs using FIREBASE_SERVICE_ACCOUNT.");
    }
  } else {
    // In serverless/container environments without FIREBASE_SERVICE_ACCOUNT,
    // do not attempt default credentials which target the host project where Firestore API is disabled.
    console.log("FIREBASE_SERVICE_ACCOUNT not configured. Background server cron will remain idle.");
  }
} catch (error: any) {
  console.warn("Firebase Admin initialization skipped:", error?.message || error);
}

export function startCronJobs() {
  if (!db) {
    console.log("Cron jobs: Server-side Telegram reminder scheduler is idle (requires FIREBASE_SERVICE_ACCOUNT).");
    return;
  }

  console.log("Starting background cron jobs for Telegram reminders...");

  // Run every hour to check for reminders
  cron.schedule("0 * * * *", async () => {
    if (!db) return;

    try {
      const usersRef = db.collection("users");
      const snapshot = await usersRef.get();

      if (snapshot.empty) return;

      const now = new Date();

      for (const userDoc of snapshot.docs) {
        const syncDoc = await userDoc.ref.collection("sync").doc("data").get();
        if (!syncDoc.exists) continue;

        const data = syncDoc.data() as any;
        const config = data?.telegramConfig;
        const subscriptions = data?.subscriptions || [];

        if (config && config.isEnabled && config.telegramBotToken && config.telegramChatId) {
          const { telegramBotToken, telegramChatId, remindDaysBefore } = config;

          for (const sub of subscriptions) {
            if (sub.status === "paused" || sub.archived) continue;
            if (!sub.nextDueDate) continue;

            const dueDate = new Date(sub.nextDueDate);
            const diffTime = Math.abs(dueDate.getTime() - now.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            // If diffDays is in remindDaysBefore, send reminder
            if (remindDaysBefore && remindDaysBefore.includes(diffDays)) {
              const itemText = `🔔 <b>Upcoming Payment Reminder</b>\n\n💰 <b>Amount:</b> ${sub.amount} ${sub.currency || "USD"}\n📅 <b>Due in:</b> ${diffDays} days (${sub.nextDueDate})\n\n<i>Via MMV Hub</i>`;

              const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
              await fetch(telegramUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: telegramChatId,
                  text: itemText,
                  parse_mode: "HTML",
                }),
              });
              console.log(`Sent telegram reminder for sub ${sub.name} to chat ${telegramChatId}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Cron Job Error:", error);
    }
  });
}
