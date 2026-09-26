import React from "react";
import { X, BarChart2, Calendar, DollarSign, CheckCircle2, TrendingUp } from "lucide-react";
import { PaymentItem, PaymentHistoryRecord, CurrencyCode } from "../../types";
import { calculateItemStats, formatCurrency } from "../../utils/calculations";
import { ServiceIcon } from "../ServiceIcon";

interface ItemStatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PaymentItem | null;
  records: PaymentHistoryRecord[];
  displayCurrency: CurrencyCode;
  exchangeRateUsdToUzs: number;
}

export const ItemStatisticsModal: React.FC<ItemStatisticsModalProps> = ({
  isOpen,
  onClose,
  item,
  records,
  displayCurrency,
  exchangeRateUsdToUzs,
}) => {
  if (!isOpen || !item) return null;

  const stats = calculateItemStats(item, records, displayCurrency, exchangeRateUsdToUzs);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs select-none">
      <div 
        className="w-full max-w-md bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0">
              <ServiceIcon icon={item.icon} size={18} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-900">{item.name}</h3>
              <p className="text-xs text-neutral-500">Payment Statistics</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50">
              <span className="text-[11px] text-neutral-500 block mb-0.5">Total Paid</span>
              <span className="text-sm font-medium text-neutral-900">
                {formatCurrency(stats.totalPaid, displayCurrency)}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50">
              <span className="text-[11px] text-neutral-500 block mb-0.5">Number of Payments</span>
              <span className="text-sm font-medium text-neutral-900">
                {stats.numberOfPayments} {stats.numberOfPayments === 1 ? "payment" : "payments"}
              </span>
            </div>

            {item.type !== "purchase" && (
              <>
                <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50">
                  <span className="text-[11px] text-neutral-500 block mb-0.5">Monthly Spending</span>
                  <span className="text-sm font-medium text-neutral-900">
                    {formatCurrency(stats.monthlySpending, displayCurrency)}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50">
                  <span className="text-[11px] text-neutral-500 block mb-0.5">Yearly Spending</span>
                  <span className="text-sm font-medium text-neutral-900">
                    {formatCurrency(stats.yearlySpending, displayCurrency)}
                  </span>
                </div>
              </>
            )}

            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50">
              <span className="text-[11px] text-neutral-500 block mb-0.5">Next Payment</span>
              <span className="text-sm font-medium text-neutral-900">
                {stats.nextPayment || "None"}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50">
              <span className="text-[11px] text-neutral-500 block mb-0.5">First Payment</span>
              <span className="text-sm font-medium text-neutral-900">
                {stats.firstPayment || "None"}
              </span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-neutral-400 text-center">
            Amounts converted to {displayCurrency} using rate: 1 USD = {exchangeRateUsdToUzs.toLocaleString()} UZS
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
