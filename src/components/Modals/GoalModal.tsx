import React, { useState, useEffect } from "react";
import { X, Target, AlertCircle, Image as ImageIcon, Upload, MoveVertical } from "lucide-react";
import { SpendingGoal, GoalType, CurrencyCode, ItemType } from "../../types";
import { getConversionPreview } from "../../utils/calculations";

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Partial<SpendingGoal>) => void;
  initialGoal?: SpendingGoal | null;
  exchangeRateUsdToUzs: number;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGoal,
  exchangeRateUsdToUzs,
}) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<GoalType>("budget_limit");
  const [category, setCategory] = useState<ItemType | "all">("all");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePositionY, setImagePositionY] = useState<number>(50);
  const [period, setPeriod] = useState<"monthly" | "yearly" | "custom">("monthly");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialGoal) {
      setTitle(initialGoal.title);
      setType(initialGoal.type);
      setCategory(initialGoal.category || "all");
      setTargetAmount(initialGoal.targetAmount.toString());
      setCurrentAmount(initialGoal.currentAmount?.toString() || "0");
      setCurrency(initialGoal.currency);
      setImageUrl(initialGoal.imageUrl || "");
      setImagePositionY(initialGoal.imagePositionY ?? 50);
      setPeriod(initialGoal.period || "monthly");
      setDeadline(initialGoal.deadline || "");
      setNotes(initialGoal.notes || "");
    } else {
      setTitle("");
      setType("budget_limit");
      setCategory("all");
      setTargetAmount("");
      setCurrentAmount("0");
      setCurrency("USD");
      setImageUrl("");
      setImagePositionY(50);
      setPeriod("monthly");
      setDeadline("");
      setNotes("");
    }
    setError(null);
  }, [initialGoal, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a goal title.");
      return;
    }
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      setError("Please specify a valid target amount.");
      return;
    }
    const current = parseFloat(currentAmount) || 0;

    onSave({
      ...(initialGoal?.id ? { id: initialGoal.id } : {}),
      title: title.trim(),
      type,
      category,
      targetAmount: target,
      currentAmount: current,
      currency,
      imageUrl: imageUrl.trim() || undefined,
      imagePositionY,
      period,
      deadline: deadline || undefined,
      notes: notes.trim() || undefined,
      isCompleted: current >= target,
    });
    onClose();
  };

  const parsedTarget = parseFloat(targetAmount) || 0;

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/40 backdrop-blur-xs select-none overflow-y-auto"
    >
      <div 
        className="w-full max-w-md bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (no module descriptions) */}
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-neutral-900 text-white flex items-center justify-center">
              <Target size={14} />
            </div>
            <h3 className="text-sm font-medium text-neutral-900">
              {initialGoal ? "Edit Goal" : "Create Goal"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Goal Type */}
          <div>
            <label className="block text-neutral-700 font-medium mb-1">Goal Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("budget_limit")}
                className={`py-1.5 px-3 rounded-lg border font-medium transition-colors ${
                  type === "budget_limit"
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-2xs"
                    : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                Spending Limit
              </button>
              <button
                type="button"
                onClick={() => setType("savings_target")}
                className={`py-1.5 px-3 rounded-lg border font-medium transition-colors ${
                  type === "savings_target"
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-2xs"
                    : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                Savings Target
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-neutral-700 font-medium mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "budget_limit" ? "e.g. Monthly Streaming Cap" : "e.g. Vacation Fund"}
              className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900"
              required
            />
          </div>

          {/* Image URL (Fast load) */}
          <div>
            <label className="block text-neutral-700 font-medium mb-1">
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 text-xs"
            />
            {imageUrl && (
              <div className="mt-1.5 w-full h-24 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Target Amount & Currency */}
          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span className="font-medium text-neutral-700">Target Amount</span>
              <span>1 USD = {exchangeRateUsdToUzs.toLocaleString()} UZS</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                min="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-neutral-300 focus:outline-none focus:border-neutral-900 font-medium"
                required
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-24 px-2 py-1.5 rounded-lg bg-white border border-neutral-300 focus:outline-none focus:border-neutral-900 font-medium"
              >
                <option value="USD">USD ($)</option>
                <option value="UZS">UZS</option>
              </select>
            </div>
            {parsedTarget > 0 && (
              <div className="text-[11px] text-neutral-500">
                ≈ {getConversionPreview(parsedTarget, currency, exchangeRateUsdToUzs)}
              </div>
            )}
          </div>

          {/* Current Amount */}
          <div>
            <label className="block text-neutral-700 font-medium mb-1">
              Current Accumulated / Used Amount
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900"
            />
          </div>

          {/* Category Scope */}
          <div>
            <label className="block text-neutral-700 font-medium mb-1">Scope</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemType | "all")}
              className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 font-medium"
            >
              <option value="all">All Spending</option>
              <option value="subscription">Subscriptions Only</option>
              <option value="bill">Recurring Bills Only</option>
              <option value="purchase">One-Time Purchases Only</option>
            </select>
          </div>

          {/* Period & Deadline */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-neutral-700 font-medium mb-1">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as "monthly" | "yearly" | "custom")}
                className="w-full px-2 py-1.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 font-medium"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom / One-time</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-700 font-medium mb-1">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 font-medium"
              />
            </div>
          </div>

          {/* Goal Image & Repositioning Section */}
          <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-100/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-neutral-700 font-medium flex items-center gap-1.5">
                <ImageIcon size={14} className="text-neutral-500" />
                <span>Goal Cover Image</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl("");
                    setImagePositionY(50);
                  }}
                  className="text-[11px] text-rose-600 hover:underline"
                >
                  Remove Image
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL (https://...)"
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 bg-white"
              />
              <label className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-medium flex items-center gap-1 cursor-pointer shrink-0">
                <Upload size={13} />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Live Image Preview & Vertical Repositioning Slider */}
            {imageUrl && (
              <div className="space-y-2 pt-1">
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100">
                  <img
                    src={imageUrl}
                    alt="Goal preview"
                    className="w-full h-full object-cover transition-all duration-75"
                    style={{ objectPosition: `center ${imagePositionY}%` }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] bg-neutral-900/70 text-white backdrop-blur-xs font-medium">
                    Position: {imagePositionY}%
                  </div>
                </div>

                {/* Vertical Slider */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
                    <span className="flex items-center gap-1">
                      <MoveVertical size={12} />
                      <span>Reposition Image (Focal Point)</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setImagePositionY(0)}
                        className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${imagePositionY === 0 ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-700"}`}
                      >
                        Top
                      </button>
                      <button
                        type="button"
                        onClick={() => setImagePositionY(50)}
                        className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${imagePositionY === 50 ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-700"}`}
                      >
                        Center
                      </button>
                      <button
                        type="button"
                        onClick={() => setImagePositionY(100)}
                        className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${imagePositionY === 100 ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-700"}`}
                      >
                        Bottom
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={imagePositionY}
                    onChange={(e) => setImagePositionY(Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 font-medium shadow-2xs"
            >
              {initialGoal ? "Save Changes" : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
