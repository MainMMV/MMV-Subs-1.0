import React from "react";
import { Calendar, Check } from "lucide-react";
import { PaymentItem, CurrencyCode, CurrencyDisplayMode } from "../types";
import { getItemStatus, formatFrequency, getItemDualPrice } from "../utils/calculations";
import { ServiceIcon } from "./ServiceIcon";
import { ItemActionMenu } from "./ItemActionMenu";

interface PaymentItemRowProps {
  item: PaymentItem;
  displayCurrency?: CurrencyDisplayMode | CurrencyCode;
  exchangeRateUsdToUzs: number;
  onClick?: (item: PaymentItem) => void;
  onEdit: (item: PaymentItem) => void;
  onManageReminders: (item: PaymentItem) => void;
  onViewStatistics: (item: PaymentItem) => void;
  onViewHistory: (item: PaymentItem) => void;
  onDelete: (item: PaymentItem) => void;
  onTogglePaid: (item: PaymentItem) => void;
  onToggleSkipped?: (item: PaymentItem) => void;
}

export const PaymentItemRow: React.FC<PaymentItemRowProps> = ({
  item,
  displayCurrency = "default",
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

  const { topText, bottomText } = getItemDualPrice(
    item.price,
    item.currency,
    displayCurrency as CurrencyDisplayMode,
    exchangeRateUsdToUzs
  );

  return (
    <div
      onClick={() => onClick?.(item)}
      className={`p-3 sm:p-3.5 rounded-lg border transition-all text-xs select-none cursor-pointer ${
        isPaid
          ? "border-neutral-200 bg-emerald-50/15 opacity-80 hover:bg-emerald-50/25"
          : isOverdue
          ? "border-rose-200 bg-rose-50/20 hover:border-rose-300"
          : isDueToday
          ? "border-amber-200 bg-amber-50/20 hover:border-amber-300"
          : "border-neutral-200 bg-white hover:border-neutral-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2.5 sm:gap-3">
        {/* Left Side: Checkbox + Icon + Info */}
        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
          {/* Quick Mark Paid / Completed Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePaid(item);
            }}
            className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
              isPaid
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "border-neutral-300 hover:border-neutral-500 bg-white"
            }`}
            title={isPaid ? "Mark as unpaid" : "Mark as paid"}
          >
            {isPaid && <Check size={11} strokeWidth={3} />}
          </button>

          {/* Item Icon */}
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 text-white shadow-2xs mt-0.5"
            style={{ backgroundColor: item.iconBgColor || "#3B82F6" }}
          >
            <ServiceIcon icon={item.icon} size={15} />
          </div>

          {/* Item Main Text & Details */}
          <div className="min-w-0 flex-1">
            {/* Title */}
            <h4
              className={`font-medium text-xs sm:text-sm tracking-tight truncate leading-snug ${
                isPaid ? "text-neutral-500 line-through" : "text-neutral-900"
              }`}
            >
              {item.name}
            </h4>

            {/* Date & Frequency line - never break dates across lines */}
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
              <span className="flex items-center gap-1 shrink-0 font-medium">
                <Calendar size={11} className="text-neutral-400 shrink-0" />
                <span>{item.date}</span>
              </span>

              {item.frequency && (
                <>
                  <span className="text-neutral-300 shrink-0">•</span>
                  <span className="text-neutral-600 shrink-0">{formatFrequency(item.frequency)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Status Badge, Price & Menu */}
        <div className="flex flex-col items-end shrink-0 pl-1">
          {/* Status Badge */}
          <div className="mb-1 flex items-center justify-end">
            {isOverdue && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-700 whitespace-nowrap">
                Overdue
              </span>
            )}
            {isDueToday && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 whitespace-nowrap">
                Due Today
              </span>
            )}
            {isPaid && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 whitespace-nowrap">
                Paid
              </span>
            )}
            {isSkipped && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600 whitespace-nowrap">
                Skipped
              </span>
            )}
            {status === "upcoming" && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 whitespace-nowrap">
                Upcoming
              </span>
            )}
          </div>

          {/* Price & 3-Dot Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="text-right whitespace-nowrap">
              <span
                className={`font-medium text-xs sm:text-sm block ${
                  isPaid ? "text-neutral-400" : "text-neutral-900"
                }`}
              >
                {topText}
              </span>
              <span className="text-[10px] text-neutral-400 block -mt-0.5">
                {bottomText}
              </span>
            </div>

            {/* 3-Dot Action Menu */}
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
      </div>
    </div>
  );
};
