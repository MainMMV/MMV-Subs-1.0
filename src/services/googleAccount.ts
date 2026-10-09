import { Capacitor } from "@capacitor/core";
import {
  GoogleAuthProvider,
  getRedirectResult,
  linkWithCredential,
  linkWithPopup,
  linkWithRedirect,
  reauthenticateWithPopup,
  reauthenticateWithRedirect,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  type User,
  type UserCredential,
} from "firebase/auth";
import { auth } from "../firebase";

export type GoogleRedirectPurpose = "account" | "calendar";
export type GoogleAccountResult = UserCredential | { user: User; credential: null };

const REDIRECT_PURPOSE_KEY = "mmv_hub_google_redirect_purpose";
let redirectCompletion: Promise<{ purpose: GoogleRedirectPurpose; result: UserCredential | null; error: unknown | null } | null> | null = null;

export function isGoogleAccount(user: User | null): boolean {
  return Boolean(user && !user.isAnonymous && user.providerData.some((provider) => provider.providerId === "google.com"));
}

export async function connectGoogleAccountWithIdToken(idToken: string): Promise<UserCredential> {
  const credential = GoogleAuthProvider.credential(idToken);
  const current = auth.currentUser;
  if (current?.isAnonymous) {
    try {
      return await linkWithCredential(current, credential);
    } catch (error: any) {
      if (error?.code !== "auth/credential-already-in-use" && error?.code !== "auth/email-already-in-use") throw error;
    }
  }
  return signInWithCredential(auth, credential);
}

async function startGoogleRedirect(provider: GoogleAuthProvider, current: User | null, requireFreshConsent: boolean, purpose: GoogleRedirectPurpose): Promise<void> {
  sessionStorage.setItem(REDIRECT_PURPOSE_KEY, purpose);
  try {
    if (current?.isAnonymous) await linkWithRedirect(current, provider);
    else if (isGoogleAccount(current) && requireFreshConsent) await reauthenticateWithRedirect(current!, provider);
    else await signInWithRedirect(auth, provider);
  } catch (error) {
    sessionStorage.removeItem(REDIRECT_PURPOSE_KEY);
    throw error;
  }
}

export async function connectGoogleAccount(
  provider = new GoogleAuthProvider(),
  requireFreshConsent = false,
  mode: "popup" | "redirect" = "popup",
  purpose: GoogleRedirectPurpose = "account",
): Promise<GoogleAccountResult | null> {
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

  if (mode === "redirect") {
    await startGoogleRedirect(provider, current, requireFreshConsent, purpose);
    return null;
  }

  try {
    if (current?.isAnonymous) {
      try {
        return await linkWithPopup(current, provider);
      } catch (error: any) {
        if (error?.code !== "auth/credential-already-in-use" && error?.code !== "auth/email-already-in-use") throw error;
        const credential = GoogleAuthProvider.credentialFromError(error);
        if (credential) return signInWithCredential(auth, credential);
      }
    }
    if (isGoogleAccount(current) && requireFreshConsent) return await reauthenticateWithPopup(current!, provider);
    return await signInWithPopup(auth, provider);
  } catch (error: any) {
    if (error?.code !== "auth/popup-blocked") throw error;
    await startGoogleRedirect(provider, auth.currentUser, requireFreshConsent, purpose);
    return null;
  }
}

export function completeGoogleAccountRedirect() {
  if (redirectCompletion) return redirectCompletion;
  const purpose = sessionStorage.getItem(REDIRECT_PURPOSE_KEY) as GoogleRedirectPurpose | null;
  if (purpose !== "account" && purpose !== "calendar") return Promise.resolve(null);
  redirectCompletion = (async () => {
    try {
      const result = await getRedirectResult(auth);
      // A redirect started by the older account flow can remain in sessionStorage
      // after the web app switches to the direct Google Identity button. Firebase
      // returns null for that abandoned redirect; it is not a failure of the new
      // button and should not be shown as one.
      if (!result && purpose === "account") return null;
      if (!result) throw new Error("Google Calendar connection did not finish. Please try again.");
      return { purpose, result, error: null };
    } catch (error: any) {
      if (error?.code === "auth/credential-already-in-use" || error?.code === "auth/email-already-in-use") {
        const credential = GoogleAuthProvider.credentialFromError(error);
        if (credential) {
          try {
            const result = await signInWithCredential(auth, credential);
            return { purpose, result, error: null };
          } catch (signInError) {
            return { purpose, result: null, error: signInError };
          }
        }
      }
      return { purpose, result: null, error };
    } finally {
      sessionStorage.removeItem(REDIRECT_PURPOSE_KEY);
    }
  })();
  return redirectCompletion;
}

export function googleAccountError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return "Google sign-in was canceled.";
  if (code === "auth/popup-blocked") return "Your browser blocked Google sign-in. Use full-page sign-in or allow pop-ups, then try again.";
  if (code === "auth/unauthorized-domain") return "This website domain needs to be added to Firebase Authentication authorized domains.";
  if (code === "auth/operation-not-allowed") return "Enable the Google provider in Firebase Authentication.";
  if (code === "auth/account-exists-with-different-credential") return "This email already uses another sign-in method. Sign in with that method first.";
  return error instanceof Error ? error.message : "Google sign-in could not be completed.";
}
