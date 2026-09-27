import React from "react";
import { 
  Menu, 
  Bell, 
  Plus, 
  ArrowRightLeft,
  DollarSign
} from "lucide-react";
import { CurrencyDisplayMode, AppPage } from "../../types";

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
  const pageTitles: Record<AppPage, string> = {
    home: "Overview",
    habits: "Habit Tracker",
    subscriptions: "Subscriptions",
    bills: "Recurring Bills",
    purchases: "One-Time Purchases",
    calendar: "Calendar",
    goals: "Goals & Budgets",
    settings: "Settings",
  };

  return (
    <header className="h-14 bg-white border-b border-neutral-200 px-4 md:px-6 flex items-center justify-between select-none shrink-0 sticky top-0 z-30 w-full">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 md:hidden"
          title="Open Menu"
        >
          <Menu size={18} />
        </button>

        <div>
          <h1 className="text-sm font-medium text-neutral-900">
            {pageTitles[currentPage] || "Overview"}
          </h1>
        </div>
      </div>

      {/* Right: Controls & New Item */}
      <div className="flex items-center gap-2">
        {/* Exchange Rate Badge */}
        <div 
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-neutral-600 bg-neutral-100 rounded-lg border border-neutral-200 font-medium"
          title="Exchange rate: 1 USD to UZS"
        >
          <span>1 USD = {exchangeRateUsdToUzs.toLocaleString()} UZS</span>
        </div>

        {/* In-App Notifications Button */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          title="Notifications"
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
          title="New Item"
        >
          <Plus size={14} />
          <span>New Item</span>
        </button>
      </div>
    </header>
  );
};
