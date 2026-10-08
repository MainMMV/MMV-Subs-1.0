import React, { useState } from "react";
import { CalendarDays, Check, CheckCircle2, LayoutGrid, List, Pencil, Plus, Target, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import { useI18n, type TranslationKey } from "../i18n";
import type { SpendingGoal, CurrencyDisplayMode, PaymentItem, PaymentHistoryRecord } from "../types";
import { formatCurrency } from "../utils/calculations";
import { formatDateDDMMYYYY } from "../utils/dateFormat";
import { tashkentDateKey } from "../utils/timezone";
import { setSectionFilter, setSectionView, updateUiPreferences, useUiPreferences } from "../services/uiPreferences";

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

const GOAL_TYPES: Record<SpendingGoal["type"], TranslationKey> = {
  budget_limit: "budgetLimit",
  savings_target: "savingsTarget",
  category_cap: "categoryCap",
  bill_reserve: "billReserve",
};

function goalProgress(goal: SpendingGoal) {
  if (goal.isCompleted) return 100;
  return goal.targetAmount > 0 ? Math.min(100, Math.round(goal.currentAmount / goal.targetAmount * 100)) : 0;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ goals, exchangeRateUsdToUzs, onOpenAddGoal, onEditGoal, onDeleteGoal, onUpdateProgress, onToggleComplete }) => {
  const { t } = useI18n();
  const preferences = useUiPreferences();
  const viewMode = preferences.views.goals;
  const filter = preferences.filters.goals;
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const today = tashkentDateKey();
  const activeCount = goals.filter((goal) => !goal.isCompleted).length;
  const completedCount = goals.length - activeCount;
  const nextWeek = tashkentDateKey(new Date(Date.now() + 7 * 86_400_000));
  const dueSoonCount = goals.filter((goal) => !goal.isCompleted && goal.deadline && goal.deadline >= today && goal.deadline <= nextWeek).length;
  const visibleGoals = goals
    .filter((goal) => filter === "all" || (filter === "active" ? !goal.isCompleted : goal.isCompleted))
    .sort((left, right) => {
      if (preferences.goalSort === "name") return left.title.localeCompare(right.title);
      if (preferences.goalSort === "progress") return goalProgress(right) - goalProgress(left);
      return (left.deadline || "9999-12-31").localeCompare(right.deadline || "9999-12-31") || left.title.localeCompare(right.title);
    });

  const saveProgress = (goalId: string) => {
    const amount = Number(adjustAmount);
    if (!Number.isFinite(amount) || amount === 0) return;
    onUpdateProgress(goalId, amount);
    setAdjustingId(null);
    setAdjustAmount("");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }} className="mmv-page goals-page w-full min-w-0 space-y-4 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
        <h2 className="text-base font-medium text-neutral-900">{t("goals")}</h2>
        <button type="button" onClick={onOpenAddGoal} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-neutral-900 px-3 text-xs font-medium text-white"><Plus size={15} />{t("createGoal")}</button>
      </div>
      <div className="grid grid-cols-3 gap-2 border-b border-neutral-200 pb-4 text-xs">
        <div><span className="block text-neutral-500">{t("active")}</span><span className="text-lg font-medium text-neutral-900">{activeCount}</span></div>
        <div><span className="block text-neutral-500">{t("completed")}</span><span className="text-lg font-medium text-neutral-900">{completedCount}</span></div>
        <div><span className="block text-neutral-500">{t("dueInWeek")}</span><span className="text-lg font-medium text-neutral-900">{dueSoonCount}</span></div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1" role="group" aria-label="Goal status">
          {(["all", "active", "completed"] as const).map((status) => <button key={status} type="button" onClick={() => setSectionFilter("goals", status)} aria-pressed={filter === status} className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${filter === status ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>{t(status)}</button>)}
        </div>
        <div className="flex items-center gap-1.5">
          <select aria-label={t("goalOrder")} value={preferences.goalSort} onChange={(event) => updateUiPreferences({ goalSort: event.target.value as typeof preferences.goalSort })} className="h-9 rounded-lg border border-neutral-200 bg-white px-2 text-xs text-neutral-700"><option value="deadline">{t("deadlineSort")}</option><option value="progress">{t("progressSort")}</option><option value="name">{t("nameSort")}</option></select>
          <div className="flex rounded-lg bg-neutral-100 p-0.5" role="group" aria-label="Goal view">
            <button type="button" onClick={() => setSectionView("goals", "list")} aria-label={t("listView")} aria-pressed={viewMode === "list"} title={t("listView")} className={`rounded-md p-1.5 ${viewMode === "list" ? "bg-white text-neutral-900" : "text-neutral-500"}`}><List size={15} /></button>
            <button type="button" onClick={() => setSectionView("goals", "card")} aria-label={t("cardView")} aria-pressed={viewMode === "card"} title={t("cardView")} className={`rounded-md p-1.5 ${viewMode === "card" ? "bg-white text-neutral-900" : "text-neutral-500"}`}><LayoutGrid size={15} /></button>
          </div>
        </div>
      </div>
      {visibleGoals.length === 0 ? <div className="py-12 text-center text-sm text-neutral-500"><Target size={22} className="mx-auto mb-3" />{goals.length ? t("noGoalsInFilter") : t("noGoalsYet")}</div> : (
        <div className={viewMode === "card" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" : "space-y-2"}>
          {visibleGoals.map((goal) => {
            const progress = goalProgress(goal);
            const isLimit = goal.type === "budget_limit" || goal.type === "category_cap";
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const overdue = !goal.isCompleted && !!goal.deadline && goal.deadline < today;
            const equivalent = goal.currency === "USD"
              ? formatCurrency(goal.currentAmount * exchangeRateUsdToUzs, "UZS")
              : formatCurrency(goal.currentAmount / (exchangeRateUsdToUzs || 1), "USD");
            return <article key={goal.id} className={`min-w-0 rounded-lg border border-neutral-200 bg-white p-3.5 ${viewMode === "card" ? "flex h-full flex-col" : ""}`}>
              <div className="flex min-w-0 items-start gap-3">
                {goal.imageUrl ? <img src={goal.imageUrl} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-md object-cover" style={{ objectPosition: `center ${goal.imagePositionY ?? 50}%` }} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-600"><Target size={17} /></span>}
                <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-medium text-neutral-900" title={goal.title}>{goal.title}</h3><p className="text-[11px] text-neutral-500">{t(GOAL_TYPES[goal.type])}{goal.period ? ` · ${goal.period}` : ""}</p></div>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${goal.isCompleted ? "bg-emerald-100 text-emerald-800" : overdue ? "bg-rose-100 text-rose-800" : "bg-neutral-100 text-neutral-700"}`}>{goal.isCompleted ? t("done") : overdue ? t("late") : `${progress}%`}</span>
              </div>
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-label={`${goal.title} progress`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className={`h-full transition-[width] duration-300 ${overdue ? "bg-rose-600" : "bg-neutral-900"}`} style={{ width: `${progress}%` }} /></div>
                <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-xs"><span className="font-medium text-neutral-900">{formatCurrency(goal.currentAmount, goal.currency)} <span className="font-normal text-neutral-500">/ {formatCurrency(goal.targetAmount, goal.currency)}</span></span><span className="text-neutral-500">{goal.isCompleted ? t("completed") : `${formatCurrency(remaining, goal.currency)} ${t(isLimit ? "left" : "toGo")}`}</span></div>
                <p className="mt-0.5 text-[11px] text-neutral-500">≈ {equivalent}</p>
                {goal.deadline ? <div className={`mt-2 flex items-center gap-1 text-[11px] ${overdue ? "text-rose-700" : "text-neutral-500"}`}><CalendarDays size={12} />{formatDateDDMMYYYY(goal.deadline)}</div> : null}
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                {adjustingId === goal.id ? <form onSubmit={(event) => { event.preventDefault(); saveProgress(goal.id); }} className="flex min-w-0 items-center gap-1"><input type="number" step="any" inputMode="decimal" value={adjustAmount} onChange={(event) => setAdjustAmount(event.target.value)} placeholder={t("amount")} aria-label={t("amount")} className="h-8 w-24 rounded-md border border-neutral-200 px-2 text-xs" autoFocus /><button type="submit" disabled={!Number.isFinite(Number(adjustAmount)) || Number(adjustAmount) === 0} aria-label={t("saveChanges")} title={t("saveChanges")} className="rounded-md p-1.5 text-neutral-800 disabled:opacity-40"><Check size={15} /></button><button type="button" onClick={() => setAdjustingId(null)} aria-label={t("cancel")} title={t("cancel")} className="rounded-md p-1.5 text-neutral-500"><X size={15} /></button></form> : goal.isCompleted ? <span /> : <button type="button" onClick={() => { setAdjustingId(goal.id); setAdjustAmount(""); }} className="text-xs font-medium text-neutral-700 hover:text-neutral-900">{t("adjustProgress")}</button>}
                <div className="flex items-center gap-0.5">{deleteId === goal.id ? <><span className="mr-1 text-[11px] text-neutral-500">{t("deleteQuestion")}</span><button type="button" onClick={() => { onDeleteGoal(goal.id); setDeleteId(null); }} className="rounded-md px-2 py-1 text-xs text-rose-700">{t("yes")}</button><button type="button" onClick={() => setDeleteId(null)} className="rounded-md px-2 py-1 text-xs text-neutral-600">{t("no")}</button></> : <><button type="button" onClick={() => onToggleComplete(goal.id)} title={goal.isCompleted ? t("active") : t("completed")} aria-label={goal.isCompleted ? t("active") : t("completed")} className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100"><CheckCircle2 size={16} /></button><button type="button" onClick={() => onEditGoal(goal)} title={t("edit")} aria-label={t("edit")} className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100"><Pencil size={15} /></button><button type="button" onClick={() => setDeleteId(goal.id)} title={t("delete")} aria-label={t("delete")} className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100"><Trash2 size={15} /></button></>}</div>
              </div>
            </article>;
          })}
        </div>
      )}
    </motion.div>
  );
};
