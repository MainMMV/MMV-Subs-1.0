import React, { useState } from "react";
import { X, FileText, Calendar, Check } from "lucide-react";
import { Habit, HabitLog } from "../../types/habit";
import { formatDateStr } from "../../utils/habitCalculations";

interface HabitNotesModalProps {
  habit: Habit;
  log?: HabitLog;
  dateStr: string;
  onSave: (notes: string) => void;
  onClose: () => void;
}

export const HabitNotesModal: React.FC<HabitNotesModalProps> = ({
  habit,
  log,
  dateStr,
  onSave,
  onClose,
}) => {
  const [notes, setNotes] = useState(log?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-2xs select-none">
      <div 
        className="w-full max-w-sm bg-white rounded-lg border border-neutral-200 shadow-xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-neutral-700" />
            <div>
              <h3 className="text-xs font-medium text-neutral-900">{habit.name}</h3>
              <p className="text-[11px] text-neutral-500">Day note for {dateStr}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xs">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            rows={3}
            placeholder="Write reflections, obstacles, or journal notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs p-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-neutral-900"
          />

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 rounded-lg border border-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg font-medium shadow-2xs"
            >
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface HabitBackdateModalProps {
  habit: Habit;
  onSave: (dateStr: string, value?: number, notes?: string) => void;
  onClose: () => void;
}

export const HabitBackdateModal: React.FC<HabitBackdateModalProps> = ({
  habit,
  onSave,
  onClose,
}) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const [selectedDate, setSelectedDate] = useState(formatDateStr(yesterday));
  const [val, setVal] = useState(habit.targetValue ? habit.targetValue.toString() : "1");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(val);
    onSave(selectedDate, !isNaN(num) ? num : undefined, note.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-2xs select-none">
      <div 
        className="w-full max-w-sm bg-white rounded-lg border border-neutral-200 shadow-xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-neutral-700" />
            <div>
              <h3 className="text-xs font-medium text-neutral-900">Backdate Completion</h3>
              <p className="text-[11px] text-neutral-500">{habit.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xs">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-neutral-700 block mb-1">
              Select Past Date
            </label>
            <input
              type="date"
              value={selectedDate}
              max={formatDateStr(new Date())}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs p-1.5 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white"
            />
          </div>

          {(habit.type === "quantity" || habit.type === "duration" || habit.type === "counter") && (
            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1">
                Amount Completed ({habit.unit || "units"})
              </label>
              <input
                type="number"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="w-full text-xs p-1.5 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-neutral-700 block mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Completed during flight"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs p-1.5 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 rounded-lg border border-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg font-medium shadow-2xs"
            >
              Record Backdate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
