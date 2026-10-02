# MMV Hub for Android

The Android app uses Capacitor. It stores the same data locally as the web app. A fresh Android install starts with empty data; it does not import browser data automatically.

## Build an installable APK

GitHub Actions builds a signed debug APK on each push. Open the `Android APK` workflow run, download the `mmv-hub-installable-apk` artifact, extract `app-debug.apk`, and install it on Android. Debug APKs are for personal installation and testing; a public Play Store release needs a separately managed release signing key.

For local development with an Android SDK and JDK 21:

```sh
npm ci
npm run android:sync
cd android
./gradlew assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

## Calendar and reminders

In Calendar or Settings, open Calendar reminders. On Android, grant calendar access, choose the Google calendar associated with the device account, and add selected payments. This writes events directly to the device calendar provider with one-day and two-hour alerts. The Google account and calendar app on the device handle cloud synchronization.

In Settings, enable Device reminders. The app schedules the configured in-app reminders as Android notifications, including while the app is closed. Android may deliver them later when battery restrictions or exact alarm settings prevent precise delivery. Opening the app after editing payments refreshes the schedule.

On the web, Google Calendar uses Firebase Google sign-in and the Calendar Events scope. The Firebase project must have Google Authentication enabled and the deployed domain authorized. Web calendar sync prompts for Google authorization; it does not share the Android calendar permission.
