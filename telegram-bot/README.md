# MMV Subs Telegram Bot

The bot is a separate long-running service for the MMV Subs app. Deploy the `telegram-bot` folder as a Render Background Worker.

## What it does

- Shows live dashboard information through inline keyboard buttons: Today, Payments, Habits, Subscriptions, Bills, One-time purchases, Goals, and Calendar.
- Sends each Telegram payment reminder once. It supports one-time purchases, subscriptions, and recurring bills. The app moves a recurring item's due date forward when it is marked paid, creating the next notification cycle.
- Honors each payment reminder's `before`, `on_date`, or `after` timing; minutes, hours, days, and weeks; exact time; and Telegram/Both delivery channel.
- Uses the app-level reminder days as a fallback when an item has no Telegram reminder.
- Sends one overdue payment alert on the day after its due date when past-due alerts are enabled.
- Sends habit reminders only on scheduled days, respects incomplete-only reminders, and lets the user mark a habit done from Telegram.
- Sends goal deadline reminders 7 days before, 1 day before, and on the deadline.

## Link the bot

1. Start the bot and copy the Chat ID shown by `/start`.
2. In MMV Subs, open Settings → Telegram Notifications.
3. Paste the Chat ID, enable alerts, and save. The app syncs items, habits, habit logs, and goals to Firestore.

The bot token belongs only in the background worker's `TELEGRAM_BOT_TOKEN` variable. Do not place it in browser code, Firebase client data, or Git.

## Render

- Root directory: `telegram-bot`
- Build command: `npm ci`
- Start command: `npm start`
- Environment variables: `TELEGRAM_BOT_TOKEN`, `FIREBASE_SERVICE_ACCOUNT`, and optional `TIME_ZONE=Asia/Tashkent`

Run one worker instance only. Long polling and reminder delivery should have one active owner.
