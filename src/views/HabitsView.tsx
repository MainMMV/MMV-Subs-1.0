import React, { useState, useMemo, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Flame, 
  CheckCircle2, 
  BarChart2, 
  Grid, 
  ListFilter,
  Sparkles,
  Pin,
  LayoutGrid,
  List
} from "lucide-react";
import { motion } from "motion/react";
import { Habit, HabitLog } from "../types/habit";
import { HabitCard } from "../components/Habits/HabitCard";
import { HabitRow } from "../components/Habits/HabitRow";
import { HabitMatrixView } from "../components/Habits/HabitMatrixView";
import { HabitModal } from "../components/Modals/HabitModal";
import { HabitStatsModal } from "../components/Habits/HabitStatsModal";
import { useI18n } from "../i18n";
import { HabitNotesModal, HabitBackdateModal } from "../components/Modals/HabitNotesModal";
import { 
  formatDateStr, 
  parseDateStr, 
  isHabitScheduledOnDate, 
  calculateHabitStreak, 
  isPerfectDay 
} from "../utils/habitCalculations";

interface HabitsViewProps {
  habits: Habit[];
  logs: Record<string, Record<string, HabitLog>>;
  onSaveHabit: (habitData: Partial<Habit>) => void;
  onDeleteHabit: (habitId: string) => void;
  onUpdateLog: (habitId: string, dateStr: string, updates: Partial<HabitLog>) => void;
  externalCreateHabitOpen?: boolean;
  onCloseExternalCreateHabit?: () => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  logs,
  onSaveHabit,
  onDeleteHabit,
  onUpdateLog,
  externalCreateHabitOpen,
  onCloseExternalCreateHabit,
}) => {
  const { t } = useI18n();
  // Navigation / View Tabs: "today" | "matrix" | "analytics"
  const [activeTab, setActiveTab] = useState<"today" | "matrix" | "analytics">("today");

  // Selected Date for "today" tab
  const todayDate = new Date();
  const todayStr = formatDateStr(todayDate);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Filters & View Mode
  const [habitViewMode, setHabitViewMode] = useState<"card" | "list">("card");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("active");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const hasActiveFilters = statusFilter !== "active" || categoryFilter !== "all";

  // Modals state
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [statsHabit, setStatsHabit] = useState<Habit | null>(null);

  const [notesModalHabit, setNotesModalHabit] = useState<{ habit: Habit; log?: HabitLog } | null>(null);
  const [backdateHabit, setBackdateHabit] = useState<Habit | null>(null);

  // Date Navigation
  const handlePrevDay = () => {
    const d = parseDateStr(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDateStr(d));
  };

  const handleNextDay = () => {
    const d = parseDateStr(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDateStr(d));
  };

  const handleTodayShortcut = () => {
    setSelectedDate(todayStr);
  };

  // External create trigger
  useEffect(() => {
    if (externalCreateHabitOpen) {
      setEditingHabit(null);
      setIsHabitModalOpen(true);
      if (onCloseExternalCreateHabit) {
        onCloseExternalCreateHabit();
      }
    }
  }, [externalCreateHabitOpen, onCloseExternalCreateHabit]);

  // Categories set
  const categories = useMemo(() => {
    const set = new Set<string>();
    habits.forEach((h) => set.add(h.category));
    return Array.from(set);
  }, [habits]);

  // Habits scheduled on selectedDate
  const scheduledHabits = useMemo(() => {
    return habits
      .filter((habit) => {
        // Status filter
        if (statusFilter === "active" && habit.isPaused) return false;
        if (statusFilter === "paused" && !habit.isPaused) return false;

        // Category filter
        if (categoryFilter !== "all" && habit.category !== categoryFilter) return false;

        // Schedule check
        return isHabitScheduledOnDate(habit, selectedDate);
      })
      .sort((a, b) => {
        // Pinned first
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return a.order - b.order;
      });
  }, [habits, selectedDate, statusFilter, categoryFilter]);

  // Today's completion stats
  const completionStats = useMemo(() => {
    const activeScheduled = habits.filter(
      (h) => !h.isPaused && isHabitScheduledOnDate(h, selectedDate)
    );
    const totalScheduled = activeScheduled.length;
    let completedCount = 0;

    activeScheduled.forEach((h) => {
      const log = logs[h.id]?.[selectedDate];
      if (log?.completed || log?.status === "completed") {
        completedCount++;
      }
    });

    const pct = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;
    const isPerfect = totalScheduled > 0 && completedCount === totalScheduled;

    return { totalScheduled, completedCount, pct, isPerfect };
  }, [habits, logs, selectedDate]);

  // Interactive Action Handlers
  const handleToggleComplete = (habitId: string) => {
    const habitLogs = logs[habitId] || {};
    const currentLog = habitLogs[selectedDate];
    const isDone = currentLog?.completed || currentLog?.status === "completed";
    const habit = habits.find((h) => h.id === habitId);

    onUpdateLog(habitId, selectedDate, {
      completed: !isDone,
      status: !isDone ? "completed" : "unscheduled",
      value: !isDone ? (habit?.targetValue || 1) : 0,
      completedAt: !isDone ? new Date().toISOString() : undefined,
    });
  };

  const handleUpdateValue = (habitId: string, delta: number) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const habitLogs = logs[habitId] || {};
    const currentLog = habitLogs[selectedDate];
    const curVal = currentLog?.value ?? 0;
    const newVal = Math.max(0, Math.round((curVal + delta) * 10) / 10);
    const target = habit.targetValue || 1;
    const isComplete = habit.type === "limit" ? newVal <= target : newVal >= target;

    onUpdateLog(habitId, selectedDate, {
      value: newVal,
      completed: isComplete,
      status: isComplete ? "completed" : newVal > 0 ? "partial" : "unscheduled",
      completedAt: isComplete ? new Date().toISOString() : undefined,
    });
  };

  const handleSetValue = (habitId: string, value: number) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const target = habit.targetValue || 1;
    const isComplete = habit.type === "limit" ? value <= target : value >= target;

    onUpdateLog(habitId, selectedDate, {
      value,
      completed: isComplete,
      status: isComplete ? "completed" : value > 0 ? "partial" : "unscheduled",
      completedAt: isComplete ? new Date().toISOString() : undefined,
    });
  };

  const handleToggleChecklistItem = (habitId: string, itemId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit || !habit.checklists) return;
    const habitLogs = logs[habitId] || {};
    const currentLog = habitLogs[selectedDate];
    const currentChecks = { ...(currentLog?.checklistProgress || {}) };
    currentChecks[itemId] = !currentChecks[itemId];

    const completedCount = habit.checklists.filter((c) => currentChecks[c.id]).length;
    const isAllDone = completedCount === habit.checklists.length;

    onUpdateLog(habitId, selectedDate, {
      checklistProgress: currentChecks,
      completed: isAllDone,
      status: isAllDone ? "completed" : completedCount > 0 ? "partial" : "unscheduled",
      completedAt: isAllDone ? new Date().toISOString() : undefined,
    });
  };

  const handleSkipDay = (habitId: string) => {
    const habitLogs = logs[habitId] || {};
    const currentLog = habitLogs[selectedDate];
    const isSkipped = currentLog?.status === "skipped";

    onUpdateLog(habitId, selectedDate, {
      status: isSkipped ? "unscheduled" : "skipped",
      completed: false,
      notes: isSkipped ? undefined : "Intentionally skipped (streak protected)",
    });
  };

  const handleTogglePause = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    onSaveHabit({
      id: habit.id,
      isPaused: !habit.isPaused,
      pausedAt: !habit.isPaused ? new Date().toISOString() : undefined,
    });
  };

  const handleTogglePin = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    onSaveHabit({
      id: habit.id,
      isPinned: !habit.isPinned,
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="mmv-page space-y-4 w-full pb-12 min-w-0 overflow-hidden"
    >
      {/* Top Main Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-white border border-neutral-200 rounded-lg shadow-2xs">
        {/* Left: Tab Switcher */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "today"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <CheckCircle2 size={14} />
            <span>{t("today")} · {t("habits")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "matrix"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Grid size={14} />
            <span>Matrix View</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "analytics"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <BarChart2 size={14} />
            <span>Analytics & Trends</span>
          </button>
        </div>

        {/* Middle: Progress Section */}
        {activeTab === "today" && (
          completionStats.isPerfect ? (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg shrink-0 shadow-2xs">
              <Sparkles size={14} className="text-emerald-600" />
              <span className="text-xs font-medium tracking-wide">Perfect</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 px-3 py-1 bg-neutral-50 border border-neutral-200 rounded-lg shrink-0">
              <div className="text-left sm:text-right">
                <span className="text-xs font-medium text-neutral-900 block leading-tight">
                  {completionStats.completedCount} of {completionStats.totalScheduled} Completed
                </span>
                <span className="text-[10px] text-neutral-500 block leading-tight mt-0.5">
                  {completionStats.pct}% daily progress
                </span>
              </div>

              <div className="w-24 bg-neutral-200 rounded-full h-1.5 overflow-hidden shrink-0">
                <div
                  className="h-full bg-neutral-900 transition-all duration-300"
                  style={{ width: `${completionStats.pct}%` }}
                />
              </div>
            </div>
          )
        )}

        {/* Right: Calendar Date Navigator with unified h-8 sizes and Filter Button right after right-side arrow */}
        <div className="flex items-center gap-1.5 shrink-0 self-start md:self-auto flex-wrap">
          {/* Previous Day Arrow */}
          <button
            type="button"
            onClick={handlePrevDay}
            className="h-8 w-8 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 flex items-center justify-center transition-colors"
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Date Picker (Same h-8 height) */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-8 text-xs font-medium text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 focus:bg-white flex items-center leading-none"
          />

          {/* Today Button (Same h-8 height) */}
          {selectedDate !== todayStr && (
            <button
              type="button"
              onClick={handleTodayShortcut}
              className="h-8 px-2.5 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors flex items-center justify-center"
            >
              {t("today")}
            </button>
          )}

          {/* Next Day Arrow */}
          <button
            type="button"
            onClick={handleNextDay}
            className="h-8 w-8 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 flex items-center justify-center transition-colors"
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>

          {/* View Mode Toggle: Card and List (Icon Only) BEFORE Filter */}
          {activeTab === "today" && (
            <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200">
              <button
                type="button"
                onClick={() => setHabitViewMode("card")}
                className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
                  habitViewMode === "card"
                    ? "bg-white text-neutral-900 shadow-2xs font-medium"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
                title="Card View"
                aria-label="Card View"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setHabitViewMode("list")}
                className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
                  habitViewMode === "list"
                    ? "bg-white text-neutral-900 shadow-2xs font-medium"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
                title="List View"
                aria-label="List View"
              >
                <List size={14} />
              </button>
            </div>
          )}

          {/* Filter button (Icon only) right after the view toggler */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`h-8 w-8 rounded-lg border flex items-center justify-center relative transition-colors ${
              isFilterOpen || hasActiveFilters
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
            }`}
            title="Filter Habits"
            aria-label="Filter Habits"
          >
            <Filter size={14} />
            {hasActiveFilters && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Filtration Panel (Opens on click of Filter button) */}
      {isFilterOpen && activeTab === "today" && (
        <div className="flex items-center gap-2 p-2.5 bg-white border border-neutral-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium mr-1">
            <Filter size={13} />
            <span>Filtration:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="h-8 text-xs border border-neutral-200 rounded-lg px-2.5 bg-neutral-50 text-neutral-700 font-medium"
          >
            <option value="active">Active Habits</option>
            <option value="all">All Habits</option>
            <option value="paused">Paused Only</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 text-xs border border-neutral-200 rounded-lg px-2.5 bg-neutral-50 text-neutral-700 font-medium"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("active");
                setCategoryFilter("all");
              }}
              className="text-[11px] text-neutral-500 hover:text-neutral-900 underline px-1 font-medium ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* VIEW TAB 1: TODAY'S HABITS */}
      {activeTab === "today" && (
        <div className="space-y-4">
          {scheduledHabits.length === 0 ? (
            <div className="p-12 text-center bg-white border border-neutral-200 rounded-lg">
              <CheckCircle2 size={32} className="mx-auto text-neutral-300 mb-2" />
              <h3 className="text-xs font-medium text-neutral-800">{t("noItems")}</h3>
            </div>
          ) : habitViewMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
              {scheduledHabits.map((habit) => {
                const habitLogs = logs[habit.id] || {};
                const log = habitLogs[selectedDate];
                const streak = calculateHabitStreak(habit, habitLogs, todayStr).currentStreak;

                return (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    log={log}
                    streak={streak}
                    onToggleComplete={handleToggleComplete}
                    onUpdateValue={handleUpdateValue}
                    onSetValue={handleSetValue}
                    onToggleChecklistItem={handleToggleChecklistItem}
                    onSkipDay={handleSkipDay}
                    onOpenNotes={(h, l) => setNotesModalHabit({ habit: h, log: l })}
                    onOpenStats={(h) => setStatsHabit(h)}
                    onEditHabit={(h) => {
                      setEditingHabit(h);
                      setIsHabitModalOpen(true);
                    }}
                    onTogglePause={handleTogglePause}
                    onTogglePin={handleTogglePin}
                    onDeleteHabit={onDeleteHabit}
                    onOpenBackdate={(h) => setBackdateHabit(h)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="space-y-2 w-full">
              {scheduledHabits.map((habit) => {
                const habitLogs = logs[habit.id] || {};
                const log = habitLogs[selectedDate];
                const streak = calculateHabitStreak(habit, habitLogs, todayStr).currentStreak;

                return (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    log={log}
                    streak={streak}
                    onToggleComplete={handleToggleComplete}
                    onUpdateValue={handleUpdateValue}
                    onSetValue={handleSetValue}
                    onToggleChecklistItem={handleToggleChecklistItem}
                    onSkipDay={handleSkipDay}
                    onOpenNotes={(h, l) => setNotesModalHabit({ habit: h, log: l })}
                    onOpenStats={(h) => setStatsHabit(h)}
                    onEditHabit={(h) => {
                      setEditingHabit(h);
                      setIsHabitModalOpen(true);
                    }}
                    onTogglePause={handleTogglePause}
                    onTogglePin={handleTogglePin}
                    onDeleteHabit={onDeleteHabit}
                    onOpenBackdate={(h) => setBackdateHabit(h)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW TAB 2: MATRIX VIEW */}
      {activeTab === "matrix" && (
        <HabitMatrixView
          habits={habits}
          logs={logs}
          onUpdateLog={onUpdateLog}
          onOpenStats={(h) => setStatsHabit(h)}
        />
      )}

      {/* VIEW TAB 3: ANALYTICS & OVERVIEW */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white border border-neutral-200 rounded-lg shadow-2xs">
              <span className="text-[10px] uppercase font-medium text-neutral-500 block">
                Total Active Habits
              </span>
              <span className="text-2xl font-medium text-neutral-900 mt-1 block">
                {habits.filter((h) => !h.isPaused).length}
              </span>
              <p className="text-[11px] text-neutral-500 mt-1">
                {habits.filter((h) => h.isPaused).length} paused
              </p>
            </div>

            <div className="p-4 bg-white border border-neutral-200 rounded-lg shadow-2xs">
              <span className="text-[10px] uppercase font-medium text-neutral-500 block">
                Today's Completion Rate
              </span>
              <span className="text-2xl font-medium text-neutral-900 mt-1 block">
                {completionStats.pct}%
              </span>
              <p className="text-[11px] text-neutral-500 mt-1">
                {completionStats.completedCount} of {completionStats.totalScheduled} completed
              </p>
            </div>

            <div className="p-4 bg-white border border-neutral-200 rounded-lg shadow-2xs">
              <span className="text-[10px] uppercase font-medium text-neutral-500 block">
                Skip & Pause Protected
              </span>
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium mt-2">
                <CheckCircle2 size={16} />
                <span>Streaks preserved safely</span>
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                Planned skips don't break consecutive streaks
              </p>
            </div>
          </div>

          {/* Habit-by-habit cards for quick analytics overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {habits.map((habit) => {
              const habitLogs = logs[habit.id] || {};
              const streak = calculateHabitStreak(habit, habitLogs, todayStr);
              return (
                <div
                  key={habit.id}
                  onClick={() => setStatsHabit(habit)}
                  className="p-4 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 cursor-pointer shadow-2xs transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-900 truncate">
                      {habit.name}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {habit.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs">
                    <div className="flex items-center gap-1 text-amber-800">
                      <Flame size={14} className="text-amber-600" />
                      <span className="font-medium">{streak.currentStreak}d streak</span>
                    </div>
                    <span className="text-neutral-500 text-[11px]">
                      Best: {streak.longestStreak}d
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODALS */}
      {isHabitModalOpen && (
        <HabitModal
          isOpen={isHabitModalOpen}
          onClose={() => {
            setIsHabitModalOpen(false);
            setEditingHabit(null);
          }}
          onSave={onSaveHabit}
          editingHabit={editingHabit}
        />
      )}

      {statsHabit && (
        <HabitStatsModal
          habit={statsHabit}
          logs={logs[statsHabit.id] || {}}
          onClose={() => setStatsHabit(null)}
        />
      )}

      {notesModalHabit && (
        <HabitNotesModal
          habit={notesModalHabit.habit}
          log={notesModalHabit.log}
          dateStr={selectedDate}
          onSave={(notes) => {
            onUpdateLog(notesModalHabit.habit.id, selectedDate, { notes });
          }}
          onClose={() => setNotesModalHabit(null)}
        />
      )}

      {backdateHabit && (
        <HabitBackdateModal
          habit={backdateHabit}
          onSave={(dateStr, value, notes) => {
            const habit = backdateHabit;
            const target = habit.targetValue || 1;
            const isCompleted = habit.type === "limit" 
              ? (value !== undefined ? value <= target : true)
              : (value !== undefined ? value >= target : true);

            onUpdateLog(habit.id, dateStr, {
              date: dateStr,
              value,
              notes,
              completed: isCompleted,
              status: isCompleted ? "completed" : "partial",
              completedAt: new Date().toISOString(),
            });
          }}
          onClose={() => setBackdateHabit(null)}
        />
      )}
    </motion.div>
  );
};
