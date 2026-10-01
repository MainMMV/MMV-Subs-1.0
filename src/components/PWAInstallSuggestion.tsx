import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Share, PlusSquare } from "lucide-react";
import { MMVLogo } from "./MMVLogo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export const PWAInstallSuggestion: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    // 1. If already installed and running standalone, do not show
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // 2. If previously dismissed by user, do not show
    const dismissed = localStorage.getItem("mmv_pwa_suggest_dismissed");
    if (dismissed === "true") return;

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Reveal prompt shortly after page load
      setTimeout(() => setIsOpen(true), 1200);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // If iOS Safari, show prompt after delay
    if (isIOSDevice) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSSteps(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsOpen(false);
        localStorage.setItem("mmv_pwa_suggest_dismissed", "true");
      }
      setDeferredPrompt(null);
    } else {
      setShowAndroidGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem("mmv_pwa_suggest_dismissed", "true");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="p-4 rounded-xl border border-neutral-700 bg-[#25292E] text-neutral-100 shadow-2xl space-y-3">
        {/* Header / Dismiss */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-neutral-700 bg-neutral-800 flex items-center justify-center shadow-sm">
              <MMVLogo size={32} showText={false} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-medium text-white tracking-wide">MMV Host v2</h4>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-neutral-800 text-neutral-400 border border-neutral-700">
                  App
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                Install as a mobile app for fast offline access and full-screen experience.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>

        {/* iOS Step Guide */}
        {showIOSSteps && (
          <div className="p-2.5 rounded-lg bg-neutral-800/80 border border-neutral-700 text-[11px] text-neutral-300 space-y-1.5 animate-in fade-in duration-150">
            <div className="font-medium text-white flex items-center gap-1.5">
              <Smartphone size={13} className="text-[#ADC385]" />
              <span>Install on iPhone / iPad:</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <span className="w-4 h-4 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] shrink-0">1</span>
              <span>Tap the <Share size={12} className="inline mx-0.5 text-blue-400" /> <strong>Share</strong> button in Safari</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <span className="w-4 h-4 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] shrink-0">2</span>
              <span>Scroll down and tap <PlusSquare size={12} className="inline mx-0.5 text-[#ADC385]" /> <strong>Add to Home Screen</strong></span>
            </div>
          </div>
        )}

        {/* Android / Desktop Browser Step Guide */}
        {showAndroidGuide && (
          <div className="p-2.5 rounded-lg bg-neutral-800/80 border border-neutral-700 text-[11px] text-neutral-300 space-y-1.5 animate-in fade-in duration-150">
            <div className="font-medium text-white flex items-center gap-1.5">
              <Smartphone size={13} className="text-[#ADC385]" />
              <span>Install via Browser Menu:</span>
            </div>
            <p className="text-neutral-300">
              Tap your browser menu (<strong>⋮</strong> or <strong>Share</strong>), then select <strong>Install App</strong> or <strong>Add to Home Screen</strong>.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-800">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 rounded-lg bg-[#ADC385] hover:bg-[#9eb576] active:bg-[#8fa667] text-[#21252C] text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span>Install App</span>
          </button>
        </div>
      </div>
    </div>
  );
};
