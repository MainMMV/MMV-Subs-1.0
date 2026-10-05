export type ItemType = "subscription" | "bill" | "purchase";

export type FrequencyUnit = "days" | "weeks" | "months" | "years";

export interface CustomFrequency {
  interval: number;
  unit: FrequencyUnit;
}

export type PaymentStatus = "upcoming" | "due_today" | "paid" | "overdue" | "skipped";

export interface ItemReminder {
  id: string;
  timing: "before" | "on_date" | "after";
  duration: number; // e.g. 7, 1, 3
  unit: "minutes" | "hours" | "days" | "weeks";
  exactTime: string; // "09:00"
  channel: "in_app" | "telegram" | "both";
  enabled: boolean;
}

export interface PaymentItem {
  id: string;
  type: ItemType;
  name: string;
  icon: string;
  iconBgColor?: string;
  notes?: string;
  price: number;
  currency: "USD" | "UZS";
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  frequency?: CustomFrequency; // only for subscription and bill
  reminders: ItemReminder[];
  status: PaymentStatus;
  manualStatus?: "paid" | "skipped" | null;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistoryRecord {
  id: string;
  itemId: string;
  itemName: string;
  itemType: ItemType;
  date: string; // YYYY-MM-DD
  amount: number;
  originalCurrency: "USD" | "UZS";
  status: PaymentStatus;
  notes?: string;
}

export type CurrencyCode = "USD" | "UZS";

export type CurrencyDisplayMode = "default" | "USD" | "UZS";

export type AppTheme = "warm-dark" | "light";

export interface AppSettings {
  displayCurrency: CurrencyDisplayMode;
  exchangeRateUsdToUzs: number; // e.g. 12800 (1 USD = 12800 UZS)
  theme?: AppTheme;
}

export type AppPage = 
  | "home"
  | "habits"
  | "subscriptions"
  | "bills"
  | "purchases"
  | "calendar"
  | "goals"
  | "settings"
  | "more";

export * from "./types/habit";

export type GoalType = "budget_limit" | "savings_target" | "category_cap" | "bill_reserve";

export interface SpendingGoal {
  id: string;
  title: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  currency: CurrencyCode;
  imageUrl?: string;
  imagePositionY?: number; // 0 to 100 percentage for vertical focal repositioning
  period?: "monthly" | "yearly" | "custom";
  deadline?: string; // YYYY-MM-DD
  notes?: string;
  category?: ItemType | "all";
  isCompleted?: boolean;
  createdAt: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  botUsername?: string;
  isEnabled: boolean;
  remindDaysBefore: number[];
  notifyPastDue: boolean;
  lastNotifiedAt?: string;
}

export interface AlertLog {
  id: string;
  timestamp: string;
  type: "upcoming" | "past_due" | "reminder" | "test";
  title: string;
  details: string;
  status: "delivered" | "failed";
  error?: string;
}

export interface ForecastProjectedItem {
  id: string;
  originalItemId: string;
  name: string;
  type: ItemType;
  price: number;
  currency: CurrencyCode;
  date: string;
  icon: string;
}

export interface ForecastDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "Mon", "Tue", etc.
  dayOfMonth: number;
  totalUsd: number;
  totalUzs: number;
  items: ForecastProjectedItem[];
}

export interface CashFlowForecast {
  daysHorizon: 30 | 60 | 90;
  startDate: string;
  endDate: string;
  totalProjectedUsd: number;
  totalProjectedUzs: number;
  subscriptionShareUsd: number;
  billShareUsd: number;
  dailyAverageUsd: number;
  peakDay: {
    date: string;
    totalUsd: number;
    totalUzs: number;
    itemsCount: number;
  } | null;
  timeline: ForecastDay[];
}

export interface GoogleCalendarSyncState {
  isConnected: boolean;
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
  lastSyncedAt: string | null;
  syncedEventCount: number;
}

export interface InAppNotification {
  id: string;
  itemId: string;
  itemName: string;
  itemType: ItemType;
  price: number;
  currency: CurrencyCode;
  dueDate: string;
  daysUntilDue: number; // 0 for today, negative for overdue, positive for upcoming
  urgency: "overdue" | "due_today" | "upcoming";
  createdAt: string;
  read: boolean;
  dismissed: boolean;
}
