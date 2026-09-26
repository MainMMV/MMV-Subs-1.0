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
  Sun,
  Sunset,
  Moon,
  Clock,
  Pin
} from "lucide-react";
import { Habit, HabitLog, TimeOfDay } from "../types/habit";
import { HabitCard } from "../components/Habits/HabitCard";
import { HabitMatrixView } from "../components/Habits/HabitMatrixView";
import { HabitModal } from "../components/Modals/HabitModal";
import { HabitStatsModal } from "../components/Habits/HabitStatsModal";
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
  // Navigation / View Tabs: "today" | "matrix" | "analytics"
  const [activeTab, setActiveTab] = useState<"today" | "matrix" | "analytics">("today");

  // Selected Date for "today" tab
  const todayDate = new Date();
  const todayStr = formatDateStr(todayDate);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState<"all" | TimeOfDay>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("active");

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

        // Time of Day filter
        if (timeFilter !== "all" && habit.timeOfDay !== timeFilter) return false;

        // Schedule check
        return isHabitScheduledOnDate(habit, selectedDate);
      })
      .sort((a, b) => {
        // Pinned first
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return a.order - b.order;
      });
  }, [habits, selectedDate, statusFilter, categoryFilter, timeFilter]);

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

  // Group habits by Time of Day
  const timeSections = [
    { id: "morning", title: "Morning Routines", icon: Sun },
    { id: "afternoon", title: "Afternoon Habits", icon: Sunset },
    { id: "evening", title: "Evening Reflection", icon: Moon },
    { id: "anytime", title: "Anytime During Day", icon: Clock },
  ];

  return (
    <div className="space-y-4 w-full pb-12">
      {/* Top Main Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-neutral-200 rounded-lg shadow-2xs">
        {/* Left: Tab Switcher */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs">
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
            <span>Today's Habits</span>
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

        {/* Right: Calendar Date Navigator (Moved here in place of New Habit button) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-medium text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 focus:bg-white"
            />

            {selectedDate !== todayStr && (
              <button
                type="button"
                onClick={handleTodayShortcut}
                className="px-2 py-1 text-[11px] font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
              >
                Today
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors"
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* VIEW TAB 1: TODAY'S HABITS */}
      {activeTab === "today" && (
        <div className="space-y-4">
          {/* Daily Progress & Perfect Day Banner */}
          <div className="p-3.5 bg-white border border-neutral-200 rounded-lg shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-900">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
              </span>
              {completionStats.isPerfect && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                  <Sparkles size={13} className="text-emerald-600" />
                  <span>Perfect Day!</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-medium text-neutral-900 block">
                  {completionStats.completedCount} of {completionStats.totalScheduled} Completed
                </span>
                <span className="text-[10px] text-neutral-500">
                  {completionStats.pct}% daily progress
                </span>
              </div>

              <div className="w-28 bg-neutral-100 rounded-full h-2 overflow-hidden border border-neutral-200">
                <div
                  className={`h-full transition-all duration-300 ${
                    completionStats.isPerfect ? "bg-emerald-600" : "bg-neutral-900"
                  }`}
                  style={{ width: `${completionStats.pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filter Controls (No Search) */}
          <div className="flex items-center justify-between gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-white text-neutral-700"
              >
                <option value="active">Active</option>
                <option value="all">All Habits</option>
                <option value="paused">Paused Only</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-white text-neutral-700"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={timeFilter}
                onChange={(e: any) => setTimeFilter(e.target.value)}
                className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-white text-neutral-700"
              >
                <option value="all">All Times</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="anytime">Anytime</option>
              </select>
            </div>
          </div>

          {/* Habits Grouped by Time of Day or Flat List */}
          {scheduledHabits.length === 0 ? (
            <div className="p-12 text-center bg-white border border-neutral-200 rounded-lg">
              <CheckCircle2 size={32} className="mx-auto text-neutral-300 mb-2" />
              <h3 className="text-xs font-medium text-neutral-800">No Habits Scheduled</h3>
            </div>
          ) : (
            <div className="space-y-5">
              {timeSections.map((sec) => {
                const secHabits = scheduledHabits.filter(
                  (h) => (h.timeOfDay || "anytime") === sec.id
                );
                if (secHabits.length === 0) return null;
                const SecIcon = sec.icon;

                return (
                  <div key={sec.id} className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 px-1">
                      <SecIcon size={14} className="text-neutral-500" />
                      <span>{sec.title}</span>
                      <span className="text-[10px] text-neutral-400 font-normal">
                        ({secHabits.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {secHabits.map((habit) => {
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
                  </div>
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
    </div>
  );
};
