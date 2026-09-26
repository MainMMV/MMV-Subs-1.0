import React from "react";
import { 
  X, 
  Calendar, 
  Clock, 
  Bell, 
  CheckCircle2, 
  SkipForward, 
  RotateCcw,
  Edit2, 
  BarChart2, 
  History, 
  Trash2,
  AlertCircle
} from "lucide-react";
import { PaymentItem, CurrencyCode } from "../../types";
import { ServiceIcon } from "../ServiceIcon";
import { 
  getItemStatus, 
  formatCurrency, 
  convertCurrency, 
  formatFrequency 
} from "../../utils/calculations";

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PaymentItem | null;
  displayCurrency: CurrencyCode;
  exchangeRateUsdToUzs: number;
  onEdit: (item: PaymentItem) => void;
  onManageReminders: (item: PaymentItem) => void;
  onViewStatistics: (item: PaymentItem) => void;
  onViewHistory: (item: PaymentItem) => void;
  onDelete: (item: PaymentItem) => void;
  onUpdateStatus: (item: PaymentItem, status: "paid" | "skipped" | "upcoming") => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  displayCurrency,
  exchangeRateUsdToUzs,
  onEdit,
  onManageReminders,
  onViewStatistics,
  onViewHistory,
  onDelete,
  onUpdateStatus,
}) => {
  if (!isOpen || !item) return null;

  const status = getItemStatus(item);
  const isPaid = status === "paid";
  const isSkipped = status === "skipped";
  const isDueToday = status === "due_today";
  const isOverdue = status === "overdue";

  const convertedAmount = convertCurrency(
    item.price,
    item.currency,
    displayCurrency,
    exchangeRateUsdToUzs
  );

  const dateLabel =
    item.type === "subscription"
      ? "Renewal Date"
      : item.type === "bill"
      ? "Due Date"
      : "Purchase Date";

  const timeLabel =
    item.type === "subscription"
      ? "Renewal Time"
      : item.type === "bill"
      ? "Due Time"
      : "Purchase Time";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs select-none">
      <div 
        className="w-full max-w-lg bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white shadow-2xs"
              style={{ backgroundColor: item.iconBgColor || "#3B82F6" }}
            >
              <ServiceIcon icon={item.icon} size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-neutral-900">{item.name}</h3>
                <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-600">
                  {item.type === "subscription" ? "Subscription" : item.type === "bill" ? "Recurring Bill" : "One-Time Purchase"}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Minimal Item Details */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Price & Converted Price (both USD and UZS) */}
          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-neutral-500 block">Amount</span>
              <span className="text-base font-medium text-neutral-900">
                {formatCurrency(item.price, item.currency)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-neutral-500 block">
                ≈ {item.currency === "UZS" ? "USD Equivalent" : "UZS Equivalent"}
              </span>
              <span className="text-sm font-medium text-neutral-700">
                ≈{" "}
                {item.currency === "UZS"
                  ? formatCurrency(
                      exchangeRateUsdToUzs > 0 ? item.price / exchangeRateUsdToUzs : 0,
                      "USD"
                    )
                  : formatCurrency(item.price * (exchangeRateUsdToUzs || 12800), "UZS")}
              </span>
            </div>
            {item.frequency && (
              <div className="text-right">
                <span className="text-[11px] text-neutral-500 block">Frequency</span>
                <span className="font-medium text-neutral-800">
                  {formatFrequency(item.frequency)}
                </span>
              </div>
            )}
          </div>

          {/* Date */}
          <div className="p-3 rounded-lg border border-neutral-200 bg-white">
            <span className="text-[11px] text-neutral-500 flex items-center gap-1.5 mb-1">
              <Calendar size={13} className="text-neutral-400" />
              <span>{dateLabel}</span>
            </span>
            <span className="text-sm font-medium text-neutral-900">{item.date}</span>
          </div>

          {/* Status & Manual Action Buttons */}
          <div className="p-3.5 rounded-lg border border-neutral-200 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-700">Current Status</span>
              {isOverdue && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-700">
                  Overdue
                </span>
              )}
              {isDueToday && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                  Due Today
                </span>
              )}
              {isPaid && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                  Paid
                </span>
              )}
              {isSkipped && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-200 text-neutral-700">
                  Skipped
                </span>
              )}
              {status === "upcoming" && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                  Upcoming
                </span>
              )}
            </div>

            {/* Manual Status Buttons: Paid, Skipped, Reset */}
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateStatus(item, isPaid ? "upcoming" : "paid")}
                className={`flex-1 py-1.5 px-2.5 rounded-md border flex items-center justify-center gap-1.5 font-medium transition-colors ${
                  isPaid
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-neutral-700"
                }`}
              >
                <CheckCircle2 size={14} className={isPaid ? "text-emerald-600" : "text-neutral-400"} />
                <span>{isPaid ? "Marked as Paid" : "Mark as Paid"}</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateStatus(item, isSkipped ? "upcoming" : "skipped")}
                className={`flex-1 py-1.5 px-2.5 rounded-md border flex items-center justify-center gap-1.5 font-medium transition-colors ${
                  isSkipped
                    ? "bg-neutral-100 border-neutral-300 text-neutral-800"
                    : "border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-700"
                }`}
              >
                <SkipForward size={14} className={isSkipped ? "text-neutral-700" : "text-neutral-400"} />
                <span>{isSkipped ? "Marked as Skipped" : "Mark as Skipped"}</span>
              </button>

              {(isPaid || isSkipped) && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(item, "upcoming")}
                  className="p-1.5 rounded-md border border-neutral-200 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
                  title="Reset status to upcoming"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Reminder Information */}
          <div className="p-3.5 rounded-lg border border-neutral-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-700 flex items-center gap-1.5">
                <Bell size={13} className="text-neutral-500" />
                <span>Reminders ({item.reminders?.length || 0})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onManageReminders(item);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Configure
              </button>
            </div>

            {(!item.reminders || item.reminders.length === 0) ? (
              <p className="text-neutral-400 py-1">No reminders scheduled for this item.</p>
            ) : (
              <div className="space-y-1.5 pt-0.5">
                {item.reminders.map((rem, idx) => (
                  <div
                    key={rem.id || idx}
                    className={`flex items-center justify-between py-1.5 px-2.5 rounded bg-neutral-50 border border-neutral-100 ${
                      !rem.enabled ? "opacity-50" : ""
                    }`}
                  >
                    <span className="text-neutral-700">
                      {rem.timing === "on_date"
                        ? "On due date"
                        : `${rem.duration} ${rem.unit} ${rem.timing}`}
                      {" at "}
                      <span className="font-medium">{rem.exactTime}</span>
                    </span>
                    <span className="text-[10px] text-neutral-500 uppercase px-1.5 py-0.5 rounded bg-white border border-neutral-200 font-medium">
                      {rem.channel === "both"
                        ? "In-App & TG"
                        : rem.channel === "telegram"
                        ? "Telegram"
                        : "In-App"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions (Edit, Manage Reminders, Statistics, History, Delete) */}
        <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewStatistics(item);
              }}
              className="px-2.5 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 flex items-center gap-1.5 font-medium transition-colors text-xs"
            >
              <BarChart2 size={13} />
              <span>Statistics</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onViewHistory(item);
              }}
              className="px-2.5 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 flex items-center gap-1.5 font-medium transition-colors text-xs"
            >
              <History size={13} />
              <span>History</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="px-3 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-800 flex items-center gap-1.5 font-medium transition-colors text-xs"
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(item);
              }}
              className="px-2.5 py-1.5 rounded-md border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center gap-1.5 font-medium transition-colors text-xs"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
