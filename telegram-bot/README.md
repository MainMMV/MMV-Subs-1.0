# MMV Hub Telegram Bot

The bot is a separate service for the MMV Hub app. The current Blueprint deploys the `telegram-bot` folder as a free Render Web Service with a lightweight `/health` endpoint.

## What it does

- Shows live dashboard information through inline keyboard buttons: Today, Payments, Habits, Subscriptions, Bills, One-time purchases, Goals, and Calendar.
- Sends each Telegram payment reminder once. It supports one-time purchases, subscriptions, and recurring bills. The app moves a recurring item's due date forward when it is marked paid, creating the next notification cycle.
- Honors each payment reminder's `before`, `on_date`, or `after` timing; minutes, hours, days, and weeks; exact time; and Telegram/Both delivery channel.
- Uses the app-level reminder days as a fallback when an item has no Telegram reminder.
- Sends one overdue payment alert on the day after its due date when past-due alerts are enabled.
- Sends habit reminders only on scheduled days, respects incomplete-only reminders, and lets the user mark a habit done from Telegram.
- Sends goal deadline reminders 7 days before, 1 day before, and on the deadline.
- On a free Render service, catches up Telegram reminders scheduled within the previous 24 hours when the service wakes. Delivery records prevent repeat sends; older missed reminders cannot be recovered by this window.

## Link the bot

On the web, open Settings → Telegram Notifications and use Telegram Login. The worker verifies Telegram's signed login payload before the app accepts the Telegram user ID.

For web login, open `@BotFather`, run `/setdomain`, select this bot, and set `mmv-subs-1-0.vercel.app`.

In the Android APK, tap the button that opens the bot, tap Start, and paste the Chat ID returned by the bot. Telegram's Login Widget is tied to a web domain, so the APK keeps this direct bot flow as a fallback.

After linking, enable alerts and save. The app syncs items, habits, habit logs, and goals to Firestore.

The bot token belongs only in the background worker's `TELEGRAM_BOT_TOKEN` variable. Do not place it in browser code, Firebase client data, or Git.

## Render

- Root directory: `telegram-bot`
- Build command: `npm ci`
- Start command: `npm start`
- Environment variables: `TELEGRAM_BOT_TOKEN`, `FIREBASE_SERVICE_ACCOUNT`, and optional `TIME_ZONE=Asia/Tashkent`
- Health check path: `/health`
- Time zone: `TIME_ZONE=Asia/Tashkent`

The worker also exposes `GET /bot-info` for the public bot username and `POST /auth/telegram` for signed Telegram Login verification. The bot token is never returned by either endpoint.

Run one instance only. Telegram long polling and reminder delivery must have one active owner. Render's free web service can sleep after inactivity, which pauses polling and scheduled reminders until a request wakes it. The catch-up window improves delivery after waking but cannot guarantee 24/7 reminders. An always-on paid instance is required for that guarantee.
