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
- Switch the interface between Uzbek, Russian, and English; the choice persists on web and Android.
- Use Asia/Tashkent time (GMT+5) consistently for payment dates, reminders, calendar events, and published change times.
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

For Telegram Login on the web, open `@BotFather`, run `/setdomain`, select the MMV Hub bot, and set the domain to `mmv-subs-1-0.vercel.app`. The app verifies every Telegram Login signature on the Render worker before accepting the Telegram user ID. The Android APK opens the registered bot directly because Telegram's web Login Widget is domain-based.

## Change history

<!-- Add every new published update above older entries. Use: HH:mm DD.MM.YYYY GMT+5 (Tashkent). Keep each release inside a details block. -->
Each published update is recorded newest first using `HH:mm DD.MM.YYYY GMT+5 (Tashkent)`.

<details open>
<summary><strong>20:43 05.10.2026 GMT+5 (Tashkent) — Android Firebase and backend hardening</strong></summary>

- Registered the native Android application `com.mainmmv.subs` in Firebase and added its generated Google services configuration to APK builds.
- Enabled IAM, IAM Credentials, Monitoring, Logging, App Check, and API Keys management APIs.
- Created the dedicated `mmv-hub-telegram` backend service account with only the Firestore Datastore User role; no owner/admin role or downloadable credential was created.
- Audited API-key restrictions and retained Capacitor compatibility until native authentication and permanent release signing are complete.
- Updated the Android pipeline to publish every successful `main` build to the matching versioned GitHub Release.

Modified areas: `android/app/google-services.json`, `.github/workflows/android-apk.yml`, package metadata, Google Cloud service configuration, IAM, and `README.md`.

</details>

<details>
<summary><strong>20:18 05.10.2026 GMT+5 (Tashkent) — Firebase registration and secure storage</strong></summary>

- Enabled the Cloud Firestore, Identity Toolkit, and Google Calendar APIs for `micro-pilot-465509-m3`.
- Created named Firestore database `ai-studio-mmvsubs-7f61226f-682f-4402-823f-82cb55675031` in multi-region `eur3` with deletion protection.
- Enabled automatic anonymous registration and password-based account registration; confirmed the existing Google provider is enabled.
- Authorized `mmv-subs-1-0.vercel.app` for Firebase Authentication.
- Deployed owner-only Firestore rules and verified that one user can read/write its own sync record while another authenticated user receives HTTP 403.
- Added reproducible Firebase project and named-database deployment configuration.

Modified areas: `.firebaserc`, `firebase.json`, Firebase Authentication configuration, Firestore database and rules, and Google Cloud service configuration.

</details>

<details>
<summary><strong>12:40 05.10.2026 GMT+5 (Tashkent) — MMV Classics and responsive creation flow</strong></summary>

- Added native MMV Classics modules rebuilt from earlier MainMMV projects: Tasks, Notes, Bookmarks, Focus, Reflection, Salary Plan, Debt Calculator, QR Generator, JSON Editor, Clock, and Trade Calculator.
- Added a collapsible More navigation group on the web and retained the bottom-right More launcher in the Android app, both backed by one shared module registry.
- Removed the outlined More container so the launcher follows the selected theme, and kept every launcher icon as SVG.
- Reworked the mobile creation form with compact category labels, collision-free Icon and Reminder controls, concise currency and frequency fields, safer scrolling, and a smaller dismissible modal.
- Applied Tashkent time to device-calendar events and native/in-app reminder scheduling without displaying a GMT label in the interface.
- Added QR generation support and synchronized the updated web application into the Android project.

Modified areas: mobile and web navigation, MMV Classics views and registry, item creation modal, translations, timezone/reminder services, Android metadata, and package dependencies.

</details>

<details>
<summary><strong>10:22 03.10.2026 GMT+5 (Tashkent) — Tashkent time standardization</strong></summary>

- Standardized date-only app logic, payment status, paid dates, habit dates, forecasts, exports, and calendar event time zones on `Asia/Tashkent`.
- Kept stored ISO timestamps as absolute instants while displaying synchronized times in Tashkent time.
- Corrected every existing change-history timestamp from UTC to the equivalent Tashkent publication time.

Modified areas: `src/utils/timezone.ts`, date and calendar utilities, payment and habit flows, Settings, dashboard and calendar views, and `README.md`.

</details>

<details>
<summary><strong>10:00 03.10.2026 GMT+5 (Tashkent) — Uzbek, Russian, and English interface</strong></summary>

- Added a persistent language selector for Uzbek, Russian, and English in Settings.
- Localized core navigation, dashboard summaries, payment views, settings, Telegram controls, reminders, item creation, alerts, and the native Android shell.
- Added locale-aware month names and updated the document language for accessibility.
- Verified Uzbek and Russian layouts at a 320 px mobile viewport without horizontal overflow.

Modified areas: `src/i18n.tsx`, `src/main.tsx`, navigation, dashboard and payment views, Settings, item controls, notifications, Telegram connection, and native mobile components.

</details>

<details>
<summary><strong>09:27 03.10.2026 GMT+5 (Tashkent) — Native mobile UX and Telegram Login</strong></summary>

- Added a native Android top bar, bottom navigation, centered quick-add action, all-sections drawer, and device safe-area handling.
- Added an APK-only quick setup panel for notification permission, reminder scheduling, today's due count, and direct device-calendar access.
- Added web Telegram Login with server-side signature and expiry verification.
- Added direct bot launch from the Android APK and retained manual Chat ID entry as a fallback.
- Added `/bot-info`, Telegram registration status in `/health`, restricted CORS, and `/auth/telegram` to the Render worker.
- Changed the README history into collapsible timestamped entries and added the rule for future updates.

Modified areas: `src/App.tsx`, `src/components/Navigation/`, `src/components/NativeQuickSetup.tsx`, `src/components/TelegramConnectButton.tsx`, `src/views/SettingsView.tsx`, `src/index.css`, `telegram-bot/src/`, and `README.md`.

</details>

<details>
<summary><strong>23:05 02.10.2026 GMT+5 (Tashkent) — MMV Hub launch, reminders, and Android build</strong></summary>

- `src/views/SettingsView.tsx`, `src/views/CalendarView.tsx`, navigation, and shared styles: fixed narrow-screen text collisions, wrapping, scrolling, spacing, colors, and responsive controls.
- `public/`, `assets/`, `src/components/MMVLogo.tsx`, `index.html`, and `vite.config.ts`: replaced the old branding, favicon, PWA icons, metadata, and duplicate PWA files.
- `src/services/deviceReminders.ts` and notification components: added native Android reminder permissions and scheduling.
- `src/services/deviceCalendar.ts`, `src/services/googleCalendar.ts`, and `src/utils/phoneCalendar.ts`: added direct Android calendar access, duplicate-safe Google Calendar updates, and corrected `.ics` event duration and IDs.
- `src/firebase.ts` and `telegram-bot/`: improved Firebase synchronization, Telegram test requests, deduplication, health checks, and deployment reliability.
- `android/`, `capacitor.config.ts`, and `.github/workflows/android-apk.yml`: added the Capacitor Android project, app permissions, launcher assets, and automated APK builds.
- `src/data/initialData.ts`, `src/data/defaultHabits.ts`, and obsolete install placeholders: removed temporary seeded content so new installs start clean.

</details>

## Backend configuration status

Firebase registration and storage are configured for project `micro-pilot-465509-m3`:

- Firestore and Identity Toolkit APIs are enabled.
- Named Firestore database `ai-studio-mmvsubs-7f61226f-682f-4402-823f-82cb55675031` is active in `eur3` with deletion protection.
- Anonymous and password registration are enabled; the Google provider is enabled.
- `mmv-subs-1-0.vercel.app` is an authorized authentication domain.
- Owner-only Firestore rules are deployed and isolation-tested.
- Native Android app `com.mainmmv.subs` is registered and its Firebase build configuration is present.
- The Telegram worker has a dedicated least-privilege service account with the Firestore Datastore User role.
- Monitoring, Logging, App Check, and API Keys management APIs are enabled.

The current app automatically uses anonymous registration. A visible email/password account screen is not implemented yet, although the backend provider is ready.

Still requiring external account configuration:

1. In `@BotFather`, set the Telegram Login domain to `mmv-subs-1-0.vercel.app` with `/setdomain`.
2. Connect Render access, create a credential for the dedicated `mmv-hub-telegram` service account, store it only as `FIREBASE_SERVICE_ACCOUNT`, confirm the other required variables, and redeploy. No service-account key is stored in this repository.
3. Publish the Google OAuth consent screen if users outside the project owner's test-user list need Google Calendar access.
4. Create and securely retain a permanent Android release keystore, then register its SHA-1 and SHA-256 fingerprints for native Google sign-in and key restrictions.
5. Upgrade Firebase to a billing-enabled plan before enabling point-in-time Firestore recovery, paid backup features, or reCAPTCHA Enterprise. Billing is currently disabled.
6. Integrate App Check in both web and APK clients and verify metrics before enforcement; enforcing it now would block the current clients.

## Deployment status

- Vercel production: deployed from `main`
- Render Telegram service: configured at [mmv-subs-telegram-bot.onrender.com/health](https://mmv-subs-telegram-bot.onrender.com/health); the latest health check timed out and requires a Render status/log check
- Android CI: TypeScript, reminder tests, Capacitor sync, native Gradle build, and APK artifact upload are enabled

See [MOBILE.md](MOBILE.md) for Android behavior and [telegram-bot/README.md](telegram-bot/README.md) for bot details.
