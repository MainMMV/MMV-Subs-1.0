import React, { useState, useEffect, useCallback } from "react";
import { 
  AppPage, 
  PaymentItem, 
  ItemType, 
  PaymentHistoryRecord, 
  CurrencyCode, 
  CurrencyDisplayMode,
  TelegramConfig, 
  ItemReminder,
  SpendingGoal,
  GoogleCalendarSyncState,
  AppTheme
} from "./types";
import { 
  INITIAL_ITEMS, 
  INITIAL_PAYMENT_HISTORY, 
  DEFAULT_EXCHANGE_RATE_USD_TO_UZS,
  INITIAL_GOALS 
} from "./data/initialData";
import { getItemStatus, getNextRecurrenceDate } from "./utils/calculations";
import { syncToFirebase } from "./firebase";
import { initGoogleCalendarAuth } from "./services/googleCalendar";
import { generateInAppNotifications, triggerBrowserDueAlerts } from "./services/notificationService";
import { Sidebar } from "./components/Navigation/Sidebar";
import { TopNavbar } from "./components/Navigation/TopNavbar";
import { ItemModal } from "./components/Modals/ItemModal";
import { ItemDetailModal } from "./components/Modals/ItemDetailModal";
import { GoalModal } from "./components/Modals/GoalModal";
import { ItemStatisticsModal } from "./components/Modals/ItemStatisticsModal";
import { ItemHistoryModal } from "./components/Modals/ItemHistoryModal";
import { ManageRemindersModal } from "./components/Modals/ManageRemindersModal";
import { DeleteConfirmModal } from "./components/Modals/DeleteConfirmModal";
import { UndoToast } from "./components/UndoToast";
import { NotificationsDrawer } from "./components/NotificationsDrawer";
import { GoogleCalendarSyncModal } from "./components/GoogleCalendarSyncModal";
import { NewItemSelectModal, NewItemType } from "./components/Modals/NewItemSelectModal";
import { HomeView } from "./views/HomeView";
import { SubscriptionsView } from "./views/SubscriptionsView";
import { RecurringBillsView } from "./views/RecurringBillsView";
import { OneTimePurchasesView } from "./views/OneTimePurchasesView";
import { CalendarView } from "./views/CalendarView";
import { GoalsView } from "./views/GoalsView";
import { SettingsView } from "./views/SettingsView";
import { HabitsView } from "./views/HabitsView";
import { Habit, HabitLog } from "./types";
import { getDefaultHabits, getDefaultHabitLogs } from "./data/defaultHabits";

const STORAGE_KEYS = {
  ITEMS: "mmv_subs_items_v3",
  HISTORY: "mmv_subs_history_v3",
  CURRENCY: "mmv_subs_currency_v2",
  RATE: "mmv_subs_rate_v2",
  TELEGRAM: "mmv_subs_telegram_v2",
  GOALS: "mmv_subs_goals_v2",
  HABITS: "mmv_subs_habits_v2",
  HABIT_LOGS: "mmv_subs_habit_logs_v2",
  THEME: "mmv_subs_theme_v2",
};

export default function App() {
  // Theme State: "warm-dark" is default
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return (saved === "light" || saved === "warm-dark") ? saved : "warm-dark";
    } catch {
      return "warm-dark";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {}
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "warm-dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Navigation State
  const [currentPage, setCurrentPage] = useState<AppPage>("home");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNewItemSelectOpen, setIsNewItemSelectOpen] = useState(false);
  const [isCreateHabitOpen, setIsCreateHabitOpen] = useState(false);

  // Items State (Subscriptions, Recurring Bills, One-Time Purchases)
  const [items, setItems] = useState<PaymentItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ITEMS);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ITEMS;
    } catch {
      return INITIAL_ITEMS;
    }
  });

  // Payment History State
  const [records, setRecords] = useState<PaymentHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : INITIAL_PAYMENT_HISTORY;
    } catch {
      return INITIAL_PAYMENT_HISTORY;
    }
  });

  // Display Currency Priority Mode State (default, USD, or UZS)
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyDisplayMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENCY);
    if (saved === "default" || saved === "USD" || saved === "UZS") {
      return saved as CurrencyDisplayMode;
    }
    return "default";
  });

  // Manual Exchange Rate (1 USD = X UZS)
  const [exchangeRateUsdToUzs, setExchangeRateUsdToUzs] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RATE);
      const parsed = saved ? parseFloat(saved) : NaN;
      return !isNaN(parsed) && parsed > 0 ? parsed : DEFAULT_EXCHANGE_RATE_USD_TO_UZS;
    } catch {
      return DEFAULT_EXCHANGE_RATE_USD_TO_UZS;
    }
  });

  // Telegram Config State
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TELEGRAM);
      return saved
        ? JSON.parse(saved)
        : {
            botToken: "",
            chatId: "",
            isEnabled: false,
            remindDaysBefore: [3, 1, 0],
            notifyPastDue: true,
          };
    } catch {
      return {
        botToken: "",
        chatId: "",
        isEnabled: false,
        remindDaysBefore: [3, 1, 0],
        notifyPastDue: true,
      };
    }
  });

  // Goals State
  const [goals, setGoals] = useState<SpendingGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_GOALS;
    } catch {
      return INITIAL_GOALS;
    }
  });

  // Habits State
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HABITS);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultHabits();
    } catch {
      return getDefaultHabits();
    }
  });

  // Habit Tracking Logs State (habitId -> dateStr -> HabitLog)
  const [habitLogs, setHabitLogs] = useState<Record<string, Record<string, HabitLog>>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HABIT_LOGS);
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && typeof parsed === "object" ? parsed : getDefaultHabitLogs(getDefaultHabits());
    } catch {
      return getDefaultHabitLogs(getDefaultHabits());
    }
  });

  // Modal States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentItem | null>(null);
  const [defaultNewType, setDefaultNewType] = useState<ItemType>("subscription");

  // Item Detail Modal State
  const [detailItem, setDetailItem] = useState<PaymentItem | null>(null);

  // Goal Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SpendingGoal | null>(null);

  const [statsItem, setStatsItem] = useState<PaymentItem | null>(null);
  const [historyItem, setHistoryItem] = useState<PaymentItem | null>(null);
  const [remindersItem, setRemindersItem] = useState<PaymentItem | null>(null);

  // Delete & 5-Second Undo State
  const [deleteCandidate, setDeleteCandidate] = useState<PaymentItem | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [undoItem, setUndoItem] = useState<PaymentItem | null>(null);

  // Notifications Drawer State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Google Calendar Synchronization State
  const [isCalendarSyncModalOpen, setIsCalendarSyncModalOpen] = useState(false);
  const [calendarSyncState, setCalendarSyncState] = useState<GoogleCalendarSyncState>({
    isConnected: false,
    userEmail: null,
    userName: null,
    userPhoto: null,
    lastSyncedAt: null,
    syncedEventCount: 0,
  });

  // Listen for Google Auth changes for calendar
  useEffect(() => {
    const unsub = initGoogleCalendarAuth((state) => {
      setCalendarSyncState(state);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // Trigger browser push alerts for due items on load/item changes
  useEffect(() => {
    const notifs = generateInAppNotifications(items);
    triggerBrowserDueAlerts(notifs);
  }, [items]);

  // Persistence to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error("Failed saving items", e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(records));
    } catch (e) {
      console.error("Failed saving history", e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.error("Failed saving goals", e);
    }
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, displayCurrency);
  }, [displayCurrency]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RATE, exchangeRateUsdToUzs.toString());
  }, [exchangeRateUsdToUzs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TELEGRAM, JSON.stringify(telegramConfig));
    } catch (e) {
      console.error("Failed saving telegram config", e);
    }
  }, [telegramConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    } catch (e) {
      console.error("Failed saving habits", e);
    }
  }, [habits]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(habitLogs));
    } catch (e) {
      console.error("Failed saving habit logs", e);
    }
  }, [habitLogs]);

  // Habit Handlers
  const handleSaveHabit = (habitData: Partial<Habit>) => {
    if (habitData.id) {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitData.id
            ? ({ ...h, ...habitData, updatedAt: new Date().toISOString() } as Habit)
            : h
        )
      );
    } else {
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        name: habitData.name || "Untitled Habit",
        description: habitData.description,
        icon: habitData.icon || "CheckCircle2",
        color: habitData.color || "#059669",
        category: habitData.category || "Health",
        type: habitData.type || "yes_no",
        unit: habitData.unit,
        targetValue: habitData.targetValue,
        minTarget: habitData.minTarget,
        maxTarget: habitData.maxTarget,
        multipleCompletionsPerDay: habitData.multipleCompletionsPerDay,
        checklists: habitData.checklists,
        scheduleType: habitData.scheduleType || "daily",
        weekdays: habitData.weekdays,
        weeklyTargetCount: habitData.weeklyTargetCount,
        monthlyTargetCount: habitData.monthlyTargetCount,
        customIntervalDays: habitData.customIntervalDays,
        weekdaySchedule: habitData.weekdaySchedule,
        weekendSchedule: habitData.weekendSchedule,
        timeOfDay: habitData.timeOfDay || "anytime",
        startDate: habitData.startDate || new Date().toISOString().slice(0, 10),
        endDate: habitData.endDate,
        order: habits.length + 1,
        isPinned: false,
        isPaused: false,
        reminders: habitData.reminders || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setHabits((prev) => [...prev, newHabit]);
    }
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setHabitLogs((prev) => {
      const next = { ...prev };
      delete next[habitId];
      return next;
    });
  };

  const handleUpdateHabitLog = (habitId: string, dateStr: string, updates: Partial<HabitLog>) => {
    setHabitLogs((prev) => {
      const habitLogsForId = { ...(prev[habitId] || {}) };
      const currentLog = habitLogsForId[dateStr] || {
        id: `log-${habitId}-${dateStr}`,
        habitId,
        date: dateStr,
        status: "unscheduled",
        completed: false,
      };

      habitLogsForId[dateStr] = {
        ...currentLog,
        ...updates,
      };

      return {
        ...prev,
        [habitId]: habitLogsForId,
      };
    });
  };

  // Sync all bot-visible sections in the background for Telegram reminders.
  useEffect(() => {
    const timer = setTimeout(() => {
      syncToFirebase(items, telegramConfig, habits, habitLogs, goals);
    }, 1500);
    return () => clearTimeout(timer);
  }, [items, telegramConfig, habits, habitLogs, goals]);

  // Handler: Open Add Modal or New Item Chooser Modal
  const handleOpenAddModal = (presetType?: ItemType) => {
    if (presetType) {
      setDefaultNewType(presetType);
      setEditingItem(null);
      setIsItemModalOpen(true);
      return;
    }
    // Generic "New Item" action opens selector modal
    setIsNewItemSelectOpen(true);
  };

  const handleSelectNewItemType = (type: NewItemType) => {
    setIsNewItemSelectOpen(false);
    if (type === "habit") {
      setCurrentPage("habits");
      setIsCreateHabitOpen(true);
    } else {
      setDefaultNewType(type);
      setEditingItem(null);
      setIsItemModalOpen(true);
    }
  };

  const handleEditItem = (item: PaymentItem) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (itemData: Partial<PaymentItem>) => {
    if (itemData.id) {
      // Edit existing
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemData.id
            ? {
                ...i,
                ...itemData,
                updatedAt: new Date().toISOString(),
              }
            : i
        )
      );
    } else {
      // Create new
      const newItem: PaymentItem = {
        id: `${itemData.type || "item"}-${Date.now()}`,
        type: itemData.type || "subscription",
        name: itemData.name || "Untitled",
        icon: itemData.icon || "credit-card",
        iconBgColor: itemData.iconBgColor || "#2563EB",
        notes: itemData.notes,
        price: itemData.price || 0,
        currency: itemData.currency || "USD",
        date: itemData.date || new Date().toISOString().slice(0, 10),
        time: itemData.time || "09:00",
        frequency: itemData.frequency,
        reminders: itemData.reminders || [],
        status: "upcoming",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
    }
  };

  // Handler: Toggle Paid status (Recurring items move to next month when completed)
  const handleTogglePaid = (item: PaymentItem) => {
    const isRecurring = item.type === "subscription" || item.type === "bill";
    const currentlyPaid = item.manualStatus === "paid";

    if (isRecurring) {
      // 1. Record completed payment history
      const newRecord: PaymentHistoryRecord = {
        id: `hist-${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        date: item.date || new Date().toISOString().slice(0, 10),
        amount: item.price,
        originalCurrency: item.currency,
        status: "paid",
        notes: `Completed for ${item.date || "current period"}`,
      };
      setRecords((prev) => [newRecord, ...prev]);

      // 2. Move recurring item to next month / recurrence interval
      const nextDate = getNextRecurrenceDate(item.date, item.frequency);

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                date: nextDate,
                manualStatus: null, // Reset status to upcoming for the new month
                paidAt: new Date().toISOString().slice(0, 10),
                updatedAt: new Date().toISOString(),
              }
            : i
        )
      );
    } else {
      // One-time purchase toggle
      const nextManualStatus = currentlyPaid ? null : "paid";
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                manualStatus: nextManualStatus,
                paidAt: nextManualStatus ? new Date().toISOString().slice(0, 10) : undefined,
                updatedAt: new Date().toISOString(),
              }
            : i
        )
      );

      if (!currentlyPaid) {
        const newRecord: PaymentHistoryRecord = {
          id: `hist-${Date.now()}`,
          itemId: item.id,
          itemName: item.name,
          itemType: item.type,
          date: new Date().toISOString().slice(0, 10),
          amount: item.price,
          originalCurrency: item.currency,
          status: "paid",
          notes: `Recorded on ${new Date().toLocaleDateString()}`,
        };
        setRecords((prev) => [newRecord, ...prev]);
      }
    }
  };

  // Handler: Manage Reminders
  const handleSaveReminders = (itemId: string, updatedReminders: ItemReminder[]) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, reminders: updatedReminders } : i))
    );
  };

  // Handler: Update Item Status (from Detail modal)
  const handleUpdateStatus = (item: PaymentItem, status: "paid" | "skipped" | "upcoming") => {
    const isNowPaid = status === "paid";
    const isRecurring = item.type === "subscription" || item.type === "bill";

    if (isNowPaid && isRecurring) {
      const newRecord: PaymentHistoryRecord = {
        id: `hist-${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        date: item.date || new Date().toISOString().slice(0, 10),
        amount: item.price,
        originalCurrency: item.currency,
        status: "paid",
        notes: `Completed for ${item.date || "current period"}`,
      };
      setRecords((prev) => [newRecord, ...prev]);

      const nextDate = getNextRecurrenceDate(item.date, item.frequency);

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                date: nextDate,
                manualStatus: null,
                paidAt: new Date().toISOString().slice(0, 10),
                updatedAt: new Date().toISOString(),
              }
            : i
        )
      );

      if (detailItem && detailItem.id === item.id) {
        setDetailItem((prev) =>
          prev ? { ...prev, date: nextDate, manualStatus: null } : null
        );
      }
    } else {
      const manualStatus = status === "upcoming" ? null : status;
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                manualStatus,
                paidAt: isNowPaid ? new Date().toISOString().slice(0, 10) : undefined,
                updatedAt: new Date().toISOString(),
              }
            : i
        )
      );

      if (isNowPaid) {
        const newRecord: PaymentHistoryRecord = {
          id: `hist-${Date.now()}`,
          itemId: item.id,
          itemName: item.name,
          itemType: item.type,
          date: new Date().toISOString().slice(0, 10),
          amount: item.price,
          originalCurrency: item.currency,
          status: "paid",
          notes: `Recorded on ${new Date().toLocaleDateString()}`,
        };
        setRecords((prev) => [newRecord, ...prev]);
      }

      if (detailItem && detailItem.id === item.id) {
        setDetailItem((prev) =>
          prev
            ? {
                ...prev,
                manualStatus,
                paidAt: isNowPaid ? new Date().toISOString().slice(0, 10) : undefined,
              }
            : null
        );
      }
    }
  };

  // Handler: Item Detail modal open
  const handleViewDetail = (item: PaymentItem) => {
    setDetailItem(item);
  };

  // Handlers: Goals Management
  const handleOpenAddGoal = () => {
    setEditingGoal(null);
    setIsGoalModalOpen(true);
  };

  const handleEditGoal = (goal: SpendingGoal) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (goalData: Partial<SpendingGoal>) => {
    if (goalData.id) {
      setGoals((prev) =>
        prev.map((g) => (g.id === goalData.id ? { ...g, ...goalData } : g))
      );
    } else {
      const newGoal: SpendingGoal = {
        id: `goal-${Date.now()}`,
        title: goalData.title || "Budget Target",
        type: goalData.type || "budget_limit",
        category: goalData.category || "all",
        targetAmount: goalData.targetAmount || 0,
        currentAmount: goalData.currentAmount || 0,
        currency: goalData.currency || "USD",
        imageUrl: goalData.imageUrl,
        period: goalData.period || "monthly",
        deadline: goalData.deadline,
        notes: goalData.notes,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
      setGoals((prev) => [newGoal, ...prev]);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const handleUpdateGoalProgress = (goalId: string, deltaAmount: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const nextCurrent = Math.max(0, (g.currentAmount || 0) + deltaAmount);
        return {
          ...g,
          currentAmount: nextCurrent,
          isCompleted: g.type === "savings_target" ? nextCurrent >= g.targetAmount : g.isCompleted,
        };
      })
    );
  };

  const handleToggleCompleteGoal = (goalId: string) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, isCompleted: !g.isCompleted } : g))
    );
  };

  // Handler: Delete Flow with 5-Second Undo
  const handleDeleteRequest = (item: PaymentItem) => {
    if (detailItem?.id === item.id) {
      setDetailItem(null);
    }
    setDeleteCandidate(item);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteCandidate) return;
    const itemToDelete = deleteCandidate;
    
    // Remove from active list
    setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));

    // Show Undo toast for 5 seconds
    setUndoItem(itemToDelete);
    setDeleteCandidate(null);
  };

  const handleUndoDelete = () => {
    if (!undoItem) return;
    // Restore item completely
    setItems((prev) => [undoItem, ...prev]);
    setUndoItem(null);
  };

  const handlePermanentDelete = () => {
    setUndoItem(null);
  };

  // Count notifications (unread in-app notifications)
  const inAppNotifications = generateInAppNotifications(items);
  const activeNotificationsCount = inAppNotifications.filter((n) => !n.read).length;

  const displayItems = items;

  // Reset data handler
  const handleResetData = () => {
    setItems(INITIAL_ITEMS);
    setRecords(INITIAL_PAYMENT_HISTORY);
    setGoals(INITIAL_GOALS);
    setExchangeRateUsdToUzs(DEFAULT_EXCHANGE_RATE_USD_TO_UZS);
    setDisplayCurrency("USD");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50 text-neutral-900 select-none">
      {/* 1. FIXED MAIN NAVIGATION SIDEBAR */}
      <div className="hidden md:block h-full">
        <Sidebar
          currentPage={currentPage}
          onSelectPage={(p) => setCurrentPage(p)}
          items={items}
          habitsCount={habits.filter((h) => !h.isPaused).length}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenAddModal={() => handleOpenAddModal()}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div 
            className="w-64 h-full bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              currentPage={currentPage}
              onSelectPage={(p) => {
                setCurrentPage(p);
                setIsMobileSidebarOpen(false);
              }}
              items={items}
              habitsCount={habits.filter((h) => !h.isPaused).length}
              isCollapsed={false}
              onOpenAddModal={() => {
                setIsMobileSidebarOpen(false);
                handleOpenAddModal();
              }}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Navbar */}
        <TopNavbar
          currentPage={currentPage}
          exchangeRateUsdToUzs={exchangeRateUsdToUzs}
          notificationCount={activeNotificationsCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenAddModal={() => handleOpenAddModal()}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {currentPage === "home" && (
            <HomeView
              items={displayItems}
              records={records}
              goals={goals}
              displayCurrency={displayCurrency}
              exchangeRateUsdToUzs={exchangeRateUsdToUzs}
              onViewDetail={handleViewDetail}
              onEdit={handleEditItem}
              onManageReminders={(item) => setRemindersItem(item)}
              onViewStatistics={(item) => setStatsItem(item)}
              onViewHistory={(item) => setHistoryItem(item)}
              onDelete={handleDeleteRequest}
              onTogglePaid={handleTogglePaid}
              onOpenAddModal={() => handleOpenAddModal()}
              onNavigateToCalendar={() => setCurrentPage("calendar")}
              onNavigateToGoals={() => setCurrentPage("goals")}
              onOpenCalendarSync={() => setIsCalendarSyncModalOpen(true)}
            />
          )}

          {currentPage === "habits" && (
            <HabitsView
              habits={habits}
              logs={habitLogs}
              onSaveHabit={handleSaveHabit}
              onDeleteHabit={handleDeleteHabit}
              onUpdateLog={handleUpdateHabitLog}
              externalCreateHabitOpen={isCreateHabitOpen}
              onCloseExternalCreateHabit={() => setIsCreateHabitOpen(false)}
            />
          )}

          {currentPage === "subscriptions" && (
            <SubscriptionsView
              items={displayItems}
              displayCurrency={displayCurrency}
              exchangeRateUsdToUzs={exchangeRateUsdToUzs}
              onViewDetail={handleViewDetail}
              onEdit={handleEditItem}
              onManageReminders={(item) => setRemindersItem(item)}
              onViewStatistics={(item) => setStatsItem(item)}
              onViewHistory={(item) => setHistoryItem(item)}
              onDelete={handleDeleteRequest}
              onTogglePaid={handleTogglePaid}
              onOpenAddModal={() => handleOpenAddModal("subscription")}
            />
          )}

          {currentPage === "bills" && (
            <RecurringBillsView
              items={displayItems}
              displayCurrency={displayCurrency}
              exchangeRateUsdToUzs={exchangeRateUsdToUzs}
              onViewDetail={handleViewDetail}
              onEdit={handleEditItem}
              onManageReminders={(item) => setRemindersItem(item)}
              onViewStatistics={(item) => setStatsItem(item)}
              onViewHistory={(item) => setHistoryItem(item)}
              onDelete={handleDeleteRequest}
              onTogglePaid={handleTogglePaid}
              onOpenAddModal={() => handleOpenAddModal("bill")}
            />
          )}

          {currentPage === "purchases" && (
            <OneTimePurchasesView
              items={displayItems}
              displayCurrency={displayCurrency}
              exchangeRateUsdToUzs={exchangeRateUsdToUzs}
              onViewDetail={handleViewDetail}
              onEdit={handleEditItem}
              onManageReminders={(item) => setRemindersItem(item)}
              onViewStatistics={(item) => setStatsItem(item)}
              onViewHistory={(item) => setHistoryItem(item)}
              onDelete={handleDeleteRequest}
              onTogglePaid={handleTogglePaid}
              onOpenAddModal={() => handleOpenAddModal("purchase")}
            />
          )}

          {currentPage === "calendar" && (
            <CalendarView
              items={displayItems}
              displayCurrency={displayCurrency}
              exchangeRateUsdToUzs={exchangeRateUsdToUzs}
              onViewDetail={handleViewDetail}
              onEdit={handleEditItem}
              onManageReminders={(item) => setRemindersItem(item)}
              onViewStatistics={(item) => setStatsItem(item)}
              onViewHistory={(item) => setHistoryItem(item)}
              onDelete={handleDeleteRequest}
              onTogglePaid={handleTogglePaid}
              onOpenAddModal={() => handleOpenAddModal()}
              onOpenCalendarSync={() => setIsCalendarSyncModalOpen(true)}
              calendarSyncState={calendarSyncState}
            />
          )}

          {currentPage === "goals" && (
            <GoalsView
              goals={goals}
              items={displayItems}
              records={records}
              displayCurrency={displayCurrency}
              exchangeRateUsdToUzs={exchangeRateUsdToUzs}
              onOpenAddGoal={handleOpenAddGoal}
              onEditGoal={handleEditGoal}
              onDeleteGoal={handleDeleteGoal}
              onUpdateProgress={handleUpdateGoalProgress}
              onToggleComplete={handleToggleCompleteGoal}
            />
          )}

          {currentPage === "settings" && (
            <SettingsView
              displayCurrency={displayCurrency}
              onChangeDisplayCurrency={setDisplayCurrency}
              exchangeRateUsdToUzs={exchangeRateUsdToUzs}
              onUpdateExchangeRate={setExchangeRateUsdToUzs}
              telegramConfig={telegramConfig}
              onUpdateTelegramConfig={setTelegramConfig}
              items={items}
              onResetData={handleResetData}
              onOpenCalendarSync={() => setIsCalendarSyncModalOpen(true)}
              calendarSyncState={calendarSyncState}
              theme={theme}
              onChangeTheme={setTheme}
            />
          )}
        </main>
      </div>

      {/* SMART SINGLE CREATION / EDIT MODAL */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        initialItem={editingItem}
        defaultType={defaultNewType}
        exchangeRateUsdToUzs={exchangeRateUsdToUzs}
      />

      {/* ITEM DETAIL MODAL */}
      <ItemDetailModal
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        displayCurrency={displayCurrency}
        exchangeRateUsdToUzs={exchangeRateUsdToUzs}
        onEdit={(item) => {
          setDetailItem(null);
          handleEditItem(item);
        }}
        onManageReminders={(item) => {
          setDetailItem(null);
          setRemindersItem(item);
        }}
        onViewStatistics={(item) => {
          setDetailItem(null);
          setStatsItem(item);
        }}
        onViewHistory={(item) => {
          setDetailItem(null);
          setHistoryItem(item);
        }}
        onDelete={(item) => {
          handleDeleteRequest(item);
        }}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* GOAL CREATION / EDIT MODAL */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        initialGoal={editingGoal}
        exchangeRateUsdToUzs={exchangeRateUsdToUzs}
      />

      {/* ITEM STATISTICS MODAL */}
      <ItemStatisticsModal
        isOpen={Boolean(statsItem)}
        onClose={() => setStatsItem(null)}
        item={statsItem}
        records={records}
        displayCurrency={displayCurrency}
        exchangeRateUsdToUzs={exchangeRateUsdToUzs}
      />

      {/* ITEM HISTORY MODAL */}
      <ItemHistoryModal
        isOpen={Boolean(historyItem)}
        onClose={() => setHistoryItem(null)}
        item={historyItem}
        records={records}
        displayCurrency={displayCurrency}
        exchangeRateUsdToUzs={exchangeRateUsdToUzs}
        onAddRecord={(rec) => setRecords((prev) => [rec, ...prev])}
        onDeleteRecord={(id) => setRecords((prev) => prev.filter((r) => r.id !== id))}
      />

      {/* MANAGE REMINDERS MODAL */}
      <ManageRemindersModal
        isOpen={Boolean(remindersItem)}
        onClose={() => setRemindersItem(null)}
        item={remindersItem}
        onSaveReminders={handleSaveReminders}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeleteCandidate(null);
        }}
        onConfirm={handleConfirmDelete}
        itemName={deleteCandidate?.name || "this item"}
      />

      {/* 5-SECOND COUNTDOWN UNDO TOAST */}
      <UndoToast
        item={undoItem}
        onUndo={handleUndoDelete}
        onDismiss={handlePermanentDelete}
      />

      {/* IN-APP NOTIFICATIONS DRAWER (Upcoming & Missed) */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        items={items}
        displayCurrency={displayCurrency}
        exchangeRateUsdToUzs={exchangeRateUsdToUzs}
        onSelectItem={(item) => {
          setEditingItem(item);
          setIsItemModalOpen(true);
        }}
        onMarkPaid={handleTogglePaid}
        onOpenCalendarSync={() => setIsCalendarSyncModalOpen(true)}
        calendarSyncState={calendarSyncState}
      />

      {/* GOOGLE CALENDAR SYNC MODAL */}
      <GoogleCalendarSyncModal
        isOpen={isCalendarSyncModalOpen}
        onClose={() => setIsCalendarSyncModalOpen(false)}
        items={items}
        syncState={calendarSyncState}
        onSyncStateChange={setCalendarSyncState}
      />

      {/* NEW ITEM TYPE SELECTOR MODAL */}
      <NewItemSelectModal
        isOpen={isNewItemSelectOpen}
        onClose={() => setIsNewItemSelectOpen(false)}
        onSelectType={handleSelectNewItemType}
      />
    </div>
  );
}
