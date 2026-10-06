import React from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Home,
  ReceiptText,
  Settings,
  ShoppingBag,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { AppPage } from "../types";
import { useI18n, type TranslationKey } from "../i18n";
import { PastModuleView } from "./PastModuleView";
import { PAST_MODULES, type PastModuleId } from "../config/pastModules";

type ModuleDefinition = {
  id: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  page?: AppPage;
  action?: "notifications";
  countKey?: "subscriptions" | "bills" | "purchases" | "goals" | "notifications";
  tone: string;
};

// Keep every mobile module in this registry so future sections need one entry.
const MODULES: readonly ModuleDefinition[] = [
  { id: "today", labelKey: "today", icon: Home, page: "home", tone: "bg-emerald-50 text-emerald-700" },
  { id: "habits", labelKey: "habits", icon: CheckCircle2, page: "habits", tone: "bg-teal-50 text-teal-700" },
  { id: "subscriptions", labelKey: "subscriptions", icon: CreditCard, page: "subscriptions", countKey: "subscriptions", tone: "bg-sky-50 text-sky-700" },
  { id: "bills", labelKey: "recurringBills", icon: ReceiptText, page: "bills", countKey: "bills", tone: "bg-indigo-50 text-indigo-700" },
  { id: "purchases", labelKey: "oneTimePurchases", icon: ShoppingBag, page: "purchases", countKey: "purchases", tone: "bg-violet-50 text-violet-700" },
  { id: "calendar", labelKey: "calendar", icon: CalendarDays, page: "calendar", tone: "bg-cyan-50 text-cyan-700" },
  { id: "goals", labelKey: "goals", icon: Target, page: "goals", countKey: "goals", tone: "bg-amber-50 text-amber-700" },
  { id: "notifications", labelKey: "notifications", icon: Bell, action: "notifications", countKey: "notifications", tone: "bg-rose-50 text-rose-700" },
  { id: "settings", labelKey: "settings", icon: Settings, page: "settings", tone: "bg-neutral-100 text-neutral-700" },
];

interface NativeMoreViewProps {
  subscriptionsCount: number;
  billsCount: number;
  purchasesCount: number;
  goalsCount: number;
  notificationCount: number;
  onSelectPage: (page: AppPage) => void;
  onOpenNotifications: () => void;
  selectedPastModule: PastModuleId | null;
  onSelectPastModule: (moduleId: PastModuleId | null) => void;
}

export const NativeMoreView: React.FC<NativeMoreViewProps> = ({
  subscriptionsCount,
  billsCount,
  purchasesCount,
  goalsCount,
  notificationCount,
  onSelectPage,
  onOpenNotifications,
  selectedPastModule,
  onSelectPastModule,
}) => {
  const { t } = useI18n();
  const counts = {
    subscriptions: subscriptionsCount,
    bills: billsCount,
    purchases: purchasesCount,
    goals: goalsCount,
    notifications: notificationCount,
  };

  if (selectedPastModule) {
    return <PastModuleView moduleId={selectedPastModule} onBack={() => onSelectPastModule(null)} />;
  }

  return (
    <section className="mmv-page space-y-4 pb-4" aria-label={t("openAllSections")}>
      <div>
        <h2 className="text-lg font-medium text-neutral-900">{t("allModules")}</h2>
        <p className="mt-1 text-xs text-neutral-500">{t("allModulesDescription")}</p>
      </div>

      <div className="grid grid-cols-3 gap-x-2 gap-y-5 py-2">
        {MODULES.map(({ id, page, action, labelKey, countKey, icon: Icon, tone }) => {
          const count = countKey ? counts[countKey] : undefined;
          return (
            <button
              key={id}
              type="button"
              onClick={() => action === "notifications" ? onOpenNotifications() : page && onSelectPage(page)}
              className="group flex min-w-0 flex-col items-center gap-2 rounded-2xl px-1 py-1 text-center transition-transform duration-150 active:scale-95"
              aria-label={t(labelKey)}
            >
              <span className={`relative flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-current/10 shadow-sm transition-transform duration-200 group-active:scale-95 ${tone}`}>
                <Icon size={25} strokeWidth={1.8} aria-hidden="true" />
                {count !== undefined && count > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-neutral-900 px-1 text-[9px] font-semibold tabular-nums text-white">
                    {Math.min(count, 99)}
                  </span>
                ) : null}
              </span>
              <span className="line-clamp-2 min-h-8 w-full break-words text-[11px] font-medium leading-4 text-neutral-700 [overflow-wrap:anywhere]">
                {t(labelKey)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="pt-2">
        <h3 className="text-sm font-medium text-neutral-900">{t("mmvClassics")}</h3>
        <p className="mt-1 text-xs leading-5 text-neutral-500">{t("mmvClassicsDescription")}</p>
      </div>

      <div className="grid grid-cols-3 gap-x-2 gap-y-5 py-2">
        {PAST_MODULES.map(({ id, labelKey, icon: Icon, tone }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelectPastModule(id)}
            className="group flex min-w-0 flex-col items-center gap-2 rounded-2xl px-1 py-1 text-center transition-transform duration-150 active:scale-95"
            aria-label={t(labelKey)}
          >
            <span className={`flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-current/10 shadow-sm transition-transform duration-200 group-active:scale-95 ${tone}`}>
              <Icon size={25} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="line-clamp-2 min-h-8 w-full break-words text-[11px] font-medium leading-4 text-neutral-700 [overflow-wrap:anywhere]">
              {t(labelKey)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
