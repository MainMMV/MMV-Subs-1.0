import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Bell, AlertCircle, Calendar } from "lucide-react";
import { 
  PaymentItem, 
  ItemType, 
  CurrencyCode, 
  ItemReminder, 
  FrequencyUnit 
} from "../../types";
import { ServiceIcon, AVAILABLE_ICONS } from "../ServiceIcon";
import { getConversionPreview } from "../../utils/calculations";
import { useI18n } from "../../i18n";
import { tashkentDateKey } from "../../utils/timezone";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<PaymentItem>) => void;
  initialItem?: PaymentItem | null;
  defaultType?: ItemType;
  exchangeRateUsdToUzs: number;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  defaultType = "subscription",
  exchangeRateUsdToUzs,
}) => {
  const { t } = useI18n();
  const [type, setType] = useState<ItemType>(defaultType);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [icon, setIcon] = useState("credit-card");
  const [iconBgColor, setIconBgColor] = useState("#2563EB");
  const [price, setPrice] = useState<string>("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [date, setDate] = useState("");
  
  // Custom recurring frequency (only for subscription & bill)
  const [freqInterval, setFreqInterval] = useState<number>(1);
  const [freqUnit, setFreqUnit] = useState<FrequencyUnit>("months");

  // Reminders and UI states
  const [reminders, setReminders] = useState<ItemReminder[]>([]);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isRemindersSectionOpen, setIsRemindersSectionOpen] = useState(false);

  // Validation
  const [error, setError] = useState<string | null>(null);

  // When initialItem or isOpen changes, initialize form
  useEffect(() => {
    if (initialItem) {
      setType(initialItem.type);
      setName(initialItem.name);
      setNotes(initialItem.notes || "");
      setIcon(initialItem.icon || "credit-card");
      setIconBgColor(initialItem.iconBgColor || "#2563EB");
      setPrice(initialItem.price.toString());
      setCurrency(initialItem.currency);
      setDate(initialItem.date || tashkentDateKey());
      if (initialItem.frequency) {
        setFreqInterval(initialItem.frequency.interval);
        setFreqUnit(initialItem.frequency.unit);
      } else {
        setFreqInterval(1);
        setFreqUnit("months");
      }
      setReminders(initialItem.reminders ? [...initialItem.reminders] : []);
      setIsRemindersSectionOpen((initialItem.reminders?.length || 0) > 0);
    } else {
      setType(defaultType);
      setName("");
      setNotes("");
      setIcon("credit-card");
      setIconBgColor("#2563EB");
      setPrice("");
      setCurrency("USD");
      setDate(tashkentDateKey());
      setFreqInterval(1);
      setFreqUnit("months");
      setReminders([
        {
          id: `rem-${Date.now()}`,
          timing: "before",
          duration: 1,
          unit: "days",
          exactTime: "09:00",
          channel: "both",
          enabled: true,
        },
      ]);
      setIsRemindersSectionOpen(false);
    }
    setIsIconPickerOpen(false);
    setError(null);
  }, [initialItem, isOpen, defaultType]);

  if (!isOpen) return null;

  const handleAddReminder = () => {
    const newRem: ItemReminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timing: "before",
      duration: 3,
      unit: "days",
      exactTime: "09:00",
      channel: "both",
      enabled: true,
    };
    setReminders((prev) => [...prev, newRem]);
  };

  const handleUpdateReminder = (id: string, updates: Partial<ItemReminder>) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const handleRemoveReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter an item name.");
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError("Please enter a valid price.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }

    const payload: Partial<PaymentItem> = {
      ...(initialItem?.id ? { id: initialItem.id } : {}),
      type,
      name: name.trim(),
      icon,
      iconBgColor,
      notes: notes.trim() || undefined,
      price: numPrice,
      currency,
      date,
      reminders,
    };

    if (type !== "purchase") {
      payload.frequency = {
        interval: Math.max(1, Number(freqInterval) || 1),
        unit: freqUnit,
      };
    } else {
      payload.frequency = undefined;
    }

    onSave(payload);
    onClose();
  };

  const dateLabel =
    type === "subscription"
      ? t("renewalDate")
      : type === "bill"
      ? t("dueDate")
      : t("purchaseDate");

  const parsedPrice = parseFloat(price) || 0;

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-900/40 px-4 py-[max(3.5rem,env(safe-area-inset-top))] backdrop-blur-xs select-none"
    >
      <div 
        className="flex max-h-[calc(100dvh-7rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-md animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-900">
            {initialItem ? `${t("edit")} ${t("paymentItem")}` : `${t("newItem")} · ${t("paymentItem")}`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="min-h-0 space-y-4 overflow-y-auto p-4 sm:p-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Item Type Selector */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              {t("category")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("subscription")}
                className={`rounded-lg border px-1.5 py-2 text-center text-[11px] font-medium transition-colors ${
                  type === "subscription"
                    ? "bg-blue-50 border-blue-300 text-blue-700 shadow-2xs"
                    : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {t("subscription")}
              </button>
              <button
                type="button"
                onClick={() => setType("bill")}
                className={`rounded-lg border px-1.5 py-2 text-center text-[11px] font-medium transition-colors ${
                  type === "bill"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs"
                    : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {t("billShort")}
              </button>
              <button
                type="button"
                onClick={() => setType("purchase")}
                className={`rounded-lg border px-1.5 py-2 text-center text-[11px] font-medium transition-colors ${
                  type === "purchase"
                    ? "bg-purple-50 border-purple-300 text-purple-700 shadow-2xs"
                    : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {t("purchaseShort")}
              </button>
            </div>
          </div>

          {/* 2. Name & Notes directly below Name */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                {t("name")} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  type === "subscription"
                    ? "e.g. Netflix, Spotify, ChatGPT"
                    : type === "bill"
                    ? "e.g. Internet, Rent, Electricity"
                    : "e.g. Phone, Chair, Course"
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 transition-colors"
                required
              />
            </div>
          </div>

          {/* 3. Side-by-side Choose Icon & Reminders buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Choose Icon Button */}
              <button
                type="button"
                onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                className={`min-w-0 px-2.5 py-2 rounded-lg border flex items-center text-xs font-medium transition-colors ${
                  isIconPickerOpen
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
                title="Choose service icon"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: iconBgColor }}
                  >
                    <ServiceIcon icon={icon} size={13} />
                  </div>
                  <span className="truncate">{t("icon")}</span>
                </div>
              </button>

              {/* Reminders Button */}
              <button
                type="button"
                onClick={() => setIsRemindersSectionOpen(!isRemindersSectionOpen)}
                className={`min-w-0 px-2 py-2 rounded-lg border flex items-center justify-between gap-1 text-[11px] font-medium transition-colors ${
                  isRemindersSectionOpen
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
                title="Configure item reminders"
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <Bell size={13} className={`shrink-0 ${isRemindersSectionOpen ? "text-white" : "text-neutral-500"}`} />
                  <span className="whitespace-nowrap">{t("reminderShort")}</span>
                </div>
                <span
                  className={`ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    isRemindersSectionOpen
                      ? "bg-white/20 text-white"
                      : reminders.length > 0
                      ? "bg-blue-100 text-blue-700"
                      : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {reminders.length}
                </span>
              </button>
            </div>

            {/* Compact Block for Icons selection */}
            {isIconPickerOpen && (
              <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/70 space-y-2 animate-in fade-in duration-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-600">Choose Icon</span>
                  <button
                    type="button"
                    onClick={() => setIsIconPickerOpen(false)}
                    className="text-[10px] text-neutral-400 hover:text-neutral-700"
                  >
                    Done
                  </button>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {AVAILABLE_ICONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setIcon(item.id);
                      }}
                      className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 border text-center transition-colors ${
                        icon === item.id
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      <ServiceIcon icon={item.id} size={15} />
                      <span className="text-[9px] truncate max-w-full">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Expandable Reminders Section */}
            {isRemindersSectionOpen && (
              <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-100/60 space-y-2.5 animate-in fade-in duration-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-700 flex items-center gap-1.5">
                    <Bell size={13} className="text-neutral-500" />
                    <span>Reminders ({reminders.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddReminder}
                    className="text-xs text-neutral-900 hover:text-neutral-700 font-medium flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>{t("addReminder")}</span>
                  </button>
                </div>

                {reminders.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-1">No reminders added yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {reminders.map((rem, idx) => (
                      <div
                        key={rem.id}
                        className="p-2.5 rounded-lg border border-neutral-200 bg-white space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-neutral-700">Reminder #{idx + 1}</span>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rem.enabled}
                                onChange={(e) => handleUpdateReminder(rem.id, { enabled: e.target.checked })}
                                className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
                              />
                              <span className="text-[11px] text-neutral-500">Enabled</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveReminder(rem.id)}
                              className="text-neutral-400 hover:text-rose-600 p-0.5"
                              title="Remove reminder"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-neutral-400 block mb-0.5">Timing</span>
                            <select
                              value={rem.timing}
                              onChange={(e) =>
                                handleUpdateReminder(rem.id, {
                                  timing: e.target.value as "before" | "on_date" | "after",
                                })
                              }
                              className="w-full px-2 py-1 text-xs rounded border border-neutral-200 bg-neutral-50 font-medium"
                            >
                              <option value="before">Before payment</option>
                              <option value="on_date">On payment date</option>
                              <option value="after">After payment</option>
                            </select>
                          </div>

                          {/* Time is used ONLY here in Reminders as requested */}
                          <div>
                            <span className="text-[10px] text-neutral-400 block mb-0.5">Reminder Time</span>
                            <input
                              type="time"
                              value={rem.exactTime}
                              onChange={(e) => handleUpdateReminder(rem.id, { exactTime: e.target.value })}
                              className="w-full px-2 py-1 text-xs rounded border border-neutral-200 bg-neutral-50 font-medium"
                            />
                          </div>
                        </div>

                        {rem.timing !== "on_date" && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-neutral-500">Duration:</span>
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={rem.duration}
                              onChange={(e) =>
                                handleUpdateReminder(rem.id, {
                                  duration: Math.max(1, parseInt(e.target.value) || 1),
                                })
                              }
                              className="w-16 px-2 py-1 text-xs rounded border border-neutral-200 bg-neutral-50 text-center"
                            />
                            <select
                              value={rem.unit}
                              onChange={(e) =>
                                handleUpdateReminder(rem.id, {
                                  unit: e.target.value as "minutes" | "hours" | "days" | "weeks",
                                })
                              }
                              className="flex-1 px-2 py-1 text-xs rounded border border-neutral-200 bg-neutral-50 font-medium"
                            >
                              <option value="days">Days</option>
                              <option value="hours">Hours</option>
                              <option value="minutes">Minutes</option>
                              <option value="weeks">Weeks</option>
                            </select>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[11px] text-neutral-500">Channel:</span>
                          <select
                            value={rem.channel}
                            onChange={(e) =>
                              handleUpdateReminder(rem.id, {
                                channel: e.target.value as "in_app" | "telegram" | "both",
                              })
                            }
                            className="flex-1 px-2 py-1 text-xs rounded border border-neutral-200 bg-neutral-50 font-medium"
                          >
                            <option value="both">Both (In-App + Telegram)</option>
                            <option value="in_app">In-App only</option>
                            <option value="telegram">Telegram only</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Price & Currency with Conversion Preview */}
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <label className="block text-xs font-medium text-neutral-700">
                {t("price")}
              </label>
              <span className="whitespace-nowrap text-[10px] text-neutral-500">
                1 USD = {exchangeRateUsdToUzs.toLocaleString()} UZS
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-neutral-300 focus:outline-none focus:border-neutral-900 transition-colors"
                  required
                />
              </div>

              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-24 px-2 py-2 text-xs rounded-lg bg-white border border-neutral-300 focus:outline-none focus:border-neutral-900 transition-colors font-medium"
              >
                <option value="USD">USD</option>
                <option value="UZS">UZS</option>
              </select>
            </div>

            {/* Real-time conversion preview */}
            {parsedPrice > 0 && (
              <div className="text-xs text-neutral-600 pt-0.5 font-medium flex items-center gap-1.5">
                <span>Preview:</span>
                <span className="text-neutral-900">
                  {getConversionPreview(parsedPrice, currency, exchangeRateUsdToUzs)}
                </span>
              </div>
            )}
          </div>

          {/* 5. Date ONLY (Purchase/due time removed as requested) */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              {dateLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 transition-colors"
                required
              />
            </div>
          </div>

          {/* 6. Custom Recurring Frequency (Only for Subscriptions and Recurring Bills) */}
          {type !== "purchase" && (
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
              <label className="block text-xs font-medium text-neutral-700">
                {t("frequency")}
              </label>
              <div className="grid grid-cols-[auto_4rem_minmax(0,1fr)] items-center gap-2">
                <span className="whitespace-nowrap text-xs text-neutral-500">{t("every")}</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={freqInterval}
                  onChange={(e) => setFreqInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 min-w-0 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-center text-xs focus:border-neutral-900 focus:outline-none"
                />
                <select
                  value={freqUnit}
                  onChange={(e) => setFreqUnit(e.target.value as FrequencyUnit)}
                  className="min-w-0 w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-xs font-medium focus:border-neutral-900 focus:outline-none"
                >
                  <option value="days">{t("days")}</option>
                  <option value="weeks">{t("weeks")}</option>
                  <option value="months">{t("months")}</option>
                  <option value="years">{t("years")}</option>
                </select>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-2xs"
            >
              {initialItem ? t("saveChanges") : t("createItem")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
