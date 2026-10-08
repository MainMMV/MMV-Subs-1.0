import React from "react";
import { 
  Menu, 
  Bell, 
  Plus, 
  ArrowRightLeft,
  DollarSign
} from "lucide-react";
import { CurrencyDisplayMode, AppPage } from "../../types";
import { useI18n } from "../../i18n";

interface TopNavbarProps {
  currentPage: AppPage;
  displayCurrency?: CurrencyDisplayMode;
  onSelectCurrencyMode?: (mode: CurrencyDisplayMode) => void;
  exchangeRateUsdToUzs: number;
  notificationCount: number;
  onOpenNotifications: () => void;
  onOpenAddModal: () => void;
  onOpenMobileMenu: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentPage,
  displayCurrency,
  onSelectCurrencyMode,
  exchangeRateUsdToUzs,
  notificationCount,
  onOpenNotifications,
  onOpenAddModal,
  onOpenMobileMenu,
}) => {
  const { t } = useI18n();
  const pageTitles: Record<AppPage, string> = {
    home: t("overview"),
    habits: t("habitTracker"),
    subscriptions: t("subscriptions"),
    bills: t("recurringBills"),
    purchases: t("oneTimePurchases"),
    calendar: t("calendar"),
    reports: t("reports"),
    goals: t("goalsBudgets"),
    settings: t("settings"),
  };

  return (
    <header className="h-14 bg-white border-b border-neutral-200 px-4 md:px-6 flex items-center justify-between select-none shrink-0 sticky top-0 z-30 w-full">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 md:hidden"
          title={t("openMenu")}
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-medium text-neutral-900">
            {pageTitles[currentPage] || t("overview")}
          </h1>
        </div>
      </div>

      {/* Right: Controls & New Item */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {/* Exchange Rate Badge */}
        <div 
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-neutral-600 bg-neutral-100 rounded-lg border border-neutral-200 font-medium"
          title={t("exchangeRate")}
        >
          <span>1 USD = {exchangeRateUsdToUzs.toLocaleString()} UZS</span>
        </div>

        {/* In-App Notifications Button */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          title={t("notifications")}
        >
          <Bell size={17} />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </button>

        {/* New Item Top Button */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
          title={t("newItem")}
        >
          <Plus size={14} />
          <span className="hidden sm:inline">{t("newItem")}</span>
        </button>
      </div>
    </header>
  );
};
