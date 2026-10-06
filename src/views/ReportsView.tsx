import React, { useMemo, useRef, useState } from "react";
import { CalendarRange, CheckCircle2, ChevronRight, Clock3, MoreVertical, ReceiptText, TrendingUp, XCircle } from "lucide-react";
import { motion } from "motion/react";
import type { CurrencyDisplayMode, PaymentHistoryRecord, PaymentItem } from "../types";
import { convertCurrency, formatCurrency, getItemDisplayPrices, getItemStatus } from "../utils/calculations";
import { formatDateDDMMYYYY } from "../utils/dateFormat";
import { tashkentDateKey } from "../utils/timezone";
import { ServiceIcon } from "../components/ServiceIcon";

export type ReportSection = "overview" | "history" | "upcoming" | "monthly" | "yearly";

interface ReportsViewProps {
  items: PaymentItem[];
  records: PaymentHistoryRecord[];
  displayCurrency: CurrencyDisplayMode;
  exchangeRateUsdToUzs: number;
  section: ReportSection;
  onSectionChange: (section: ReportSection) => void;
  onViewDetail?: (item: PaymentItem) => void;
}

const sections: Array<{ id: ReportSection; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "history", label: "Payment history" },
  { id: "upcoming", label: "Upcoming payments" },
  { id: "monthly", label: "Monthly report" },
  { id: "yearly", label: "Yearly report" },
];

export const ReportsView: React.FC<ReportsViewProps> = ({ items, records, displayCurrency, exchangeRateUsdToUzs, section, onSectionChange, onViewDetail }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const today = tashkentDateKey();
  const year = today.slice(0, 4);
  const month = today.slice(0, 7);
  const active = items.filter((item) => item.manualStatus !== "paid" && item.manualStatus !== "skipped");
  const upcoming = active.filter((item) => item.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const overdue = active.filter((item) => getItemStatus(item) === "overdue");
  const thisMonthRecords = records.filter((record) => record.date.startsWith(month));
  const thisYearRecords = records.filter((record) => record.date.startsWith(year));

  const totals = (entries: Array<{ amount: number; originalCurrency: "USD" | "UZS" }>) => {
    const usd = entries.reduce((sum, entry) => sum + convertCurrency(entry.amount, entry.originalCurrency, "USD", exchangeRateUsdToUzs), 0);
    return { usd, uzs: usd * exchangeRateUsdToUzs };
  };
  const upcomingTotals = totals(upcoming.map((item) => ({ amount: item.price, originalCurrency: item.currency })));
  const monthTotals = totals(thisMonthRecords);
  const yearTotals = totals(thisYearRecords);

  const grouped = useMemo(() => {
    const map = new Map<string, PaymentHistoryRecord[]>();
    records.forEach((record) => {
      const key = section === "yearly" ? record.date.slice(0, 4) : record.date.slice(0, 7);
      map.set(key, [...(map.get(key) || []), record]);
    });
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [records, section]);

  const title = sections.find((entry) => entry.id === section)?.label || "Reports";
  const dualTotal = (value: { usd: number; uzs: number }) => <><strong className="block text-lg font-semibold text-neutral-900">{formatCurrency(value.usd, "USD")}</strong><span className="text-[11px] text-neutral-500">≈ {formatCurrency(value.uzs, "UZS")}</span></>;

  return <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mmv-page space-y-4 pb-12">
    <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
      <div><h2 className="text-base font-semibold text-neutral-900">Reports</h2><p className="mt-0.5 text-xs text-neutral-500">{title}</p></div>
      <div className="relative" ref={menuRef}>
        <button type="button" onClick={() => setMenuOpen((open) => !open)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600" aria-label="Choose report"><MoreVertical size={18} /></button>
        {menuOpen ? <><button type="button" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} aria-label="Close reports menu" /><div className="absolute right-0 top-11 z-20 w-52 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">{sections.map((entry) => <button key={entry.id} type="button" onClick={() => { onSectionChange(entry.id); setMenuOpen(false); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs ${section === entry.id ? "bg-neutral-900 font-medium text-white" : "text-neutral-700 hover:bg-neutral-100"}`}><span>{entry.label}</span>{section === entry.id ? <ChevronRight size={14} /> : null}</button>)}</div></> : null}
      </div>
    </div>

    {section === "overview" ? <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button type="button" onClick={() => onSectionChange("upcoming")} className="min-h-28 rounded-xl border border-neutral-200 bg-white p-3 text-left"><Clock3 size={16} className="mb-3 text-sky-600" /><span className="text-[10px] uppercase tracking-wide text-neutral-500">Upcoming</span><strong className="mt-1 block text-xl text-neutral-900">{upcoming.length}</strong></button>
        <button type="button" onClick={() => onSectionChange("history")} className="min-h-28 rounded-xl border border-neutral-200 bg-white p-3 text-left"><CheckCircle2 size={16} className="mb-3 text-emerald-600" /><span className="text-[10px] uppercase tracking-wide text-neutral-500">Paid records</span><strong className="mt-1 block text-xl text-neutral-900">{records.length}</strong></button>
        <div className="min-h-28 rounded-xl border border-neutral-200 bg-white p-3"><XCircle size={16} className="mb-3 text-rose-600" /><span className="text-[10px] uppercase tracking-wide text-neutral-500">Overdue</span><strong className="mt-1 block text-xl text-neutral-900">{overdue.length}</strong></div>
        <button type="button" onClick={() => onSectionChange("monthly")} className="min-h-28 rounded-xl border border-neutral-200 bg-white p-3 text-left"><TrendingUp size={16} className="mb-3 text-violet-600" /><span className="text-[10px] uppercase tracking-wide text-neutral-500">This month</span><strong className="mt-1 block text-sm text-neutral-900">{formatCurrency(monthTotals.usd, "USD")}</strong></button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4"><span className="text-[11px] font-medium text-neutral-500">Upcoming commitment</span><div className="mt-2">{dualTotal(upcomingTotals)}</div></div>
        <button type="button" onClick={() => onSectionChange("monthly")} className="rounded-xl border border-neutral-200 bg-white p-4 text-left"><span className="text-[11px] font-medium text-neutral-500">Month paid</span><div className="mt-2">{dualTotal(monthTotals)}</div></button>
        <button type="button" onClick={() => onSectionChange("yearly")} className="rounded-xl border border-neutral-200 bg-white p-4 text-left"><span className="text-[11px] font-medium text-neutral-500">Year paid</span><div className="mt-2">{dualTotal(yearTotals)}</div></button>
      </div>
    </> : null}

    {section === "upcoming" ? <div className="space-y-2">{upcoming.length ? upcoming.map((item) => { const prices = getItemDisplayPrices(item, displayCurrency, exchangeRateUsdToUzs); return <button key={item.id} type="button" onClick={() => onViewDetail?.(item)} className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: item.iconBgColor || "#2563EB" }}><ServiceIcon icon={item.icon} size={17} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-neutral-900">{item.name}</strong><span className="mt-0.5 block text-[10px] tabular-nums text-neutral-500">{formatDateDDMMYYYY(item.date)}</span></span><span className="text-right"><strong className="block text-xs text-neutral-900">{prices.primaryPrice}</strong><span className="text-[10px] text-neutral-500">{prices.secondaryPrice}</span></span></button>; }) : <Empty text="No upcoming payments." />}</div> : null}

    {section === "history" ? <div className="space-y-2">{records.length ? [...records].sort((a, b) => b.date.localeCompare(a.date)).map((record) => <div key={record.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><ReceiptText size={15} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-neutral-900">{record.itemName}</strong><span className="text-[10px] text-neutral-500">{formatDateDDMMYYYY(record.date)}</span></span><strong className="text-xs text-neutral-900">{formatCurrency(record.amount, record.originalCurrency)}</strong></div>) : <Empty text="Payment history is empty." />}</div> : null}

    {section === "monthly" || section === "yearly" ? <div className="space-y-2">{grouped.length ? grouped.map(([period, entries]) => { const periodTotals = totals(entries); return <div key={period} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700"><CalendarRange size={16} /></span><span className="min-w-0 flex-1"><strong className="block text-xs text-neutral-900">{period}</strong><span className="text-[10px] text-neutral-500">{entries.length} payment{entries.length === 1 ? "" : "s"}</span></span><span className="text-right"><strong className="block text-xs text-neutral-900">{formatCurrency(periodTotals.usd, "USD")}</strong><span className="text-[10px] text-neutral-500">≈ {formatCurrency(periodTotals.uzs, "UZS")}</span></span></div>; }) : <Empty text="No report data yet." />}</div> : null}
  </motion.div>;
};

const Empty: React.FC<{ text: string }> = ({ text }) => <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-12 text-center text-xs text-neutral-500">{text}</div>;
