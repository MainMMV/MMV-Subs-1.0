# Android Google sign-in setup

The Android source includes native Google sign-in. The installable APK needs a stable signing certificate registered with Firebase before Google will accept it.

## Signing key prepared

The new release key and password are in `.local-secrets/` in this workspace. They are ignored by Git. Back up **both** files securely; GitHub cannot return a secret after it is uploaded, and a replacement key will not update apps signed with this key.

- Keystore: `.local-secrets/mmv-hub-release.jks`
- Password: `.local-secrets/keystore-password.txt`
- Prepared GitHub secret value: `.local-secrets/keystore-base64.txt`
- Alias: `mmvhub`
- SHA-1: `85:00:B3:A8:4F:58:DC:2C:CF:5F:9E:32:F2:DF:8B:EF:97:66:0A:91`
- SHA-256: `DF:B0:18:B8:46:E8:88:4A:3C:F2:10:63:D4:64:40:32:11:89:AE:82:E6:93:ED:9B:B5:1A:26:E1:B4:6F:86:9E`

## Firebase configuration

1. Open Firebase Console → project `micro-pilot-465509-m3` → Project settings → General → Your apps → Android app `com.mainmmv.subs`.
2. Select **Add fingerprint** and add the SHA-1 above. Add the SHA-256 as a second fingerprint.
3. Download the refreshed `google-services.json` for the Android app and replace `android/app/google-services.json` in this repository. It should contain an Android OAuth client entry (`client_type: 1`) for this fingerprint.
4. Confirm Authentication → Sign-in method → Google is enabled.

The fingerprint is public. **Never** upload the keystore or password to Firebase or commit them to Git.

## Repeatable signed builds

The GitHub Android workflow builds a debug artifact on source updates. It builds and publishes the signed release APK only when these Actions repository secrets exist:

- `ANDROID_KEYSTORE_BASE64`: the single line in `.local-secrets/keystore-base64.txt`.
- `ANDROID_KEYSTORE_PASSWORD`: the value in `.local-secrets/keystore-password.txt`.

In GitHub, open Repository → Settings → Secrets and variables → Actions → New repository secret. The connected GitHub integration currently returns HTTP 403 for Actions secrets, so these must be added by an account with repository admin access or after that permission is granted to the integration. Do not paste either value into chat.

After both secrets and the refreshed Firebase file are in place, run the **Android APK** workflow on `main` with **Publish release** enabled. The signed `MMV-Hub-v1.7.0.apk` will be attached to the release. Install it and complete a real Google sign-in on the device to verify the configuration. Ordinary pushes only build artifacts and never replace the published APK.

**Existing APK data:** v1.6.0 was published from `assembleDebug` with a runner-generated debug key. Android will usually reject an in-place update signed by the new permanent key. Do not uninstall the old APK until any important local data has been backed up or a migration path has been confirmed. Uninstalling may erase its payment, habit, and goal records.
