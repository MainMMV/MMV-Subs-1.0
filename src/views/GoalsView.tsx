import React, { useState } from "react";
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Edit3, 
  Trash2, 
  Filter, 
  LayoutGrid, 
  List
} from "lucide-react";
import { motion } from "motion/react";
import { SpendingGoal, CurrencyCode, CurrencyDisplayMode, PaymentItem, PaymentHistoryRecord } from "../types";
import { formatCurrency, convertCurrency } from "../utils/calculations";

interface GoalsViewProps {
  goals: SpendingGoal[];
  items: PaymentItem[];
  records: PaymentHistoryRecord[];
  displayCurrency: CurrencyDisplayMode;
  exchangeRateUsdToUzs: number;
  onOpenAddGoal: () => void;
  onEditGoal: (goal: SpendingGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateProgress: (goalId: string, deltaAmount: number) => void;
  onToggleComplete: (goalId: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  displayCurrency,
  exchangeRateUsdToUzs,
  onEditGoal,
  onDeleteGoal,
  onUpdateProgress,
  onToggleComplete,
}) => {
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [quickAdjustId, setQuickAdjustId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>("");

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  const filteredGoals = goals.filter((g) => {
    if (filter === "active") return !g.isCompleted;
    if (filter === "completed") return g.isCompleted;
    return true;
  });

  const handleQuickAdd = (goalId: string) => {
    const val = parseFloat(adjustAmount);
    if (!isNaN(val)) {
      onUpdateProgress(goalId, val);
    }
    setQuickAdjustId(null);
    setAdjustAmount("");
  };

  const hasActiveFilters = filter !== "all";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="space-y-4 w-full pb-12 select-none min-w-0 overflow-hidden"
    >
      {/* Header: Title and counter badge with View Toggle & Hopper Filter Icon */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-medium text-neutral-900">Goals</h2>
          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            {activeGoals.length} Active
          </span>
        </div>

        {/* View Toggle Icon (before Hopper) & Hopper Filter Icon */}
        <div className="flex items-center gap-1.5">
          {/* View Toggle: toggles icon between LayoutGrid and List */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "card" ? "list" : "card")}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors"
            title={viewMode === "card" ? "Switch to list view" : "Switch to card view"}
          >
            {viewMode === "card" ? <List size={15} /> : <LayoutGrid size={15} />}
          </button>

          {/* Hopper Filter Icon */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-1.5 rounded-lg border transition-colors relative ${
              isFilterOpen || hasActiveFilters
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700"
            }`}
            title="Filter goals"
          >
            <Filter size={15} />
            {hasActiveFilters && !isFilterOpen && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-600" />
            )}
          </button>
        </div>
      </div>

      {/* Grouped Filtration below header toggled by Hopper icon */}
      {isFilterOpen && (
        <div className="p-3 rounded-lg border border-neutral-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-in fade-in duration-100">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(["all", "active", "completed"] as const).map((f) => {
              const labels = {
                all: "All Goals",
                active: `Active (${activeGoals.length})`,
                completed: `Completed (${completedGoals.length})`,
              };
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    filter === f
                      ? "bg-neutral-900 text-white shadow-2xs"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Goals Content: Card or List */}
      {filteredGoals.length === 0 ? (
        <div className="p-10 text-center border border-neutral-200 rounded-lg bg-white text-xs text-neutral-400">
          <p>No goals found.</p>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredGoals.map((goal) => {
            const pct = goal.targetAmount > 0 
              ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
              : 0;
            const isOver = goal.type === "budget_limit" && goal.currentAmount > goal.targetAmount;

            return (
              <div 
                key={goal.id} 
                className={`p-3.5 rounded-lg border bg-white flex flex-col justify-between text-xs space-y-3 transition-colors ${
                  goal.isCompleted ? "border-emerald-200 bg-emerald-50/20" : "border-neutral-200"
                }`}
              >
                <div>
                  {/* Goal Image from URL if provided (Fast load) */}
                  {goal.imageUrl && (
                    <div className="w-full h-28 rounded-md overflow-hidden mb-2.5 border border-neutral-100 bg-neutral-100">
                      <img
                        src={goal.imageUrl}
                        alt={goal.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <span className="font-medium text-sm text-neutral-900 block truncate">
                        {goal.title}
                      </span>
                      <span className="text-[11px] text-neutral-400 block capitalize">
                        {goal.type === "budget_limit" ? "Spending Limit" : "Savings Target"} • {goal.period}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${
                      goal.isCompleted 
                        ? "bg-emerald-100 text-emerald-800" 
                        : isOver 
                        ? "bg-rose-100 text-rose-800" 
                        : "bg-neutral-100 text-neutral-700"
                    }`}>
                      {pct}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        goal.isCompleted 
                          ? "bg-emerald-600" 
                          : isOver 
                          ? "bg-rose-600" 
                          : "bg-neutral-900"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Amounts with dual currencies */}
                  <div className="flex items-center justify-between text-neutral-700 font-medium">
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-normal">Accumulated</span>
                      <span>{formatCurrency(goal.currentAmount, goal.currency)}</span>
                      <span className="text-[10px] text-neutral-400 block font-normal">
                        ≈ {goal.currency === "UZS"
                          ? formatCurrency(goal.currentAmount / (exchangeRateUsdToUzs || 1), "USD")
                          : formatCurrency(goal.currentAmount * (exchangeRateUsdToUzs || 12800), "UZS")}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block font-normal">Target</span>
                      <span>{formatCurrency(goal.targetAmount, goal.currency)}</span>
                      <span className="text-[10px] text-neutral-400 block font-normal">
                        ≈ {goal.currency === "UZS"
                          ? formatCurrency(goal.targetAmount / (exchangeRateUsdToUzs || 1), "USD")
                          : formatCurrency(goal.targetAmount * (exchangeRateUsdToUzs || 12800), "UZS")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="border-t border-neutral-100 pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {quickAdjustId === goal.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          placeholder="+Amount"
                          className="w-16 px-1.5 py-0.5 text-xs rounded border border-neutral-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(goal.id)}
                          className="px-2 py-0.5 rounded bg-neutral-900 text-white text-[11px] font-medium"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setQuickAdjustId(goal.id)}
                        className="text-[11px] text-neutral-600 hover:text-neutral-900 font-medium"
                      >
                        + Progress
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(goal.id)}
                      className="p-1 rounded text-neutral-400 hover:text-emerald-700"
                      title={goal.isCompleted ? "Mark incomplete" : "Mark completed"}
                    >
                      <CheckCircle2 size={14} className={goal.isCompleted ? "text-emerald-600" : ""} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditGoal(goal)}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-700"
                      title="Edit goal"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1 rounded text-neutral-400 hover:text-rose-600"
                      title="Delete goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Mode */
        <div className="space-y-2">
          {filteredGoals.map((goal) => {
            const pct = goal.targetAmount > 0 
              ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
              : 0;
            const isOver = goal.type === "budget_limit" && goal.currentAmount > goal.targetAmount;

            return (
              <div
                key={goal.id}
                className={`p-3 rounded-lg border bg-white flex items-center justify-between gap-3 text-xs ${
                  goal.isCompleted ? "border-emerald-200 bg-emerald-50/20" : "border-neutral-200"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {goal.imageUrl && (
                    <img
                      src={goal.imageUrl}
                      alt={goal.title}
                      loading="lazy"
                      className="w-10 h-10 rounded-md object-cover shrink-0 bg-neutral-100"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-neutral-900 truncate">{goal.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        goal.isCompleted ? "bg-emerald-100 text-emerald-800" : isOver ? "bg-rose-100 text-rose-800" : "bg-neutral-100 text-neutral-700"
                      }`}>
                        {pct}%
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 block capitalize">
                      {goal.type === "budget_limit" ? "Limit" : "Target"} • {formatCurrency(goal.currentAmount, goal.currency)} of {formatCurrency(goal.targetAmount, goal.currency)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleComplete(goal.id)}
                    className="p-1 rounded text-neutral-400 hover:text-emerald-700"
                    title={goal.isCompleted ? "Mark incomplete" : "Mark completed"}
                  >
                    <CheckCircle2 size={15} className={goal.isCompleted ? "text-emerald-600" : ""} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditGoal(goal)}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-700"
                    title="Edit goal"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-1 rounded text-neutral-400 hover:text-rose-600"
                    title="Delete goal"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
