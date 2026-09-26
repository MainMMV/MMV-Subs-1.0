import { Habit, HabitLog } from "../types/habit";
import { formatDateStr } from "../utils/habitCalculations";

export const getDefaultHabits = (): Habit[] => {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const startStr = formatDateStr(thirtyDaysAgo);

  return [
    {
      id: "habit-water",
      name: "Drink 2.5L Water",
      description: "Hydrate properly throughout the day with 5 glasses minimum",
      icon: "Droplets",
      color: "#0284c7", // Sky
      category: "Health",
      type: "quantity",
      unit: "L",
      targetValue: 2.5,
      minTarget: 2.0,
      multipleCompletionsPerDay: true,
      scheduleType: "daily",
      timeOfDay: "anytime",
      startDate: startStr,
      order: 1,
      isPinned: true,
      isPaused: false,
      reminders: [
        {
          id: "rem-1",
          time: "10:00",
          incompleteOnly: true,
          enabled: true,
        },
        {
          id: "rem-2",
          time: "15:00",
          incompleteOnly: true,
          enabled: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "habit-reading",
      name: "Read 25 Pages",
      description: "Focus on non-fiction, finance, or programming books",
      icon: "BookOpen",
      color: "#7c3aed", // Violet
      category: "Study",
      type: "quantity",
      unit: "pages",
      targetValue: 25,
      scheduleType: "weekdays",
      weekdays: [1, 2, 3, 4, 5],
      timeOfDay: "evening",
      startDate: startStr,
      order: 2,
      isPinned: true,
      isPaused: false,
      reminders: [
        {
          id: "rem-read",
          time: "20:30",
          incompleteOnly: true,
          deadline: "23:00",
          enabled: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "habit-meditation",
      name: "Mindful Meditation",
      description: "15 minutes box breathing and mental stillness",
      icon: "Sparkles",
      color: "#059669", // Emerald
      category: "Mindfulness",
      type: "duration",
      unit: "min",
      targetValue: 15,
      scheduleType: "daily",
      timeOfDay: "morning",
      startDate: startStr,
      order: 3,
      isPinned: false,
      isPaused: false,
      reminders: [
        {
          id: "rem-med",
          time: "07:30",
          incompleteOnly: true,
          enabled: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "habit-coffee-limit",
      name: "Coffee Consumption Limit",
      description: "Keep caffeine intake at or below 2 cups max per day",
      icon: "Coffee",
      color: "#b45309", // Amber
      category: "Health",
      type: "limit",
      unit: "cups",
      targetValue: 2,
      scheduleType: "daily",
      timeOfDay: "afternoon",
      startDate: startStr,
      order: 4,
      isPinned: false,
      isPaused: false,
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "habit-morning-routine",
      name: "Morning Startup Routine",
      description: "Complete essential hygiene, bed-making, and stretch",
      icon: "Sun",
      color: "#ea580c", // Orange
      category: "Productivity",
      type: "checklist",
      checklists: [
        { id: "c-1", text: "Make bed & open windows" },
        { id: "c-2", text: "5-minute spinal stretch" },
        { id: "c-3", text: "Review day's top 3 tasks" },
      ],
      scheduleType: "daily",
      timeOfDay: "morning",
      startDate: startStr,
      order: 5,
      isPinned: false,
      isPaused: false,
      reminders: [
        {
          id: "rem-morn",
          time: "07:00",
          incompleteOnly: true,
          enabled: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "habit-gym",
      name: "Strength / Cardio Training",
      description: "4 workouts per week to build strength and stamina",
      icon: "Dumbbell",
      color: "#e11d48", // Rose
      category: "Fitness",
      type: "yes_no",
      scheduleType: "weekly_frequency",
      weeklyTargetCount: 4,
      timeOfDay: "evening",
      startDate: startStr,
      order: 6,
      isPinned: false,
      isPaused: false,
      reminders: [
        {
          id: "rem-gym",
          time: "18:00",
          incompleteOnly: true,
          enabled: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "habit-avoid-sugar",
      name: "No Refined Sugar",
      description: "Avoid candy, soda, and pastries during workdays",
      icon: "ShieldAlert",
      color: "#4f46e5", // Indigo
      category: "Health",
      type: "avoid",
      scheduleType: "weekdays",
      weekdays: [1, 2, 3, 4, 5],
      timeOfDay: "anytime",
      startDate: startStr,
      order: 7,
      isPinned: false,
      isPaused: false,
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
};

export const getDefaultHabitLogs = (habits: Habit[]): Record<string, Record<string, HabitLog>> => {
  const result: Record<string, Record<string, HabitLog>> = {};
  const today = new Date();

  habits.forEach((habit) => {
    result[habit.id] = {};

    // Generate past 28 days of logs
    for (let i = 28; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = formatDateStr(d);
      const isToday = i === 0;

      // Realistic pseudo-random pattern based on habit ID and day offset
      const hash = (habit.id.length * 17 + i * 31 + d.getDay() * 11) % 100;

      if (isToday) {
        // Half completed for today
        if (habit.id === "habit-water") {
          result[habit.id][dateStr] = {
            id: `log-${habit.id}-${dateStr}`,
            habitId: habit.id,
            date: dateStr,
            status: "partial",
            completed: false,
            value: 1.5,
            targetValue: 2.5,
            completedAt: new Date().toISOString(),
          };
        } else if (habit.id === "habit-morning-routine") {
          result[habit.id][dateStr] = {
            id: `log-${habit.id}-${dateStr}`,
            habitId: habit.id,
            date: dateStr,
            status: "completed",
            completed: true,
            checklistProgress: { "c-1": true, "c-2": true, "c-3": true },
            completedAt: new Date().toISOString(),
          };
        }
        continue;
      }

      // Check if scheduled
      const dayOfWeek = d.getDay();
      let isScheduled = true;
      if (habit.scheduleType === "weekdays") {
        isScheduled = dayOfWeek >= 1 && dayOfWeek <= 5;
      }

      if (!isScheduled) continue;

      if (hash > 88) {
        // Intentional skip
        result[habit.id][dateStr] = {
          id: `log-${habit.id}-${dateStr}`,
          habitId: habit.id,
          date: dateStr,
          status: "skipped",
          completed: false,
          notes: "Rest day / approved skip",
        };
      } else if (hash > 20) {
        // Completed
        let value = habit.targetValue;
        if (habit.type === "quantity" && habit.unit === "L") {
          value = 2.5;
        } else if (habit.type === "quantity" && habit.unit === "pages") {
          value = 25 + (hash % 10);
        } else if (habit.type === "duration") {
          value = 15;
        }

        result[habit.id][dateStr] = {
          id: `log-${habit.id}-${dateStr}`,
          habitId: habit.id,
          date: dateStr,
          status: "completed",
          completed: true,
          value,
          targetValue: habit.targetValue,
          completedAt: new Date(d.setHours(9, 30)).toISOString(),
        };
      } else if (hash > 12 && habit.type === "quantity") {
        // Partial
        result[habit.id][dateStr] = {
          id: `log-${habit.id}-${dateStr}`,
          habitId: habit.id,
          date: dateStr,
          status: "partial",
          completed: false,
          value: habit.targetValue ? Math.round(habit.targetValue * 0.6 * 10) / 10 : 1,
          targetValue: habit.targetValue,
        };
      }
      // Else left uncompleted -> missed
    }
  });

  return result;
};
