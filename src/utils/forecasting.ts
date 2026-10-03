import { PaymentItem, CashFlowForecast, ForecastDay, ForecastProjectedItem, ItemType } from "../types";
import { convertCurrency, getNextRecurrenceDate } from "./calculations";
import { tashkentDateKey } from "./timezone";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Generates cash flow outflow projection over 30, 60, or 90 days
 * strictly for tracking and liquidity forecasting.
 */
export function calculateCashFlowForecast(
  items: PaymentItem[],
  daysHorizon: 30 | 60 | 90 = 30,
  exchangeRateUsdToUzs: number = 12800,
  filterType: "all" | "subscription" | "bill" = "all"
): CashFlowForecast {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + daysHorizon - 1);

  const startDateStr = tashkentDateKey(startDate);
  const endDateStr = tashkentDateKey(endDate);

  // Initialize timeline array for each day in horizon
  const timeline: ForecastDay[] = [];
  const dayMap = new Map<string, ForecastDay>();

  for (let i = 0; i < daysHorizon; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = tashkentDateKey(d);
    const dayOfWeek = DAY_NAMES[d.getDay()];
    const dayOfMonth = d.getDate();

    const dayObj: ForecastDay = {
      date: dateStr,
      dayOfWeek,
      dayOfMonth,
      totalUsd: 0,
      totalUzs: 0,
      items: [],
    };
    timeline.push(dayObj);
    dayMap.set(dateStr, dayObj);
  }

  // Filter items matching requested scope
  const targetItems = items.filter((item) => {
    if (filterType === "all") {
      return item.type === "subscription" || item.type === "bill" || item.type === "purchase";
    }
    return item.type === filterType;
  });

  let totalSubscriptionUsd = 0;
  let totalBillUsd = 0;

  targetItems.forEach((item) => {
    if (!item.date || item.price <= 0) return;

    const isRecurring = (item.type === "subscription" || item.type === "bill") && item.frequency;

    if (!isRecurring) {
      // One-time or non-recurring
      if (item.manualStatus === "paid" || item.manualStatus === "skipped") return;
      const targetDay = dayMap.get(item.date);
      if (targetDay) {
        const itemUsd = convertCurrency(item.price, item.currency, "USD", exchangeRateUsdToUzs);
        const itemUzs = convertCurrency(item.price, item.currency, "UZS", exchangeRateUsdToUzs);

        targetDay.totalUsd += itemUsd;
        targetDay.totalUzs += itemUzs;
        targetDay.items.push({
          id: `${item.id}-ot-${item.date}`,
          originalItemId: item.id,
          name: item.name,
          type: item.type,
          price: item.price,
          currency: item.currency,
          date: item.date,
          icon: item.icon,
        });

        if (item.type === "subscription") totalSubscriptionUsd += itemUsd;
        else if (item.type === "bill") totalBillUsd += itemUsd;
      }
      return;
    }

    // Recurring Subscriptions and Bills
    let iterDate = item.date;
    const maxIterations = 300; // safety ceiling
    let loopCount = 0;

    // If initial date is before startDateStr, advance until inside horizon
    while (iterDate < startDateStr && loopCount < maxIterations) {
      const nextDate = getNextRecurrenceDate(iterDate, item.frequency);
      if (nextDate <= iterDate) break;
      iterDate = nextDate;
      loopCount++;
    }

    // Now record all occurrences that land within [startDateStr, endDateStr]
    while (iterDate <= endDateStr && loopCount < maxIterations) {
      const dayTarget = dayMap.get(iterDate);
      if (dayTarget) {
        // If this recurrence is the current active cycle and already marked paid/skipped, skip only this first cycle
        const isCurrentCyclePaid = (iterDate === item.date) && (item.manualStatus === "paid" || item.manualStatus === "skipped");

        if (!isCurrentCyclePaid) {
          const itemUsd = convertCurrency(item.price, item.currency, "USD", exchangeRateUsdToUzs);
          const itemUzs = convertCurrency(item.price, item.currency, "UZS", exchangeRateUsdToUzs);

          dayTarget.totalUsd += itemUsd;
          dayTarget.totalUzs += itemUzs;
          dayTarget.items.push({
            id: `${item.id}-proj-${iterDate}`,
            originalItemId: item.id,
            name: item.name,
            type: item.type,
            price: item.price,
            currency: item.currency,
            date: iterDate,
            icon: item.icon,
          });

          if (item.type === "subscription") totalSubscriptionUsd += itemUsd;
          else if (item.type === "bill") totalBillUsd += itemUsd;
        }
      }

      const nextDate = getNextRecurrenceDate(iterDate, item.frequency);
      if (nextDate <= iterDate) break;
      iterDate = nextDate;
      loopCount++;
    }
  });

  // Calculate totals and peak day
  let totalProjectedUsd = 0;
  let totalProjectedUzs = 0;
  let peakDay: CashFlowForecast["peakDay"] = null;

  timeline.forEach((day) => {
    totalProjectedUsd += day.totalUsd;
    totalProjectedUzs += day.totalUzs;

    if (day.totalUsd > 0) {
      if (!peakDay || day.totalUsd > peakDay.totalUsd) {
        peakDay = {
          date: day.date,
          totalUsd: day.totalUsd,
          totalUzs: day.totalUzs,
          itemsCount: day.items.length,
        };
      }
    }
  });

  return {
    daysHorizon,
    startDate: startDateStr,
    endDate: endDateStr,
    totalProjectedUsd,
    totalProjectedUzs,
    subscriptionShareUsd: totalSubscriptionUsd,
    billShareUsd: totalBillUsd,
    dailyAverageUsd: totalProjectedUsd / daysHorizon,
    peakDay,
    timeline,
  };
}
