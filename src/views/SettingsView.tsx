import React, { useCallback, useState, useEffect } from "react";
import { Send, Check, Download, RotateCcw, CalendarSync, Bell, ShieldCheck, Palette, Terminal, Languages } from "lucide-react";
import { motion } from "motion/react";
import { CurrencyDisplayMode, TelegramConfig, PaymentItem, GoogleCalendarSyncState, AppTheme } from "../types";
import { isBrowserPushEnabled, requestBrowserPushPermission } from "../services/notificationService";
import { isNativeApp } from "../services/deviceCalendar";
import { areDeviceRemindersEnabled, enableDeviceReminders, syncDeviceReminders } from "../services/deviceReminders";
import { requestTelegramTest } from "../firebase";
import { TelegramConnectButton, type TelegramIdentity } from "../components/TelegramConnectButton";
import { useI18n, type AppLanguage } from "../i18n";

interface SettingsViewProps {
  displayCurrency: CurrencyDisplayMode;
  onChangeDisplayCurrency: (curr: CurrencyDisplayMode) => void;
  exchangeRateUsdToUzs: number;
  onUpdateExchangeRate: (rate: number) => void;
  telegramConfig: TelegramConfig;
  onUpdateTelegramConfig: (cfg: TelegramConfig) => void;
  items: PaymentItem[];
  onResetData: () => void;
  onOpenCalendarSync?: () => void;
  calendarSyncState?: GoogleCalendarSyncState;
  theme?: AppTheme;
  onChangeTheme?: (theme: AppTheme) => void;
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
  theme = "warm-dark",
  onChangeTheme,
}) => {
  const { language, setLanguage, t } = useI18n();
  const [rateInput, setRateInput] = useState(exchangeRateUsdToUzs.toString());
  const [browserPushActive, setBrowserPushActive] = useState<boolean>(() => isBrowserPushEnabled());
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [rateSavedMessage, setRateSavedMessage] = useState(false);
  const nativeApp = isNativeApp();

  useEffect(() => {
    if (nativeApp) areDeviceRemindersEnabled().then(setBrowserPushActive).catch(() => setBrowserPushActive(false));
  }, [nativeApp]);

  // Telegram state
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
      // The shared bot token stays in the Telegram worker environment only.
      botToken: "",
      chatId: tgChatId.trim(),
      isEnabled: tgEnabled,
    });
    setTestStatus("Telegram configuration saved.");
    setTimeout(() => setTestStatus(null), 3000);
  };

  const handleTestTelegram = async () => {
    if (!tgChatId.trim() || !telegramConfig.isEnabled || telegramConfig.chatId !== tgChatId.trim()) {
      setTestStatus("Save an enabled Telegram Chat ID before testing.");
      return;
    }
    setIsTesting(true);
    try {
      await requestTelegramTest(tgChatId.trim());
      setTestStatus("Test queued. Check your Telegram chat after the next worker check (about a minute).");
    } catch (error) {
      setTestStatus(error instanceof Error ? error.message : "Could not queue Telegram test. Check Firebase access.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleTelegramConnected = useCallback((identity: TelegramIdentity, botUsername: string) => {
    const chatId = String(identity.id);
    setTgChatId(chatId);
    setTgEnabled(true);
    onUpdateTelegramConfig({
      ...telegramConfig,
      botToken: "",
      botUsername,
      chatId,
      isEnabled: true,
    });
    setTestStatus(`Connected${identity.username ? ` as @${identity.username}` : ""}. Telegram alerts are enabled.`);
  }, [onUpdateTelegramConfig, telegramConfig]);

  const handleExportData = () => {
    const jsonStr = JSON.stringify(items, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mmv-hub-payments-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="space-y-6 w-full pb-16 select-none"
    >
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="text-base font-medium text-neutral-900">{t("settings")}</h2>
      </div>

      <div className="p-5 rounded-lg border border-neutral-200 bg-white space-y-3">
        <div className="flex items-center gap-2">
          <Languages size={16} className="text-neutral-700" />
          <div>
            <h3 className="text-sm font-medium text-neutral-900">{t("language")}</h3>
            <p className="mt-0.5 text-[11px] text-neutral-500">{t("languageDescription")}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("language")}>
          {([
            ["uz", "UZ", t("uzbek")],
            ["ru", "RU", t("russian")],
            ["en", "EN", t("english")],
          ] as [AppLanguage, string, string][]).map(([code, shortLabel, label]) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              aria-pressed={language === code}
              className={`min-h-11 rounded-lg border px-2 py-2 text-center transition-colors ${language === code ? "border-emerald-700 bg-emerald-700 text-white" : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"}`}
            >
              <span className="block text-xs font-medium">{shortLabel}</span>
              <span className={`block truncate text-[10px] ${language === code ? "text-emerald-50" : "text-neutral-500"}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="p-5 rounded-lg border border-neutral-200 bg-white space-y-4">
        <div>
          <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
            <Palette size={16} className="text-neutral-700" />
            <span>{t("themeAppearance")}</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Dark */}
          <button
            type="button"
            onClick={() => onChangeTheme?.("warm-dark")}
            className={`p-3.5 rounded-lg border text-left transition-all relative ${
              theme === "warm-dark"
                ? "border-[#a8c999] ring-1 ring-[#a8c999] bg-[#29312e]"
                : "border-neutral-200 hover:border-neutral-300 bg-[#29312e]/80"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#f1f4f2]">{t("dark")}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#ADC385]/20 text-[#ADC385] border border-[#ADC385]/40">
                  {t("default")}
                </span>
              </div>
              {theme === "warm-dark" && (
                <Check size={14} className="text-[#a8c999]" />
              )}
            </div>

            {/* Color swatches preview */}
            <div className="flex items-center gap-1.5 pt-1">
              <div className="w-5 h-5 rounded bg-[#29312e] border border-[#4b5750]" title="Main" />
              <div className="w-5 h-5 rounded bg-[#202825] border border-[#4b5750]" title="Sidebar" />
              <div className="w-5 h-5 rounded bg-[#35403a] border border-[#4b5750]" title="Surface" />
              <div className="w-5 h-5 rounded bg-[#455049] border border-[#4b5750]" title="Input" />
              <div className="w-5 h-5 rounded bg-[#a8c999] border border-[#a8c999]" title="Accent" />
            </div>
          </button>

          {/* Light */}
          <button
            type="button"
            onClick={() => onChangeTheme?.("light")}
            style={{ backgroundColor: theme === "light" ? "#ffffff" : "#f5f7f6", color: "#1e2825" }}
            className={`p-3.5 rounded-lg border text-left transition-all relative ${
              theme === "light"
                ? "border-[#317459] ring-1 ring-[#317459]"
                : "border-[#dce4df] hover:border-[#b8d4c1]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: "#1e2825" }}>{t("light")}</span>
              {theme === "light" && (
                <Check size={14} style={{ color: "#317459" }} />
              )}
            </div>

            {/* Color swatches preview */}
            <div className="flex items-center gap-1.5 pt-1">
              <div className="w-5 h-5 rounded bg-[#f5f7f6] border border-[#dce4df]" title="Main" />
              <div className="w-5 h-5 rounded bg-[#ecf0ee] border border-[#dce4df]" title="Sidebar" />
              <div className="w-5 h-5 rounded bg-white border border-[#dce4df]" title="Surface" />
              <div className="w-5 h-5 rounded bg-[#edf2ef] border border-[#dce4df]" title="Secondary" />
              <div className="w-5 h-5 rounded bg-[#317459] border border-[#317459]" title="Accent" />
            </div>
          </button>
        </div>
      </div>

      {/* 2. Currency & Manual Exchange Rate Configuration */}
      <div className="p-5 rounded-lg border border-neutral-200 bg-white space-y-4">
        <div>
          <h3 className="text-sm font-medium text-neutral-900">{t("currencyConversion")}</h3>
        </div>

        {/* Display Priority Mode: Default, USD, UZS */}
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1.5">
            {t("currencyPriority")}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onChangeDisplayCurrency("default")}
              className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-colors ${
                displayCurrency === "default"
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-2xs"
                  : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <span className="block font-medium">{t("default")}</span>
              <span className={`text-[10px] block mt-0.5 ${displayCurrency === "default" ? "text-neutral-300" : "text-neutral-400"}`}>
                {t("createdCurrencyTop")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onChangeDisplayCurrency("USD")}
              className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-colors ${
                displayCurrency === "USD"
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-2xs"
                  : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <span className="block font-medium">USD ($)</span>
              <span className={`text-[10px] block mt-0.5 ${displayCurrency === "USD" ? "text-neutral-300" : "text-neutral-400"}`}>
                {t("usdTop")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onChangeDisplayCurrency("UZS")}
              className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-colors ${
                displayCurrency === "UZS"
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-2xs"
                  : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <span className="block font-medium">UZS (Som)</span>
              <span className={`text-[10px] block mt-0.5 ${displayCurrency === "UZS" ? "text-neutral-300" : "text-neutral-400"}`}>
                {t("uzsTop")}
              </span>
            </button>
          </div>
        </div>

        {/* Manual Exchange Rate */}
        <form onSubmit={handleSaveRate} className="pt-2 border-t border-neutral-100 space-y-2">
          <label className="block text-xs font-medium text-neutral-700">
            {t("manualExchangeRate")}
          </label>
          <div className="grid max-w-sm grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[auto_minmax(5rem,1fr)_auto_auto]">
            <span className="whitespace-nowrap text-xs text-neutral-500 font-medium">1 USD =</span>
            <input
              aria-label={t("uzsPerUsd")}
              type="number"
              step="any"
              min="1"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="min-w-0 flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 font-medium"
            />
            <span className="whitespace-nowrap text-xs text-neutral-500 font-medium">UZS</span>
            <button
              type="submit"
              className="col-span-3 w-full px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors sm:col-span-1 sm:w-auto"
            >
              {t("update")}
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
              <Send size={15} className="text-blue-500" />
              <span>{t("telegramNotifications")}</span>
            </h3>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={tgEnabled}
                onChange={(e) => setTgEnabled(e.target.checked)}
                className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
              />
              <span className="text-xs font-medium text-neutral-700">{t("enableTelegramAlerts")}</span>
            </label>
          </div>
        </div>

        <TelegramConnectButton onConnected={handleTelegramConnected} />

        <form onSubmit={handleSaveTelegram} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">{t("telegramChatId")} <span className="font-normal text-neutral-400">({t("manualFallback")})</span></label>
              <input
                type="text"
                placeholder="e.g. 987654321"
                value={tgChatId}
                onChange={(e) => setTgChatId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 font-mono"
              />
              <p className="mt-1 text-[11px] text-neutral-500">Use this field if Telegram Login is unavailable or when linking from the APK.</p>
            </div>
            <div>
              <p className="pt-6 text-xs text-neutral-500">The bot token is managed securely by the Telegram worker and is never stored in this browser.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              {t("saveTelegram")}
            </button>
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={isTesting}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-colors"
            >
              {isTesting ? `${t("sendTest")}…` : t("sendTest")}
            </button>
          </div>

          {testStatus && (
            <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-800">
              {testStatus}
            </div>
          )}

          {/* Telegram Commands Cheat Sheet */}
          <div className="pt-3 border-t border-neutral-200/60">
            <h4 className="text-xs font-medium text-neutral-700 mb-2 flex items-center gap-1.5">
              <Terminal size={13} className="text-neutral-500" />
              <span>{t("availableBotCommands")}</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded border border-neutral-200 bg-neutral-50">
                <span className="font-mono font-medium text-neutral-900">/today</span>
                <p className="text-neutral-500 mt-0.5">Today's charges</p>
              </div>
              <div className="p-2 rounded border border-neutral-200 bg-neutral-50">
                <span className="font-mono font-medium text-neutral-900">/payments</span>
                <p className="text-neutral-500 mt-0.5">Upcoming payments</p>
              </div>
              <div className="p-2 rounded border border-neutral-200 bg-neutral-50">
                <span className="font-mono font-medium text-neutral-900">/habits</span>
                <p className="text-neutral-500 mt-0.5">Today's habits & done</p>
              </div>
              <div className="p-2 rounded border border-neutral-200 bg-neutral-50">
                <span className="font-mono font-medium text-neutral-900">/refresh</span>
                <p className="text-neutral-500 mt-0.5">Refresh live data</p>
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2">
              See complete command reference in <code className="font-mono">docs/TELEGRAM_INTEGRATION.md</code>.
            </p>
          </div>
        </form>
      </div>

      {/* 3. Google Calendar Synchronization */}
      <div className="p-5 rounded-lg border border-neutral-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarSync size={16} className="text-neutral-700" />
              <h3 className="text-sm font-medium text-neutral-900">{t("calendarReminders")}</h3>
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
              <span>{nativeApp ? t("deviceCalendar") : (calendarSyncState?.isConnected ? t("calendarReminders") : t("connectGoogleCalendar"))}</span>
            </button>
          )}
        </div>

        {nativeApp ? (
          <p className="text-xs text-neutral-600">Grant calendar access and choose a calendar on this device to add payment reminders directly.</p>
        ) : calendarSyncState?.isConnected ? (
          <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 text-xs space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1 text-neutral-700">
              <span>Account:</span>
              <span className="break-all font-medium text-neutral-900">{calendarSyncState.userEmail}</span>
            </div>
            {calendarSyncState.lastSyncedAt && (
            <div className="flex flex-wrap items-center justify-between gap-1 text-neutral-500 text-[11px]">
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
          <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-100/60 text-xs text-neutral-600 flex flex-wrap items-center justify-between gap-2">
            <span>No Google account linked. Connect to add due dates to your calendar.</span>
            {onOpenCalendarSync && (
              <button
                type="button"
                onClick={onOpenCalendarSync}
                className="shrink-0 text-xs font-medium text-neutral-900 underline hover:text-neutral-700"
              >
                {t("connectNow")}
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
              <h3 className="text-sm font-medium text-neutral-900">{nativeApp ? t("deviceAlerts") : t("browserAlerts")}</h3>
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
              if (nativeApp) {
                try {
                  const granted = await enableDeviceReminders();
                  setBrowserPushActive(granted);
                  const count = granted ? await syncDeviceReminders(items) : 0;
                  setPushStatus(granted ? `${count} reminders scheduled on this device.` : "Notification access was not granted.");
                } catch (error) {
                  setPushStatus(error instanceof Error ? error.message : "Could not schedule reminders.");
                }
                return;
              }
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
            {nativeApp ? (browserPushActive ? t("remindersActive") : t("enableReminders")) : (browserPushActive ? t("browserAlerts") : t("enableBrowserAlerts"))}
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
          <h3 className="text-sm font-medium text-neutral-900">{t("dataManagement")}</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg transition-colors"
          >
            <Download size={14} />
            <span>{t("exportPayments")}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear all payments, goals, habits, and history from this device?")) {
                onResetData();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <RotateCcw size={14} />
            <span>{t("clearData")}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
