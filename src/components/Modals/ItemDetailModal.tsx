import React, { useEffect, useRef, useState } from "react";
import {
  BarChart2,
  Bell,
  Calendar,
  CheckCircle2,
  Edit2,
  History,
  MoreVertical,
  RotateCcw,
  SkipForward,
  Trash2,
  X,
} from "lucide-react";
import type { CurrencyDisplayMode, PaymentItem } from "../../types";
import { ServiceIcon } from "../ServiceIcon";
import { formatFrequency, getItemDualPrice, getItemStatus } from "../../utils/calculations";
import { formatDateDDMMYYYY } from "../../utils/dateFormat";
import { describePaymentReminder } from "../../services/paymentReminderSchedule";

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PaymentItem | null;
  displayCurrency: CurrencyDisplayMode;
  exchangeRateUsdToUzs: number;
  onEdit: (item: PaymentItem) => void;
  onManageReminders: (item: PaymentItem) => void;
  onViewStatistics: (item: PaymentItem) => void;
  onViewHistory: (item: PaymentItem) => void;
  onDelete: (item: PaymentItem) => void;
  onOpenCalendar: () => void;
  onUpdateStatus: (item: PaymentItem, status: "paid" | "skipped" | "upcoming") => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  displayCurrency,
  exchangeRateUsdToUzs,
  onEdit,
  onManageReminders,
  onViewStatistics,
  onViewHistory,
  onDelete,
  onOpenCalendar,
  onUpdateStatus,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) setMenuOpen(false);
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const status = getItemStatus(item);
  const statusLabel = status === "due_today" ? "Due today" : status.charAt(0).toUpperCase() + status.slice(1);
  const statusTone = status === "paid" ? "bg-emerald-100 text-emerald-800" : status === "overdue" ? "bg-rose-100 text-rose-700" : status === "due_today" ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-700";
  const dateLabel = item.type === "subscription" ? "Renewal" : item.type === "bill" ? "Due" : "Purchased";
  const typeLabel = item.type === "subscription" ? "Subscription" : item.type === "bill" ? "Recurring bill" : "Purchase";
  const { topText, bottomText } = getItemDualPrice(item.price, item.currency, displayCurrency, exchangeRateUsdToUzs);
  const activeReminders = (item.reminders || []).filter((reminder) => reminder.enabled);

  const run = (action: () => void) => {
    setMenuOpen(false);
    onClose();
    action();
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/45 p-3 backdrop-blur-xs select-none">
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: item.iconBgColor || "#2563EB" }}><ServiceIcon icon={item.icon} size={18} /></span>
          <div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-2"><h3 className="truncate text-sm font-semibold text-neutral-900">{item.name}</h3><span className="shrink-0 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[9px] font-medium text-neutral-600">{typeLabel}</span></div><span className={`mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${statusTone}`}>{statusLabel}</span></div>
          <div className="relative" ref={menuRef}>
            <button type="button" onClick={() => setMenuOpen((open) => !open)} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100" aria-label="Item actions"><MoreVertical size={18} /></button>
            {menuOpen ? <div className="absolute right-0 top-10 z-10 w-48 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
              {status !== "paid" ? <button type="button" onClick={() => { setMenuOpen(false); onUpdateStatus(item, "paid"); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-neutral-700 hover:bg-neutral-100"><CheckCircle2 size={14} />Mark as paid</button> : null}
              {status !== "skipped" ? <button type="button" onClick={() => { setMenuOpen(false); onUpdateStatus(item, "skipped"); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-neutral-700 hover:bg-neutral-100"><SkipForward size={14} />Mark as skipped</button> : null}
              {status === "paid" || status === "skipped" ? <button type="button" onClick={() => { setMenuOpen(false); onUpdateStatus(item, "upcoming"); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-neutral-700 hover:bg-neutral-100"><RotateCcw size={14} />Reset status</button> : null}
              <div className="my-1 border-t border-neutral-100" />
              <button type="button" onClick={() => run(() => onViewStatistics(item))} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-neutral-700 hover:bg-neutral-100"><BarChart2 size={14} />Statistics</button>
              <button type="button" onClick={() => run(() => onViewHistory(item))} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-neutral-700 hover:bg-neutral-100"><History size={14} />Payment history</button>
              <button type="button" onClick={() => run(() => onEdit(item))} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-neutral-700 hover:bg-neutral-100"><Edit2 size={14} />Edit item</button>
              <button type="button" onClick={() => run(() => onDelete(item))} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-rose-700 hover:bg-rose-50"><Trash2 size={14} />Delete item</button>
            </div> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="max-h-[68dvh] space-y-2.5 overflow-y-auto p-4 text-xs">
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div><span className="block text-[10px] text-neutral-500">Amount</span><strong className="mt-0.5 block truncate text-sm text-neutral-900">{topText}</strong></div>
            <div><span className="block text-[10px] text-neutral-500">Equivalent</span><strong className="mt-0.5 block truncate text-xs text-neutral-700">{bottomText}</strong></div>
            <div><span className="block text-[10px] text-neutral-500">Frequency</span><strong className="mt-0.5 block truncate text-xs text-neutral-700">{item.frequency ? formatFrequency(item.frequency) : "One time"}</strong></div>
          </div>

          <button type="button" onClick={() => run(onOpenCalendar)} className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left hover:bg-neutral-50">
            <span className="flex items-center gap-2 text-neutral-500"><Calendar size={14} />{dateLabel} date</span><span className="font-semibold tabular-nums text-neutral-900">{formatDateDDMMYYYY(item.date)}</span>
          </button>

          <div className="rounded-xl border border-neutral-200 bg-white p-3">
            <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 font-medium text-neutral-800"><Bell size={14} />Reminders</span><button type="button" onClick={() => run(() => onManageReminders(item))} className="text-[11px] font-medium text-emerald-700">Edit · {activeReminders.length}</button></div>
            {activeReminders.length ? <div className="mt-2 space-y-1.5">{activeReminders.slice(0, 5).map((reminder) => <div key={reminder.id} className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-2.5 py-2"><span className="truncate text-[11px] text-neutral-700">{describePaymentReminder(reminder)}</span><span className="shrink-0 font-medium tabular-nums text-neutral-900">{reminder.exactTime}</span></div>)}</div> : <p className="mt-2 text-[11px] text-neutral-500">No reminder is active.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
