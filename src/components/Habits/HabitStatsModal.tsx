import React, { useMemo } from "react";
import { 
  X, 
  BarChart2, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Award, 
  CheckCircle2, 
  Clock, 
  Target,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck
} from "lucide-react";
import * as Icons from "lucide-react";
import { Habit, HabitLog } from "../../types/habit";
import { 
  formatDateStr, 
  calculateHabitStreak, 
  calculateHabitAnalytics,
  generateYearActivityHeatmap 
} from "../../utils/habitCalculations";

interface HabitStatsModalProps {
  habit: Habit;
  logs: Record<string, HabitLog>;
  onClose: () => void;
}

export const HabitStatsModal: React.FC<HabitStatsModalProps> = ({
  habit,
  logs,
  onClose,
}) => {
  const todayStr = formatDateStr(new Date());

  const streakInfo = useMemo(() => {
    return calculateHabitStreak(habit, logs, todayStr);
  }, [habit, logs, todayStr]);

  const analytics = useMemo(() => {
    return calculateHabitAnalytics(habit, logs, todayStr);
  }, [habit, logs, todayStr]);

  const IconComponent = (Icons as any)[habit.icon] || Icons.CheckCircle2;

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-2xs select-none">
      <div 
        className="w-full max-w-2xl bg-white rounded-lg border border-neutral-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/60">
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
              style={{ backgroundColor: `${habit.color}15`, borderColor: `${habit.color}30`, color: habit.color }}
            >
              <IconComponent size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-neutral-900">{habit.name}</h2>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-200 text-neutral-700 font-medium">
                  {habit.category}
                </span>
                {habit.isPaused && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-medium">
                    Paused
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Statistics, performance consistency & historical streak records
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Consistency / Completion Rate */}
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50">
              <span className="text-[10px] uppercase font-medium text-neutral-500 block">
                Completion Rate
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-medium text-neutral-900">
                  {analytics.completionRate}%
                </span>
                <span className="text-[10px] text-neutral-500">
                  ({analytics.totalCompletions}/{analytics.totalExpected})
                </span>
              </div>
              <div className="mt-2 w-full bg-neutral-200 rounded-full h-1 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full" 
                  style={{ width: `${analytics.completionRate}%` }} 
                />
              </div>
            </div>

            {/* Current Streak */}
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-medium text-amber-800 block">
                  Current Streak
                </span>
                <Flame size={14} className="text-amber-600" />
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-medium text-amber-900">
                  {streakInfo.currentStreak}
                </span>
                <span className="text-[10px] text-amber-700">days</span>
              </div>
              <p className="text-[10px] text-amber-700 mt-1 truncate">
                Started: {streakInfo.streakStartDate || "No active streak"}
              </p>
            </div>

            {/* Longest Historical Streak */}
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-medium text-neutral-500 block">
                  Longest Streak
                </span>
                <Award size={14} className="text-neutral-500" />
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-medium text-neutral-900">
                  {streakInfo.longestStreak}
                </span>
                <span className="text-[10px] text-neutral-500">days best</span>
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                All-time personal record
              </p>
            </div>

            {/* Trend & Momentum */}
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50">
              <span className="text-[10px] uppercase font-medium text-neutral-500 block">
                30-Day Trend
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {analytics.trend === "increasing" ? (
                  <>
                    <TrendingUp size={16} className="text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Increasing</span>
                  </>
                ) : analytics.trend === "decreasing" ? (
                  <>
                    <TrendingDown size={16} className="text-rose-600" />
                    <span className="text-xs font-medium text-rose-700">Decreasing</span>
                  </>
                ) : (
                  <>
                    <span className="text-neutral-400 font-bold">—</span>
                    <span className="text-xs font-medium text-neutral-700">Stable</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                Last 30d: {analytics.monthlyCompletionRate}%
              </p>
            </div>
          </div>

          {/* Weekday Breakdown (Mon-Sun consistency) */}
          <div className="p-4 rounded-lg border border-neutral-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-neutral-900">
                Weekday Consistency Performance
              </h3>
              <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                <span>Best: <strong className="text-emerald-700 font-medium">{analytics.bestDay}</strong></span>
                <span>Weakest: <strong className="text-rose-700 font-medium">{analytics.mostMissedDay}</strong></span>
              </div>
            </div>

            {/* Vertical Bar Chart */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
                const pct = analytics.weekdayConsistency[dow] ?? 0;
                return (
                  <div key={dow} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-neutral-500 font-medium">{pct}%</span>
                    <div className="w-full bg-neutral-100 rounded-t h-24 flex items-end justify-center p-0.5">
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          pct >= 75
                            ? "bg-emerald-600"
                            : pct >= 50
                            ? "bg-emerald-400"
                            : pct > 0
                            ? "bg-neutral-300"
                            : "bg-transparent"
                        }`}
                        style={{ height: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-neutral-600">{weekdayLabels[dow]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Streak Milestones */}
          <div className="p-4 rounded-lg border border-neutral-200 bg-white space-y-2.5">
            <h3 className="text-xs font-medium text-neutral-900">
              Streak Achievements & Milestones
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {streakInfo.milestones.map((m) => (
                <div
                  key={m.days}
                  className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    m.achieved
                      ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                      : "border-neutral-200 bg-neutral-50/40 text-neutral-400"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    m.achieved ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-400"
                  }`}>
                    {m.achieved ? <CheckCircle2 size={14} /> : <Target size={14} />}
                  </div>
                  <div>
                    <span className="text-xs font-medium block">
                      {m.days} Days
                    </span>
                    <span className="text-[10px]">
                      {m.achieved ? "Achieved" : `${Math.max(0, m.days - streakInfo.longestStreak)} days left`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Habit Details & Rule Summary */}
          <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50/60 text-xs space-y-2">
            <h3 className="font-medium text-neutral-900 text-xs">Configuration & Rules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-600 text-[11px]">
              <div>
                <span className="text-neutral-500">Tracking Type:</span>{" "}
                <strong className="text-neutral-800 font-medium capitalize">{habit.type.replace("_", "/")}</strong>
              </div>
              <div>
                <span className="text-neutral-500">Schedule:</span>{" "}
                <strong className="text-neutral-800 font-medium capitalize">{habit.scheduleType.replace("_", " ")}</strong>
              </div>
              <div>
                <span className="text-neutral-500">Target Value:</span>{" "}
                <strong className="text-neutral-800 font-medium">{habit.targetValue || 1} {habit.unit || ""}</strong>
              </div>
              <div>
                <span className="text-neutral-500">Time of Day:</span>{" "}
                <strong className="text-neutral-800 font-medium capitalize">{habit.timeOfDay || "Anytime"}</strong>
              </div>
              <div>
                <span className="text-neutral-500">Started Tracking:</span>{" "}
                <strong className="text-neutral-800 font-medium">{habit.startDate}</strong>
              </div>
              <div>
                <span className="text-neutral-500">Skip Protection:</span>{" "}
                <strong className="text-emerald-700 font-medium">Enabled (Active)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
