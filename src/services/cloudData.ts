import type { AppTheme, CurrencyDisplayMode, PaymentHistoryRecord, PaymentItem, SpendingGoal, TelegramConfig, Habit, HabitLog } from "../types";

export interface CloudData {
  items: PaymentItem[];
  history: PaymentHistoryRecord[];
  habits: Habit[];
  habitLogs: Record<string, Record<string, HabitLog>>;
  goals: SpendingGoal[];
  telegramConfig: TelegramConfig;
  displayCurrency: CurrencyDisplayMode;
  exchangeRateUsdToUzs: number;
  theme: AppTheme;
}

export function resolveCloudData(local: CloudData, remote: Partial<CloudData> | null): "keep" | "restore" | "choose" {
  if (!remote) return "keep";
  const content = (data: Partial<CloudData>) => [data.items || [], data.history || [], data.habits || [], data.habitLogs || {}, data.goals || []];
  const localContent = content(local);
  const remoteContent = content(remote);
  const isEmpty = (data: unknown[]) => data.every((entry) => Array.isArray(entry) ? entry.length === 0 : Object.keys(entry as object).length === 0);
  if (isEmpty(remoteContent) || JSON.stringify(localContent) === JSON.stringify(remoteContent)) return "keep";
  if (isEmpty(localContent)) return "restore";
  return "choose";
}
