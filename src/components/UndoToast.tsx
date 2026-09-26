import React, { useEffect, useState } from "react";
import { Undo2, X } from "lucide-react";
import { PaymentItem } from "../types";

interface UndoToastProps {
  item: PaymentItem | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ item, onUndo, onDismiss }) => {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (!item) return;

    setSecondsLeft(5);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[99999] max-w-sm w-full bg-neutral-900 text-white rounded-lg shadow-lg border border-neutral-800 p-3 select-none animate-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-white truncate">
            Deleted "{item.name}"
          </p>
          <p className="text-[11px] text-neutral-400">
            Undo available for {secondsLeft}s
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            className="px-2.5 py-1 text-xs font-medium text-neutral-900 bg-white hover:bg-neutral-100 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Undo2 size={13} />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-neutral-400 hover:text-white rounded"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 5-second progress indicator bar */}
      <div className="w-full bg-neutral-800 h-1 rounded-full mt-2 overflow-hidden">
        <div
          className="bg-blue-500 h-full transition-all duration-1000 ease-linear"
          style={{ width: `${(secondsLeft / 5) * 100}%` }}
        />
      </div>
    </div>
  );
};
