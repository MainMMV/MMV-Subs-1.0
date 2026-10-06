import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Bell, Calendar, Check, ChevronUp, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import type { CurrencyCode, FrequencyUnit, ItemReminder, ItemType, PaymentItem } from "../../types";
import { ServiceIcon, AVAILABLE_ICONS } from "../ServiceIcon";
import { getConversionPreview } from "../../utils/calculations";
import { useI18n } from "../../i18n";
import { tashkentDateKey } from "../../utils/timezone";
import { formatDateDDMMYYYY, normalizeTimeHHMM, parseDateDDMMYYYY } from "../../utils/dateFormat";
import { describePaymentReminder } from "../../services/paymentReminderSchedule";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<PaymentItem>) => void;
  initialItem?: PaymentItem | null;
  defaultType?: ItemType;
  exchangeRateUsdToUzs: number;
}

const SMART_REMINDERS: ReadonlyArray<Omit<ItemReminder, "id">> = [
  { timing: "before", duration: 5, unit: "days", exactTime: "09:00", channel: "both", enabled: true },
  { timing: "before", duration: 1, unit: "days", exactTime: "09:00", channel: "both", enabled: true },
  { timing: "before", duration: 1, unit: "hours", exactTime: "09:00", channel: "both", enabled: true },
  { timing: "after", duration: 1, unit: "days", exactTime: "09:00", channel: "both", enabled: true, onlyIfUnpaid: true },
  { timing: "after", duration: 3, unit: "days", exactTime: "09:00", channel: "both", enabled: true, onlyIfUnpaid: true },
];

function makeReminder(template: Partial<ItemReminder> = {}): ItemReminder {
  return {
    id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timing: "before",
    duration: 1,
    unit: "days",
    exactTime: "09:00",
    channel: "both",
    enabled: true,
    ...template,
  };
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
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [date, setDate] = useState("");
  const [dateText, setDateText] = useState("");
  const [freqInterval, setFreqInterval] = useState(1);
  const [freqUnit, setFreqUnit] = useState<FrequencyUnit>("months");
  const [reminders, setReminders] = useState<ItemReminder[]>([]);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nativeDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const nextDate = initialItem?.date || tashkentDateKey();
    setType(initialItem?.type || defaultType);
    setName(initialItem?.name || "");
    setNotes(initialItem?.notes || "");
    setIcon(initialItem?.icon || "credit-card");
    setIconBgColor(initialItem?.iconBgColor || "#2563EB");
    setPrice(initialItem ? String(initialItem.price) : "");
    setCurrency(initialItem?.currency || "USD");
    setDate(nextDate);
    setDateText(formatDateDDMMYYYY(nextDate));
    setFreqInterval(initialItem?.frequency?.interval || 1);
    setFreqUnit(initialItem?.frequency?.unit || "months");
    setReminders(initialItem?.reminders ? [...initialItem.reminders] : []);
    setIsRemindersOpen(Boolean(initialItem?.reminders?.length));
    setEditingReminderId(null);
    setIsIconPickerOpen(false);
    setError(null);
  }, [initialItem, isOpen, defaultType]);

  const parsedPrice = Number(price) || 0;
  const dateLabel = type === "subscription" ? t("renewalDate") : type === "bill" ? t("dueDate") : t("purchaseDate");
  const itemTypeLabel = type === "subscription" ? t("subscription") : type === "bill" ? t("recurringBill") : t("oneTimePurchase");
  const enabledCount = reminders.filter((reminder) => reminder.enabled).length;
  const hasSmartPlan = useMemo(() => SMART_REMINDERS.every((preset) => reminders.some((reminder) =>
    reminder.timing === preset.timing && reminder.duration === preset.duration && reminder.unit === preset.unit
  )), [reminders]);

  if (!isOpen) return null;

  const updateReminder = (id: string, updates: Partial<ItemReminder>) => {
    setReminders((current) => current.map((reminder) => reminder.id === id ? { ...reminder, ...updates } : reminder));
  };

  const addSmartPlan = () => {
    setReminders((current) => {
      const additions = SMART_REMINDERS
        .filter((preset) => !current.some((reminder) => reminder.timing === preset.timing && reminder.duration === preset.duration && reminder.unit === preset.unit))
        .map((preset) => makeReminder(preset));
      return [...current, ...additions];
    });
    setIsRemindersOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedDate = parseDateDDMMYYYY(dateText);
    if (!name.trim()) return setError("Please enter an item name.");
    if (!Number.isFinite(Number(price)) || Number(price) < 0) return setError("Please enter a valid price.");
    if (!parsedDate) return setError("Use date format DD.MM.YYYY.");
    if (reminders.some((reminder) => !normalizeTimeHHMM(reminder.exactTime))) return setError("Use reminder time format HH:MM (00:00–23:59).");

    onSave({
      ...(initialItem?.id ? { id: initialItem.id } : {}),
      type,
      name: name.trim(),
      icon,
      iconBgColor,
      notes: notes.trim() || undefined,
      price: Number(price),
      currency,
      date: parsedDate,
      reminders: reminders.map((reminder) => ({ ...reminder, exactTime: normalizeTimeHHMM(reminder.exactTime) || "09:00" })),
      frequency: type === "purchase" ? undefined : { interval: Math.max(1, Number(freqInterval) || 1), unit: freqUnit },
    });
    onClose();
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-900/45 px-3 py-[max(2rem,env(safe-area-inset-top))] backdrop-blur-xs select-none">
      <div onClick={(event) => event.stopPropagation()} className="flex max-h-[calc(100dvh-4rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <div className="min-w-0"><h3 className="truncate text-sm font-medium text-neutral-900">{initialItem ? t("edit") : t("newItem")} · {itemTypeLabel}</h3><p className="mt-0.5 text-[10px] text-neutral-500">DD.MM.YYYY · HH:MM</p></div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800" aria-label={t("close")}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 space-y-3 overflow-y-auto p-4">
          {error ? <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700"><AlertCircle size={14} />{error}</div> : null}

          <div><label className="mb-1 block text-xs font-medium text-neutral-700">{t("name")} <span className="text-rose-500">*</span></label><input value={name} onChange={(event) => setName(event.target.value)} placeholder={type === "subscription" ? "e.g. Netflix, Spotify" : type === "bill" ? "e.g. Internet, Electricity" : "e.g. Phone, Course"} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-neutral-900" autoFocus required /></div>

          <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-2">
            <button type="button" onClick={() => setIsIconPickerOpen((open) => !open)} className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium ${isIconPickerOpen ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-neutral-50 text-neutral-700"}`}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white" style={{ backgroundColor: iconBgColor }}><ServiceIcon icon={icon} size={14} /></span><span className="truncate">{t("icon")}</span></button>
            <button type="button" onClick={() => setIsRemindersOpen((open) => !open)} className={`flex min-w-0 items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold ${isRemindersOpen ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}><span className="flex min-w-0 items-center gap-2"><Bell size={15} /><span className="truncate">Strong reminders</span></span><span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-emerald-800">{enabledCount}</span></button>
          </div>

          {isIconPickerOpen ? <div className="grid grid-cols-5 gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-7">{AVAILABLE_ICONS.map((item) => <button key={item.id} type="button" onClick={() => setIcon(item.id)} title={item.label} className={`flex aspect-square items-center justify-center rounded-lg border ${icon === item.id ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-600"}`}><ServiceIcon icon={item.id} size={16} /></button>)}</div> : null}

          {isRemindersOpen ? (
            <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
              <button type="button" onClick={addSmartPlan} disabled={hasSmartPlan} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2.5 text-xs font-semibold text-white shadow-sm disabled:bg-emerald-200 disabled:text-emerald-700">{hasSmartPlan ? <Check size={15} /> : <Sparkles size={15} />}{hasSmartPlan ? "Smart reminder plan added" : "Add 5-step smart reminder plan"}</button>
              <p className="text-[10px] leading-4 text-neutral-500">5 days early · 1 day early · 1 hour early · 1 and 3 days after if unpaid</p>
              <div className="max-h-64 space-y-1.5 overflow-y-auto pr-0.5">
                {reminders.map((reminder, index) => {
                  const editing = editingReminderId === reminder.id;
                  return <div key={reminder.id} className="rounded-lg border border-neutral-200 bg-white">
                    <div className="flex items-center gap-2 px-2.5 py-2"><input type="checkbox" checked={reminder.enabled} onChange={(event) => updateReminder(reminder.id, { enabled: event.target.checked })} className="rounded border-neutral-300 text-emerald-700" /><button type="button" onClick={() => setEditingReminderId(editing ? null : reminder.id)} className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"><span className="truncate text-[11px] font-medium text-neutral-800">{describePaymentReminder(reminder)} · {reminder.exactTime}</span>{editing ? <ChevronUp size={14} /> : <Pencil size={13} className="text-neutral-400" />}</button><button type="button" onClick={() => setReminders((current) => current.filter((entry) => entry.id !== reminder.id))} className="p-1 text-neutral-400 hover:text-rose-600" aria-label={`Delete reminder ${index + 1}`}><Trash2 size={13} /></button></div>
                    {editing ? <div className="grid grid-cols-2 gap-2 border-t border-neutral-100 p-2.5 text-[11px]">
                      <select value={reminder.timing} onChange={(event) => updateReminder(reminder.id, { timing: event.target.value as ItemReminder["timing"] })} className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-2"><option value="before">Before payment</option><option value="on_date">On payment date</option><option value="after">After payment</option></select>
                      <input value={reminder.exactTime} inputMode="numeric" maxLength={5} placeholder="09:00" onChange={(event) => updateReminder(reminder.id, { exactTime: event.target.value })} onBlur={(event) => updateReminder(reminder.id, { exactTime: normalizeTimeHHMM(event.target.value) || event.target.value })} className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-2" aria-label="Reminder time HH:MM" />
                      {reminder.timing !== "on_date" ? <><input type="number" min="1" max="999" value={reminder.duration} onChange={(event) => updateReminder(reminder.id, { duration: Math.max(1, Number(event.target.value) || 1) })} className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-2" /><select value={reminder.unit} onChange={(event) => updateReminder(reminder.id, { unit: event.target.value as ItemReminder["unit"] })} className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-2"><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option><option value="weeks">Weeks</option></select></> : null}
                      <select value={reminder.channel} onChange={(event) => updateReminder(reminder.id, { channel: event.target.value as ItemReminder["channel"] })} className="col-span-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-2"><option value="both">In-app + Telegram</option><option value="in_app">In-app only</option><option value="telegram">Telegram only</option></select>
                      {reminder.timing === "after" ? <label className="col-span-2 flex items-center gap-2 text-neutral-600"><input type="checkbox" checked={reminder.onlyIfUnpaid !== false} onChange={(event) => updateReminder(reminder.id, { onlyIfUnpaid: event.target.checked })} />Only remind if not marked paid</label> : null}
                    </div> : null}
                  </div>;
                })}
              </div>
              <button type="button" onClick={() => { const reminder = makeReminder(); setReminders((current) => [...current, reminder]); setEditingReminderId(reminder.id); }} className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-800"><Plus size={13} />Add custom reminder</button>
            </div>
          ) : null}

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3"><div className="mb-2 flex items-center justify-between gap-2"><label className="text-xs font-medium text-neutral-700">{t("price")}</label><span className="text-[10px] text-neutral-500">1 USD = {exchangeRateUsdToUzs.toLocaleString()} UZS</span></div><div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-2"><input type="number" step="any" min="0" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" className="min-w-0 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-neutral-900" required /><select value={currency} onChange={(event) => setCurrency(event.target.value as CurrencyCode)} className="rounded-lg border border-neutral-300 bg-white px-2 py-2.5 text-xs font-medium"><option value="USD">USD</option><option value="UZS">UZS</option></select></div>{parsedPrice > 0 ? <p className="mt-2 text-[10px] font-medium text-neutral-600">≈ {getConversionPreview(parsedPrice, currency, exchangeRateUsdToUzs)}</p> : null}</div>

          <div><label className="mb-1 block text-xs font-medium text-neutral-700">{dateLabel} <span className="text-rose-500">*</span></label><div className="relative"><input value={dateText} onChange={(event) => setDateText(event.target.value)} inputMode="numeric" maxLength={10} placeholder="DD.MM.YYYY" className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 pr-11 text-xs tabular-nums outline-none focus:border-neutral-900" required /><button type="button" onClick={() => nativeDateRef.current?.showPicker?.()} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-neutral-500" aria-label="Open date picker"><Calendar size={16} /></button><input ref={nativeDateRef} type="date" value={date} onChange={(event) => { setDate(event.target.value); setDateText(formatDateDDMMYYYY(event.target.value)); }} className="pointer-events-none absolute h-0 w-0 opacity-0" tabIndex={-1} /></div></div>

          {type !== "purchase" ? <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3"><label className="mb-2 block text-xs font-medium text-neutral-700">{t("frequency")}</label><div className="grid grid-cols-[auto_4rem_minmax(0,1fr)] items-center gap-2"><span className="text-xs text-neutral-500">{t("every")}</span><input type="number" min="1" max="365" value={freqInterval} onChange={(event) => setFreqInterval(Math.max(1, Number(event.target.value) || 1))} className="min-w-0 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-center text-xs" /><select value={freqUnit} onChange={(event) => setFreqUnit(event.target.value as FrequencyUnit)} className="min-w-0 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-xs"><option value="days">{t("days")}</option><option value="weeks">{t("weeks")}</option><option value="months">{t("months")}</option><option value="years">{t("years")}</option></select></div></div> : null}

          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-3"><button type="button" onClick={onClose} className="rounded-lg border border-neutral-200 px-3.5 py-2 text-xs font-medium text-neutral-700">{t("cancel")}</button><button type="submit" className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-sm">{initialItem ? t("saveChanges") : t("createItem")}</button></div>
        </form>
      </div>
    </div>
  );
};
