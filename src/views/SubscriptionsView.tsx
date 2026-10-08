import React, { useState } from "react";
import { Filter, LayoutGrid, List } from "lucide-react";
import { motion } from "motion/react";
import { PaymentItem, CurrencyCode, CurrencyDisplayMode } from "../types";
import { PaymentItemRow } from "../components/PaymentItemRow";
import { PaymentItemCard } from "../components/PaymentItemCard";
import { getItemStatus } from "../utils/calculations";
import { useI18n } from "../i18n";
import { setSectionFilter, setSectionView, useUiPreferences } from "../services/uiPreferences";

interface SubscriptionsViewProps {
  items: PaymentItem[];
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
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  items,
  displayCurrency,
  exchangeRateUsdToUzs,
  onViewDetail,
  onEdit,
  onManageReminders,
  onViewStatistics,
  onViewHistory,
  onDelete,
  onTogglePaid,
}) => {
  const { t } = useI18n();
  const uiPreferences = useUiPreferences();
  const viewMode = uiPreferences.views.subscriptions;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filter = uiPreferences.filters.subscriptions;

  const subs = items.filter((i) => i.type === "subscription");

  const filteredSubs = subs.filter((s) => {
    if (filter === "all") return true;
    const status = getItemStatus(s);
    if (filter === "active") return status !== "paid" && status !== "skipped";
    return status === filter;
  });

  const hasActiveFilters = filter !== "all";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="mmv-page space-y-4 w-full pb-12 select-none min-w-0 overflow-hidden"
    >
      {/* Header: Title and counter badge with View Toggle & Hopper Filter Icon */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-medium text-neutral-900">{t("subscriptions")}</h2>
          <span className="mmv-count-badge px-2 py-0.5 rounded-md text-xs font-medium">
            {subs.length}
          </span>
        </div>

        {/* View Toggle Icon (before Hopper) & Hopper Filter Icon */}
        <div className="flex items-center gap-1.5">
          {/* View Toggle: toggles icon between LayoutGrid and List */}
          <button
            type="button"
            onClick={() => setSectionView("subscriptions", viewMode === "list" ? "card" : "list")}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors"
            title={viewMode === "list" ? "Switch to card view" : "Switch to list view"}
          >
            {viewMode === "list" ? <LayoutGrid size={15} /> : <List size={15} />}
          </button>

          {/* Hopper Filter Icon */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-1.5 rounded-lg border transition-colors relative ${
              isFilterOpen || hasActiveFilters
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700"
            }`}
            title="Filter subscriptions"
          >
            <Filter size={15} />
            {hasActiveFilters && !isFilterOpen && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-600" />
            )}
          </button>
        </div>
      </div>

      {/* Grouped Filtration below header toggled by Hopper icon */}
      {isFilterOpen && (
        <div className="p-3 rounded-lg border border-neutral-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-in fade-in duration-100">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(["all", "active", "overdue", "due_today", "upcoming", "paid"] as const).map((f) => {
              const labels = {
                all: "All",
                active: "Active",
                overdue: "Overdue",
                due_today: "Due Today",
                upcoming: "Upcoming",
                paid: "Paid",
              };
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSectionFilter("subscriptions", f)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    filter === f
                      ? "bg-neutral-900 text-white shadow-2xs"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Subscription List or Card Grid */}
      {filteredSubs.length === 0 ? (
        <div className="p-10 text-center border border-neutral-200 rounded-lg bg-white text-xs text-neutral-400">
          <p>{t("noItems")}</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {filteredSubs.map((item) => (
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSubs.map((item) => (
            <PaymentItemCard
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
    </motion.div>
  );
};
