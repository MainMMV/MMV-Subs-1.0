import React, { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  CreditCard, 
  Repeat, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Target,
  TrendingUp,
  CalendarSync,
  Plus
} from "lucide-react";
import { motion } from "motion/react";
import { PaymentItem, PaymentHistoryRecord, CurrencyCode, CurrencyDisplayMode, SpendingGoal } from "../types";
import { 
  calculateHomeSpending, 
  formatCurrency, 
  getItemStatus, 
  convertCurrency 
} from "../utils/calculations";
import { calculateCashFlowForecast } from "../utils/forecasting";
import { PaymentItemRow } from "../components/PaymentItemRow";
import { ServiceIcon } from "../components/ServiceIcon";
import { useI18n } from "../i18n";
import { tashkentDateKey } from "../utils/timezone";

interface HomeViewProps {
  items: PaymentItem[];
  records: PaymentHistoryRecord[];
  goals?: SpendingGoal[];
  displayCurrency: CurrencyDisplayMode;
  exchangeRateUsdToUzs: number;
  onViewDetail?: (item: PaymentItem) => void;
  onEdit: (item: PaymentItem) => void;
  onManageReminders: (item: PaymentItem) => void;
  onViewStatistics: (item: PaymentItem) => void;
  onViewHistory: (item: PaymentItem) => void;
  onDelete: (item: PaymentItem) => void;
  onTogglePaid: (item: PaymentItem) => void;
  onOpenAddModal: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToGoals?: () => void;
  onOpenAddGoal?: () => void;
  onOpenCalendarSync?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  items,
  records,
  goals = [],
  displayCurrency,
  exchangeRateUsdToUzs,
  onViewDetail,
  onEdit,
  onManageReminders,
  onViewStatistics,
  onViewHistory,
  onDelete,
  onTogglePaid,
  onOpenAddModal,
  onNavigateToCalendar,
  onNavigateToGoals,
  onOpenAddGoal,
  onOpenCalendarSync,
}) => {
  const { t, locale } = useI18n();
  const [selectedDate, setSelectedDate] = useState<string>(
    tashkentDateKey()
  );

  // Month navigation for compact home calendar
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // 1. Total Spending Calculations (This Month & This Year in both USD and UZS)
  const spending = calculateHomeSpending(items, records, exchangeRateUsdToUzs);

  // 1.1 Cash Flow Forecaster (30 Days rolling projection)
  const forecast30 = calculateCashFlowForecast(items, 30, exchangeRateUsdToUzs);

  // 2. Overdue Payments (Needs immediate attention)
  const now = new Date();
  const overduePayments = items
    .filter((item) => getItemStatus(item, now) === "overdue")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2.1 Active / Upcoming Payments (Sorted by nearest date)
  const upcomingPayments = items
    .filter((item) => {
      const status = getItemStatus(item, now);
      return status === "due_today" || status === "upcoming";
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  // 3. Recent Payments (From recorded payment history)
  const recentPayments = [...records]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // 4. Compact Calendar Logic (Week starts Monday)
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const handlePrevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };

  // Generate days in month
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // Adjust so Monday is 0, Sunday is 6
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const calendarDays: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevMonthDate = new Date(year, month - 1, d);
    calendarDays.push({
      dateStr: tashkentDateKey(prevMonthDate),
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const currDate = new Date(year, month, d);
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  // Next month padding to complete 35 or 42 grid
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d);
    calendarDays.push({
      dateStr: tashkentDateKey(nextDate),
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  // Items on selected date
  const itemsOnSelectedDate = items.filter((i) => i.date === selectedDate);

  const monthNames = Array.from({ length: 12 }, (_, monthIndex) =>
    new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2026, monthIndex, 1))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="space-y-4 w-full pb-12 select-none min-w-0 overflow-hidden"
    >
      {/* TOTAL SPENDING & 30-DAY CASH FLOW FORECAST CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-w-0">
        {/* This Month Spending */}
        <div className="p-3.5 rounded-lg border border-neutral-200 bg-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
              {t("thisMonthSpending")}
            </span>
            <span className="text-[11px] text-neutral-400">
              {monthNames[month]} {year}
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="text-xl font-medium text-neutral-900 tracking-tight tabular-nums">
              {formatCurrency(spending.thisMonth.usd, "USD")}
            </div>
            <div className="text-xs font-medium text-neutral-500 tabular-nums">
              ≈ {formatCurrency(spending.thisMonth.uzs, "UZS")}
            </div>
          </div>
        </div>

        {/* This Year Spending */}
        <div className="p-3.5 rounded-lg border border-neutral-200 bg-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
              {t("thisYearSpending")}
            </span>
            <span className="text-[11px] text-neutral-400">
              {t("fullYear", { year })}
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="text-xl font-medium text-neutral-900 tracking-tight tabular-nums">
              {formatCurrency(spending.thisYear.usd, "USD")}
            </div>
            <div className="text-xs font-medium text-neutral-500 tabular-nums">
              ≈ {formatCurrency(spending.thisYear.uzs, "UZS")}
            </div>
          </div>
        </div>

        {/* 30-Day Outflow Forecast Card */}
        <div 
          onClick={onNavigateToCalendar}
          className="p-3.5 rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp size={12} className="text-neutral-500" />
              <span>{t("projectedOutflow")}</span>
            </span>
            <span className="text-[11px] font-medium text-neutral-600 group-hover:text-neutral-900 flex items-center gap-0.5">
              <span>{t("forecast")}</span>
              <ArrowRight size={10} />
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="text-xl font-medium text-neutral-900 tracking-tight tabular-nums">
              {formatCurrency(forecast30.totalProjectedUsd, "USD")}
            </div>
            <div className="text-xs font-medium text-neutral-500 tabular-nums flex items-center justify-between">
              <span>≈ {formatCurrency(forecast30.totalProjectedUzs, "UZS")}</span>
              {forecast30.peakDay && (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  {t("peak", { date: forecast30.peakDay.date.slice(5) })}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* GOALS SECTION IN HOME DASHBOARD */}
      {goals.length > 0 && (
        <section className="p-3.5 rounded-lg border border-neutral-200 bg-white space-y-2.5 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-neutral-700" />
              <h3 className="text-xs font-medium text-neutral-900">{t("spendingSavingsGoals")}</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                {goals.filter((g) => !g.isCompleted).length} {t("active")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onOpenAddGoal && (
                <button
                  type="button"
                  onClick={onOpenAddGoal}
                  className="text-[11px] font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100/80 hover:bg-neutral-200/80 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus size={11} />
                  <span>Add Goal</span>
                </button>
              )}
              {onNavigateToGoals && (
                <button
                  type="button"
                  onClick={onNavigateToGoals}
                  className="text-[11px] font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                >
                  <span>View all</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {goals.slice(0, 3).map((goal) => {
              const pct = goal.isCompleted
                ? 100
                : (goal.targetAmount > 0 
                    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                    : 0);
              const isOver = goal.type === "budget_limit" && goal.currentAmount > goal.targetAmount;
              return (
                <div 
                  key={goal.id} 
                  onClick={onNavigateToGoals}
                  className="p-2.5 rounded-lg border border-neutral-100 bg-neutral-50/60 hover:bg-neutral-100/70 transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-neutral-900 truncate">{goal.title}</span>
                    <span className={`text-[11px] font-medium shrink-0 ${goal.isCompleted ? "text-emerald-700" : isOver ? "text-rose-700" : "text-neutral-700"}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${goal.isCompleted ? "bg-emerald-600" : isOver ? "bg-rose-600" : "bg-neutral-900"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-500">
                    <span>{formatCurrency(goal.currentAmount, goal.currency)}</span>
                    <span>Target: {formatCurrency(goal.targetAmount, goal.currency)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Grid: Upcoming Payments (Left) & Home Calendar + Recent (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 min-w-0 items-start">
        {/* Left Column: Overdue and Upcoming Payments */}
        <div className="lg:col-span-7 space-y-4 min-w-0">
          {/* Overdue Payments Block (when overdue items exist) */}
          {overduePayments.length > 0 && (
            <div className="p-3.5 rounded-lg border border-rose-200/80 bg-rose-50/40 space-y-2.5 overdue-section-container">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-rose-800 font-medium text-xs">
                  <AlertCircle size={14} className="text-rose-600 shrink-0" />
                  <span>{t("overduePayments")}</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-rose-100 text-rose-700">
                    {overduePayments.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {overduePayments.map((item) => (
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
            </div>
          )}

          {/* Upcoming Payments */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-900">
                {t("upcomingPayments")}
              </h3>
              <span className="text-xs text-neutral-500">
                {upcomingPayments.length} upcoming
              </span>
            </div>

            {upcomingPayments.length === 0 ? (
              <div className="py-5 text-xs text-neutral-500">
                <p>{t("noUpcomingPayments")}</p>
                {items.length === 0 && (
                  <button type="button" onClick={onOpenAddModal} className="mt-2 inline-flex items-center gap-1.5 text-neutral-900 underline underline-offset-2 hover:opacity-75">
                    <Plus size={13} /> {t("addFirstPayment")}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingPayments.map((item) => (
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

          {/* 4.2 RECENT PAYMENTS */}
          <div className="pt-4 space-y-3">
            <h3 className="text-sm font-medium text-neutral-900">
              {t("recentPayments")}
            </h3>

            {recentPayments.length === 0 ? (
              <div className="py-3 text-xs text-neutral-500">
                {t("noRecentPayments")}
              </div>
            ) : (
              <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
                {recentPayments.map((record) => (
                  <div
                    key={record.id}
                    className="p-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <span className="font-medium text-neutral-900 block">
                          {record.itemName}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {record.date}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-medium text-neutral-900">
                        {formatCurrency(record.amount, record.originalCurrency)}
                      </span>
                      {record.originalCurrency !== displayCurrency && (
                        <span className="text-[11px] text-neutral-400 block">
                          ≈ {formatCurrency(
                            convertCurrency(
                              record.amount,
                              record.originalCurrency,
                              displayCurrency,
                              exchangeRateUsdToUzs
                            ),
                            displayCurrency
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 4.4 HOME CALENDAR (Compact) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-lg border border-neutral-200 bg-white space-y-3">
            {/* Header: arrows between month and year */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CalendarIcon size={15} className="text-neutral-700" />
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  title={t("previousMonth")}
                >
                  <ChevronLeft size={15} />
                </button>
                <h3 className="text-xs font-medium text-neutral-900 px-1">
                  {monthNames[month]} {year}
                </h3>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  title={t("nextMonth")}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Week days: Week starts on Monday */}
            <div className="grid grid-cols-7 text-center text-[11px] font-medium text-neutral-400 pb-1">
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
              <span>Su</span>
            </div>

            {/* Grid of square days */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((cd, idx) => {
                const isSelected = cd.dateStr === selectedDate;
                const isToday = cd.dateStr === tashkentDateKey();

                // Items on this day
                const dayItems = items.filter((i) => i.date === cd.dateStr);
                const hasSub = dayItems.some((i) => i.type === "subscription");
                const hasBill = dayItems.some((i) => i.type === "bill");
                const hasPur = dayItems.some((i) => i.type === "purchase");

                return (
                  <button
                    key={`${cd.dateStr}-${idx}`}
                    type="button"
                    onClick={() => setSelectedDate(cd.dateStr)}
                    className={`aspect-square rounded-md flex flex-col items-center justify-center relative transition-colors ${
                      isSelected
                        ? "bg-neutral-900 text-white font-medium shadow-2xs"
                        : isToday
                        ? "bg-neutral-100 text-neutral-900 font-medium"
                        : cd.isCurrentMonth
                        ? "text-neutral-800 hover:bg-neutral-50"
                        : "text-neutral-300"
                    }`}
                  >
                    <span className="text-xs">{cd.dayNum}</span>

                    {/* Color-coded indicators: Subscriptions (blue), Bills (emerald), Purchases (purple) */}
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {hasSub && (
                        <span
                          className={`w-1 h-1 rounded-full ${
                            isSelected ? "bg-blue-300" : "bg-blue-500"
                          }`}
                        />
                      )}
                      {hasBill && (
                        <span
                          className={`w-1 h-1 rounded-full ${
                            isSelected ? "bg-emerald-300" : "bg-emerald-500"
                          }`}
                        />
                      )}
                      {hasPur && (
                        <span
                          className={`w-1 h-1 rounded-full ${
                            isSelected ? "bg-purple-300" : "bg-purple-500"
                          }`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Subscription</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Bill</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>Purchase</span>
              </div>
            </div>
          </div>

          {/* Payments on Selected Date Panel */}
          <div className="p-4 rounded-lg border border-neutral-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-700">
                Scheduled on {selectedDate}
              </span>
              <span className="text-[11px] text-neutral-400">
                {itemsOnSelectedDate.length} item{itemsOnSelectedDate.length !== 1 ? "s" : ""}
              </span>
            </div>

            {itemsOnSelectedDate.length === 0 ? (
              <p className="text-xs text-neutral-400 py-3 text-center">
                No payments or reminders on this date.
              </p>
            ) : (
              <div className="space-y-2">
                {itemsOnSelectedDate.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onViewDetail?.(item)}
                    className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/60 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-neutral-200 flex items-center justify-center text-neutral-800">
                        <ServiceIcon icon={item.icon} size={13} />
                      </div>
                      <div>
                        <span className="font-medium text-neutral-900 block">{item.name}</span>
                        <span className="text-[10px] text-neutral-500">
                          {item.time || "09:00"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-medium text-neutral-900">
                        {formatCurrency(item.price, item.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={onNavigateToCalendar}
              className="w-full pt-2 flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <span>{t("openFullCalendar")}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
