import React, { useState } from "react";
import { Filter, LayoutGrid, List } from "lucide-react";
import { motion } from "motion/react";
import { PaymentItem, CurrencyCode } from "../types";
import { PaymentItemRow } from "../components/PaymentItemRow";
import { PaymentItemCard } from "../components/PaymentItemCard";
import { getItemStatus } from "../utils/calculations";

interface RecurringBillsViewProps {
  items: PaymentItem[];
  displayCurrency: CurrencyCode;
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

export const RecurringBillsView: React.FC<RecurringBillsViewProps> = ({
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
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "upcoming" | "due_today" | "overdue" | "paid">("all");

  const bills = items.filter((i) => i.type === "bill");

  const filteredBills = bills.filter((b) => {
    if (filter === "all") return true;
    const status = getItemStatus(b);
    return status === filter;
  });

  const hasActiveFilters = filter !== "all";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="space-y-3.5 w-full pb-12 select-none min-w-0 overflow-hidden"
    >
      {/* Header: Title and counter badge with View Toggle & Hopper Filter Icon */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-medium text-neutral-900">Recurring Bills</h2>
          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
            {bills.length}
          </span>
        </div>

        {/* View Toggle Icon (before Hopper) & Hopper Filter Icon */}
        <div className="flex items-center gap-1.5">
          {/* View Toggle: toggles icon between LayoutGrid and List */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "list" ? "card" : "list")}
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
            title="Filter recurring bills"
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
            {(["all", "upcoming", "due_today", "overdue", "paid"] as const).map((f) => {
              const labels = {
                all: "All",
                upcoming: "Upcoming",
                due_today: "Due Today",
                overdue: "Overdue",
                paid: "Paid",
              };
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
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

      {/* Bills List or Card Grid */}
      {filteredBills.length === 0 ? (
        <div className="p-10 text-center border border-neutral-200 rounded-lg bg-white text-xs text-neutral-400">
          <p>No recurring bills found.</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {filteredBills.map((item) => (
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
          {filteredBills.map((item) => (
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
