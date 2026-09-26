import React, { useState } from "react";
import { X, Plus, Trash2, Bell, Check } from "lucide-react";
import { PaymentItem, ItemReminder } from "../../types";
import { ServiceIcon } from "../ServiceIcon";

interface ManageRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PaymentItem | null;
  onSaveReminders: (itemId: string, reminders: ItemReminder[]) => void;
}

export const ManageRemindersModal: React.FC<ManageRemindersModalProps> = ({
  isOpen,
  onClose,
  item,
  onSaveReminders,
}) => {
  if (!isOpen || !item) return null;

  const [reminders, setReminders] = useState<ItemReminder[]>(
    item.reminders ? [...item.reminders] : []
  );

  const handleAdd = () => {
    const newRem: ItemReminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timing: "before",
      duration: 3,
      unit: "days",
      exactTime: "09:00",
      channel: "both",
      enabled: true,
    };
    setReminders([...reminders, newRem]);
  };

  const handleUpdate = (id: string, updates: Partial<ItemReminder>) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const handleRemove = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSave = () => {
    onSaveReminders(item.id, reminders);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs select-none">
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
              <p className="text-xs text-neutral-500">Manage Reminders</p>
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

        {/* Reminders List */}
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700">
              Configured Reminders ({reminders.length})
            </span>
            <button
              type="button"
              onClick={handleAdd}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <Plus size={14} />
              <span>Add Reminder</span>
            </button>
          </div>

          {reminders.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No reminders configured for this item. Click "Add Reminder" to schedule one.
            </div>
          ) : (
            <div className="space-y-2.5">
              {reminders.map((rem, idx) => (
                <div
                  key={rem.id}
                  className="p-3 rounded-lg border border-neutral-200 bg-white space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-700">Reminder #{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rem.enabled}
                          onChange={(e) => handleUpdate(rem.id, { enabled: e.target.checked })}
                          className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
                        />
                        <span className="text-[11px] text-neutral-500">Enabled</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemove(rem.id)}
                        className="text-neutral-400 hover:text-rose-600 p-0.5"
                        title="Remove reminder"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-neutral-400 block mb-0.5">Timing</span>
                      <select
                        value={rem.timing}
                        onChange={(e) =>
                          handleUpdate(rem.id, {
                            timing: e.target.value as "before" | "on_date" | "after",
                          })
                        }
                        className="w-full px-2 py-1 text-xs rounded border border-neutral-200 bg-neutral-50 font-medium"
                      >
                        <option value="before">Before payment</option>
                        <option value="on_date">On payment date</option>
                        <option value="after">After payment</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-400 block mb-0.5">Exact Time</span>
                      <input
                        type="time"
                        value={rem.exactTime}
                        onChange={(e) => handleUpdate(rem.id, { exactTime: e.target.value })}
                        className="w-full px-2 py-1 text-xs rounded border border-neutral-200 bg-neutral-50 font-medium"
                      />
                    </div>
                  </div>

                  {rem.timing !== "on_date" && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-500">Duration:</span>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={rem.duration}
                        onChange={(e) =>
                          handleUpdate(rem.id, {
                            duration: Math.max(1, parseInt(e.target.value) || 1),
                          })
                        }
                        className="w-16 px-2 py-1 text-xs rounded border border-neutral-200 bg-neutral-50 text-center"
                      />
                      <select
                        value={rem.unit}
                        onChange={(e) =>
                          handleUpdate(rem.id, {
                            unit: e.target.value as "minutes" | "hours" | "days" | "weeks",
                          })
                        }
                        className="flex-1 px-2 py-1 text-xs rounded border border-neutral-200 bg-neutral-50 font-medium"
                      >
                        <option value="days">Days</option>
                        <option value="hours">Hours</option>
                        <option value="minutes">Minutes</option>
                        <option value="weeks">Weeks</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[11px] text-neutral-500">Channel:</span>
                    <select
                      value={rem.channel}
                      onChange={(e) =>
                        handleUpdate(rem.id, {
                          channel: e.target.value as "in_app" | "telegram" | "both",
                        })
                      }
                      className="flex-1 px-2 py-1 text-xs rounded border border-neutral-200 bg-neutral-50 font-medium"
                    >
                      <option value="both">Both (In-App + Telegram)</option>
                      <option value="in_app">In-App only</option>
                      <option value="telegram">Telegram only</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Save Reminders
          </button>
        </div>
      </div>
    </div>
  );
};
