import React, { useCallback, useState, useEffect } from "react";
import type { User } from "firebase/auth";
import { Send, Check, Download, RotateCcw, CalendarSync, Bell, ShieldCheck, Palette, Terminal, Languages, UserRound, Coffee, Copy, MessageSquare, Sparkles, X, Heart, Trophy, Volume2 } from "lucide-react";
import { motion } from "motion/react";
import { CurrencyDisplayMode, TelegramConfig, PaymentItem, GoogleCalendarSyncState, AppTheme } from "../types";
import { isBrowserPushEnabled, requestBrowserPushPermission } from "../services/notificationService";
import { isSoundEnabled, playAppSound, setSoundEnabled, type SoundPreference } from "../services/soundService";
import { isNativeApp } from "../services/deviceCalendar";
import { areDeviceRemindersEnabled, enableDeviceReminders, syncDeviceReminders } from "../services/deviceReminders";
import { requestTelegramTest } from "../firebase";
import { TelegramConnectButton, type TelegramIdentity } from "../components/TelegramConnectButton";
import { NativeQuickSetup } from "../components/NativeQuickSetup";
import { useI18n, type AppLanguage, type TranslationKey } from "../i18n";
import { formatTashkentDateTime, tashkentDateKey } from "../utils/timezone";
import { DEFAULT_UI_PREFERENCES, FONT_OPTIONS, updateUiPreferences, useUiPreferences, type ViewSection } from "../services/uiPreferences";

type SettingsGroup = "appearance" | "views" | "finance" | "connections" | "account" | "data";
const SETTINGS_GROUPS: Array<{ id: SettingsGroup; labelKey: TranslationKey }> = [
  { id: "appearance", labelKey: "settingsAppearance" },
  { id: "views", labelKey: "settingsViews" },
  { id: "finance", labelKey: "settingsFinance" },
  { id: "connections", labelKey: "settingsConnections" },
  { id: "account", labelKey: "settingsAccount" },
  { id: "data", labelKey: "settingsData" },
];

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
  accountUser: User | null;
  accountStatus: "loading" | "local" | "connected" | "needs-choice" | "error";
  accountError: string | null;
  showAccountOnMount?: boolean;
  onGoogleSignIn: (mode?: "popup" | "redirect") => Promise<void>;
  onAccountSignOut: () => Promise<void>;
  onChooseCloud: () => void;
  onKeepDevice: () => void;
  onRetryCloud: () => void;
}

interface LocalProfile {
  name: string;
  email: string;
  telegram: string;
  createdAt: string;
}

interface CoffeeSupportRecord {
  id: string;
  name: string;
  amount: string;
  note: string;
  createdAt: string;
}

interface FeedbackRecord {
  id: string;
  type: "feedback" | "improvement" | "bug";
  message: string;
  contact: string;
  createdAt: string;
}

const SETTINGS_STORAGE_KEYS = {
  PROFILE: "mmv_hub_local_profile_v1",
  COFFEE: "mmv_hub_coffee_support_v1",
  FEEDBACK: "mmv_hub_feedback_v1",
  COFFEE_POPUP_DISMISSED: "mmv_hub_coffee_popup_dismissed_v1",
};

const SUPPORT_CARD_NUMBER = "8600 4929 3050 8490";
const SUPPORT_CARD_OWNER = "M. F.";

const THEME_OPTIONS: Array<{
  id: AppTheme;
  label: string;
  badge?: string;
  previewText: string;
  selectedBorder: string;
  cardBg: string;
  textColor: string;
  swatches: string[];
}> = [
  {
    id: "warm-dark",
    label: "Dark",
    badge: "Default",
    previewText: "Soft dark workspace",
    selectedBorder: "#a8c999",
    cardBg: "#29312e",
    textColor: "#f1f4f2",
    swatches: ["#29312e", "#202825", "#35403a", "#455049", "#a8c999"],
  },
  {
    id: "light",
    label: "Light",
    previewText: "Clean daylight",
    selectedBorder: "#317459",
    cardBg: "#ffffff",
    textColor: "#1e2825",
    swatches: ["#f5f7f6", "#ecf0ee", "#ffffff", "#edf2ef", "#317459"],
  },
  {
    id: "graphite",
    label: "Graphite",
    previewText: "Deep neutral focus",
    selectedBorder: "#7dd3fc",
    cardBg: "#202124",
    textColor: "#f4f7f8",
    swatches: ["#202124", "#181a1d", "#2a2d31", "#3a3f45", "#7dd3fc"],
  },
  {
    id: "mint",
    label: "Mint",
    previewText: "Fresh calm",
    selectedBorder: "#0f8a6a",
    cardBg: "#f1faf5",
    textColor: "#14342b",
    swatches: ["#f1faf5", "#e3f3eb", "#ffffff", "#d8eee3", "#0f8a6a"],
  },
  {
    id: "rose",
    label: "Rose",
    previewText: "Warm polished",
    selectedBorder: "#be3455",
    cardBg: "#fff7f8",
    textColor: "#331f25",
    swatches: ["#fff7f8", "#f7ecef", "#ffffff", "#f1dce2", "#be3455"],
  },
];

function loadJsonValue<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    return fallback;
  }
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
  accountUser,
  accountStatus,
  accountError,
  showAccountOnMount = false,
  onGoogleSignIn,
  onAccountSignOut,
  onChooseCloud,
  onKeepDevice,
  onRetryCloud,
}) => {
  const { language, setLanguage, t } = useI18n();
  const uiPreferences = useUiPreferences();
  const [activeGroup, setActiveGroup] = useState<SettingsGroup>(showAccountOnMount ? "account" : "appearance");
  useEffect(() => {
    if (showAccountOnMount) setActiveGroup("account");
  }, [showAccountOnMount]);
  const [rateInput, setRateInput] = useState(exchangeRateUsdToUzs.toString());
  const [browserPushActive, setBrowserPushActive] = useState<boolean>(() => isBrowserPushEnabled());
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [soundPreferences, setSoundPreferences] = useState(() => ({ actions: isSoundEnabled("actions"), alerts: isSoundEnabled("alerts") }));
  const [rateSavedMessage, setRateSavedMessage] = useState(false);
  const [profile, setProfile] = useState<LocalProfile | null>(() => loadJsonValue<LocalProfile | null>(SETTINGS_STORAGE_KEYS.PROFILE, null));
  const [profileForm, setProfileForm] = useState(() => ({
    name: profile?.name || "",
    email: profile?.email || "",
    telegram: profile?.telegram || "",
  }));
  const [profileSavedMessage, setProfileSavedMessage] = useState<string | null>(null);
  const [coffeeRecords, setCoffeeRecords] = useState<CoffeeSupportRecord[]>(() => loadJsonValue<CoffeeSupportRecord[]>(SETTINGS_STORAGE_KEYS.COFFEE, []));
  const [coffeeForm, setCoffeeForm] = useState({ name: profile?.name || "", amount: "", note: "" });
  const [coffeeStatus, setCoffeeStatus] = useState<string | null>(null);
  const [feedbackRecords, setFeedbackRecords] = useState<FeedbackRecord[]>(() => loadJsonValue<FeedbackRecord[]>(SETTINGS_STORAGE_KEYS.FEEDBACK, []));
  const [feedbackForm, setFeedbackForm] = useState<Pick<FeedbackRecord, "type" | "message" | "contact">>({
    type: "improvement",
    message: "",
    contact: profile?.email || profile?.telegram || "",
  });
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [showCoffeePopup, setShowCoffeePopup] = useState(false);
  const nativeApp = isNativeApp();

  useEffect(() => {
    if (!accountUser || accountUser.isAnonymous) return;
    setProfileForm((previous) => ({
      ...previous,
      name: previous.name || accountUser.displayName || "",
      email: previous.email || accountUser.email || "",
    }));
  }, [accountUser]);

  const handleSoundPreference = (preference: SoundPreference, enabled: boolean) => {
    setSoundEnabled(preference, enabled);
    setSoundPreferences((previous) => ({ ...previous, [preference]: enabled }));
    if (enabled) playAppSound(preference === "alerts" ? "reminder" : "save");
  };

  useEffect(() => {
    if (nativeApp) areDeviceRemindersEnabled().then(setBrowserPushActive).catch(() => setBrowserPushActive(false));
  }, [nativeApp]);

  useEffect(() => {
    const dismissed = localStorage.getItem(SETTINGS_STORAGE_KEYS.COFFEE_POPUP_DISMISSED) === "true";
    if (!dismissed) {
      const timer = window.setTimeout(() => setShowCoffeePopup(true), 650);
      return () => window.clearTimeout(timer);
    }
  }, []);

  // Telegram state
  const [tgChatId, setTgChatId] = useState(telegramConfig.chatId || "");
  const [tgEnabled, setTgEnabled] = useState(telegramConfig.isEnabled || false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(rateInput);
    if (!isNaN(num) && num > 0) {
      playAppSound("save");
      onUpdateExchangeRate(num);
      setRateSavedMessage(true);
      setTimeout(() => setRateSavedMessage(false), 2000);
    }
  };

  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    playAppSound("save");
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
      playAppSound("notification");
      return;
    }
    setIsTesting(true);
    try {
      await requestTelegramTest(tgChatId.trim());
      playAppSound("notification");
      setTestStatus("Test queued. Check your Telegram chat after the next worker check (about a minute).");
    } catch (error) {
      setTestStatus(error instanceof Error ? error.message : "Could not queue Telegram test. Check Firebase access.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleTelegramConnected = useCallback((identity: TelegramIdentity, botUsername: string) => {
    playAppSound("save");
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
    playAppSound("save");
    const jsonStr = JSON.stringify(items, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mmv-hub-payments-${tashkentDateKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    playAppSound("save");
    const nextProfile: LocalProfile = {
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      telegram: profileForm.telegram.trim(),
      createdAt: profile?.createdAt || new Date().toISOString(),
    };
    localStorage.setItem(SETTINGS_STORAGE_KEYS.PROFILE, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setCoffeeForm((prev) => ({ ...prev, name: prev.name || nextProfile.name }));
    setFeedbackForm((prev) => ({ ...prev, contact: prev.contact || nextProfile.email || nextProfile.telegram }));
    setProfileSavedMessage("Local profile saved on this device.");
    window.setTimeout(() => setProfileSavedMessage(null), 2500);
  };

  const handleCopySupportCard = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_CARD_NUMBER.replaceAll(" ", ""));
      playAppSound("save");
      setCoffeeStatus("Card number copied.");
    } catch {
      playAppSound("notification");
      setCoffeeStatus("Copy failed. You can select the card number manually.");
    }
    window.setTimeout(() => setCoffeeStatus(null), 2500);
  };

  const handleCloseCoffeePopup = () => {
    playAppSound("tap");
    setShowCoffeePopup(false);
    localStorage.setItem(SETTINGS_STORAGE_KEYS.COFFEE_POPUP_DISMISSED, "true");
  };

  const handleRecordCoffee = (e: React.FormEvent) => {
    e.preventDefault();
    playAppSound("paid");
    const record: CoffeeSupportRecord = {
      id: `coffee-${Date.now()}`,
      name: coffeeForm.name.trim() || "Kind supporter",
      amount: coffeeForm.amount.trim() || "Any amount",
      note: coffeeForm.note.trim(),
      createdAt: new Date().toISOString(),
    };
    const nextRecords = [record, ...coffeeRecords].slice(0, 20);
    localStorage.setItem(SETTINGS_STORAGE_KEYS.COFFEE, JSON.stringify(nextRecords));
    setCoffeeRecords(nextRecords);
    setCoffeeForm({ name: profile?.name || "", amount: "", note: "" });
    setCoffeeStatus("Thank you. Saved locally for the future Coffee module.");
    window.setTimeout(() => setCoffeeStatus(null), 3000);
  };

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.message.trim()) {
      setFeedbackStatus("Write a short message first.");
      playAppSound("notification");
      return;
    }
    playAppSound("save");
    const record: FeedbackRecord = {
      id: `feedback-${Date.now()}`,
      type: feedbackForm.type,
      message: feedbackForm.message.trim(),
      contact: feedbackForm.contact.trim(),
      createdAt: new Date().toISOString(),
    };
    const nextRecords = [record, ...feedbackRecords].slice(0, 30);
    localStorage.setItem(SETTINGS_STORAGE_KEYS.FEEDBACK, JSON.stringify(nextRecords));
    setFeedbackRecords(nextRecords);
    setFeedbackForm((prev) => ({ ...prev, message: "" }));
    setFeedbackStatus("Saved locally. It will be ready to sync when backend feedback storage is connected.");
    window.setTimeout(() => setFeedbackStatus(null), 3500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="mmv-page settings-page w-full min-w-0 pb-16"
    >
      <div className="border-b border-neutral-200 pb-3">
        <h2 className="text-base font-medium text-neutral-900">{t("settings")}</h2>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings categories">
          {SETTINGS_GROUPS.map((group) => (
            <button key={group.id} type="button" onClick={(event) => { setActiveGroup(group.id); event.currentTarget.closest("main")?.scrollTo({ top: 0, behavior: "auto" }); }} aria-current={activeGroup === group.id ? "page" : undefined} className={activeGroup === group.id ? "is-active" : ""}>{t(group.labelKey)}</button>
          ))}
        </nav>
        <div className="settings-content">
      {activeGroup === "account" ? <>

      <div className="settings-block space-y-3">
        <div className="flex items-start gap-2">
          <UserRound size={17} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-medium">{t("googleAccount")}</h3>
            <p className="text-xs opacity-70">{t("googleAccountDescription")}</p>
          </div>
        </div>
        {accountUser && !accountUser.isAnonymous ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 break-all text-xs">{accountUser.displayName ? `${accountUser.displayName} · ` : ""}{accountUser.email}</span>
            <button type="button" onClick={() => void onAccountSignOut()} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs">{t("signOutAccount")}</button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={accountStatus === "loading"} onClick={() => void onGoogleSignIn()} className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">
              {accountStatus === "loading" ? t("connectingGoogle") : t("continueWithGoogle")}
            </button>
            {!nativeApp ? <button type="button" disabled={accountStatus === "loading"} onClick={() => void onGoogleSignIn("redirect")} className="rounded-lg border border-neutral-300 px-3 py-2 text-xs disabled:opacity-50">{t("fullPageGoogleSignIn")}</button> : null}
          </div>
        )}
        {accountStatus === "connected" ? <p className="text-xs opacity-70">{t("cloudSyncActive")}</p> : null}
        {accountStatus === "needs-choice" ? (
          <div className="space-y-2 rounded-lg bg-neutral-500/10 p-3 text-xs">
            <p>{t("cloudDataConflict")}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onChooseCloud} className="rounded-lg bg-neutral-900 px-3 py-1.5 font-medium text-white">{t("useCloudData")}</button>
              <button type="button" onClick={onKeepDevice} className="rounded-lg border border-neutral-300 px-3 py-1.5">{t("keepDeviceData")}</button>
            </div>
          </div>
        ) : null}
        {accountError ? <div role="alert" className="space-y-2 text-xs text-rose-600"><p>{accountError}</p>{accountStatus === "error" && accountUser && !accountUser.isAnonymous ? <button type="button" onClick={onRetryCloud} className="underline">{t("retryCloud")}</button> : null}</div> : null}
      </div>

      {showCoffeePopup ? (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="relative overflow-hidden rounded-lg border border-emerald-200 bg-white p-4 shadow-lg"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-700 via-lime-300 to-emerald-700" />
          <button
            type="button"
            onClick={handleCloseCoffeePopup}
            className="absolute right-3 top-3 rounded-lg border border-neutral-200 bg-white p-1.5 text-neutral-500 hover:bg-neutral-50"
            aria-label="Close coffee support"
          >
            <X size={14} />
          </button>
          <div className="flex items-start gap-3 pr-8">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-neutral-900">Fuel MMV Hub with a coffee</h3>
              <p className="mt-1 text-xs leading-5 text-neutral-600">
                If this app saves you time, a small coffee keeps the work moving. Any amount is welcome, and every supporter will have a place in the future Coffee module.
              </p>
              <button
                type="button"
                onClick={handleCopySupportCard}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
              >
                <Copy size={13} />
                <span>Copy card</span>
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}

      <div className="p-5 rounded-lg border border-neutral-200 bg-white space-y-4">
        <div className="flex items-start gap-2">
          <UserRound size={16} className="mt-0.5 text-neutral-700" />
          <div>
            <h3 className="text-sm font-medium text-neutral-900">{t("deviceProfile")}</h3>
            <p className="mt-0.5 text-[11px] text-neutral-500">{t("deviceProfileDescription")}</p>
          </div>
        </div>
        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            type="text"
            value={profileForm.name}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Name"
            className="min-w-0 rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:outline-none focus:border-neutral-900"
          />
          <input
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
            className="min-w-0 rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:outline-none focus:border-neutral-900"
          />
          <input
            type="text"
            value={profileForm.telegram}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, telegram: e.target.value }))}
            placeholder="Telegram username"
            className="min-w-0 rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:outline-none focus:border-neutral-900"
          />
          <div className="sm:col-span-3 flex flex-wrap items-center gap-2">
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white">
              <Check size={13} />
              <span>{profile ? "Update profile" : "Register locally"}</span>
            </button>
            {profileSavedMessage ? <span className="text-xs text-emerald-600">{profileSavedMessage}</span> : null}
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="relative p-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-700 via-lime-300 to-emerald-700" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.75fr)]">
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Coffee size={16} className="mt-0.5 text-neutral-700" />
                <div>
                  <h3 className="text-sm font-medium text-neutral-900">Buy me a coffee</h3>
                  <p className="mt-1 text-xs leading-5 text-neutral-600">
                    MMV Hub is growing one careful feature at a time. If it helped you organize your payments, habits, or reminders, your support turns into more late-night fixes, cleaner APK builds, and better tools.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Card</p>
                    <p className="mt-1 font-mono text-sm font-medium text-neutral-900">{SUPPORT_CARD_NUMBER}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">Owner: {SUPPORT_CARD_OWNER}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySupportCard}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    <Copy size={13} />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleRecordCoffee} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
                <input
                  type="text"
                  value={coffeeForm.name}
                  onChange={(e) => setCoffeeForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name for future top supporters"
                  className="min-w-0 rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:outline-none focus:border-neutral-900"
                />
                <input
                  type="text"
                  value={coffeeForm.amount}
                  onChange={(e) => setCoffeeForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="Amount"
                  className="min-w-0 rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:outline-none focus:border-neutral-900"
                />
                <input
                  type="text"
                  value={coffeeForm.note}
                  onChange={(e) => setCoffeeForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Optional note"
                  className="min-w-0 rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:outline-none focus:border-neutral-900 sm:col-span-2"
                />
                <button type="submit" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-medium text-white sm:col-span-2">
                  <Heart size={13} />
                  <span>I sent support</span>
                </button>
              </form>
              {coffeeStatus ? <p className="text-xs text-emerald-600">{coffeeStatus}</p> : null}
            </div>

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-neutral-900">
                <Trophy size={14} />
                <span>Coffee module preview</span>
              </div>
              <p className="mb-3 text-[11px] leading-5 text-neutral-500">Future plan: gamified supporter levels, top donators, thank-you badges, and visible supporter history after backend sync is added.</p>
              <div className="space-y-2">
                {coffeeRecords.length ? coffeeRecords.slice(0, 3).map((record) => (
                  <div key={record.id} className="rounded-lg border border-neutral-200 bg-white p-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-neutral-900">{record.name}</span>
                      <span className="shrink-0 text-neutral-500">{record.amount}</span>
                    </div>
                    {record.note ? <p className="mt-1 line-clamp-2 text-[11px] text-neutral-500">{record.note}</p> : null}
                  </div>
                )) : (
                  <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-3 text-[11px] text-neutral-500">
                    Support records you add will appear here locally.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-lg border border-neutral-200 bg-white space-y-4">
        <div className="flex items-start gap-2">
          <MessageSquare size={16} className="mt-0.5 text-neutral-700" />
          <div>
            <h3 className="text-sm font-medium text-neutral-900">Feedback & improvements</h3>
            <p className="mt-0.5 text-[11px] text-neutral-500">Save ideas, bug notes, and improvement requests locally until backend feedback sync is enabled.</p>
          </div>
        </div>
        <form onSubmit={handleSaveFeedback} className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <select
              value={feedbackForm.type}
              onChange={(e) => setFeedbackForm((prev) => ({ ...prev, type: e.target.value as FeedbackRecord["type"] }))}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:outline-none focus:border-neutral-900"
            >
              <option value="improvement">Improvement</option>
              <option value="feedback">Feedback</option>
              <option value="bug">Bug</option>
            </select>
            <input
              type="text"
              value={feedbackForm.contact}
              onChange={(e) => setFeedbackForm((prev) => ({ ...prev, contact: e.target.value }))}
              placeholder="Contact, optional"
              className="min-w-0 rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:outline-none focus:border-neutral-900"
            />
          </div>
          <textarea
            value={feedbackForm.message}
            onChange={(e) => setFeedbackForm((prev) => ({ ...prev, message: e.target.value }))}
            placeholder="Write what should be improved..."
            rows={3}
            className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:outline-none focus:border-neutral-900"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white">
              <Send size={13} />
              <span>Save feedback</span>
            </button>
            {feedbackStatus ? <span className="text-xs text-emerald-600">{feedbackStatus}</span> : null}
          </div>
        </form>
        {feedbackRecords.length ? (
          <div className="space-y-2 border-t border-neutral-100 pt-3">
            {feedbackRecords.slice(0, 3).map((record) => (
              <div key={record.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-2 text-xs">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-medium capitalize text-neutral-900">{record.type}</span>
                  <span className="text-[10px] text-neutral-400">{formatTashkentDateTime(record.createdAt)}</span>
                </div>
                <p className="line-clamp-2 text-neutral-600">{record.message}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      </> : null}

      {activeGroup === "appearance" ? <>
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

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {THEME_OPTIONS.map((option) => {
            const selected = theme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  playAppSound("tap");
                  onChangeTheme?.(option.id);
                }}
                aria-pressed={selected}
                style={{
                  backgroundColor: option.cardBg,
                  color: option.textColor,
                  borderColor: selected ? "currentColor" : "transparent",
                }}
                className="min-h-20 rounded-lg border p-2.5 text-left transition-colors hover:opacity-95"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-medium">{option.label}</span>
                      {option.badge ? (
                        <span
                          className="rounded border px-1.5 py-0.5 text-[10px] font-medium"
                          style={{ borderColor: "currentColor", color: option.selectedBorder, backgroundColor: `${option.selectedBorder}22` }}
                        >
                          {option.badge}
                        </span>
                      ) : null}
                    </div>
                    <span className="mt-0.5 block truncate text-[10px] opacity-70">{option.previewText}</span>
                  </div>
                  {selected ? <Check size={14} style={{ color: option.selectedBorder }} /> : null}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  {option.swatches.map((swatch) => (
                    <span
                      key={swatch}
                      className="h-3.5 w-3.5 rounded-sm"
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="settings-block space-y-2">
        <h3 className="text-sm font-medium text-neutral-900">{t("typographyLayout")}</h3>
        <div className="settings-control-row"><label htmlFor="settings-font">{t("fontLabel")}</label><select id="settings-font" value={uiPreferences.font} onChange={(event) => updateUiPreferences({ font: event.target.value as typeof uiPreferences.font })}>{FONT_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></div>
        <p className="settings-font-preview" aria-live="polite">MMV Hub · Aa Бб Ўў · 12345</p>
        <div className="settings-control-row"><span>{t("textSizeLabel")}</span><div className="settings-choice" role="group" aria-label={t("textSizeLabel")}>{(["small", "normal", "large"] as const).map((size) => <button key={size} type="button" aria-pressed={uiPreferences.textSize === size} onClick={() => updateUiPreferences({ textSize: size })}>{t(size)}</button>)}</div></div>
        <div className="settings-control-row"><span>{t("cornerRadius")}</span><div className="settings-choice" role="group" aria-label={t("cornerRadius")}>{(["square", "soft", "round"] as const).map((radius) => <button key={radius} type="button" aria-pressed={uiPreferences.radius === radius} onClick={() => updateUiPreferences({ radius })}>{t(radius)}</button>)}</div></div>
        <div className="settings-control-row"><span>{t("spacingLabel")}</span><div className="settings-choice" role="group" aria-label={t("spacingLabel")}>{(["compact", "comfortable"] as const).map((density) => <button key={density} type="button" aria-pressed={uiPreferences.density === density} onClick={() => updateUiPreferences({ density })}>{t(density)}</button>)}</div></div>
        <label className="settings-control-row"><span>{t("reduceMotion")}</span><input type="checkbox" checked={uiPreferences.reducedMotion} onChange={(event) => updateUiPreferences({ reducedMotion: event.target.checked })} /></label>
      </div>

      <div className="p-5 rounded-lg border border-neutral-200 bg-white space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-medium text-neutral-900">
          <Volume2 size={16} className="text-neutral-700" />
          Sounds
        </h3>
        {([
          { id: "actions" as const, label: "Action sounds", detail: "Saving, completing, and deleting" },
          { id: "alerts" as const, label: "In-app alerts", detail: "Notifications and reminders while the app is open" },
        ]).map((option) => (
          <label key={option.id} className="flex min-h-11 items-center justify-between gap-3 border-t border-neutral-100 pt-3">
            <span className="min-w-0">
              <span className="block text-xs font-medium text-neutral-900">{option.label}</span>
              <span className="block text-[11px] text-neutral-500">{option.detail}</span>
            </span>
            <input
              type="checkbox"
              checked={soundPreferences[option.id]}
              onChange={(event) => handleSoundPreference(option.id, event.target.checked)}
              className="h-4 w-4 shrink-0 accent-emerald-700"
            />
          </label>
        ))}
        {nativeApp ? <p className="text-[11px] text-neutral-500">Scheduled Android alerts use their own sounds. Manage them in your device notification settings.</p> : null}
      </div>

      </> : null}

      {activeGroup === "views" ? <div className="settings-block space-y-3">
        <h3 className="text-sm font-medium text-neutral-900">{t("savedViewsFilters")}</h3>
        <label className="settings-control-row"><span>{t("rememberViews")}</span><input type="checkbox" checked={uiPreferences.rememberViews} onChange={(event) => updateUiPreferences({ rememberViews: event.target.checked })} /></label>
        {(["subscriptions", "bills", "purchases", "goals"] as ViewSection[]).map((section) => {
          const filters = section === "goals" ? ["all", "active", "completed"] : section === "purchases" ? ["all", "upcoming", "paid"] : ["all", "active", "overdue", "due_today", "upcoming", "paid"];
          const sectionLabel = section === "bills" ? t("recurringBills") : section === "purchases" ? t("oneTimePurchases") : t(section);
          return <div key={section} className="settings-control-row settings-view-row"><span>{sectionLabel}</span><div className="flex min-w-0 flex-wrap gap-2"><select aria-label={`${section} view`} value={uiPreferences.views[section]} onChange={(event) => updateUiPreferences({ views: { ...uiPreferences.views, [section]: event.target.value as "list" | "card" } })}><option value="list">{t("listView")}</option><option value="card">{t("cardView")}</option></select><select aria-label={`${section} filter`} value={uiPreferences.filters[section]} onChange={(event) => updateUiPreferences({ filters: { ...uiPreferences.filters, [section]: event.target.value } })}>{filters.map((filterOption) => <option key={filterOption} value={filterOption}>{filterOption === "due_today" ? t("dueSoon") : filterOption === "active" ? t("active") : filterOption === "completed" ? t("completed") : filterOption === "overdue" ? t("overdue") : filterOption === "upcoming" ? t("upcoming") : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}</option>)}</select></div></div>;
        })}
        <div className="settings-control-row"><label htmlFor="settings-goal-sort">{t("goalOrder")}</label><select id="settings-goal-sort" value={uiPreferences.goalSort} onChange={(event) => updateUiPreferences({ goalSort: event.target.value as typeof uiPreferences.goalSort })}><option value="deadline">{t("deadlineSort")}</option><option value="progress">{t("progressSort")}</option><option value="name">{t("nameSort")}</option></select></div>
        <button type="button" onClick={() => updateUiPreferences({ views: DEFAULT_UI_PREFERENCES.views, filters: DEFAULT_UI_PREFERENCES.filters, goalSort: DEFAULT_UI_PREFERENCES.goalSort })} className="text-xs font-medium text-neutral-600 underline">{t("resetViewsFilters")}</button>
      </div> : null}

      {/* 2. Currency & Manual Exchange Rate Configuration */}
      {activeGroup === "finance" ? <>
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
      </> : null}
      {activeGroup === "connections" ? <>
      {nativeApp ? <NativeQuickSetup items={items} onOpenCalendar={() => onOpenCalendarSync?.()} autoHideWhenReady className="mb-0" /> : null}
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
                <span>{formatTashkentDateTime(calendarSyncState.lastSyncedAt)}</span>
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
                  playAppSound(granted ? "reminder" : "notification");
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
                playAppSound("notification");
                setBrowserPushActive(true);
                setPushStatus("Browser push notifications are active!");
              } else {
                playAppSound("tap");
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
      </> : null}
      {activeGroup === "data" ? <>
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
      </> : null}
        </div>
      </div>
    </motion.div>
  );
};
