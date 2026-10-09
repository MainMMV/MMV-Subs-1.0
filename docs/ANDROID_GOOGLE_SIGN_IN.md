# Android Google sign-in setup

The Android source includes native Google sign-in. Its stable signing certificate was registered with Firebase on 09.10.2026, and the refreshed Android configuration is in `android/app/google-services.json`.

## Signing key prepared

The new release key and password are in `.local-secrets/` in this workspace. They are ignored by Git. Back up **both** files securely; GitHub cannot return a secret after it is uploaded, and a replacement key will not update apps signed with this key.

- Keystore: `.local-secrets/mmv-hub-release.jks`
- Password: `.local-secrets/keystore-password.txt`
- Prepared GitHub secret value: `.local-secrets/keystore-base64.txt`
- Alias: `mmvhub`
- SHA-1: `85:00:B3:A8:4F:58:DC:2C:CF:5F:9E:32:F2:DF:8B:EF:97:66:0A:91`
- SHA-256: `DF:B0:18:B8:46:E8:88:4A:3C:F2:10:63:D4:64:40:32:11:89:AE:82:E6:93:ED:9B:B5:1A:26:E1:B4:6F:86:9E`

## Firebase configuration

Completed for Firebase project `micro-pilot-465509-m3` and Android package `com.mainmmv.subs`:

- Both signing fingerprints above are registered on the Android app.
- `google-services.json` contains the Android OAuth client (`client_type: 1`) for the SHA-1 above.
- Google and Anonymous Authentication are enabled. `mmv-subs-1-0.vercel.app` is an authorized domain.
- The configured Firestore database exists and its deployed owner-only rules match `firestore.rules`.

If the signing key ever changes, register the new SHA-1 and SHA-256 in Firebase Project settings → Your apps → Android app, then download a new `google-services.json` before building.

The fingerprint is public. **Never** upload the keystore or password to Firebase or commit them to Git.

## Repeatable signed builds

The GitHub Android workflow builds a debug artifact on source updates. It builds a signed release APK when these Actions repository secrets exist, and publishes it only after a manual workflow run with **Publish release** enabled:

- `ANDROID_KEYSTORE_BASE64`: the single line in `.local-secrets/keystore-base64.txt`.
- `ANDROID_KEYSTORE_PASSWORD`: the value in `.local-secrets/keystore-password.txt`.

In GitHub, open Repository → Settings → Secrets and variables → Actions → New repository secret. The original connected GitHub integration returns HTTP 403 for Actions secrets, so these require an account with repository admin access or a separate GitHub CLI authorization. Do not paste either value into chat.

The refreshed Firebase file is already in the repository. After both secrets are in place, run the **Android APK** workflow on `main` with **Publish release** enabled for future versions. A locally built signed APK can also be attached to a release, but that does not configure automated signing for later builds. Complete a real Google sign-in on an Android device to verify the end-to-end flow. Ordinary pushes only build artifacts and never replace the published APK.

**Existing APK data:** v1.6.0 was published from `assembleDebug` with a runner-generated debug key. Android will usually reject an in-place update signed by the new permanent key. If you do not need its local data, uninstall v1.6.0 before installing the signed v1.7.0 APK. Otherwise, keep the old APK until its data is backed up; uninstalling erases local records.
