# MMV Hub — Telegram Integration & Bot Guide

This guide explains how to connect, configure, and operate the **MMV Hub Telegram Bot** with your application database, notifications, and scheduled reminders.

---

## 1. Architecture Overview

```
 ┌──────────────────────┐          ┌─────────────────────────┐          ┌───────────────────────┐
 │   MMV Hub Web App   │          │   Firestore Database    │          │  Telegram Bot Worker  │
 │   (React + Vite)     │ ───────> │  users/{uid}/sync/data  │ <─────── │ (Render / Node.js 22) │
 └──────────────────────┘          └─────────────────────────┘          └───────────┬───────────┘
                                                                                    │
                                                                                    ▼
                                                                        ┌───────────────────────┐
                                                                        │  Telegram Bot API     │
                                                                        │   (@MMVSubsBot)       │
                                                                        └───────────────────────┘
```

1. **Web App Synchronization**: Whenever you add, edit, or mark items/habits/goals in the web app, your data automatically syncs to the persistent cloud database (`users/{uid}/sync/data`).
2. **Bot Token Isolation**: The Telegram Bot Token is stored solely in the secure server environment (`TELEGRAM_BOT_TOKEN`). It is **never** exposed to browser storage or client bundles.
3. **Dedicated Background Worker**: The `telegram-bot` service runs continuously (e.g., on Render), listening for commands via Telegram Long Polling and evaluating scheduled notifications every minute.

---

## 2. Linking Your Account (Registration)

Follow these simple steps to link your Telegram account to your MMV Hub dashboard:

1. **Start the Bot in Telegram**:
   - Open Telegram and search for your bot (or open `https://t.me/YourBotName`).
   - Send the `/start` command.
   - The bot replies with a welcome message containing your **Chat ID** (e.g., `123456789`).

2. **Connect in Web App Settings**:
   - In MMV Hub, open **Settings → Integrations Hub** (or **Telegram Notifications**).
   - Enter your **Telegram Chat ID**.
   - Ensure the **Enable Telegram Notifications** toggle is checked.
   - Click **Save Telegram Settings**.

3. **Verify the Connection**:
   - Click **Test Telegram Notification** in Settings.
   - The bot will immediately send a verification message confirming that the link is active.

---

## 3. Bot Commands & Dashboard Control

The bot provides full read-only visibility into your finances and habits, with live refresh capabilities:

| Command | Description |
| :--- | :--- |
| `/start` or `/home` | Opens the main home dashboard showing today's due payments, upcoming 7-day outlook, open habits, and active goals. |
| `/today` | Quick overview of payments due today and scheduled habits. |
| `/payments` | Lists all upcoming payments sorted by nearest due date. |
| `/subscriptions` or `/subs` | Displays recurring software and digital subscriptions. |
| `/bills` | Displays household, utility, rent, and recurring bills. |
| `/purchases` or `/onetime` | Displays pending one-time hardware, course, or equipment purchases. |
| `/habits` | Shows habits scheduled for today. Includes inline buttons to mark them done directly from Telegram. |
| `/goals` | Lists active savings targets and budget limits with current progress percentages. |
| `/calendar` | Shows a 14-day chronological schedule of all scheduled charges. |
| `/refresh` or `/status` | Refreshes and returns the latest live data from the database. |
| `/help` | Detailed instructions on how the bot operates and notification rules. |

---

## 4. Automated Reminders & Scheduling

The bot checks for reminders every **30 seconds** based on your configured local time zone (default: `Asia/Tashkent` / `Asia/Samarkand`, UTC+5):

### A. Subscriptions & Bills
- **Individual Reminders**: When an item has custom reminders set to `channel: "telegram"` or `"both"`, the bot triggers at the precise minute specified (e.g., 3 days before at 09:00, on date at 12:00, or 2 hours after).
- **Global Fallback**: If an item does not have custom reminders, the bot uses the global fallback days (e.g., 3 days, 1 day, and day-of at 09:00).
- **Overdue Alert**: If an item is past due and unpaid, a high-priority alert is sent once on the day after the due date.
- **Cycle Reset**: When a recurring bill is marked paid in the web app or via API, its due date is automatically bumped forward by its frequency (e.g., +1 month), initializing the next notification cycle.

### B. Habits
- Only triggers on scheduled days (e.g., daily, weekdays only, or custom intervals).
- Respects the `incompleteOnly` flag—if you already marked the habit done earlier in the day, the reminder is quietly skipped.
- Includes an inline **"Mark Done"** button to log completion directly from chat.

### C. Financial Goals
- Alerts at **7 days before**, **1 day before**, and **on the deadline date** at 09:00.

---

## 5. Render 24/7 Deployment

The repository includes a ready-to-deploy `render.yaml` blueprint for a free Render Web Service.

### Deployment Steps:
1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Web Service** pointing to the `telegram-bot` directory:
   - **Environment**: Node
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
3. Configure the following **Environment Variables**:
   - `TELEGRAM_BOT_TOKEN`: The API token from `@BotFather`.
   - `FIREBASE_SERVICE_ACCOUNT`: Single-line JSON string of your Firebase service account key.
   - `FIRESTORE_DATABASE_ID`: `ai-studio-mmvsubs-7f61226f-682f-4402-823f-82cb55675031` (or your database ID).
   - `TIME_ZONE`: `Asia/Tashkent` (or your desired IANA timezone).

*Important: Run only **one** instance of the bot service at any time to prevent duplicate Telegram update processing.*
