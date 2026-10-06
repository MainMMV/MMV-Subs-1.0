import React from "react";
import { Calendar, Check } from "lucide-react";
import { PaymentItem, CurrencyDisplayMode } from "../types";
import { getItemStatus, formatFrequency, getItemDualPrice } from "../utils/calculations";
import { ServiceIcon } from "./ServiceIcon";
import { ItemActionMenu } from "./ItemActionMenu";

interface PaymentItemCardProps {
  item: PaymentItem;
  displayCurrency: CurrencyDisplayMode;
  exchangeRateUsdToUzs: number;
  onClick?: (item: PaymentItem) => void;
  onEdit: (item: PaymentItem) => void;
  onManageReminders: (item: PaymentItem) => void;
  onViewStatistics: (item: PaymentItem) => void;
  onViewHistory: (item: PaymentItem) => void;
  onDelete: (item: PaymentItem) => void;
  onTogglePaid: (item: PaymentItem) => void;
}

export const PaymentItemCard: React.FC<PaymentItemCardProps> = ({
  item,
  displayCurrency,
  exchangeRateUsdToUzs,
  onClick,
  onEdit,
  onManageReminders,
  onViewStatistics,
  onViewHistory,
  onDelete,
  onTogglePaid,
}) => {
  const status = getItemStatus(item);
  const isPaid = status === "paid";
  const isSkipped = status === "skipped";
  const isDueToday = status === "due_today";
  const isOverdue = status === "overdue";

  return (
    <div
      onClick={() => onClick?.(item)}
      className={`p-3.5 rounded-lg border transition-colors flex min-h-32 h-full flex-col justify-between select-none cursor-pointer text-xs ${
        isPaid
          ? "border-neutral-200 bg-neutral-50/60 opacity-80"
          : isOverdue
          ? "border-rose-200 bg-rose-50/20 hover:border-rose-300"
          : isDueToday
          ? "border-amber-200 bg-amber-50/20 hover:border-amber-300"
          : "border-neutral-200 bg-white hover:border-neutral-300"
      }`}
    >
      {/* Top Row: Icon, Title, and Top-Right Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePaid(item);
            }}
            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
              isPaid
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "border-neutral-300 hover:border-neutral-500 bg-white"
            }`}
            title={isPaid ? "Mark as unpaid" : "Mark as paid"}
          >
            {isPaid && <Check size={12} strokeWidth={3} />}
          </button>

          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white shadow-2xs"
            style={{ backgroundColor: item.iconBgColor || "#3B82F6" }}
          >
            <ServiceIcon icon={item.icon} size={15} />
          </div>

          <div className="min-w-0">
            <span
              className={`font-medium text-sm tracking-tight truncate block ${
                isPaid ? "text-neutral-500 line-through" : "text-neutral-900"
              }`}
            >
              {item.name}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
              <Calendar size={11} className="text-neutral-400 shrink-0" />
              <span className="shrink-0 font-medium">{item.date}</span>
              {item.frequency && (
                <>
                  <span className="text-neutral-300 shrink-0">•</span>
                  <span className="text-neutral-600 shrink-0">{formatFrequency(item.frequency)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge OVER 3-dot and price */}
        <div className="shrink-0">
          {isOverdue && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-700">
              Overdue
            </span>
          )}
          {isDueToday && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
              Due Today
            </span>
          )}
          {isPaid && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
              Paid
            </span>
          )}
          {isSkipped && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600">
              Skipped
            </span>
          )}
          {status === "upcoming" && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
              Upcoming
            </span>
          )}
        </div>
      </div>

      {/* Bottom Row: Price (priority dual currency) & 3-Dot Action Menu */}
      <div className="flex items-end justify-between border-t border-neutral-100 pt-2 mt-auto">
        <div>
          {(() => {
            const { topText, bottomText } = getItemDualPrice(
              item.price,
              item.currency,
              displayCurrency,
              exchangeRateUsdToUzs
            );
            return (
              <>
                <div
                  className={`font-medium text-sm ${
                    isPaid ? "text-neutral-400" : "text-neutral-900"
                  }`}
                >
                  {topText}
                </div>
                {/* Secondary priority currency approximation */}
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {bottomText}
                </div>
              </>
            );
          })()}
        </div>

        <ItemActionMenu
          item={item}
          onEdit={() => onEdit(item)}
          onManageReminders={() => onManageReminders(item)}
          onViewStatistics={() => onViewStatistics(item)}
          onViewHistory={() => onViewHistory(item)}
          onDelete={() => onDelete(item)}
        />
      </div>
    </div>
  );
};
