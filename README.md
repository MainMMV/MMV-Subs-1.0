# MMV Hub

MMV Hub is a responsive personal dashboard for subscriptions, recurring bills, one-time purchases, habits, goals, and payment reminders. It runs as a web app and as an installable Android app.

- Live web app: [mmv-subs-1-0.vercel.app](https://mmv-subs-1-0.vercel.app)
- Android downloads: [GitHub Releases](https://github.com/MainMMV/MMV-Subs-1.0/releases)

## Features

- Track subscriptions, recurring bills, and one-time purchases in USD or UZS.
- Configure custom reminder timing and delivery channels for each payment.
- Receive in-app and Android local notifications, including while the app is closed.
- Add reminders directly to a calendar on Android after granting calendar access.
- Connect Google Calendar from the web or export standards-compliant `.ics` calendar files.
- Track habits, completion history, goals, budgets, payment history, and cash-flow forecasts.
- Use light and dark themes with responsive layouts for phones, tablets, and desktops.
- Sync app data to Firebase for Telegram reminder delivery.
- Use Telegram commands for payments, habits, goals, and upcoming calendar items.
- Install the web app as a PWA or install the Android APK from GitHub Releases.

## Requirements and setup

### Web development

- Node.js 24 and npm
- A modern browser

```bash
npm ci
npm run dev
```

The local app is available at `http://localhost:3000` by default.

Useful checks:

```bash
npm run lint
npm test
npm run build
```

### Android

- JDK 21
- Android SDK 36 and Build Tools 36.0.0
- An Android device running Android 7.0 or newer

Build locally with:

```bash
npm ci
npm run android:sync
cd android
./gradlew assembleDebug
```

The APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`. GitHub Actions also builds an installable debug APK after pushes to `main` and `codex/**` branches. A Play Store release requires a separately managed release signing key.

After installing the APK, grant notification and calendar permissions when requested. To sync events to Google Calendar without a file download, select a Google-backed calendar already configured on the Android device.

### Firebase and web Google Calendar

The web app reads its public Firebase client configuration from `firebase-applet-config.json`.

The Firebase project must have:

- Cloud Firestore API enabled and the configured Firestore database created.
- Anonymous Authentication enabled for background app-data synchronization.
- Google Authentication enabled for web Google Calendar connection.
- `mmv-subs-1-0.vercel.app` added to Firebase Authentication authorized domains.
- Google Calendar API and the `calendar.events` OAuth scope enabled for the configured OAuth client.

### Telegram worker

The Telegram worker runs from `telegram-bot/` and requires these environment variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Yes | Token created with BotFather |
| `FIREBASE_SERVICE_ACCOUNT` | Yes | Firebase Admin service-account JSON |
| `FIRESTORE_DATABASE_ID` | Yes | Firestore database used by the web app |
| `TIME_ZONE` | No | Reminder timezone; defaults to Asia/Tashkent |

For Render, use `telegram-bot` as the root directory, `npm ci` as the build command, `npm start` as the start command, and `/health` as the health-check path. Run only one bot instance because Telegram long polling must have one active owner.

## Recent changes and modified files

The October 2026 update renamed the product to MMV Hub and changed these areas:

- `src/views/SettingsView.tsx`, `src/views/CalendarView.tsx`, navigation, and shared styles: fixed narrow-screen text collisions, wrapping, scrolling, spacing, colors, and responsive controls.
- `public/`, `assets/`, `src/components/MMVLogo.tsx`, `index.html`, and `vite.config.ts`: replaced the old branding, favicon, PWA icons, metadata, and duplicate PWA files.
- `src/services/deviceReminders.ts` and notification components: added native Android reminder permissions and scheduling.
- `src/services/deviceCalendar.ts`, `src/services/googleCalendar.ts`, and `src/utils/phoneCalendar.ts`: added direct Android calendar access, duplicate-safe Google Calendar updates, and corrected `.ics` event duration and IDs.
- `src/firebase.ts` and `telegram-bot/`: improved Firebase synchronization, Telegram test requests, deduplication, health checks, and deployment reliability.
- `android/`, `capacitor.config.ts`, and `.github/workflows/android-apk.yml`: added the Capacitor Android project, app permissions, launcher assets, and automated APK builds.
- `src/data/initialData.ts`, `src/data/defaultHabits.ts`, and obsolete install placeholders: removed temporary seeded content so new installs start clean.

## Still needs configuration

The code, Vercel production deployment, Android build, and Render worker are deployed. The following account-level Firebase settings are not stored in this repository and still need to be completed in project `micro-pilot-465509-m3`:

1. Enable the Cloud Firestore API and create/confirm database `ai-studio-mmvsubs-7f61226f-682f-4402-823f-82cb55675031`.
2. Enable Anonymous Authentication.
3. Enable Google Authentication and authorize `mmv-subs-1-0.vercel.app`.
4. Confirm the Google Calendar API and OAuth consent configuration.

Until the first two items are enabled, the Telegram bot can run and receive Telegram updates, but it cannot read synchronized MMV Hub data or deliver data-driven reminders. Android local reminders and direct device-calendar access work independently of Firebase.

## Deployment status

- Vercel production: deployed from `main`
- Render Telegram service: live at [mmv-subs-telegram-bot.onrender.com/health](https://mmv-subs-telegram-bot.onrender.com/health)
- Android CI: TypeScript, reminder tests, Capacitor sync, native Gradle build, and APK artifact upload are enabled

See [MOBILE.md](MOBILE.md) for Android behavior and [telegram-bot/README.md](telegram-bot/README.md) for bot details.
