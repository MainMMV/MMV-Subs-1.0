import firebaseConfig from "../../firebase-applet-config.json";

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
        use_fedcm_for_button: boolean;
      }) => void;
      renderButton: (element: HTMLElement, options: {
        type: "standard";
        theme: "outline";
        size: "large";
        text: "continue_with";
        shape: "rectangular";
        locale: string;
      }) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let googleScript: Promise<void> | null = null;

function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScript) return googleScript;
  googleScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google sign-in could not load. Check your connection and try again."));
    document.head.appendChild(script);
  }).catch((error) => {
    googleScript = null;
    throw error;
  });
  return googleScript;
}

export async function renderGoogleIdentityButton(
  element: HTMLElement,
  locale: string,
  onCredential: (idToken: string) => void,
  onError: (message: string) => void,
): Promise<void> {
  await loadGoogleIdentity();
  if (!window.google?.accounts?.id) throw new Error("Google sign-in is unavailable in this browser.");
  element.replaceChildren();
  window.google.accounts.id.initialize({
    client_id: firebaseConfig.oAuthClientId,
    callback: ({ credential }) => {
      if (credential) onCredential(credential);
      else onError("Google did not return a sign-in credential. Please try again.");
    },
    use_fedcm_for_button: true,
  });
  window.google.accounts.id.renderButton(element, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "rectangular",
    locale,
  });
}
