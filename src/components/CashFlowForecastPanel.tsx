import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  Filter, 
  ChevronRight, 
  Layers, 
  Sparkles 
} from "lucide-react";
import { PaymentItem, CurrencyCode } from "../types";
import { calculateCashFlowForecast } from "../utils/forecasting";
import { formatCurrency, convertCurrency } from "../utils/calculations";
import { ServiceIcon } from "./ServiceIcon";
import { formatDateDDMMYYYY } from "../utils/dateFormat";

interface CashFlowForecastPanelProps {
  items: PaymentItem[];
  displayCurrency: CurrencyCode;
  exchangeRateUsdToUzs: number;
  onSelectItem?: (item: PaymentItem) => void;
}

export const CashFlowForecastPanel: React.FC<CashFlowForecastPanelProps> = ({
  items,
  displayCurrency,
  exchangeRateUsdToUzs,
  onSelectItem,
}) => {
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30);
  const [filterType, setFilterType] = useState<"all" | "subscription" | "bill">("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const forecast = useMemo(() => {
    return calculateCashFlowForecast(items, horizon, exchangeRateUsdToUzs, filterType);
  }, [items, horizon, exchangeRateUsdToUzs, filterType]);

  // Selected date items
  const activeDay = useMemo(() => {
    if (!selectedDate) {
      // Default to peak day or first day with items
      const withItems = forecast.timeline.find((d) => d.items.length > 0);
      return forecast.peakDay
        ? forecast.timeline.find((d) => d.date === forecast.peakDay?.date) || withItems
        : withItems;
    }
    return forecast.timeline.find((d) => d.date === selectedDate);
  }, [forecast, selectedDate]);

  // Formatted totals in user's active display currency
  const totalInDisplay = convertCurrency(
    forecast.totalProjectedUsd,
    "USD",
    displayCurrency,
    exchangeRateUsdToUzs
  );

  const otherCurrency: CurrencyCode = displayCurrency === "USD" ? "UZS" : "USD";
  const totalInOther = convertCurrency(
    forecast.totalProjectedUsd,
    "USD",
    otherCurrency,
    exchangeRateUsdToUzs
  );

  const dailyAvgInDisplay = convertCurrency(
    forecast.dailyAverageUsd,
    "USD",
    displayCurrency,
    exchangeRateUsdToUzs
  );

  // Peak Day formatting
  const peakDayDisplay = forecast.peakDay
    ? convertCurrency(forecast.peakDay.totalUsd, "USD", displayCurrency, exchangeRateUsdToUzs)
    : 0;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-4">
      {/* Header with Title and Horizon Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0">
            <TrendingUp size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-medium text-neutral-900">Cash Flow Outflow Forecaster</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                Predictive
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Scheduled payment obligations from {forecast.startDate} to {forecast.endDate}
            </p>
          </div>
        </div>

        {/* Controls: Horizon & Filter */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Filter dropdown / toggle */}
          <div className="flex items-center p-0.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-2 py-1 rounded-md text-[11px] transition-colors ${
                filterType === "all"
                  ? "bg-white text-neutral-900 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType("subscription")}
              className={`px-2 py-1 rounded-md text-[11px] transition-colors ${
                filterType === "subscription"
                  ? "bg-white text-neutral-900 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Subs
            </button>
            <button
              type="button"
              onClick={() => setFilterType("bill")}
              className={`px-2 py-1 rounded-md text-[11px] transition-colors ${
                filterType === "bill"
                  ? "bg-white text-neutral-900 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Bills
            </button>
          </div>

          {/* Horizon Toggle */}
          <div className="flex items-center p-0.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-medium">
            {[30, 60, 90].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(h as 30 | 60 | 90)}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                  horizon === h
                    ? "bg-neutral-900 text-white shadow-2xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {h}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Projected Outflow */}
        <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/60">
          <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Total {horizon}-Day Outflow
          </div>
          <div className="text-lg font-medium text-neutral-900 tabular-nums">
            {formatCurrency(totalInDisplay, displayCurrency)}
          </div>
          <div className="text-[11px] font-medium text-neutral-500 mt-0.5 tabular-nums">
            ≈ {formatCurrency(totalInOther, otherCurrency)}
          </div>
        </div>

        {/* Peak Payment Spike Day */}
        <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/60">
          <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Peak Outflow Day
          </div>
          {forecast.peakDay ? (
            <div>
              <div className="text-lg font-medium text-neutral-900 tabular-nums">
                {formatCurrency(peakDayDisplay, displayCurrency)}
              </div>
              <div className="text-[11px] font-medium text-amber-700 mt-0.5 flex items-center gap-1">
                <span>{formatDateDDMMYYYY(forecast.peakDay.date)}</span>
                <span>•</span>
                <span>{forecast.peakDay.itemsCount} charge{forecast.peakDay.itemsCount > 1 ? "s" : ""}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-neutral-400 py-1">No payments scheduled</div>
          )}
        </div>

        {/* Daily Average Burn */}
        <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/60">
          <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Daily Projected Burn
          </div>
          <div className="text-lg font-medium text-neutral-900 tabular-nums">
            {formatCurrency(dailyAvgInDisplay, displayCurrency)}
          </div>
          <div className="text-[11px] font-medium text-neutral-500 mt-0.5">
            Normalized per day
          </div>
        </div>
      </div>

      {/* Interactive Timeline Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-neutral-700">
          <span>Projected Due Dates</span>
          <span className="text-[11px] text-neutral-500">
            Click any day with charges to inspect
          </span>
        </div>

        {/* Day bubbles horizontal grid / scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {forecast.timeline.map((day) => {
            const hasItems = day.items.length > 0;
            const isSelected = activeDay?.date === day.date;
            const isPeak = forecast.peakDay?.date === day.date;

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(day.date)}
                disabled={!hasItems}
                className={`min-w-[42px] py-1.5 px-1 rounded-md border text-center transition-colors flex flex-col items-center justify-center shrink-0 ${
                  isSelected
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : hasItems
                    ? isPeak
                      ? "border-amber-300 bg-amber-50/70 text-neutral-900 hover:bg-amber-100"
                      : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50"
                    : "border-transparent bg-neutral-50/40 text-neutral-300 cursor-default"
                }`}
                title={`${day.date} (${day.dayOfWeek}): ${day.items.length} payments`}
              >
                <span className="text-[9px] uppercase tracking-wider opacity-80">{day.dayOfWeek}</span>
                <span className="text-xs font-medium tabular-nums">{day.dayOfMonth}</span>
                {hasItems ? (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      isSelected ? "bg-white" : isPeak ? "bg-amber-600" : "bg-neutral-900"
                    }`}
                  />
                ) : (
                  <span className="w-1.5 h-1.5 mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Item Breakdown */}
      {activeDay && activeDay.items.length > 0 && (
        <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-neutral-500" />
              <span className="text-xs font-medium text-neutral-900">
                Scheduled Charges for {formatDateDDMMYYYY(activeDay.date)} ({activeDay.dayOfWeek})
              </span>
            </div>
            <div className="text-xs font-medium text-neutral-900 tabular-nums">
              Total: {formatCurrency(
                convertCurrency(activeDay.totalUsd, "USD", displayCurrency, exchangeRateUsdToUzs),
                displayCurrency
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            {activeDay.items.map((proj) => {
              const matchedItem = items.find((i) => i.id === proj.originalItemId);
              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    if (matchedItem && onSelectItem) {
                      onSelectItem(matchedItem);
                    }
                  }}
                  className={`p-2 rounded-md border border-neutral-200 bg-white flex items-center justify-between text-xs ${
                    onSelectItem ? "cursor-pointer hover:bg-neutral-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0">
                      <ServiceIcon icon={proj.icon} size={13} />
                    </div>
                    <span className="font-medium text-neutral-900 truncate">{proj.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-100 text-neutral-600 border border-neutral-200">
                      {proj.type === "subscription" ? "Subscription" : "Bill"}
                    </span>
                  </div>

                  <div className="font-medium text-neutral-900 tabular-nums shrink-0 ml-2">
                    {formatCurrency(proj.price, proj.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
