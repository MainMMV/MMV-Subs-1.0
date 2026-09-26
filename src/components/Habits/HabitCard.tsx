import React, { useState } from "react";
import { 
  Check, 
  Plus, 
  Minus, 
  MoreVertical, 
  Flame, 
  Clock, 
  SkipForward, 
  FileText, 
  BarChart2, 
  Edit3, 
  Pause, 
  Play, 
  Pin, 
  PinOff, 
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import * as Icons from "lucide-react";
import { Habit, HabitLog } from "../../types/habit";

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  streak: number;
  onToggleComplete: (habitId: string) => void;
  onUpdateValue: (habitId: string, delta: number) => void;
  onSetValue: (habitId: string, value: number) => void;
  onToggleChecklistItem: (habitId: string, itemId: string) => void;
  onSkipDay: (habitId: string) => void;
  onOpenNotes: (habit: Habit, log?: HabitLog) => void;
  onOpenStats: (habit: Habit) => void;
  onEditHabit: (habit: Habit) => void;
  onTogglePause: (habitId: string) => void;
  onTogglePin: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onOpenBackdate: (habit: Habit) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  log,
  streak,
  onToggleComplete,
  onUpdateValue,
  onSetValue,
  onToggleChecklistItem,
  onSkipDay,
  onOpenNotes,
  onOpenStats,
  onEditHabit,
  onTogglePause,
  onTogglePin,
  onDeleteHabit,
  onOpenBackdate,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [tempValue, setTempValue] = useState(log?.value?.toString() || "");
  const [showChecklist, setShowChecklist] = useState(false);

  // Dynamic Lucide icon lookup
  const IconComponent = (Icons as any)[habit.icon] || Icons.CheckCircle2;

  const isCompleted = Boolean(log?.completed || log?.status === "completed");
  const isSkipped = log?.status === "skipped";
  const currentValue = log?.value ?? 0;
  const target = habit.targetValue || 1;

  // Calculate percentage
  let progressPct = 0;
  if (isCompleted) {
    progressPct = 100;
  } else if (habit.type === "quantity" || habit.type === "duration" || habit.type === "counter") {
    progressPct = Math.min(100, Math.round((currentValue / target) * 100));
  } else if (habit.type === "checklist" && habit.checklists && habit.checklists.length > 0) {
    const checks = log?.checklistProgress || {};
    const checkedCount = habit.checklists.filter((c) => checks[c.id]).length;
    progressPct = Math.round((checkedCount / habit.checklists.length) * 100);
  }

  const handleValueSubmit = () => {
    setIsEditingValue(false);
    const num = parseFloat(tempValue);
    if (!isNaN(num)) {
      onSetValue(habit.id, Math.max(0, num));
    }
  };

  return (
    <div
      className={`p-3.5 rounded-lg border transition-all ${
        habit.isPaused
          ? "bg-neutral-50/70 border-neutral-200/80 opacity-70"
          : isCompleted
          ? "bg-neutral-50/50 border-emerald-200/80 shadow-2xs"
          : isSkipped
          ? "bg-neutral-50 border-neutral-200/80 opacity-75"
          : "bg-white border-neutral-200 hover:border-neutral-300 shadow-2xs"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Checkmark or Type Control */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Main Action Check Button */}
          <button
            type="button"
            onClick={() => onToggleComplete(habit.id)}
            disabled={habit.isPaused}
            title={isCompleted ? "Completed (click to undo)" : "Click to complete"}
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
              isCompleted
                ? "bg-emerald-600 border-emerald-600 text-white"
                : isSkipped
                ? "bg-neutral-100 border-neutral-300 text-neutral-400"
                : "bg-neutral-50 border-neutral-300 text-neutral-300 hover:border-neutral-400 hover:text-neutral-500"
            }`}
          >
            {isCompleted ? (
              <Check size={18} strokeWidth={2.5} />
            ) : isSkipped ? (
              <SkipForward size={15} />
            ) : (
              <IconComponent size={17} style={{ color: habit.color }} />
            )}
          </button>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium truncate ${isCompleted ? "text-neutral-900 line-through text-neutral-500" : "text-neutral-900"}`}>
                {habit.name}
              </span>

              {habit.isPinned && (
                <span title="Pinned to top">
                  <Pin size={11} className="text-amber-600 fill-amber-600 shrink-0" />
                </span>
              )}

              {habit.isPaused && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-200 text-neutral-700 font-medium">
                  Paused
                </span>
              )}

              {isSkipped && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-200 text-neutral-600 font-medium">
                  Skipped today
                </span>
              )}
            </div>

            {/* Badges / Schedule */}
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-neutral-500 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                {habit.category}
              </span>

              {streak > 0 && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                  <Flame size={11} className="text-amber-600" />
                  <span>{streak}d streak</span>
                </span>
              )}

              {log?.notes && (
                <span 
                  onClick={() => onOpenNotes(habit, log)}
                  className="flex items-center text-neutral-500 hover:text-neutral-900 cursor-pointer"
                  title={log.notes}
                >
                  <FileText size={11} />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Values / Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Counter / Quantity Controls */}
          {(habit.type === "quantity" || habit.type === "counter" || habit.type === "duration") && !habit.isPaused && (
            <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => onUpdateValue(habit.id, habit.type === "quantity" && habit.unit === "L" ? -0.5 : -1)}
                className="w-6 h-6 flex items-center justify-center rounded text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 transition-colors"
                title="Decrease"
              >
                <Minus size={13} />
              </button>

              {isEditingValue ? (
                <input
                  type="number"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={handleValueSubmit}
                  onKeyDown={(e) => e.key === "Enter" && handleValueSubmit()}
                  autoFocus
                  className="w-12 text-center text-xs py-0.5 border border-neutral-300 rounded bg-white font-medium"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTempValue(currentValue.toString());
                    setIsEditingValue(true);
                  }}
                  className="px-1.5 py-0.5 font-medium text-neutral-800 hover:bg-white rounded transition-colors text-xs"
                  title="Click to enter exact value"
                >
                  {currentValue} <span className="text-[10px] text-neutral-500">/ {target} {habit.unit || ""}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onUpdateValue(habit.id, habit.type === "quantity" && habit.unit === "L" ? 0.5 : 1)}
                className="w-6 h-6 flex items-center justify-center rounded text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 transition-colors"
                title="Increase"
              >
                <Plus size={13} />
              </button>
            </div>
          )}

          {/* Checklist Toggle Trigger */}
          {habit.type === "checklist" && habit.checklists && (
            <button
              type="button"
              onClick={() => setShowChecklist(!showChecklist)}
              className="px-2 py-1 text-xs border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 rounded-lg text-neutral-700 flex items-center gap-1 transition-colors"
            >
              <span>{habit.checklists.filter((c) => log?.checklistProgress?.[c.id]).length}/{habit.checklists.length}</span>
              {showChecklist ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}

          {/* Limit / Avoid Badges */}
          {habit.type === "limit" && (
            <div className="text-right text-[11px] text-neutral-600">
              <span className="font-medium text-neutral-900">{currentValue}</span>
              <span className="text-neutral-400"> / max {habit.targetValue} {habit.unit}</span>
            </div>
          )}

          {habit.type === "avoid" && (
            <span className={`px-2 py-0.5 rounded text-[11px] border font-medium ${
              isCompleted 
                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                : "bg-neutral-50 text-neutral-600 border-neutral-200"
            }`}>
              {isCompleted ? "Avoided today" : "Active"}
            </span>
          )}

          {/* 3-Dots Action Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
              title="More options"
            >
              <MoreVertical size={15} />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-md z-40 py-1 text-xs">
                  {/* Statistics & Analytics */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenStats(habit);
                    }}
                    className="w-full px-3 py-1.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <BarChart2 size={13} className="text-neutral-500" />
                    <span>Statistics & Analytics</span>
                  </button>

                  {/* Daily Note */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenNotes(habit, log);
                    }}
                    className="w-full px-3 py-1.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <FileText size={13} className="text-neutral-500" />
                    <span>{log?.notes ? "Edit Day Note" : "Add Day Note"}</span>
                  </button>

                  {/* Skip Day */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onSkipDay(habit.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <SkipForward size={13} className="text-neutral-500" />
                    <span>{isSkipped ? "Unskip Day" : "Skip Day (Protect Streak)"}</span>
                  </button>

                  {/* Backdate / Log for another day */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenBackdate(habit);
                    }}
                    className="w-full px-3 py-1.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <Calendar size={13} className="text-neutral-500" />
                    <span>Backdate Completion</span>
                  </button>

                  <div className="my-1 border-t border-neutral-100" />

                  {/* Pin / Unpin */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onTogglePin(habit.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    {habit.isPinned ? <PinOff size={13} className="text-neutral-500" /> : <Pin size={13} className="text-neutral-500" />}
                    <span>{habit.isPinned ? "Unpin from Top" : "Pin to Top"}</span>
                  </button>

                  {/* Pause / Resume */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onTogglePause(habit.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    {habit.isPaused ? <Play size={13} className="text-neutral-500" /> : <Pause size={13} className="text-neutral-500" />}
                    <span>{habit.isPaused ? "Resume Habit" : "Pause Tracking"}</span>
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEditHabit(habit);
                    }}
                    className="w-full px-3 py-1.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <Edit3 size={13} className="text-neutral-500" />
                    <span>Edit Habit</span>
                  </button>

                  <div className="my-1 border-t border-neutral-100" />

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onDeleteHabit(habit.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <Trash2 size={13} />
                    <span>Delete Habit</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Checklist Section */}
      {showChecklist && habit.type === "checklist" && habit.checklists && (
        <div className="mt-3 pt-2.5 border-t border-neutral-100 space-y-1.5 pl-11">
          {habit.checklists.map((item) => {
            const isChecked = Boolean(log?.checklistProgress?.[item.id]);
            return (
              <label
                key={item.id}
                className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 hover:text-neutral-900"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleChecklistItem(habit.id, item.id)}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0 w-3.5 h-3.5"
                />
                <span className={isChecked ? "line-through text-neutral-400" : ""}>
                  {item.text}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {/* Compact Progress Bar for Measurable Habits */}
      {(habit.type === "quantity" || habit.type === "duration" || habit.type === "counter") && (
        <div className="mt-2.5 w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted ? "bg-emerald-500" : "bg-neutral-800"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
};
