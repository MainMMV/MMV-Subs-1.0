export type ItemType = "subscription" | "bill" | "purchase";

export interface ItemReminder {
  id: string;
  timing: "before" | "on_date" | "after";
  duration: number;
  unit: "minutes" | "hours" | "days" | "weeks";
  exactTime?: string;
  channel: "in_app" | "telegram" | "both";
  enabled: boolean;
  onlyIfUnpaid?: boolean;
}

export interface PaymentItem {
  id: string;
  type: ItemType;
  name: string;
  price: number;
  currency: "USD" | "UZS";
  date: string;
  time?: string;
  notes?: string;
  frequency?: { interval: number; unit: "days" | "weeks" | "months" | "years" };
  reminders?: ItemReminder[];
  manualStatus?: "paid" | "skipped" | null;
}

export interface HabitReminder {
  id: string;
  time: string;
  days?: number[];
  incompleteOnly: boolean;
  enabled: boolean;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  type: string;
  unit?: string;
  targetValue?: number;
  scheduleType: string;
  weekdays?: number[];
  customIntervalDays?: number;
  specificDates?: string[];
  weekdaySchedule?: boolean;
  weekendSchedule?: boolean;
  startDate: string;
  endDate?: string;
  isPaused: boolean;
  pausedAt?: string;
  reminders?: HabitReminder[];
}

export interface HabitLog {
  id?: string;
  habitId?: string;
  date?: string;
  completed?: boolean;
  value?: number;
  status?: string;
  completedAt?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: "USD" | "UZS";
  deadline?: string;
  isCompleted?: boolean;
}

export interface TelegramConfig {
  chatId?: string;
  isEnabled?: boolean;
  remindDaysBefore?: number[];
  notifyPastDue?: boolean;
}

export interface UserData {
  updatedAt?: string;
  telegramTestRequest?: { id: string; chatId: string; requestedAt: string };
  telegramTestResultId?: string;
  items?: PaymentItem[];
  subscriptions?: PaymentItem[];
  habits?: Habit[];
  habitLogs?: Record<string, Record<string, HabitLog>>;
  goals?: Goal[];
  telegramConfig?: TelegramConfig;
}

export interface LocalClock {
  date: string;
  time: string;
  weekday: number;
}
