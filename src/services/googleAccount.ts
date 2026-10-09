import { Capacitor } from "@capacitor/core";
import {
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  reauthenticateWithPopup,
  signInWithCredential,
  signInWithPopup,
  type User,
  type UserCredential,
} from "firebase/auth";
import { auth } from "../firebase";

export function isGoogleAccount(user: User | null): boolean {
  return Boolean(user && !user.isAnonymous && user.providerData.some((provider) => provider.providerId === "google.com"));
}

export async function connectGoogleAccount(provider = new GoogleAuthProvider(), requireFreshConsent = false): Promise<UserCredential | { user: User; credential: null }> {
  const current = auth.currentUser;
  if (isGoogleAccount(current) && !requireFreshConsent) return { user: current!, credential: null };

  if (Capacitor.isNativePlatform()) {
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    const nativeResult = await FirebaseAuthentication.signInWithGoogle();
    const idToken = nativeResult.credential?.idToken;
    if (!idToken) throw new Error("Google did not return an identity token. Check the Android signing certificate in Firebase.");
    const credential = GoogleAuthProvider.credential(idToken, nativeResult.credential?.accessToken);
    if (current?.isAnonymous) {
      try {
        return await linkWithCredential(current, credential);
      } catch (error: any) {
        if (error?.code !== "auth/credential-already-in-use" && error?.code !== "auth/email-already-in-use") throw error;
      }
    }
    return signInWithCredential(auth, credential);
  }

  if (current?.isAnonymous) {
    try {
      return await linkWithPopup(current, provider);
    } catch (error: any) {
      if (error?.code !== "auth/credential-already-in-use" && error?.code !== "auth/email-already-in-use") throw error;
    }
  }
  if (isGoogleAccount(current) && requireFreshConsent) return reauthenticateWithPopup(current!, provider);
  return signInWithPopup(auth, provider);
}

export function googleAccountError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return "Google sign-in was canceled.";
  if (code === "auth/popup-blocked") return "Allow pop-ups for MMV Hub, then try again.";
  if (code === "auth/unauthorized-domain") return "This website domain needs to be added to Firebase Authentication authorized domains.";
  if (code === "auth/operation-not-allowed") return "Enable the Google provider in Firebase Authentication.";
  if (code === "auth/account-exists-with-different-credential") return "This email already uses another sign-in method. Sign in with that method first.";
  return error instanceof Error ? error.message : "Google sign-in could not be completed.";
}
