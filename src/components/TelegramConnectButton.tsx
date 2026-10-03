import React, { useEffect, useRef, useState } from "react";
import { ExternalLink, LoaderCircle, Send, ShieldCheck } from "lucide-react";
import { isNativeApp } from "../services/deviceCalendar";
import { useI18n } from "../i18n";

const TELEGRAM_SERVICE_URL = "https://mmv-subs-telegram-bot.onrender.com";

export interface TelegramIdentity {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramConnectButtonProps {
  onConnected: (identity: TelegramIdentity, botUsername: string) => void;
}

declare global {
  interface Window {
    __mmvTelegramAuth?: (identity: TelegramIdentity) => void;
  }
}

export const TelegramConnectButton: React.FC<TelegramConnectButtonProps> = ({ onConnected }) => {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [botUsername, setBotUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const nativeApp = isNativeApp();

  useEffect(() => {
    fetch(`${TELEGRAM_SERVICE_URL}/bot-info`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Telegram bot information is unavailable.");
        return response.json() as Promise<{ username?: string }>;
      })
      .then((profile) => {
        if (!profile.username) throw new Error("Telegram bot username is not configured.");
        setBotUsername(profile.username);
      })
      .catch(() => setError(t("telegramUnavailable")));
  }, [t]);

  useEffect(() => {
    if (!botUsername || nativeApp || !containerRef.current) return;

    window.__mmvTelegramAuth = async (identity) => {
      setVerifying(true);
      setError(null);
      try {
        const response = await fetch(`${TELEGRAM_SERVICE_URL}/auth/telegram`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(identity),
        });
        const result = await response.json() as { verified?: boolean; identity?: TelegramIdentity; error?: string };
        if (!response.ok || !result.verified || !result.identity) throw new Error(result.error || "Telegram verification failed.");
        onConnected(result.identity, botUsername);
      } catch (verificationError) {
        setError(verificationError instanceof Error ? verificationError.message : "Telegram verification failed.");
      } finally {
        setVerifying(false);
      }
    };

    containerRef.current.replaceChildren();
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "10");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "window.__mmvTelegramAuth(user)");
    containerRef.current.appendChild(script);

    return () => {
      delete window.__mmvTelegramAuth;
    };
  }, [botUsername, nativeApp, onConnected]);

  if (nativeApp) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
        <div className="mb-2 flex items-start gap-2">
          <Send size={16} className="mt-0.5 shrink-0 text-blue-600" />
          <div>
            <p className="text-xs font-medium text-blue-950">{t("connectThroughTelegram")}</p>
            <p className="mt-0.5 text-[11px] text-blue-800">{t("telegramApkInstructions")}</p>
          </div>
        </div>
        <button
          type="button"
          disabled={!botUsername}
          onClick={() => window.open(`https://t.me/${botUsername}?start=connect`, "_blank")}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white disabled:cursor-wait disabled:opacity-60"
        >
          {botUsername ? <ExternalLink size={15} /> : <LoaderCircle size={15} className="animate-spin" />}
          <span>{botUsername ? `@${botUsername}` : t("findingBot")}</span>
        </button>
        {error ? <p className="mt-2 text-[11px] text-rose-700" role="alert">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="mb-2 flex items-start gap-2">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-700" />
        <div>
          <p className="text-xs font-medium text-neutral-900">{t("telegramLogin")}</p>
          <p className="mt-0.5 text-[11px] text-neutral-600">{t("telegramLoginDescription")}</p>
        </div>
      </div>
      {verifying ? (
        <div className="flex min-h-10 items-center gap-2 text-xs text-neutral-600"><LoaderCircle size={15} className="animate-spin" /> {t("verifyingTelegram")}</div>
      ) : (
        <div ref={containerRef} className="min-h-10" />
      )}
      {error ? <p className="mt-2 text-[11px] text-rose-600" role="alert">{error}</p> : null}
    </div>
  );
};
