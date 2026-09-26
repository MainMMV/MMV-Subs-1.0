import React, { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CalendarDays,
  CalendarSync,
  TrendingUp
} from "lucide-react";
import { motion } from "motion/react";
import { PaymentItem, CurrencyCode, GoogleCalendarSyncState } from "../types";
import { formatCurrency, convertCurrency } from "../utils/calculations";
import { PaymentItemRow } from "../components/PaymentItemRow";
import { CashFlowForecastPanel } from "../components/CashFlowForecastPanel";

type CalendarViewMode = "yearly" | "monthly" | "weekly" | "dayly";

interface CalendarViewProps {
  items: PaymentItem[];
  displayCurrency: CurrencyCode;
  exchangeRateUsdToUzs: number;
  onViewDetail?: (item: PaymentItem) => void;
  onEdit: (item: PaymentItem) => void;
  onManageReminders: (item: PaymentItem) => void;
  onViewStatistics: (item: PaymentItem) => void;
  onViewHistory: (item: PaymentItem) => void;
  onDelete: (item: PaymentItem) => void;
  onTogglePaid: (item: PaymentItem) => void;
  onOpenAddModal: () => void;
  onOpenCalendarSync?: () => void;
  calendarSyncState?: GoogleCalendarSyncState;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  items,
  displayCurrency,
  exchangeRateUsdToUzs,
  onViewDetail,
  onEdit,
  onManageReminders,
  onViewStatistics,
  onViewHistory,
  onDelete,
  onTogglePaid,
  onOpenCalendarSync,
  calendarSyncState,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarMode, setCalendarMode] = useState<CalendarViewMode>("monthly");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [showForecast, setShowForecast] = useState<boolean>(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers based on calendarMode
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (calendarMode === "yearly") {
      d.setFullYear(d.getFullYear() - 1);
    } else if (calendarMode === "monthly") {
      d.setMonth(d.getMonth() - 1);
    } else if (calendarMode === "weekly") {
      d.setDate(d.getDate() - 7);
    } else if (calendarMode === "dayly") {
      d.setDate(d.getDate() - 1);
      setSelectedDate(d.toISOString().slice(0, 10));
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (calendarMode === "yearly") {
      d.setFullYear(d.getFullYear() + 1);
    } else if (calendarMode === "monthly") {
      d.setMonth(d.getMonth() + 1);
    } else if (calendarMode === "weekly") {
      d.setDate(d.getDate() + 7);
    } else if (calendarMode === "dayly") {
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().slice(0, 10));
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().slice(0, 10));
  };

  // Header Title
  const getHeaderTitle = () => {
    if (calendarMode === "yearly") {
      return `${year}`;
    }
    if (calendarMode === "monthly") {
      return `${MONTH_NAMES[month]} ${year}`;
    }
    if (calendarMode === "weekly") {
      const d = new Date(currentDate);
      let dayOfWeek = d.getDay() - 1;
      if (dayOfWeek === -1) dayOfWeek = 6;
      d.setDate(d.getDate() - dayOfWeek);
      const startStr = `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
      d.setDate(d.getDate() + 6);
      const endStr = `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
      return `${startStr} – ${endStr}`;
    }
    // Dayly mode
    return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  };

  // Monthly Grid Data (Square Days)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const monthCalendarDays: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, d);
    monthCalendarDays.push({
      dateStr: prevDate.toISOString().slice(0, 10),
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    monthCalendarDays.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  const remaining = (7 - (monthCalendarDays.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d);
    monthCalendarDays.push({
      dateStr: nextDate.toISOString().slice(0, 10),
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  // Weekly Days (7 Square Days)
  const weekCalendarDays: Array<{ dateStr: string; dayNum: number; dayLabel: string }> = [];
  const weekLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const currD = new Date(currentDate);
  let dow = currD.getDay() - 1;
  if (dow === -1) dow = 6;
  currD.setDate(currD.getDate() - dow);

  for (let i = 0; i < 7; i++) {
    const dObj = new Date(currD);
    dObj.setDate(currD.getDate() + i);
    weekCalendarDays.push({
      dateStr: dObj.toISOString().slice(0, 10),
      dayNum: dObj.getDate(),
      dayLabel: weekLabels[i],
    });
  }

  // Selected Day Items
  const dayDateStr = calendarMode === "dayly" 
    ? currentDate.toISOString().slice(0, 10) 
    : selectedDate;
  const dayItems = items.filter((i) => i.date === dayDateStr);

  // Total daily amount calculation for dayly view or drawer
  let dailyTotalUSD = 0;
  dayItems.forEach((it) => {
    dailyTotalUSD += convertCurrency(it.price, it.currency, "USD", exchangeRateUsdToUzs);
  });
  const dailyTotalUZS = dailyTotalUSD * (exchangeRateUsdToUzs || 12800);

  // Formatted date string for drawer header
  const formattedSelectedDate = (() => {
    try {
      const [y, m, d] = dayDateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dayDateStr;
    }
  })();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="space-y-4 w-full pb-12 select-none min-w-0 overflow-hidden"
    >
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        {/* Navigation with left and right arrows between month/year title */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 transition-colors"
            title="Previous"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-sm font-medium text-neutral-900 px-2 min-w-[140px] text-center">
            {getHeaderTitle()}
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="p-1 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 transition-colors"
            title="Next"
          >
            <ChevronRight size={16} />
          </button>

          <button
            type="button"
            onClick={handleToday}
            className="ml-2 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Today
          </button>
        </div>

        {/* View Mode Selector with Icon: Yearly, Monthly, Weekly, Dayly */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <div className="flex items-center p-0.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium">
            <span className="px-2 text-neutral-400 flex items-center gap-1">
              <CalendarDays size={13} />
            </span>
            {(["yearly", "monthly", "weekly", "dayly"] as const).map((m) => {
              const labels: Record<CalendarViewMode, string> = {
                yearly: "Yearly",
                monthly: "Monthly",
                weekly: "Weekly",
                dayly: "Dayly",
              };
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setCalendarMode(m);
                    if (m === "dayly") {
                      setSelectedDate(currentDate.toISOString().slice(0, 10));
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    calendarMode === m
                      ? "bg-neutral-900 text-white shadow-2xs"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {labels[m]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Secondary Feature Action Bar: Google Calendar Sync & Cash Flow Forecaster */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-lg border border-neutral-200 bg-neutral-50/70 text-xs">
        <div className="flex items-center gap-2">
          {onOpenCalendarSync && (
            <button
              type="button"
              onClick={onOpenCalendarSync}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <CalendarSync size={14} className="text-neutral-600" />
              <span>Google Calendar Sync</span>
              {calendarSyncState?.isConnected ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" title="Connected" />
              ) : (
                <span className="text-[10px] text-neutral-400 font-normal">Connect</span>
              )}
            </button>
          )}

          {calendarSyncState?.isConnected && calendarSyncState.lastSyncedAt && (
            <span className="text-[11px] text-neutral-500 hidden sm:inline">
              Synced {calendarSyncState.syncedEventCount} events ({new Date(calendarSyncState.lastSyncedAt).toLocaleDateString()})
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowForecast(!showForecast)}
          className={`px-3 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 shadow-2xs ${
            showForecast
              ? "bg-neutral-900 border-neutral-900 text-white"
              : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          <TrendingUp size={14} />
          <span>{showForecast ? "Hide Forecast" : "Cash Flow Forecast (30/60/90d)"}</span>
        </button>
      </div>

      {/* CASH FLOW OUTFLOW FORECASTER EXPANDABLE PANEL */}
      {showForecast && (
        <CashFlowForecastPanel
          items={items}
          displayCurrency={displayCurrency}
          exchangeRateUsdToUzs={exchangeRateUsdToUzs}
          onSelectItem={onViewDetail || onEdit}
        />
      )}

      {/* 1. YEARLY VIEW: 12 compact month cards */}
      {calendarMode === "yearly" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {MONTH_NAMES.map((mName, mIdx) => {
              const prefix = `${year}-${String(mIdx + 1).padStart(2, "0")}`;
              const mItems = items.filter((i) => i.date.startsWith(prefix));
              const isCurrentM = new Date().getFullYear() === year && new Date().getMonth() === mIdx;

              return (
                <div
                  key={mName}
                  onClick={() => {
                    setCurrentDate(new Date(year, mIdx, 1));
                    setSelectedDate(`${year}-${String(mIdx + 1).padStart(2, "0")}-01`);
                    setCalendarMode("monthly");
                  }}
                  className={`p-3.5 rounded-lg border bg-white cursor-pointer hover:border-neutral-400 hover:shadow-2xs transition-all ${
                    isCurrentM ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-xs text-neutral-900">{mName}</span>
                    <span className="text-[10px] text-neutral-400">{year}</span>
                  </div>

                  <div className="py-2.5 flex items-center justify-center">
                    {mItems.length > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-900 text-white">
                        {mItems.length} {mItems.length === 1 ? "item" : "items"}
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-400">0 items</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-neutral-400 text-center">
            Click any month to view its detailed daily schedule.
          </p>
        </div>
      )}

      {/* 2. MONTHLY VIEW: Square Days (NxN) with clean centered item counts */}
      {calendarMode === "monthly" && (
        <div className="p-3 sm:p-4 rounded-lg border border-neutral-200 bg-white space-y-2.5">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center text-xs font-medium text-neutral-400 pb-1">
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
            <span>Su</span>
          </div>

          {/* Square Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {monthCalendarDays.map((d, idx) => {
              const dayItemsList = items.filter((i) => i.date === d.dateStr);
              const isSelected = d.dateStr === selectedDate;
              const isToday = d.dateStr === new Date().toISOString().slice(0, 10);

              return (
                <button
                  key={`${d.dateStr}-${idx}`}
                  type="button"
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`aspect-square p-1 rounded-md border flex flex-col items-center justify-center transition-all relative overflow-hidden ${
                    isSelected
                      ? "border-neutral-900 bg-neutral-50 ring-1.5 ring-neutral-900 shadow-2xs"
                      : isToday
                      ? "border-blue-300 bg-blue-50/30"
                      : d.isCurrentMonth
                      ? "border-neutral-100 bg-white hover:bg-neutral-50"
                      : "border-transparent bg-neutral-50/40 text-neutral-300 opacity-60"
                  }`}
                >
                  {/* Day Number */}
                  <span
                    className={`text-xs font-medium leading-none ${
                      isSelected
                        ? "text-neutral-900"
                        : isToday
                        ? "text-blue-600 font-semibold"
                        : d.isCurrentMonth
                        ? "text-neutral-800"
                        : "text-neutral-300"
                    }`}
                  >
                    {d.dayNum}
                  </span>

                  {/* Clean item badge below number: fits inside square without touching borders */}
                  {dayItemsList.length > 0 ? (
                    <span className="mt-1 w-4 h-4 rounded-full bg-neutral-900 text-white text-[9px] font-medium flex items-center justify-center shrink-0">
                      {dayItemsList.length}
                    </span>
                  ) : isToday ? (
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. WEEKLY VIEW: 7 Square Days stacked cleanly without horizontal collision */}
      {calendarMode === "weekly" && (
        <div className="p-3 sm:p-4 rounded-lg border border-neutral-200 bg-white space-y-2.5">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {weekCalendarDays.map((d) => {
              const dayItemsList = items.filter((i) => i.date === d.dateStr);
              const isSelected = d.dateStr === selectedDate;
              const isToday = d.dateStr === new Date().toISOString().slice(0, 10);

              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`aspect-square p-1.5 rounded-lg border flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? "border-neutral-900 bg-neutral-50 ring-1.5 ring-neutral-900 shadow-2xs"
                      : isToday
                      ? "border-blue-300 bg-blue-50/40"
                      : "border-neutral-200 bg-white hover:bg-neutral-50"
                  }`}
                >
                  <span className="text-[10px] text-neutral-400 font-medium uppercase leading-none mb-1">
                    {d.dayLabel}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-medium leading-none ${
                      isToday ? "text-blue-600 font-semibold" : "text-neutral-900"
                    }`}
                  >
                    {d.dayNum}
                  </span>

                  {dayItemsList.length > 0 ? (
                    <span className="mt-1.5 w-4 h-4 rounded-full bg-neutral-900 text-white text-[9px] font-medium flex items-center justify-center shrink-0">
                      {dayItemsList.length}
                    </span>
                  ) : (
                    <span className="mt-1.5 text-[10px] text-neutral-300 leading-none">—</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. DAYLY VIEW OR SELECTED DAY DRAWER (Hidden in Yearly view) */}
      {calendarMode !== "yearly" && (
        <div className="p-3.5 sm:p-4 rounded-lg border border-neutral-200 bg-white space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
            <div className="flex items-center gap-2">
              <CalendarIcon size={14} className="text-neutral-600" />
              <h3 className="text-xs font-medium text-neutral-900">
                Payments on {formattedSelectedDate}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {dayItems.length > 0 && (
                <span className="text-[11px] text-neutral-500 font-medium">
                  Total: {formatCurrency(dailyTotalUSD, "USD")} ≈ {formatCurrency(dailyTotalUZS, "UZS")}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-700">
                {dayItems.length} {dayItems.length === 1 ? "item" : "items"}
              </span>
            </div>
          </div>

          {dayItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No payments or subscriptions scheduled for this day.
            </div>
          ) : (
            <div className="space-y-2">
              {dayItems.map((item) => (
                <PaymentItemRow
                  key={item.id}
                  item={item}
                  displayCurrency={displayCurrency}
                  exchangeRateUsdToUzs={exchangeRateUsdToUzs}
                  onClick={onViewDetail}
                  onEdit={onEdit}
                  onManageReminders={onManageReminders}
                  onViewStatistics={onViewStatistics}
                  onViewHistory={onViewHistory}
                  onDelete={onDelete}
                  onTogglePaid={onTogglePaid}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
