import React, { useEffect } from "react";
import { 
  X, 
  CreditCard, 
  Repeat, 
  ShoppingBag, 
  CheckCircle2, 
  ChevronRight 
} from "lucide-react";

export type NewItemType = "subscription" | "bill" | "purchase" | "habit";

interface NewItemSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: NewItemType) => void;
}

export const NewItemSelectModal: React.FC<NewItemSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const itemOptions: Array<{
    type: NewItemType;
    title: string;
    subtitle: string;
    icon: React.FC<{ size?: number; className?: string }>;
    accentColor: string;
  }> = [
    {
      type: "subscription",
      title: "Subscription",
      subtitle: "Recurring subscriptions (Netflix, Spotify, Cloud, etc.)",
      icon: CreditCard,
      accentColor: "text-blue-700 bg-blue-50 border-blue-200",
    },
    {
      type: "bill",
      title: "Recurring bill",
      subtitle: "Scheduled bills, rent, utilities, insurance, etc.",
      icon: Repeat,
      accentColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      type: "purchase",
      title: "One time Purchase",
      subtitle: "Single non-recurring expenses, hardware, shopping",
      icon: ShoppingBag,
      accentColor: "text-purple-700 bg-purple-50 border-purple-200",
    },
    {
      type: "habit",
      title: "Habit Tracker",
      subtitle: "Daily routines, streaks, counters, and goals",
      icon: CheckCircle2,
      accentColor: "text-amber-700 bg-amber-50 border-amber-200",
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-lg border border-neutral-200 shadow-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200">
          <div>
            <h3 className="text-sm font-medium text-neutral-900">New Item</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Options List */}
        <div className="p-3 space-y-1.5">
          {itemOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  onSelectType(opt.type);
                  onClose();
                }}
                className="w-full p-3 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors flex items-center justify-between gap-3 text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${opt.accentColor}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-neutral-900 block group-hover:text-neutral-900">
                      {opt.title}
                    </span>
                  </div>
                </div>

                <ChevronRight
                  size={15}
                  className="text-neutral-400 group-hover:text-neutral-700 shrink-0 transition-colors"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
