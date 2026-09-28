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
  ShieldCheck,
  Palette,
  Key,
  Copy,
  Bot,
  Sparkles,
  Terminal,
  FileText,
  Trash2
} from "lucide-react";
import { motion } from "motion/react";
import { CurrencyCode, CurrencyDisplayMode, TelegramConfig, PaymentItem, GoogleCalendarSyncState, AppTheme } from "../types";
import { isBrowserPushEnabled, requestBrowserPushPermission } from "../services/notificationService";

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
  const [rateInput, setRateInput] = useState(exchangeRateUsdToUzs.toString());
  const [browserPushActive, setBrowserPushActive] = useState<boolean>(() => isBrowserPushEnabled());
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [rateSavedMessage, setRateSavedMessage] = useState(false);

  // Telegram state
  const [tgChatId, setTgChatId] = useState(telegramConfig.chatId || "");
  const [tgEnabled, setTgEnabled] = useState(telegramConfig.isEnabled || false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // AI Connectors & API Keys state
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key: string; createdAt: string }[]>([]);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedOpenApiUrl, setCopiedOpenApiUrl] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");

  const fetchApiKeys = async () => {
    try {
      const res = await fetch("/api/v1/auth/keys");
      const data = await res.json();
      if (data.success && Array.isArray(data.keys)) {
        setApiKeys(data.keys);
      }
    } catch (err) {
      console.error("Failed to load API keys:", err);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleGenerateApiKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGeneratingKey(true);
    try {
      const res = await fetch("/api/v1/auth/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() || "AI Connector Key" }),
      });
      const data = await res.json();
      if (data.success && data.key) {
        setNewKeyName("");
        fetchApiKeys();
      }
    } catch (err) {
      console.error("Error creating API key:", err);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await fetch(`/api/v1/auth/keys/${id}`, { method: "DELETE" });
      fetchApiKeys();
    } catch (err) {
      console.error("Error deleting API key:", err);
    }
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  const handleCopyOpenApiUrl = () => {
    const url = `${window.location.origin}/api/v1/openapi.json`;
    navigator.clipboard.writeText(url);
    setCopiedOpenApiUrl(true);
    setTimeout(() => setCopiedOpenApiUrl(false), 2500);
  };

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
    if (!tgChatId.trim()) {
      setTestStatus("Please enter the Chat ID shown by the bot after /start.");
      return;
    }
    setIsTesting(true);
    setTestStatus("Open the MMV Subs bot in Telegram and send /start. Your connected dashboard will appear after this setting is saved.");
    setTimeout(() => setIsTesting(false), 300);
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
    <motion.div 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="space-y-6 w-full pb-16 select-none"
    >
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="text-base font-medium text-neutral-900">Settings</h2>
      </div>

      {/* 1. Theme & Appearance (Warm Dark ChatGPT Default) */}
      <div className="p-5 rounded-lg border border-neutral-200 bg-white space-y-4">
        <div>
          <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
            <Palette size={16} className="text-neutral-700" />
            <span>Theme & Appearance</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Warm Dark (Default) */}
          <button
            type="button"
            onClick={() => onChangeTheme?.("warm-dark")}
            className={`p-3.5 rounded-lg border text-left transition-all relative ${
              theme === "warm-dark"
                ? "border-[#ADC385] ring-1 ring-[#ADC385] bg-[#30343B]"
                : "border-neutral-200 hover:border-neutral-300 bg-[#30343B]/80"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#EEEEEE]">Warm Dark</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#ADC385]/20 text-[#ADC385] border border-[#ADC385]/40">
                  Default
                </span>
              </div>
              {theme === "warm-dark" && (
                <Check size={14} className="text-[#ADC385]" />
              )}
            </div>

            {/* Color swatches preview */}
            <div className="flex items-center gap-1.5 pt-1">
              <div className="w-5 h-5 rounded bg-[#30343B] border border-[#55585A]" title="Main #30343B" />
              <div className="w-5 h-5 rounded bg-[#25292E] border border-[#55585A]" title="Sidebar #25292E" />
              <div className="w-5 h-5 rounded bg-[#454749] border border-[#55585A]" title="Surface #454749" />
              <div className="w-5 h-5 rounded bg-[#5A5C59] border border-[#55585A]" title="Input #5A5C59" />
              <div className="w-5 h-5 rounded bg-[#ADC385] border border-[#ADC385]" title="Accent #ADC385" />
            </div>
          </button>

          {/* Warm Light Theme */}
          <button
            type="button"
            onClick={() => onChangeTheme?.("light")}
            style={{ backgroundColor: theme === "light" ? "#F8F6F1" : "#EFECE6", color: "#242320" }}
            className={`p-3.5 rounded-lg border text-left transition-all relative ${
              theme === "light"
                ? "border-[#7A9154] ring-1 ring-[#7A9154]"
                : "border-[#E4DFD5] hover:border-[#D8D2C5]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: "#242320" }}>Warm Light</span>
              {theme === "light" && (
                <Check size={14} style={{ color: "#7A9154" }} />
              )}
            </div>

            {/* Color swatches preview */}
            <div className="flex items-center gap-1.5 pt-1">
              <div className="w-5 h-5 rounded bg-[#F8F6F1] border border-[#E5DFD4]" title="Main #F8F6F1" />
              <div className="w-5 h-5 rounded bg-[#F1EEE7] border border-[#E5DFD4]" title="Sidebar #F1EEE7" />
              <div className="w-5 h-5 rounded bg-[#FFFEFC] border border-[#E5DFD4]" title="Surface #FFFEFC" />
              <div className="w-5 h-5 rounded bg-[#EDE8DF] border border-[#E5DFD4]" title="Secondary #EDE8DF" />
              <div className="w-5 h-5 rounded bg-[#262421] border border-[#262421]" title="Accent #262421" />
            </div>
          </button>
        </div>
      </div>

      {/* 2. Currency & Manual Exchange Rate Configuration */}
      <div className="p-5 rounded-lg border border-neutral-200 bg-white space-y-4">
        <div>
          <h3 className="text-sm font-medium text-neutral-900">Currency & Conversion</h3>
        </div>

        {/* Display Priority Mode: Default, USD, UZS */}
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1.5">
            Currency Priority & Display
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
              <span className="block font-medium">Default</span>
              <span className={`text-[10px] block mt-0.5 ${displayCurrency === "default" ? "text-neutral-300" : "text-neutral-400"}`}>
                Created currency on top
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
                USD on top, UZS below
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
                UZS on top, USD below
              </span>
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
              <label className="block text-xs font-medium text-neutral-700 mb-1">Telegram Chat ID</label>
              <input
                type="text"
                placeholder="e.g. 987654321"
                value={tgChatId}
                onChange={(e) => setTgChatId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 font-mono"
              />
              <p className="mt-1 text-[11px] text-neutral-500">Start the MMV Subs bot and copy the Chat ID it shows.</p>
            </div>
            <div>
              <p className="pt-6 text-xs text-neutral-500">The bot token is managed securely by the Telegram worker and is never stored in this browser.</p>
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

          {/* Telegram Commands Cheat Sheet */}
          <div className="pt-3 border-t border-neutral-200/60">
            <h4 className="text-xs font-medium text-neutral-700 mb-2 flex items-center gap-1.5">
              <Terminal size={13} className="text-neutral-500" />
              <span>Available Telegram Bot Commands</span>
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

      {/* 3. AI Connectors & REST API (Google Gemini & ChatGPT) */}
      <div className="p-5 rounded-lg border border-neutral-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-neutral-900" />
              <h3 className="text-sm font-medium text-neutral-900">AI Connectors (ChatGPT & Google Gemini)</h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Give AI assistants full control to view expenses, create subscriptions, mark items paid, and track habits.
            </p>
          </div>
        </div>

        {/* API Key Management */}
        <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-800">
              <Key size={14} className="text-neutral-700" />
              <span>API Keys for AI Authentication</span>
            </div>
            <form onSubmit={handleGenerateApiKey} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Key label (e.g. ChatGPT)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 bg-white"
              />
              <button
                type="submit"
                disabled={isGeneratingKey}
                className="px-3 py-1 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {isGeneratingKey ? "Generating..." : "Generate Key"}
              </button>
            </form>
          </div>

          {apiKeys.length === 0 ? (
            <div className="p-3 rounded border border-neutral-200/60 bg-white text-xs text-neutral-500 text-center">
              No API keys generated yet. Click "Generate Key" to create a token for ChatGPT or Gemini.
            </div>
          ) : (
            <div className="space-y-1.5">
              {apiKeys.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg border border-neutral-200 bg-white flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-neutral-900 block truncate">{item.name}</span>
                    <span className="font-mono text-neutral-500 text-[11px]">
                      {item.key.slice(0, 10)}••••••••••••••••{item.key.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyKey(item.key, item.id)}
                      className="px-2 py-1 rounded border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedKeyId === item.id ? (
                        <>
                          <Check size={11} className="text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteApiKey(item.id)}
                      className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-neutral-50 transition-colors cursor-pointer"
                      title="Delete key"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ChatGPT Actions & Gemini Function Calling Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* ChatGPT Card */}
          <div className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium text-xs text-neutral-900">
                <Bot size={14} className="text-neutral-700" />
                <span>ChatGPT Custom GPT Action</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-200 text-neutral-700 font-medium">
                OpenAPI 3.0
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Import the live OpenAPI schema into your Custom GPT Actions with custom header <code className="font-mono">x-api-key</code>.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleCopyOpenApiUrl}
                className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedOpenApiUrl ? (
                  <>
                    <Check size={12} className="text-emerald-600" />
                    <span>Schema URL Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy OpenAPI URL (/api/v1/openapi.json)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Gemini Card */}
          <div className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium text-xs text-neutral-900">
                <Sparkles size={14} className="text-neutral-700" />
                <span>Google Gemini Function Calling</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-200 text-neutral-700 font-medium">
                SDK Ready
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Provides declared tool definitions for <code className="font-mono">createItem</code>, <code className="font-mono">markItemPaid</code>, <code className="font-mono">listItems</code>, and habit tracking.
            </p>
            <div className="pt-1">
              <div className="p-2 rounded bg-white border border-neutral-200 text-[11px] text-neutral-600 flex items-center gap-1.5">
                <FileText size={12} className="text-neutral-500 shrink-0" />
                <span className="truncate">View schemas in <strong className="text-neutral-900 font-medium">docs/AI_CONNECTORS_GEMINI_CHATGPT.md</strong></span>
              </div>
            </div>
          </div>
        </div>
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
          <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-100/60 text-xs text-neutral-600 flex items-center justify-between">
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
    </motion.div>
  );
};
