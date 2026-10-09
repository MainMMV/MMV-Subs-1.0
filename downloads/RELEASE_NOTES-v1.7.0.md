MMV Hub 1.7.0 is a signed Android APK with native Google registration and Firebase synchronization. The signing certificate SHA-1 and SHA-256 are registered in Firebase, and the APK signature was verified after the build. Google, Anonymous Authentication, the web authorized domain, Firestore database, and owner-only rules were checked.

**Install:** This APK uses a new stable signing key. The earlier 1.6.0 APK used a temporary debug key, so Android may require you to uninstall 1.6.0 first. Uninstalling erases its local records.

Google sign-in still needs a real-device check. If it fails, report the exact message and device Android version. Automated signed GitHub builds are pending Actions signing secrets.
