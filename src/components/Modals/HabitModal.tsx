import React, { useState, useEffect } from "react";
import { 
  X, 
  Check, 
  Plus, 
  Trash2, 
  Bell, 
  Calendar, 
  Clock, 
  Target, 
  Sparkles,
  HelpCircle
} from "lucide-react";
import * as Icons from "lucide-react";
import { 
  Habit, 
  HabitType, 
  HabitScheduleType, 
  TimeOfDay, 
  ChecklistItem, 
  HabitReminder 
} from "../../types/habit";
import { formatDateStr } from "../../utils/habitCalculations";

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => void;
  editingHabit?: Habit | null;
}

const AVAILABLE_ICONS = [
  "Droplets", "BookOpen", "Sparkles", "Coffee", "Dumbbell", 
  "Sun", "Moon", "Heart", "Smile", "Brain", 
  "Footprints", "Apple", "Bed", "Briefcase", "Code", 
  "DollarSign", "PenTool", "CheckCircle2", "ShieldAlert", "Zap"
];

const AVAILABLE_COLORS = [
  "#0284c7", // Sky
  "#059669", // Emerald
  "#7c3aed", // Violet
  "#e11d48", // Rose
  "#ea580c", // Orange
  "#4f46e5", // Indigo
  "#b45309", // Amber
  "#0f766e", // Teal
  "#475569", // Slate
];

const CATEGORIES = [
  "Health", "Productivity", "Study", "Fitness", "Mindfulness", "Finance", "Custom"
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingHabit,
}) => {
  const todayStr = formatDateStr(new Date());

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("CheckCircle2");
  const [color, setColor] = useState("#059669");
  const [category, setCategory] = useState<Habit["category"]>("Health");
  const [type, setType] = useState<HabitType>("yes_no");
  const [unit, setUnit] = useState("");
  const [targetValue, setTargetValue] = useState<number | undefined>(undefined);
  const [minTarget, setMinTarget] = useState<number | undefined>(undefined);
  const [maxTarget, setMaxTarget] = useState<number | undefined>(undefined);
  const [multipleCompletions, setMultipleCompletions] = useState(false);

  // Checklists
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");

  // Scheduling
  const [scheduleType, setScheduleType] = useState<HabitScheduleType>("daily");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [weeklyTargetCount, setWeeklyTargetCount] = useState<number>(4);
  const [monthlyTargetCount, setMonthlyTargetCount] = useState<number>(10);
  const [customIntervalDays, setCustomIntervalDays] = useState<number>(2);
  const [weekdaySchedule, setWeekdaySchedule] = useState(true);
  const [weekendSchedule, setWeekendSchedule] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("anytime");

  // Dates
  const [startDate, setStartDate] = useState(todayStr);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState("");

  // Reminders
  const [reminders, setReminders] = useState<HabitReminder[]>([]);
  const [newReminderTime, setNewReminderTime] = useState("09:00");
  const [incompleteOnly, setIncompleteOnly] = useState(true);

  // Initialize form when opening/editing
  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name);
      setDescription(editingHabit.description || "");
      setIcon(editingHabit.icon);
      setColor(editingHabit.color);
      setCategory(editingHabit.category);
      setType(editingHabit.type);
      setUnit(editingHabit.unit || "");
      setTargetValue(editingHabit.targetValue);
      setMinTarget(editingHabit.minTarget);
      setMaxTarget(editingHabit.maxTarget);
      setMultipleCompletions(Boolean(editingHabit.multipleCompletionsPerDay));
      setChecklistItems(editingHabit.checklists || []);
      setScheduleType(editingHabit.scheduleType);
      setSelectedWeekdays(editingHabit.weekdays || [1, 2, 3, 4, 5]);
      setWeeklyTargetCount(editingHabit.weeklyTargetCount || 4);
      setMonthlyTargetCount(editingHabit.monthlyTargetCount || 10);
      setCustomIntervalDays(editingHabit.customIntervalDays || 2);
      setWeekdaySchedule(editingHabit.weekdaySchedule ?? true);
      setWeekendSchedule(editingHabit.weekendSchedule ?? true);
      setTimeOfDay(editingHabit.timeOfDay || "anytime");
      setStartDate(editingHabit.startDate || todayStr);
      setHasEndDate(Boolean(editingHabit.endDate));
      setEndDate(editingHabit.endDate || "");
      setReminders(editingHabit.reminders || []);
    } else {
      // Defaults for new habit
      setName("");
      setDescription("");
      setIcon("CheckCircle2");
      setColor("#059669");
      setCategory("Health");
      setType("yes_no");
      setUnit("");
      setTargetValue(1);
      setMinTarget(undefined);
      setMaxTarget(undefined);
      setMultipleCompletions(false);
      setChecklistItems([]);
      setScheduleType("daily");
      setSelectedWeekdays([1, 2, 3, 4, 5]);
      setWeeklyTargetCount(4);
      setMonthlyTargetCount(10);
      setCustomIntervalDays(2);
      setWeekdaySchedule(true);
      setWeekendSchedule(true);
      setTimeOfDay("anytime");
      setStartDate(todayStr);
      setHasEndDate(false);
      setEndDate("");
      setReminders([]);
    }
  }, [editingHabit, isOpen, todayStr]);

  if (!isOpen) return null;

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklistItems([
      ...checklistItems,
      { id: `c-${Date.now()}`, text: newChecklistText.trim() },
    ]);
    setNewChecklistText("");
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
  };

  const handleToggleWeekday = (dayNum: number) => {
    if (selectedWeekdays.includes(dayNum)) {
      if (selectedWeekdays.length > 1) {
        setSelectedWeekdays(selectedWeekdays.filter((d) => d !== dayNum));
      }
    } else {
      setSelectedWeekdays([...selectedWeekdays, dayNum].sort());
    }
  };

  const handleAddReminder = () => {
    if (!newReminderTime) return;
    const newRem: HabitReminder = {
      id: `rem-${Date.now()}`,
      time: newReminderTime,
      incompleteOnly,
      enabled: true,
    };
    setReminders([...reminders, newRem]);
  };

  const handleRemoveReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const habitData: Partial<Habit> = {
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      category,
      type,
      unit: unit.trim() || undefined,
      targetValue: targetValue ? Number(targetValue) : undefined,
      minTarget: minTarget ? Number(minTarget) : undefined,
      maxTarget: maxTarget ? Number(maxTarget) : undefined,
      multipleCompletionsPerDay: multipleCompletions,
      checklists: type === "checklist" ? checklistItems : undefined,
      scheduleType,
      weekdays: scheduleType === "weekdays" ? selectedWeekdays : undefined,
      weeklyTargetCount: scheduleType === "weekly_frequency" ? Number(weeklyTargetCount) : undefined,
      monthlyTargetCount: scheduleType === "monthly_frequency" ? Number(monthlyTargetCount) : undefined,
      customIntervalDays: scheduleType === "custom_interval" ? Number(customIntervalDays) : undefined,
      weekdaySchedule,
      weekendSchedule,
      timeOfDay,
      startDate,
      endDate: hasEndDate && endDate ? endDate : undefined,
      reminders,
    };

    onSave(habitData);
    onClose();
  };

  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-2xs select-none"
    >
      <div 
        className="w-full max-w-lg bg-white rounded-lg border border-neutral-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
              style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, color }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-medium text-neutral-900">
                {editingHabit ? "Edit Habit" : "Create New Habit"}
              </h2>
              <p className="text-[11px] text-neutral-500">
                Define tracking frequency, targets, schedules, and reminders
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Name & Description */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1">
                Habit Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Drink 2.5L Water, Read 20 Pages"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-neutral-900 transition-colors"
              />
            </div>
          </div>

          {/* Category, Icon & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-neutral-100">
            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1">
                Theme Color
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {AVAILABLE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-5 h-5 rounded-full border border-black/10 transition-transform flex items-center justify-center"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check size={10} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="text-xs font-medium text-neutral-700 block mb-1.5">
              Habit Icon
            </label>
            <div className="flex items-center gap-1.5 flex-wrap p-2 border border-neutral-200 rounded-lg bg-neutral-50 max-h-24 overflow-y-auto">
              {AVAILABLE_ICONS.map((ic) => {
                const Comp = (Icons as any)[ic] || Icons.CheckCircle2;
                return (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`p-1.5 rounded-md border text-neutral-700 transition-colors ${
                      icon === ic
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white border-neutral-200 hover:bg-neutral-100"
                    }`}
                  >
                    <Comp size={15} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Habit Type & Unit */}
          <div className="space-y-3 pt-2 border-t border-neutral-100">
            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1">
                Habit Type
              </label>
              <select
                value={type}
                onChange={(e: any) => setType(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white"
              >
                <option value="yes_no">Yes / No (Simple completion)</option>
                <option value="quantity">Quantity (Steps, liters, pages)</option>
                <option value="duration">Duration (Minutes, hours)</option>
                <option value="counter">Counter (Increment throughout day)</option>
                <option value="checklist">Checklist (Multiple sub-items)</option>
                <option value="limit">Limit (Stay below maximum)</option>
                <option value="avoid">Avoid (Negative habit cessation)</option>
                <option value="range">Range Goal (Min and Max target)</option>
              </select>
            </div>

            {/* Target Value & Units (for measurable types) */}
            {(type === "quantity" || type === "duration" || type === "counter" || type === "limit" || type === "range") && (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-neutral-600 block mb-1">
                    {type === "limit" ? "Maximum Limit" : type === "range" ? "Maximum Target" : "Target Amount"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 2.5, 30, 10000"
                    value={targetValue || ""}
                    onChange={(e) => setTargetValue(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-600 block mb-1">
                    Unit of Measurement
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. L, min, pages, steps, reps"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* Range Target min */}
            {type === "range" && (
              <div>
                <label className="text-[11px] font-medium text-neutral-600 block mb-1">
                  Minimum Target
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 5"
                  value={minTarget || ""}
                  onChange={(e) => setMinTarget(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white"
                />
              </div>
            )}

            {/* Checklist Builder */}
            {type === "checklist" && (
              <div className="space-y-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-xs font-medium text-neutral-700 block">
                  Checklist Sub-items
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add required step..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddChecklistItem())}
                    className="flex-1 text-xs p-1.5 border border-neutral-200 rounded-lg bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-2.5 py-1 text-xs bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1 pt-1 max-h-32 overflow-y-auto">
                  {checklistItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between text-xs p-1.5 bg-white rounded border border-neutral-200">
                      <span>{idx + 1}. {item.text}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                        className="text-neutral-400 hover:text-rose-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Schedule Rules */}
          <div className="space-y-3 pt-2 border-t border-neutral-100">
            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1">
                Repeat Schedule
              </label>
              <select
                value={scheduleType}
                onChange={(e: any) => setScheduleType(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white"
              >
                <option value="daily">Daily (Every day)</option>
                <option value="weekdays">Specific Weekdays</option>
                <option value="weekly_frequency">Weekly Frequency (e.g. 4 times/week)</option>
                <option value="monthly_frequency">Monthly Frequency (e.g. 10 times/month)</option>
                <option value="custom_interval">Custom Interval (Every N days)</option>
                <option value="weekday_weekend">Weekday vs Weekend Rules</option>
                <option value="flexible">Flexible (Anytime during cycle)</option>
              </select>
            </div>

            {/* Weekdays Selector */}
            {scheduleType === "weekdays" && (
              <div>
                <label className="text-[11px] font-medium text-neutral-600 block mb-1">
                  Active Days
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
                    const isSelected = selectedWeekdays.includes(dow);
                    return (
                      <button
                        key={dow}
                        type="button"
                        onClick={() => handleToggleWeekday(dow)}
                        className={`flex-1 py-1.5 text-xs rounded-md border text-center transition-colors ${
                          isSelected
                            ? "bg-neutral-900 text-white border-neutral-900 font-medium"
                            : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        {weekdayNames[dow]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weekly Frequency */}
            {scheduleType === "weekly_frequency" && (
              <div>
                <label className="text-[11px] font-medium text-neutral-600 block mb-1">
                  Days Per Week Goal
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={weeklyTargetCount}
                  onChange={(e) => setWeeklyTargetCount(parseInt(e.target.value) || 1)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white"
                />
              </div>
            )}

            {/* Custom Interval */}
            {scheduleType === "custom_interval" && (
              <div>
                <label className="text-[11px] font-medium text-neutral-600 block mb-1">
                  Every N Days
                </label>
                <input
                  type="number"
                  min="2"
                  max="365"
                  value={customIntervalDays}
                  onChange={(e) => setCustomIntervalDays(parseInt(e.target.value) || 2)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white"
                />
              </div>
            )}

            {/* Tracking Start Date */}
            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1">
                Tracking Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Reminders & Alerts */}
          <div className="space-y-2.5 pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-700">
                Reminders & Notification Alerts
              </span>
              <span className="text-[10px] text-neutral-500">
                Smart suppression enabled
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="time"
                value={newReminderTime}
                onChange={(e) => setNewReminderTime(e.target.value)}
                className="text-xs p-1.5 border border-neutral-200 rounded-lg bg-neutral-50"
              />

              <label className="flex items-center gap-1.5 text-[11px] text-neutral-600">
                <input
                  type="checkbox"
                  checked={incompleteOnly}
                  onChange={(e) => setIncompleteOnly(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-900"
                />
                <span>Remind only if unfinished</span>
              </label>

              <button
                type="button"
                onClick={handleAddReminder}
                className="ml-auto px-2.5 py-1 text-xs bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
              >
                Add
              </button>
            </div>

            {reminders.length > 0 && (
              <div className="space-y-1 pt-1">
                {reminders.map((rem) => (
                  <div key={rem.id} className="flex items-center justify-between text-xs p-2 bg-neutral-50 rounded border border-neutral-200">
                    <div className="flex items-center gap-2">
                      <Bell size={12} className="text-neutral-500" />
                      <span className="font-medium">{rem.time}</span>
                      {rem.incompleteOnly && (
                        <span className="text-[10px] text-neutral-500">(unfinished only)</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveReminder(rem.id)}
                      className="text-neutral-400 hover:text-rose-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors shadow-2xs"
          >
            {editingHabit ? "Save Changes" : "Create Habit"}
          </button>
        </div>
      </div>
    </div>
  );
};
