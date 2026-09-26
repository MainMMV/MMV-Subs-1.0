export type HabitType = 
  | "yes_no" 
  | "quantity" 
  | "duration" 
  | "counter" 
  | "checklist" 
  | "limit" 
  | "avoid" 
  | "range";

export type HabitScheduleType = 
  | "daily" 
  | "weekdays" 
  | "weekly_frequency" 
  | "monthly_frequency" 
  | "custom_interval" 
  | "specific_dates" 
  | "weekday_weekend" 
  | "flexible";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "anytime";

export type HabitStatus = 
  | "completed" 
  | "partial" 
  | "missed" 
  | "skipped" 
  | "future" 
  | "unscheduled";

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface HabitReminder {
  id: string;
  time: string; // HH:mm
  days?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  incompleteOnly: boolean;
  deadline?: string; // HH:mm
  enabled: boolean;
}

export interface HabitTargetHistory {
  date: string;
  targetValue: number;
}

export interface HabitMilestone {
  days: number; // e.g. 7, 30, 100, 365
  achievedAt?: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  category: "Health" | "Productivity" | "Study" | "Fitness" | "Mindfulness" | "Finance" | "Custom";
  type: HabitType;
  unit?: string; // "glasses", "min", "pages", "km", "steps", "reps"
  targetValue?: number;
  minTarget?: number;
  maxTarget?: number;
  multipleCompletionsPerDay?: boolean;
  checklists?: ChecklistItem[];
  
  // Scheduling
  scheduleType: HabitScheduleType;
  weekdays?: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  weeklyTargetCount?: number;
  monthlyTargetCount?: number;
  customIntervalDays?: number;
  specificDates?: string[];
  weekdaySchedule?: boolean;
  weekendSchedule?: boolean;
  timeOfDay?: TimeOfDay;
  timeSlots?: string[];

  // Lifespan & Status
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  order: number;
  isPinned: boolean;
  isPaused: boolean;
  pausedAt?: string;

  // Reminders & Goals
  reminders: HabitReminder[];
  targetHistory?: HabitTargetHistory[];
  milestones?: HabitMilestone[];

  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  status: HabitStatus;
  completed: boolean;
  value?: number;
  targetValue?: number;
  checklistProgress?: Record<string, boolean>; // checklist item id -> boolean
  notes?: string;
  completedAt?: string;
  manualTimestamp?: string;
}

export interface HabitStreakInfo {
  currentStreak: number;
  longestStreak: number;
  streakStartDate: string | null;
  history: { startDate: string; endDate: string; length: number }[];
  milestones: { days: number; achieved: boolean }[];
}

export interface HabitAnalytics {
  completionRate: number; // 0 to 100
  totalCompletions: number;
  totalExpected: number;
  totalTrackedDays: number;
  consistencyScore: number; // 0 to 100
  averageProgress: number;
  trend: "increasing" | "stable" | "decreasing";
  bestDay: string | null;
  mostMissedDay: string | null;
  weekdayConsistency: Record<number, number>; // 0..6 -> percentage
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
}
