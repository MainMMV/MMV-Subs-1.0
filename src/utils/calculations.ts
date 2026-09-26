import { PaymentItem, PaymentStatus, CurrencyCode, CustomFrequency, PaymentHistoryRecord } from "../types";

/**
 * Currency conversion using manual exchange rate (1 USD = rate UZS)
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  exchangeRateUsdToUzs: number
): number {
  if (from === to) return amount;
  const rate = exchangeRateUsdToUzs || 12800;
  if (from === "USD" && to === "UZS") {
    return amount * rate;
  }
  if (from === "UZS" && to === "USD") {
    return rate > 0 ? amount / rate : 0;
  }
  return amount;
}

/**
 * Clean currency formatting
 */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const safeAmount = Number(amount) || 0;
  if (currency === "USD") {
    return `$${safeAmount.toLocaleString("en-US", {
      minimumFractionDigits: safeAmount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${Math.round(safeAmount).toLocaleString("en-US")} UZS`;
}

/**
 * Format currency conversion preview line (e.g. $10 USD ≈ 120,000 UZS)
 */
export function getConversionPreview(
  amount: number,
  currency: CurrencyCode,
  exchangeRateUsdToUzs: number
): string {
  const otherCurrency: CurrencyCode = currency === "USD" ? "UZS" : "USD";
  const converted = convertCurrency(amount, currency, otherCurrency, exchangeRateUsdToUzs);
  return `${formatCurrency(amount, currency)} ≈ ${formatCurrency(converted, otherCurrency)}`;
}

/**
 * Calculate dynamic status for an item
 */
export function getItemStatus(item: PaymentItem, now: Date = new Date()): PaymentStatus {
  if (item.manualStatus === "paid") return "paid";
  if (item.manualStatus === "skipped") return "skipped";

  if (!item.date) return "upcoming";

  const todayStr = now.toISOString().slice(0, 10);
  const itemDateStr = item.date.slice(0, 10);

  if (itemDateStr === todayStr) {
    return "due_today";
  }
  if (itemDateStr < todayStr) {
    return "overdue";
  }
  return "upcoming";
}

/**
 * Format custom frequency: "Every 2 days", "Every 1 month", etc.
 */
export function formatFrequency(freq?: CustomFrequency): string {
  if (!freq) return "One-time";
  const { interval, unit } = freq;
  const singularUnit = unit.replace(/s$/, "");
  if (interval === 1) {
    return `Every ${singularUnit}`;
  }
  return `Every ${interval} ${unit}`;
}

/**
 * Normalized monthly and yearly rate for a recurring item
 */
export function getNormalizedAnnualCost(item: PaymentItem): { monthly: number; yearly: number } {
  const price = Number(item.price) || 0;
  if (item.type === "purchase" || !item.frequency) {
    return { monthly: 0, yearly: 0 };
  }

  const { interval, unit } = item.frequency;
  const count = interval > 0 ? interval : 1;
  let annual = 0;

  switch (unit) {
    case "days":
      annual = (price / count) * 365;
      break;
    case "weeks":
      annual = (price / count) * 52;
      break;
    case "months":
      annual = (price / count) * 12;
      break;
    case "years":
      annual = price / count;
      break;
    default:
      annual = price * 12;
  }

  return {
    monthly: Math.round((annual / 12) * 100) / 100,
    yearly: Math.round(annual * 100) / 100,
  };
}

/**
 * Home Calculations: This Month & This Year total spending in both USD and UZS
 */
export function calculateHomeSpending(
  items: PaymentItem[],
  records: PaymentHistoryRecord[],
  exchangeRateUsdToUzs: number,
  now: Date = new Date()
) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Total for this month (combining paid records this month + due items this month)
  // Let's sum records that were paid this month/year, plus any items due this month
  let thisMonthUsd = 0;
  let thisYearUsd = 0;

  // From recorded history (confirmed payments)
  records.forEach((rec) => {
    const recDate = new Date(rec.date + "T00:00:00");
    if (isNaN(recDate.getTime())) return;
    const amountInUsd = convertCurrency(rec.amount, rec.originalCurrency, "USD", exchangeRateUsdToUzs);

    if (recDate.getFullYear() === currentYear) {
      thisYearUsd += amountInUsd;
      if (recDate.getMonth() === currentMonth) {
        thisMonthUsd += amountInUsd;
      }
    }
  });

  // Also include items due this month that are not yet recorded in history or marked paid
  items.forEach((item) => {
    if (!item.date) return;
    const d = new Date(item.date + "T00:00:00");
    if (isNaN(d.getTime())) return;

    // Check if this item already has a history record this month
    const alreadyRecorded = records.some(
      (r) => r.itemId === item.id && r.date.slice(0, 7) === item.date.slice(0, 7)
    );

    if (!alreadyRecorded) {
      const amountInUsd = convertCurrency(item.price, item.currency, "USD", exchangeRateUsdToUzs);
      if (d.getFullYear() === currentYear) {
        if (d.getMonth() === currentMonth) {
          thisMonthUsd += amountInUsd;
        }
      }
    }
  });

  return {
    thisMonth: {
      usd: thisMonthUsd,
      uzs: convertCurrency(thisMonthUsd, "USD", "UZS", exchangeRateUsdToUzs),
    },
    thisYear: {
      usd: thisYearUsd,
      uzs: convertCurrency(thisYearUsd, "USD", "UZS", exchangeRateUsdToUzs),
    },
  };
}

/**
 * Item Statistics accessed via 3-dot menu
 */
export function calculateItemStats(
  item: PaymentItem,
  records: PaymentHistoryRecord[],
  displayCurrency: CurrencyCode,
  exchangeRateUsdToUzs: number
) {
  const itemRecords = records.filter((r) => r.itemId === item.id);
  const paidRecords = itemRecords.filter((r) => r.status === "paid");

  let totalPaidInDisplay = 0;
  paidRecords.forEach((r) => {
    totalPaidInDisplay += convertCurrency(
      r.amount,
      r.originalCurrency,
      displayCurrency,
      exchangeRateUsdToUzs
    );
  });

  const numberOfPayments = paidRecords.length;

  const annualCost = getNormalizedAnnualCost(item);
  const monthlyInDisplay = convertCurrency(
    annualCost.monthly,
    item.currency,
    displayCurrency,
    exchangeRateUsdToUzs
  );
  const yearlyInDisplay = convertCurrency(
    annualCost.yearly,
    item.currency,
    displayCurrency,
    exchangeRateUsdToUzs
  );

  const sortedDates = [...paidRecords].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstPaymentDate = sortedDates.length > 0 ? sortedDates[0].date : (item.paidAt || item.date);
  const nextPaymentDate = item.date;

  return {
    totalPaid: totalPaidInDisplay,
    numberOfPayments,
    monthlySpending: monthlyInDisplay,
    yearlySpending: yearlyInDisplay,
    firstPayment: firstPaymentDate,
    nextPayment: nextPaymentDate,
  };
}

/**
 * Calculates next recurrence date (moves to next month/interval)
 */
export function getNextRecurrenceDate(currentDateStr: string, frequency?: CustomFrequency): string {
  if (!currentDateStr) {
    const today = new Date();
    today.setMonth(today.getMonth() + 1);
    return today.toISOString().slice(0, 10);
  }

  const [year, month, day] = currentDateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);

  if (!frequency) {
    // Default to 1 month next
    d.setMonth(d.getMonth() + 1);
  } else {
    const interval = Math.max(1, frequency.interval || 1);
    switch (frequency.unit) {
      case "days":
        d.setDate(d.getDate() + interval);
        break;
      case "weeks":
        d.setDate(d.getDate() + interval * 7);
        break;
      case "months":
        d.setMonth(d.getMonth() + interval);
        break;
      case "years":
        d.setFullYear(d.getFullYear() + interval);
        break;
      default:
        d.setMonth(d.getMonth() + 1);
    }
  }

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayStr = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayStr}`;
}

