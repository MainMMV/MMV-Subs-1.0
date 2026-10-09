# MMV Hub

MMV Hub is a responsive personal dashboard for subscriptions, recurring bills, one-time purchases, habits, goals, and payment reminders. It runs as a web app and as an installable Android app.

- Live web app: [mmv-subs-1-0.vercel.app](https://mmv-subs-1-0.vercel.app)
- Android download: [MMV Hub v1.7.0 APK](https://github.com/MainMMV/MMV-Subs-1.0/releases/download/v1.7.0/MMV-Hub-v1.7.0.apk) ([release notes](https://github.com/MainMMV/MMV-Subs-1.0/releases/tag/v1.7.0))

## Features

- Track subscriptions, recurring bills, and one-time purchases in USD or UZS.
- Add a five-step smart reminder plan (5 days, 1 day, and 1 hour before; 1 and 3 days after if unpaid) and edit every reminder individually.
- Review payment history, upcoming commitments, and monthly or yearly totals in the Reports module.
- Receive in-app and Android local notifications, including while the app is closed. Payment and habit reminders use distinct Android sounds.
- Add reminders directly to a calendar on Android after granting calendar access.
- Connect Google Calendar from the web or export standards-compliant `.ics` calendar files.
- Register with Google in Settings → Account to synchronize payments, payment history, habits, and goals through Firebase. When device and cloud data differ, choose which to keep before cloud writes resume.
- On the web, use full-page Google sign-in when a browser blocks pop-ups. A blocked sign-in attempt switches to the full-page flow automatically.
- Track habits, completion history, goals, budgets, payment history, and cash-flow forecasts.
- Choose from five themes (Dark, Light, Graphite, Mint, and Rose) with responsive layouts for phones, tablets, and desktops.
- Choose Google Sans, Inter, Poppins, Manrope, Space Grotesk, JetBrains Mono, or the system font in Settings. Also adjust text size, corner radius, spacing, and motion; view modes and filters can be remembered on each device.
- Hear distinct in-app action and reminder sounds, with separate sound switches in Settings.
- Register a local profile, save feedback and improvement notes locally, and track coffee-support records for the future supporter module.
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

The debug APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`. GitHub Actions builds a debug artifact after source updates. Automated signed releases need the two signing secrets described in [Android Google sign-in setup](docs/ANDROID_GOOGLE_SIGN_IN.md); a signed APK can also be built locally and attached to a GitHub Release. The release key is kept outside Git.

After installing the APK, grant notification and calendar permissions when requested. To sync events to Google Calendar without a file download, select a Google-backed calendar already configured on the Android device.

### Firebase and web Google Calendar

The web app reads its public Firebase client configuration from `firebase-applet-config.json`.

The Firebase project must have:

- Cloud Firestore API enabled and the configured Firestore database created.
- Anonymous Authentication enabled for background app-data synchronization.
- Google Authentication enabled for account registration and web Google Calendar connection.
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

The current Render Free service may sleep when no requests arrive. When it wakes, the bot catches up Telegram reminders from the previous 24 hours; continuous delivery requires an always-on plan.

For Telegram Login on the web, open `@BotFather`, run `/setdomain`, select the MMV Hub bot, and set the domain to `mmv-subs-1-0.vercel.app`. The app verifies every Telegram Login signature on the Render worker before accepting the Telegram user ID. The Android APK opens the registered bot directly because Telegram's web Login Widget is domain-based.

## Change history

<!-- Add every new published update above older entries. Use: HH:mm DD.MM.YYYY GMT+5 (Tashkent). Keep each release inside a details block. -->
Each published update is recorded newest first using `HH:mm DD.MM.YYYY GMT+5 (Tashkent)`.

<details open>
<summary><strong>13:18 09.10.2026 GMT+5 (Tashkent) — Google sign-in redirect</strong></summary>

- Added a full-page Google sign-in option and automatic redirect when a browser blocks the account or Calendar popup.
- Restored the account or Calendar connection after the browser returns, including errors and the Calendar access token.
- Added Uzbek, Russian, and English button labels and checked the web build.

Modified areas: Google authentication services, Settings, Calendar connection, translations, and README.

</details>

<details>
<summary><strong>12:47 09.10.2026 GMT+5 (Tashkent) — Signed Android APK published</strong></summary>

- Published the verified, signed MMV Hub 1.7.0 APK to GitHub Releases with installation notes.
- Added its direct download link and updated setup status. Android Google sign-in still needs a real-device check; automated signed builds still need GitHub Actions signing secrets.

Modified areas: GitHub Release, APK publication workflow, and README.

</details>

<details>
<summary><strong>12:18 09.10.2026 GMT+5 (Tashkent) — Render Telegram reminder reliability</strong></summary>

- Confirmed the existing Render Free bot is live, registered with Telegram, and serving its health and login endpoints.
- Added a 24-hour reminder catch-up window for payments, habits, and goals after the free service wakes, with existing delivery records preventing repeats.
- Set the Render configuration time zone to Asia/Tashkent and documented that Free cannot guarantee continuous delivery.

Modified areas: Telegram bot schedule and tests, Render Blueprint, bot setup guide, and README.

</details>

<details>
<summary><strong>11:25 09.10.2026 GMT+5 (Tashkent) — Android Google registration configuration</strong></summary>

- Registered the stable APK signing key's SHA-1 and SHA-256 in Firebase and refreshed the Android `google-services.json` with its OAuth client.
- Confirmed Google and Anonymous Authentication, the web authorized domain, Firestore database, and owner-only rules.
- Built and verified the signed Android 1.7.0 APK locally. A real device sign-in check is still needed.
- Automated GitHub signing still requires repository Actions secrets.

Modified areas: Android Firebase configuration, setup guide, and README.

</details>

<details>
<summary><strong>10:47 09.10.2026 GMT+5 (Tashkent) — Android Google sign-in release preparation</strong></summary>

- Prepared a stable Android release keystore outside Git and recorded its public Firebase signing fingerprints.
- Configured Gradle and GitHub Actions to sign Android releases when signing secrets are present; publication requires a deliberate manual workflow run, while debug builds remain CI artifacts.
- Advanced Android source to version 1.7.0 and documented Firebase fingerprint, refreshed configuration, secret setup, and existing APK data migration.
- Signed APK publication is pending Firebase certificate registration and GitHub Actions secret access.

Modified areas: Android signing configuration, APK workflow, version metadata, signing setup guide, Git ignore rules, and README.

</details>

<details>
<summary><strong>10:19 09.10.2026 GMT+5 (Tashkent) — Google registration and account data</strong></summary>

- Added Google account registration in Settings, linking an existing anonymous Firebase account when possible.
- Added cloud restore and a choice when this device and an existing Google account contain different records.
- Included payment history and core finance preferences in account sync. Calendar access now uses the same account and disconnecting Calendar keeps the account signed in.
- Wired native Android Google sign-in through Capacitor; Android certificate registration remains required before sign-in can be verified in an APK.
- Updated the web app only; no APK was generated.

Modified areas: Firebase account and cloud services, Settings, Calendar connection, Android plugin configuration, translations, dependencies, and README.

</details>

<details>
<summary><strong>19:20 08.10.2026 GMT+5 (Tashkent) — Expanded typography choices</strong></summary>

- Added Inter, Poppins, Manrope, Space Grotesk, and JetBrains Mono beside Google Sans and the system font.
- Bundled the new fonts locally in regular and medium weights, with Latin and Cyrillic support where available.
- Added a live type sample in Settings. The choice persists per device across web and Android source.
- Published the web app only; no Android APK was built.

Modified areas: Settings, font preference storage, shared styles, bundled fonts, dependency metadata, and README.

</details>

<details>
<summary><strong>14:15 08.10.2026 GMT+5 (Tashkent) — Compact settings and goals, web update</strong></summary>

- Reorganized Settings into compact Appearance, Views, Finance, Connections, Account, and Data sections on web and Android.
- Added saved typography, text size, corner radius, spacing, motion, view, filter, and goal sorting choices on each device.
- Removed the cursor ambient effect and the More page and its retired module code; Android now opens all core pages from its top navigation menu.
- Reworked Goals with active/completed/due counts, sorting, compact progress and remaining amounts, and a delete confirmation.
- Neutralized colored borders while keeping status colors in text and fills.
- Published the web app only; the Android APK remains v1.6.0.

Modified areas: Settings, Goals, finance views, navigation, UI preference storage, translations, shared styles, web-only build guard, dependency metadata, and README.

</details>

<details>
<summary><strong>12:45 08.10.2026 GMT+5 (Tashkent) — Five themes and improved reminder sounds</strong></summary>

- Added Graphite, Mint, and Rose themes alongside Dark and Light.
- Added separate Settings switches for action sounds and in-app notification sounds.
- Added distinct Android tones for payment and habit reminders and fixed multi-note audio playback.
- Refreshed the notification badge and drawer as time passes, and made each configured reminder stage eligible for its own in-app alert.
- Advanced the web and Android app versions to 1.6.0 for the regenerated APK.

Modified areas: `src/App.tsx`, `src/index.css`, `src/types.ts`, `src/views/SettingsView.tsx`, `src/components/NotificationsDrawer.tsx`, `src/services/soundService.ts`, `src/services/deviceReminders.ts`, `src/services/notificationService.ts`, reminder tests, Android sound assets and version metadata, and README.

</details>

<details>
<summary><strong>22:37 07.10.2026 GMT+5 (Tashkent) — Settings registration, coffee support, and web polish</strong></summary>

- Added a web-only cursor-following beam effect that respects pointer type and reduced-motion preferences.
- Moved the native device setup panel from Today into Settings, with a fade/collapse behavior after reminder access is granted.
- Added local registration in Settings for name, email, and Telegram username so future sync flows can identify locally created records.
- Added an animated Buy Me a Coffee prompt, copyable support card, supporter record form, and Coffee module preview for future gamified top supporters.
- Added a Feedback and Improvements section that stores bug notes, ideas, and contact details locally until backend feedback sync is connected.

Modified areas: app shell, cursor effect styling, native setup panel, Settings registration/support/feedback sections, and README.

</details>

<details>
<summary><strong>22:15 06.10.2026 GMT+5 (Tashkent) — Reminder-first mobile workflow and reports</strong></summary>

- Rebuilt payment creation as a compact, type-specific flow and removed the duplicate category selector.
- Added an editable five-step smart reminder plan with in-app and Telegram delivery controls and unpaid-only follow-ups.
- Added reminder occurrences to calendar days, plus compact daily, weekly, monthly, and yearly view selection.
- Standardized payment and reminder date/time entry and display as `DD.MM.YYYY` and `HH:MM`.
- Replaced the large item status/footer action areas with a compact three-dot action menu.
- Added a Reports module with overview, payment history, upcoming, monthly, and yearly sections selected from its three-dot menu.
- Connected dashboard spending, upcoming, recent-payment, and calendar labels to their relevant destinations; removed the duplicate selected-day dashboard panel.
- Replaced Habits with Subscriptions in the Android bottom navigation while keeping Habits available in More.
- Added automated coverage for payment reminders before and after due dates and suppression after payment.

Modified areas: item creation and detail dialogs, reminder scheduling, calendar, dashboard, reports, shared date formatting, web/mobile navigation, Android assets, tests, and package metadata.

</details>

<details>
<summary><strong>08:24 06.10.2026 GMT+5 (Tashkent) — Unified MMV interface system</strong></summary>

- Introduced one shared surface, border, radius, spacing, accent, and shadow system across dashboard, finance, goals, habits, calendar, settings, More, and MMV Classics.
- Standardized module counters and launcher colors on the MMV green accent while retaining status colors only for meaningful warnings, overdue items, and completion states.
- Equalized payment, habit, and goal card heights so responsive grids remain aligned on phone, tablet, and desktop layouts.
- Normalized page spacing and narrow-screen containment to prevent inconsistent blocks and horizontal overflow.
- Preserved the current MMV Hub identity; earlier repositories were used only as feature references, not as design sources.

Modified areas: shared theme primitives, primary views, navigation counters, module launcher registry, finance cards, habit cards, goal cards, and MMV Classics surfaces.

</details>

<details>
<summary><strong>08:06 06.10.2026 GMT+5 (Tashkent) — Android habit reminder repair</strong></summary>

- Connected saved habit reminder settings to Android local-notification scheduling.
- Added support for habit schedules, reminder weekdays and times, paused habits, and incomplete-only reminders.
- Reschedules when habits or completion logs change, suppressing incomplete-only alerts after completion.
- Added automated coverage for active, completed, and paused habit reminder behavior.

Modified areas: habit reminder planning, Android device notification synchronization, app synchronization effects, tests, and package metadata.

</details>

<details>
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

The app uses anonymous Firebase registration until a user connects Google in Settings → Account. The Google action keeps the anonymous account ID when linking a new Google identity. An existing Google account restores cloud records on an empty device; when both locations contain different records, the user chooses which copy to keep. Email/password account UI is not implemented.

Still requiring external account configuration:

1. In `@BotFather`, set the Telegram Login domain to `mmv-subs-1-0.vercel.app` with `/setdomain`.
2. Publish the Google OAuth consent screen if users outside the project owner's test-user list need Google Calendar access.
3. Back up the permanent Android release keystore, add the two [GitHub Actions signing secrets](docs/ANDROID_GOOGLE_SIGN_IN.md) for repeatable signed builds, and verify native Google sign-in on a real device. The signing fingerprints and refreshed Android Firebase configuration are already registered.
4. Upgrade Firebase to a billing-enabled plan before enabling point-in-time Firestore recovery, paid backup features, or reCAPTCHA Enterprise. Billing is currently disabled.
5. Integrate App Check in both web and APK clients and verify metrics before enforcement; enforcing it now would block the current clients.

## Deployment status

- Vercel production: deployed from `main`
- Render Telegram service: live at [mmv-subs-telegram-bot.onrender.com/health](https://mmv-subs-telegram-bot.onrender.com/health) on the Free plan; reminders catch up for 24 hours after a service wake
- Android CI: TypeScript, reminder tests, Capacitor sync, native Gradle build, and APK artifact upload are enabled

See [MOBILE.md](MOBILE.md) for Android behavior and [telegram-bot/README.md](telegram-bot/README.md) for bot details.
