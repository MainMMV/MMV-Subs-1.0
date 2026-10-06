import React, { useState } from "react";
import { tashkentDateKey } from "../../utils/timezone";
import { X, Calendar, Plus, CheckCircle2, History, Trash2 } from "lucide-react";
import { PaymentItem, PaymentHistoryRecord, CurrencyCode } from "../../types";
import { convertCurrency, formatCurrency } from "../../utils/calculations";
import { ServiceIcon } from "../ServiceIcon";
import { formatDateDDMMYYYY, parseDateDDMMYYYY } from "../../utils/dateFormat";

interface ItemHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PaymentItem | null;
  records: PaymentHistoryRecord[];
  displayCurrency: CurrencyCode;
  exchangeRateUsdToUzs: number;
  onAddRecord: (record: PaymentHistoryRecord) => void;
  onDeleteRecord?: (recordId: string) => void;
}

export const ItemHistoryModal: React.FC<ItemHistoryModalProps> = ({
  isOpen,
  onClose,
  item,
  records,
  displayCurrency,
  exchangeRateUsdToUzs,
  onAddRecord,
  onDeleteRecord,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newDateText, setNewDateText] = useState(formatDateDDMMYYYY(tashkentDateKey()));
  const [newAmount, setNewAmount] = useState<string>("");
  const [newNotes, setNewNotes] = useState("");

  if (!isOpen || !item) return null;

  const itemRecords = records
    .filter((r) => r.itemId === item.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDate = parseDateDDMMYYYY(newDateText);
    if (!parsedDate) return;
    const amountNum = parseFloat(newAmount) || item.price;
    const record: PaymentHistoryRecord = {
      id: `hist-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      itemType: item.type,
      date: parsedDate,
      amount: amountNum,
      originalCurrency: item.currency,
      status: "paid",
      notes: newNotes.trim() || undefined,
    };
    onAddRecord(record);
    setIsAdding(false);
    setNewNotes("");
  };

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs select-none"
    >
      <div 
        className="w-full max-w-lg bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
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
              <p className="text-xs text-neutral-500">Payment History</p>
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
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700">
              Recorded Payments ({itemRecords.length})
            </span>
            <button
              type="button"
              onClick={() => {
                setIsAdding(!isAdding);
                setNewAmount(item.price.toString());
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <Plus size={14} />
              <span>{isAdding ? "Cancel" : "Log Payment"}</span>
            </button>
          </div>

          {/* Quick Log Form */}
          {isAdding && (
            <form onSubmit={handleCreateRecord} className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 space-y-2.5 text-xs">
              <span className="font-medium text-neutral-800 block">Record Past Payment</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">Date</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="DD.MM.YYYY"
                    value={newDateText}
                    onChange={(e) => setNewDateText(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">Amount ({item.currency})</label>
                  <input
                    type="number"
                    step="any"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-neutral-500 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Card renewal, bank reference"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 rounded border border-neutral-200 bg-white text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-neutral-900 text-white font-medium hover:bg-neutral-800"
                >
                  Save Payment
                </button>
              </div>
            </form>
          )}

          {/* History List */}
          {itemRecords.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No payment history records found for this item yet.
            </div>
          ) : (
            <div className="space-y-2">
              {itemRecords.map((rec) => {
                const converted = convertCurrency(
                  rec.amount,
                  rec.originalCurrency,
                  displayCurrency,
                  exchangeRateUsdToUzs
                );
                return (
                  <div
                    key={rec.id}
                    className="p-3 rounded-lg border border-neutral-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900">{formatDateDDMMYYYY(rec.date)}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                          {rec.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <div className="font-medium text-neutral-900">
                          {formatCurrency(rec.amount, rec.originalCurrency)}
                        </div>
                        {rec.originalCurrency !== displayCurrency && (
                          <div className="text-[11px] text-neutral-500">
                            ≈ {formatCurrency(converted, displayCurrency)}
                          </div>
                        )}
                      </div>

                      {onDeleteRecord && (
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(rec.id)}
                          className="text-neutral-400 hover:text-rose-600 p-1"
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
