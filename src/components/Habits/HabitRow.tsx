import React, { useState } from "react";
import { 
  Check, 
  Plus, 
  Minus, 
  MoreVertical, 
  Flame, 
  FileText, 
  BarChart2, 
  Edit3, 
  Pause, 
  Play, 
  Pin, 
  PinOff, 
  Trash2,
  Calendar,
  Sparkles
} from "lucide-react";
import * as Icons from "lucide-react";
import { Habit, HabitLog } from "../../types/habit";

interface HabitRowProps {
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

export const HabitRow: React.FC<HabitRowProps> = ({
  habit,
  log,
  streak,
  onToggleComplete,
  onUpdateValue,
  onOpenNotes,
  onOpenStats,
  onEditHabit,
  onTogglePause,
  onTogglePin,
  onDeleteHabit,
  onOpenBackdate,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const isCompleted = log?.completed ?? false;
  const isSkipped = log?.status === "skipped";
  const currentValue = log?.value ?? (isCompleted ? habit.targetValue : 0);
  const target = habit.targetValue || 1;
  const pct = Math.min(100, Math.round((currentValue / target) * 100));

  // Dynamic Lucide icon
  const IconComponent = (Icons as any)[habit.icon] || Icons.CheckCircle2;

  return (
    <div
      className={`group px-3.5 py-2.5 rounded-lg border transition-colors flex items-center justify-between gap-3 select-none ${
        isCompleted
          ? "bg-emerald-50/20 border-emerald-200/60"
          : isSkipped
          ? "bg-neutral-100/40 border-neutral-200 opacity-60"
          : "bg-white border-neutral-200 hover:border-neutral-300"
      }`}
    >
      {/* Left: Completion Toggle + Icon + Habit Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Quick Checkbox / Completion Circle */}
        <button
          type="button"
          onClick={() => onToggleComplete(habit.id)}
          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
            isCompleted
              ? "bg-emerald-600 border-emerald-600 text-white"
              : "bg-white border-neutral-300 hover:border-neutral-400 text-transparent"
          }`}
          title={isCompleted ? "Mark Incomplete" : "Mark Complete"}
        >
          <Check size={13} strokeWidth={2.5} className={isCompleted ? "opacity-100" : "opacity-0"} />
        </button>

        {/* Habit Icon Badge */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
          style={{ backgroundColor: habit.color || "#3B82F6" }}
        >
          <IconComponent size={16} />
        </div>

        {/* Habit Title & Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4
              className={`text-xs font-medium truncate ${
                isCompleted ? "text-neutral-500 line-through" : "text-neutral-900"
              }`}
            >
              {habit.name}
            </h4>

            {habit.isPinned && (
              <Pin size={11} className="text-amber-500 fill-amber-500 shrink-0" />
            )}

            {habit.category && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 font-medium">
                {habit.category}
              </span>
            )}
          </div>

          {/* Micro Progress info for numerical habits */}
          {habit.type === "number" && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-neutral-500">
                {currentValue} / {habit.targetValue} {habit.unit}
              </span>
              <div className="w-16 bg-neutral-200 rounded-full h-1 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCompleted ? "bg-emerald-600" : "bg-neutral-800"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle/Right: Numerical Adjusters + Streak + Notes + Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Numerical Quick Plus / Minus */}
        {habit.type === "number" && !isCompleted && !isSkipped && (
          <div className="flex items-center border border-neutral-200 rounded-md overflow-hidden bg-neutral-50">
            <button
              type="button"
              onClick={() => onUpdateValue(habit.id, -1)}
              className="p-1 hover:bg-neutral-200 text-neutral-600 transition-colors"
              title="Decrease by 1"
            >
              <Minus size={12} />
            </button>
            <span className="px-1.5 text-[11px] font-medium text-neutral-800 min-w-5 text-center">
              {currentValue}
            </span>
            <button
              type="button"
              onClick={() => onUpdateValue(habit.id, 1)}
              className="p-1 hover:bg-neutral-200 text-neutral-600 transition-colors"
              title="Increase by 1"
            >
              <Plus size={12} />
            </button>
          </div>
        )}

        {/* Streak Flame Badge */}
        {streak > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60"
            title={`${streak} day streak`}
          >
            <Flame size={12} className="text-amber-500 fill-amber-500" />
            <span>{streak}d</span>
          </div>
        )}

        {/* Day Note Icon Button */}
        <button
          type="button"
          onClick={() => onOpenNotes(habit, log)}
          className={`p-1.5 rounded-md transition-colors ${
            log?.notes
              ? "text-blue-600 bg-blue-50 border border-blue-200"
              : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          }`}
          title={log?.notes ? `Note: ${log.notes}` : "Add Day Note"}
        >
          <FileText size={14} />
        </button>

        {/* Actions Dropdown Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
            title="More Options"
          >
            <MoreVertical size={14} />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-neutral-200 rounded-lg shadow-md py-1 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onOpenStats(habit);
                  }}
                  className="w-full px-3 py-1.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                >
                  <BarChart2 size={13} className="text-neutral-500" />
                  <span>View Statistics</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onOpenBackdate(habit);
                  }}
                  className="w-full px-3 py-1.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                >
                  <Calendar size={13} className="text-neutral-500" />
                  <span>Log Past Day</span>
                </button>

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

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onTogglePin(habit.id);
                  }}
                  className="w-full px-3 py-1.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                >
                  {habit.isPinned ? (
                    <>
                      <PinOff size={13} className="text-neutral-500" />
                      <span>Unpin</span>
                    </>
                  ) : (
                    <>
                      <Pin size={13} className="text-neutral-500" />
                      <span>Pin to Top</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onTogglePause(habit.id);
                  }}
                  className="w-full px-3 py-1.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                >
                  {habit.isPaused ? (
                    <>
                      <Play size={13} className="text-neutral-500" />
                      <span>Resume Habit</span>
                    </>
                  ) : (
                    <>
                      <Pause size={13} className="text-neutral-500" />
                      <span>Pause Habit</span>
                    </>
                  )}
                </button>

                <div className="my-1 border-t border-neutral-100" />

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteHabit(habit.id);
                  }}
                  className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <Trash2 size={13} className="text-rose-600" />
                  <span>Delete Habit</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
