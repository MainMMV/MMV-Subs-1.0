import React from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs select-none">
      <div 
        className="w-full max-w-sm bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Trash2 size={20} />
          </div>

          <div>
            <h3 className="text-sm font-medium text-neutral-900">Delete {itemName}?</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Are you sure you want to delete this payment item? You will have 5 seconds to undo this action after deletion.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
