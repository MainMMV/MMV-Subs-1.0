import React, { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Check, 
  Minus, 
  SkipForward, 
  Filter, 
  Flame, 
  Sparkles,
  Layers,
  CalendarDays,
  Grid
} from "lucide-react";
import * as Icons from "lucide-react";
import { Habit, HabitLog, HabitStatus } from "../../types/habit";
import { 
  formatDateStr, 
  parseDateStr, 
  isHabitScheduledOnDate, 
  getHabitStatusForDate,
  generateYearActivityHeatmap
} from "../../utils/habitCalculations";

interface HabitMatrixViewProps {
  habits: Habit[];
  logs: Record<string, Record<string, HabitLog>>;
  onUpdateLog: (habitId: string, dateStr: string, updates: Partial<HabitLog>) => void;
  onOpenStats: (habit: Habit) => void;
}

export const HabitMatrixView: React.FC<HabitMatrixViewProps> = ({
  habits,
  logs,
  onUpdateLog,
  onOpenStats,
}) => {
  // Matrix View Sub-mode: "monthly" | "weekly" | "year_heatmap"
  const [matrixMode, setMatrixMode] = useState<"monthly" | "weekly" | "year_heatmap">("monthly");

  const today = new Date();
  const todayStr = formatDateStr(today);

  // Selected Month/Year for Monthly mode
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11

  // Selected Week Start for Weekly mode
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date(today);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    return new Date(d.setDate(diff));
  });

  // Filter state
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("active");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Selected cell popover state for direct matrix editing
  const [editingCell, setEditingCell] = useState<{
    habitId: string;
    dateStr: string;
    habit: Habit;
    log?: HabitLog;
  } | null>(null);

  const [editValue, setEditValue] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleTodayShortcut = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    setWeekStart(new Date(new Date(now).setDate(diff)));
  };

  // Week navigation
  const handlePrevWeek = () => {
    const nextW = new Date(weekStart);
    nextW.setDate(nextW.getDate() - 7);
    setWeekStart(nextW);
  };

  const handleNextWeek = () => {
    const nextW = new Date(weekStart);
    nextW.setDate(nextW.getDate() + 7);
    setWeekStart(nextW);
  };

  // Days in selected month
  const monthDays = useMemo(() => {
    const daysInM = new Date(currentYear, currentMonth + 1, 0).getDate();
    const list: { dateStr: string; dayNum: number; dayOfWeek: string; isToday: boolean; isWeekend: boolean }[] = [];
    const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    for (let d = 1; d <= daysInM; d++) {
      const dt = new Date(currentYear, currentMonth, d);
      const str = formatDateStr(dt);
      const dow = dt.getDay();
      list.push({
        dateStr: str,
        dayNum: d,
        dayOfWeek: weekdayLabels[dow],
        isToday: str === todayStr,
        isWeekend: dow === 0 || dow === 6,
      });
    }
    return list;
  }, [currentYear, currentMonth, todayStr]);

  // Days in selected week
  const weekDays = useMemo(() => {
    const list: { dateStr: string; dayNum: number; dayOfWeek: string; isToday: boolean; isWeekend: boolean }[] = [];
    const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const curr = new Date(weekStart);

    for (let i = 0; i < 7; i++) {
      const str = formatDateStr(curr);
      const dow = curr.getDay();
      list.push({
        dateStr: str,
        dayNum: curr.getDate(),
        dayOfWeek: weekdayLabels[dow],
        isToday: str === todayStr,
        isWeekend: dow === 0 || dow === 6,
      });
      curr.setDate(curr.getDate() + 1);
    }
    return list;
  }, [weekStart, todayStr]);

  // Filtered habits
  const filteredHabits = useMemo(() => {
    return habits
      .filter((h) => {
        if (statusFilter === "active" && h.isPaused) return false;
        if (statusFilter === "paused" && !h.isPaused) return false;
        if (categoryFilter !== "all" && h.category !== categoryFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return a.order - b.order;
      });
  }, [habits, statusFilter, categoryFilter]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    habits.forEach((h) => set.add(h.category));
    return Array.from(set);
  }, [habits]);

  // Handle cell click
  const handleCellClick = (habit: Habit, dateStr: string) => {
    if (dateStr > todayStr) return; // Future cells are inactive
    const habitLogs = logs[habit.id] || {};
    const log = habitLogs[dateStr];
    setEditingCell({
      habitId: habit.id,
      dateStr,
      habit,
      log,
    });
    setEditValue(log?.value !== undefined ? log.value.toString() : (habit.targetValue || 1).toString());
    setEditNotes(log?.notes || "");
  };

  // Direct toggle on cell
  const handleDirectToggle = (habit: Habit, dateStr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (dateStr > todayStr) return;
    const habitLogs = logs[habit.id] || {};
    const currentLog = habitLogs[dateStr];
    const isDone = currentLog?.completed || currentLog?.status === "completed";

    onUpdateLog(habit.id, dateStr, {
      completed: !isDone,
      status: !isDone ? "completed" : "unscheduled",
      value: !isDone ? (habit.targetValue || 1) : 0,
      completedAt: !isDone ? new Date().toISOString() : undefined,
    });
  };

  // Save detailed cell edit
  const handleSaveCellEdit = (status: HabitStatus) => {
    if (!editingCell) return;
    const { habitId, dateStr, habit } = editingCell;
    const num = parseFloat(editValue);
    const val = !isNaN(num) ? num : undefined;
    const isCompleted = status === "completed" || (habit.targetValue && val ? val >= habit.targetValue : false);

    onUpdateLog(habitId, dateStr, {
      status,
      completed: isCompleted,
      value: val,
      notes: editNotes.trim() || undefined,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
    });

    setEditingCell(null);
  };

  // Year Heatmap Data
  const yearHeatmapData = useMemo(() => {
    if (matrixMode !== "year_heatmap") return [];
    return generateYearActivityHeatmap(habits, logs, currentYear);
  }, [matrixMode, habits, logs, currentYear]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-4">
      {/* Matrix Controls & View Mode Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-neutral-200 rounded-lg">
        {/* Left: View Mode Switcher */}
        <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs">
          <button
            type="button"
            onClick={() => setMatrixMode("monthly")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              matrixMode === "monthly" ? "bg-white text-neutral-900 shadow-2xs" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Monthly Matrix
          </button>
          <button
            type="button"
            onClick={() => setMatrixMode("weekly")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              matrixMode === "weekly" ? "bg-white text-neutral-900 shadow-2xs" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Weekly (7-Day)
          </button>
          <button
            type="button"
            onClick={() => setMatrixMode("year_heatmap")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              matrixMode === "year_heatmap" ? "bg-white text-neutral-900 shadow-2xs" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Year Heatmap
          </button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          {matrixMode === "monthly" && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-md border border-neutral-200 hover:bg-neutral-100 text-neutral-600"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-xs font-medium text-neutral-900 min-w-[120px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-md border border-neutral-200 hover:bg-neutral-100 text-neutral-600"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {matrixMode === "weekly" && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-1 rounded-md border border-neutral-200 hover:bg-neutral-100 text-neutral-600"
                title="Previous Week"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-xs font-medium text-neutral-900 min-w-[140px] text-center">
                {weekDays[0]?.dateStr} — {weekDays[6]?.dateStr}
              </span>

              <button
                type="button"
                onClick={handleNextWeek}
                className="p-1 rounded-md border border-neutral-200 hover:bg-neutral-100 text-neutral-600"
                title="Next Week"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {matrixMode === "year_heatmap" && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentYear(currentYear - 1)}
                className="p-1 rounded-md border border-neutral-200 hover:bg-neutral-100 text-neutral-600"
                title="Previous Year"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-xs font-medium text-neutral-900 px-2">
                Year {currentYear}
              </span>

              <button
                type="button"
                onClick={() => setCurrentYear(currentYear + 1)}
                className="p-1 rounded-md border border-neutral-200 hover:bg-neutral-100 text-neutral-600"
                title="Next Year"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleTodayShortcut}
            className="px-2.5 py-1 text-xs font-medium border border-neutral-200 rounded-md hover:bg-neutral-50 text-neutral-700 transition-colors"
          >
            Today
          </button>
        </div>

        {/* Filters */}
        {matrixMode !== "year_heatmap" && (
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="text-xs border border-neutral-200 rounded-md px-2 py-1 bg-white text-neutral-700"
            >
              <option value="active">Active Habits</option>
              <option value="all">All Habits</option>
              <option value="paused">Paused Habits</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-neutral-200 rounded-md px-2 py-1 bg-white text-neutral-700"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* MATRIX TABLE: Monthly or Weekly */}
      {matrixMode !== "year_heatmap" && (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-2xs overflow-hidden">
          {/* Scrollable Container with Sticky Habit Column */}
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] text-neutral-500">
                  {/* Sticky Habit Name Column */}
                  <th className="sticky left-0 z-20 bg-neutral-50 px-3.5 py-2.5 font-medium text-neutral-700 min-w-[200px] border-r border-neutral-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                    Habit Name
                  </th>

                  {/* Date Columns */}
                  {(matrixMode === "monthly" ? monthDays : weekDays).map((day) => (
                    <th
                      key={day.dateStr}
                      className={`px-1 py-2 text-center min-w-[32px] border-r border-neutral-100 ${
                        day.isToday
                          ? "bg-neutral-900 text-white font-medium"
                          : day.isWeekend
                          ? "bg-neutral-100/60 text-neutral-400"
                          : ""
                      }`}
                    >
                      <div className="text-[9px] uppercase tracking-tighter">{day.dayOfWeek}</div>
                      <div className="text-[11px]">{day.dayNum}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredHabits.length === 0 ? (
                  <tr>
                    <td colSpan={40} className="p-8 text-center text-xs text-neutral-400">
                      No habits match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredHabits.map((habit) => {
                    const habitLogs = logs[habit.id] || {};
                    const IconComponent = (Icons as any)[habit.icon] || Icons.CheckCircle2;

                    return (
                      <tr key={habit.id} className="hover:bg-neutral-50/50 transition-colors">
                        {/* Sticky Habit Name & Category */}
                        <td className="sticky left-0 z-10 bg-white px-3.5 py-2.5 border-r border-neutral-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                              >
                                <IconComponent size={12} />
                              </div>
                              <span
                                className="font-medium text-neutral-900 truncate hover:text-neutral-600 cursor-pointer"
                                onClick={() => onOpenStats(habit)}
                                title="Click to view full habit analytics"
                              >
                                {habit.name}
                              </span>
                            </div>
                            <span className="text-[9px] text-neutral-400 uppercase shrink-0">
                              {habit.category}
                            </span>
                          </div>
                        </td>

                        {/* Date Cells */}
                        {(matrixMode === "monthly" ? monthDays : weekDays).map((day) => {
                          const log = habitLogs[day.dateStr];
                          const status = getHabitStatusForDate(habit, log, day.dateStr, todayStr);
                          const isFuture = day.dateStr > todayStr;

                          return (
                            <td
                              key={day.dateStr}
                              onClick={() => handleCellClick(habit, day.dateStr)}
                              className={`p-0 text-center border-r border-neutral-100 relative group transition-colors ${
                                isFuture
                                  ? "bg-neutral-50/40 cursor-default"
                                  : "cursor-pointer hover:bg-neutral-100"
                              } ${day.isToday ? "bg-neutral-50/80" : ""}`}
                            >
                              <div className="h-8 flex items-center justify-center">
                                {status === "completed" && (
                                  <div 
                                    className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center shadow-2xs"
                                    title={`Completed on ${day.dateStr}${log?.value ? ` (${log.value} ${habit.unit || ""})` : ""}`}
                                  >
                                    <Check size={12} strokeWidth={2.5} />
                                  </div>
                                )}

                                {status === "partial" && (
                                  <div
                                    className="w-5 h-5 rounded border border-emerald-500 bg-emerald-50 text-emerald-700 text-[9px] font-medium flex items-center justify-center"
                                    title={`Partially completed: ${log?.value || "progress"}`}
                                  >
                                    {log?.value ? log.value : <Minus size={10} />}
                                  </div>
                                )}

                                {status === "skipped" && (
                                  <div
                                    className="w-4 h-4 rounded text-neutral-400 flex items-center justify-center"
                                    title={`Skipped on ${day.dateStr} (Protected streak)`}
                                  >
                                    <SkipForward size={11} />
                                  </div>
                                )}

                                {status === "missed" && (
                                  <div
                                    className="w-2.5 h-2.5 rounded-full bg-rose-200 border border-rose-300"
                                    title={`Missed on ${day.dateStr}`}
                                  />
                                )}

                                {status === "future" && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-200" />
                                )}

                                {status === "unscheduled" && !isFuture && (
                                  <span className="text-[10px] text-neutral-200">—</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Matrix Legend */}
          <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center gap-4 text-[11px] text-neutral-600 flex-wrap">
            <span className="font-medium text-neutral-700">Legend:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center">
                <Check size={9} strokeWidth={2.5} />
              </div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded border border-emerald-500 bg-emerald-50 text-emerald-700 flex items-center justify-center text-[9px]">
                ½
              </div>
              <span>Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-200 border border-rose-300" />
              <span>Missed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <SkipForward size={11} className="text-neutral-400" />
              <span>Skipped (Protected)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-300 font-bold">—</span>
              <span>Unscheduled</span>
            </div>
          </div>
        </div>
      )}

      {/* YEAR HEATMAP MODE */}
      {matrixMode === "year_heatmap" && (
        <div className="p-5 bg-white border border-neutral-200 rounded-lg shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-medium text-neutral-900">
                Annual Consistency Heatmap ({currentYear})
              </h3>
              <p className="text-[11px] text-neutral-500">
                365-day tracking history across all scheduled habits
              </p>
            </div>

            {/* Intensity Scale */}
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
              <span>Less</span>
              <div className="w-3 h-3 rounded-xs bg-neutral-100 border border-neutral-200" />
              <div className="w-3 h-3 rounded-xs bg-emerald-200" />
              <div className="w-3 h-3 rounded-xs bg-emerald-400" />
              <div className="w-3 h-3 rounded-xs bg-emerald-600" />
              <div className="w-3 h-3 rounded-xs bg-emerald-800" />
              <span>More</span>
            </div>
          </div>

          {/* GitHub style calendar grid */}
          <div className="overflow-x-auto pb-2">
            <div className="grid grid-flow-col grid-rows-7 gap-1 min-w-[750px]">
              {yearHeatmapData.map((d) => {
                const colors = [
                  "bg-neutral-100 border border-neutral-200",
                  "bg-emerald-200",
                  "bg-emerald-400",
                  "bg-emerald-600",
                  "bg-emerald-800",
                ];
                return (
                  <div
                    key={d.date}
                    className={`w-3 h-3 rounded-xs cursor-pointer ${colors[d.level]} transition-transform hover:scale-125`}
                    title={`${d.date}: ${d.count} / ${d.totalScheduled} completed`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Direct Cell Editing Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-2xs">
          <div className="w-full max-w-sm bg-white rounded-lg border border-neutral-200 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div>
                <h4 className="text-xs font-medium text-neutral-900">{editingCell.habit.name}</h4>
                <p className="text-[11px] text-neutral-500">{editingCell.dateStr}</p>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xs"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Buttons */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleSaveCellEdit("completed")}
                className="p-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 font-medium hover:bg-emerald-100 flex flex-col items-center gap-1 transition-colors"
              >
                <Check size={14} />
                <span>Completed</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveCellEdit("skipped")}
                className="p-2 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 font-medium hover:bg-neutral-100 flex flex-col items-center gap-1 transition-colors"
              >
                <SkipForward size={14} />
                <span>Skip Day</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveCellEdit("missed")}
                className="p-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 font-medium hover:bg-rose-100 flex flex-col items-center gap-1 transition-colors"
              >
                <Minus size={14} />
                <span>Mark Missed</span>
              </button>
            </div>

            {/* Numeric Value Entry */}
            {(editingCell.habit.type === "quantity" || editingCell.habit.type === "counter" || editingCell.habit.type === "duration") && (
              <div>
                <label className="text-[11px] font-medium text-neutral-700 block mb-1">
                  Recorded Amount ({editingCell.habit.unit || "units"})
                </label>
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full text-xs p-1.5 border border-neutral-200 rounded-lg bg-neutral-50 focus:bg-white"
                />
              </div>
            )}

            {/* Day Notes */}
            <div>
              <label className="text-[11px] font-medium text-neutral-700 block mb-1">
                Day Note
              </label>
              <input
                type="text"
                placeholder="Optional note for this day..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full text-xs p-1.5 border border-neutral-200 rounded-lg bg-neutral-50 focus:bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 rounded-lg border border-neutral-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveCellEdit("completed")}
                className="px-3 py-1.5 text-xs text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg font-medium"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
