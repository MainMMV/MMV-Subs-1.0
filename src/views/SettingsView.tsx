import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  Send, 
  Shield, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Download, 
  RotateCcw,
  CalendarSync,
  Bell,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { CurrencyCode, TelegramConfig, PaymentItem, GoogleCalendarSyncState } from "../types";
import { isBrowserPushEnabled, requestBrowserPushPermission } from "../services/notificationService";

interface SettingsViewProps {
  displayCurrency: CurrencyCode;
  onChangeDisplayCurrency: (curr: CurrencyCode) => void;
  exchangeRateUsdToUzs: number;
  onUpdateExchangeRate: (rate: number) => void;
  telegramConfig: TelegramConfig;
  onUpdateTelegramConfig: (cfg: TelegramConfig) => void;
  items: PaymentItem[];
  onResetData: () => void;
  onOpenCalendarSync?: () => void;
  calendarSyncState?: GoogleCalendarSyncState;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  displayCurrency,
  onChangeDisplayCurrency,
  exchangeRateUsdToUzs,
  onUpdateExchangeRate,
  telegramConfig,
  onUpdateTelegramConfig,
  items,
  onResetData,
  onOpenCalendarSync,
  calendarSyncState,
}) => {
  const [rateInput, setRateInput] = useState(exchangeRateUsdToUzs.toString());
  const [browserPushActive, setBrowserPushActive] = useState<boolean>(() => isBrowserPushEnabled());
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [rateSavedMessage, setRateSavedMessage] = useState(false);

  // Telegram state
  const [tgBotToken, setTgBotToken] = useState(telegramConfig.botToken || "");
  const [tgChatId, setTgChatId] = useState(telegramConfig.chatId || "");
  const [tgEnabled, setTgEnabled] = useState(telegramConfig.isEnabled || false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(rateInput);
    if (!isNaN(num) && num > 0) {
      onUpdateExchangeRate(num);
      setRateSavedMessage(true);
      setTimeout(() => setRateSavedMessage(false), 2000);
    }
  };

  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTelegramConfig({
      ...telegramConfig,
      botToken: tgBotToken.trim(),
      chatId: tgChatId.trim(),
      isEnabled: tgEnabled,
    });
    setTestStatus("Telegram configuration saved.");
    setTimeout(() => setTestStatus(null), 3000);
  };

  const handleTestTelegram = async () => {
    if (!tgBotToken.trim() || !tgChatId.trim()) {
      setTestStatus("Please provide both Bot Token and Chat ID first.");
      return;
    }
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await fetch(`https://api.telegram.org/bot${tgBotToken.trim()}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: tgChatId.trim(),
          text: "🔔 MMV subs: Test notification received successfully! Your payment tracking and reminders are connected.",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestStatus("Test notification sent successfully to Telegram!");
      } else {
        setTestStatus(`Telegram error: ${data.description || "Failed to send"}`);
      }
    } catch (err: any) {
      setTestStatus(`Network error: ${err?.message || "Failed to contact Telegram API"}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleExportData = () => {
    const jsonStr = JSON.stringify(items, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mmv-subs-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 w-full pb-16 select-none">
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="text-base font-medium text-neutral-900">Settings</h2>
      </div>

      {/* 1. Currency & Manual Exchange Rate Configuration */}
      <div className="p-5 rounded-lg border border-neutral-200 bg-white space-y-4">
        <div>
          <h3 className="text-sm font-medium text-neutral-900">Currency & Conversion</h3>
        </div>

        {/* Display Currency */}
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1.5">
            Active Display Currency
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChangeDisplayCurrency("USD")}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-colors ${
                displayCurrency === "USD"
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-2xs"
                  : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              USD ($)
            </button>
            <button
              type="button"
              onClick={() => onChangeDisplayCurrency("UZS")}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-colors ${
                displayCurrency === "UZS"
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-2xs"
                  : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              UZS (Uzbek Som)
            </button>
          </div>
        </div>

        {/* Manual Exchange Rate */}
        <form onSubmit={handleSaveRate} className="pt-2 border-t border-neutral-100 space-y-2">
          <label className="block text-xs font-medium text-neutral-700">
            Manual Exchange Rate (1 USD to UZS)
          </label>
          <div className="flex items-center gap-2 max-w-sm">
            <span className="text-xs text-neutral-500 font-medium">1 USD =</span>
            <input
              type="number"
              step="any"
              min="1"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 font-medium"
            />
            <span className="text-xs text-neutral-500 font-medium">UZS</span>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Update
            </button>
          </div>
          {rateSavedMessage && (
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <Check size={13} />
              <span>Exchange rate updated successfully.</span>
            </p>
          )}
        </form>
      </div>

      {/* 2. Telegram Notifications Configuration */}
      <div className="p-5 rounded-lg border border-neutral-200 bg-white space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
              <Send size={15} className="text-blue-500" />
              <span>Telegram Notifications</span>
            </h3>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={tgEnabled}
                onChange={(e) => setTgEnabled(e.target.checked)}
                className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
              />
              <span className="text-xs font-medium text-neutral-700">Enable Telegram Alerts</span>
            </label>
          </div>
        </div>

        <form onSubmit={handleSaveTelegram} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Bot Token
              </label>
              <input
                type="text"
                placeholder="e.g. 123456789:ABCdefGHI..."
                value={tgBotToken}
                onChange={(e) => setTgBotToken(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Chat ID
              </label>
              <input
                type="text"
                placeholder="e.g. 987654321"
                value={tgChatId}
                onChange={(e) => setTgChatId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Save Telegram Settings
            </button>
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={isTesting}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-colors"
            >
              {isTesting ? "Sending..." : "Send Test Notification"}
            </button>
          </div>

          {testStatus && (
            <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-800">
              {testStatus}
            </div>
          )}
        </form>
      </div>

      {/* 3. Google Calendar Synchronization */}
      <div className="p-5 rounded-lg border border-neutral-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarSync size={16} className="text-neutral-700" />
              <h3 className="text-sm font-medium text-neutral-900">Google Calendar Synchronization</h3>
              {calendarSyncState?.isConnected && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-medium border border-emerald-200">
                  Connected
                </span>
              )}
            </div>
          </div>

          {onOpenCalendarSync && (
            <button
              type="button"
              onClick={onOpenCalendarSync}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              <CalendarSync size={13} />
              <span>{calendarSyncState?.isConnected ? "Manage Calendar Sync" : "Connect Google Calendar"}</span>
            </button>
          )}
        </div>

        {calendarSyncState?.isConnected ? (
          <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-neutral-700">
              <span>Account:</span>
              <span className="font-medium text-neutral-900">{calendarSyncState.userEmail}</span>
            </div>
            {calendarSyncState.lastSyncedAt && (
              <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                <span>Last Synchronized:</span>
                <span>{new Date(calendarSyncState.lastSyncedAt).toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 pt-1 border-t border-neutral-200/60">
              <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
              <span>Events are published with 24h advance notifications to prevent surprise debits.</span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/60 text-xs text-neutral-600 flex items-center justify-between">
            <span>No Google account linked. Connect to keep due dates synchronized with your calendar.</span>
            {onOpenCalendarSync && (
              <button
                type="button"
                onClick={onOpenCalendarSync}
                className="text-xs font-medium text-neutral-900 underline hover:text-neutral-700 ml-2"
              >
                Connect Now
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Browser Web Push Notifications */}
      <div className="p-5 rounded-lg border border-neutral-200 bg-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-neutral-700" />
              <h3 className="text-sm font-medium text-neutral-900">Browser Web Push Notifications</h3>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                  browserPushActive
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-neutral-100 text-neutral-600 border-neutral-200"
                }`}
              >
                {browserPushActive ? "Active" : "Disabled"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              if (!("Notification" in window)) {
                setPushStatus("Web notifications are not supported in this browser.");
                return;
              }
              const perm = await requestBrowserPushPermission();
              if (perm === "granted") {
                setBrowserPushActive(true);
                setPushStatus("Browser push notifications are active!");
              } else {
                setBrowserPushActive(false);
                setPushStatus("Permission was not granted in browser settings.");
              }
              setTimeout(() => setPushStatus(null), 3000);
            }}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-800 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg transition-colors shrink-0 shadow-2xs"
          >
            {browserPushActive ? "Verify Permission" : "Enable Browser Alerts"}
          </button>
        </div>

        {pushStatus && (
          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 flex items-center gap-1.5">
            <Check size={13} className="text-neutral-700" />
            <span>{pushStatus}</span>
          </div>
        )}
      </div>

      {/* 5. Data Backup & Reset */}
      <div className="p-5 rounded-lg border border-neutral-200 bg-white space-y-4">
        <div>
          <h3 className="text-sm font-medium text-neutral-900">Data Management</h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg transition-colors"
          >
            <Download size={14} />
            <span>Export Backup (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm("Are you sure you want to restore default sample payments?")) {
                onResetData();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <RotateCcw size={14} />
            <span>Restore Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};
