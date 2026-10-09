import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "en" | "uz" | "ru";

type TranslationValues = Record<string, string | number>;
export type TranslationKey = keyof typeof en;

const en = {
  language: "Language",
  languageDescription: "Choose the language used across MMV Hub.",
  settingsAppearance: "Appearance", settingsViews: "Views", settingsFinance: "Finance", settingsConnections: "Connections", settingsAccount: "Account", settingsData: "Data",
  googleAccount: "Google account", googleAccountDescription: "Sign in to save payments, habits, goals, and history to your account.", continueWithGoogle: "Continue with Google", connectingGoogle: "Connecting…", cloudSyncActive: "Your data is connected to this Google account.", cloudDataConflict: "This device and your Google account have different records. Choose which set to keep; the other will be replaced.", useCloudData: "Use cloud data", keepDeviceData: "Keep device data", signOutAccount: "Sign out", retryCloud: "Retry cloud connection", deviceProfile: "Device profile", deviceProfileDescription: "Optional name and contact details saved on this device.",
  typographyLayout: "Typography and layout", fontLabel: "Font", textSizeLabel: "Text size", cornerRadius: "Corner radius", spacingLabel: "Spacing", reduceMotion: "Reduce motion",
  all: "All", small: "Small", normal: "Default", large: "Large", square: "Square", soft: "Soft", round: "Round", compact: "Compact", comfortable: "Comfortable",
  savedViewsFilters: "Saved views and filters", rememberViews: "Remember view and filter choices", goalOrder: "Goal order", resetViewsFilters: "Reset views and filters", listView: "List", cardView: "Cards", deadlineSort: "Deadline", progressSort: "Progress", nameSort: "Name", completed: "Completed", dueInWeek: "Due in 7 days", adjustProgress: "Adjust progress", noGoalsInFilter: "No goals in this filter.", noGoalsYet: "No goals yet.",
  budgetLimit: "Budget limit", savingsTarget: "Savings target", categoryCap: "Category cap", billReserve: "Bill reserve", toGo: "to go", left: "left", late: "Late", done: "Done", deleteQuestion: "Delete?", yes: "Yes", no: "No",
  timeZone: "Time zone",
  english: "English",
  uzbek: "O‘zbekcha",
  russian: "Русский",
  home: "Home",
  today: "Today",
  overview: "Overview",
  habits: "Habits",
  habitTracker: "Habit Tracker",
  subscriptions: "Subscriptions",
  recurringBills: "Recurring Bills",
  oneTimePurchases: "One-Time Purchases",
  calendar: "Calendar",
  reports: "Reports",
  goals: "Goals",
  goalsBudgets: "Goals & Budgets",
  settings: "Settings",
  more: "More",
  openMenu: "Open menu",
  openNotifications: "Open notifications",
  appNavigation: "App navigation",
  addNewItem: "Add a new item",
  openAllSections: "Open all sections",
  allModules: "All modules",
  allModulesDescription: "Everything in MMV Hub, in one place.",
  newItem: "New Item",
  notifications: "Notifications",
  notificationCenter: "Notification Center",
  dueSoon: "Due Soon",
  overdue: "Overdue",
  upcoming: "Upcoming",
  connect: "Connect",
  syncNow: "Sync Now",
  exchangeRate: "Exchange rate: 1 USD to UZS",
  thisMonthSpending: "This month spending",
  thisYearSpending: "This year spending",
  fullYear: "Full year {year}",
  projectedOutflow: "30-day projected outflow",
  forecast: "Forecast",
  peak: "Peak: {date}",
  upcomingPayments: "Upcoming Payments",
  recentPayments: "Recent Payments",
  overduePayments: "Overdue Payments",
  noUpcomingPayments: "No upcoming payments.",
  noRecentPayments: "No recent payment records logged yet.",
  addFirstPayment: "Add your first payment",
  openFullCalendar: "Open full calendar",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  dueToday: "{count} due today",
  active: "Active",
  spendingSavingsGoals: "Spending & Savings Goals",
  themeAppearance: "Theme & Appearance",
  dark: "Dark",
  light: "Light",
  default: "Default",
  currencyConversion: "Currency & Conversion",
  currencyPriority: "Currency Priority & Display",
  createdCurrencyTop: "Created currency on top",
  usdTop: "USD on top, UZS below",
  uzsTop: "UZS on top, USD below",
  manualExchangeRate: "Manual exchange rate",
  uzsPerUsd: "UZS per USD",
  update: "Update",
  saved: "Saved",
  telegramNotifications: "Telegram Notifications",
  enableTelegramAlerts: "Enable Telegram Alerts",
  telegramChatId: "Telegram Chat ID",
  manualFallback: "manual fallback",
  saveTelegram: "Save Telegram Settings",
  sendTest: "Send Test Notification",
  availableBotCommands: "Available Telegram Bot Commands",
  calendarReminders: "Calendar reminders",
  connectGoogleCalendar: "Connect Google Calendar",
  connectNow: "Connect Now",
  browserAlerts: "Browser alerts",
  deviceAlerts: "Device reminders",
  enableBrowserAlerts: "Enable browser alerts",
  enableDeviceAlerts: "Enable device reminders",
  dataManagement: "Data Management",
  exportPayments: "Export payments (JSON)",
  clearData: "Clear data",
  onThisDevice: "On this device",
  readyForToday: "Ready for today",
  remindersActive: "Reminders active",
  enableReminders: "Enable reminders",
  deviceCalendar: "Device calendar",
  remindersScheduled: "{count} reminders scheduled",
  permissionDenied: "Notification permission was not granted",
  telegramLogin: "Telegram Login",
  telegramLoginDescription: "Telegram verifies your identity and fills your Chat ID automatically. MMV Hub never receives your bot token.",
  verifyingTelegram: "Verifying Telegram account…",
  telegramUnavailable: "Telegram Login is temporarily unavailable. Use the manual Chat ID below.",
  connectThroughTelegram: "Connect through Telegram",
  telegramApkInstructions: "Open the bot, tap Start, then copy the Chat ID it sends into the field below.",
  findingBot: "Finding bot…",
  paymentItem: "Payment item",
  subscription: "Subscription",
  recurringBill: "Recurring bill",
  billShort: "Bill",
  oneTimePurchase: "One-time purchase",
  purchaseShort: "Purchase",
  habit: "Habit",
  edit: "Edit",
  delete: "Delete",
  cancel: "Cancel",
  saveChanges: "Save Changes",
  createItem: "Create Item",
  createGoal: "Create Goal",
  close: "Close",
  name: "Name",
  category: "Category",
  price: "Price",
  renewalDate: "Renewal Date",
  dueDate: "Due Date",
  purchaseDate: "Purchase Date",
  frequency: "Frequency",
  amount: "Amount",
  date: "Date",
  notes: "Notes",
  optional: "Optional",
  icon: "Icon",
  every: "Every",
  days: "Days",
  weeks: "Weeks",
  months: "Months",
  years: "Years",
  mmvClassics: "MMV classics",
  mmvClassicsDescription: "Useful modules rebuilt from your earlier MMV projects.",
  tasks: "Tasks",
  bookmarks: "Bookmarks",
  focus: "Focus",
  reflection: "Reflection",
  salaryPlan: "Salary Plan",
  debtCalculator: "Debt Calculator",
  qrGenerator: "QR Generator",
  jsonEditor: "JSON Editor",
  clock: "Clock",
  tradeCalculator: "Trade Calculator",
  backToModules: "Back to modules",
  reminders: "Reminders",
  reminderShort: "Reminder",
  addReminder: "Add Reminder",
  noReminders: "No reminders added yet.",
  markPaid: "Mark Paid",
  manageReminders: "Manage Reminders",
  statistics: "Statistics",
  history: "History",
  noItems: "Nothing here yet.",
} as const;

const uz: Record<TranslationKey, string> = {
  settingsAppearance: "Ko‘rinish", settingsViews: "Ko‘rish", settingsFinance: "Moliya", settingsConnections: "Ulanishlar", settingsAccount: "Hisob", settingsData: "Ma’lumotlar",
  googleAccount: "Google hisobi", googleAccountDescription: "To‘lovlar, odatlar, maqsadlar va tarixni hisobingizga saqlash uchun kiring.", continueWithGoogle: "Google orqali davom etish", connectingGoogle: "Ulanmoqda…", cloudSyncActive: "Ma’lumotlaringiz Google hisobingizga ulangan.", cloudDataConflict: "Qurilmadagi va Google hisobidagi ma’lumotlar farq qiladi. Qaysi birini saqlashni tanlang; boshqasi almashtiriladi.", useCloudData: "Bulutdagi ma’lumotni olish", keepDeviceData: "Qurilmadagi ma’lumotni saqlash", signOutAccount: "Chiqish", retryCloud: "Bulutga qayta ulanish", deviceProfile: "Qurilma profili", deviceProfileDescription: "Ushbu qurilmada saqlanadigan ixtiyoriy ism va aloqa ma’lumotlari.",
  typographyLayout: "Shrift va joylashuv", fontLabel: "Shrift", textSizeLabel: "Matn o‘lchami", cornerRadius: "Burchak yumaloqligi", spacingLabel: "Oraliq", reduceMotion: "Harakatni kamaytirish",
  all: "Barchasi", small: "Kichik", normal: "Standart", large: "Katta", square: "To‘g‘ri", soft: "Yumshoq", round: "Yumaloq", compact: "Ixcham", comfortable: "Qulay",
  savedViewsFilters: "Saqlangan ko‘rinish va filtrlar", rememberViews: "Ko‘rinish va filtrlarni eslab qolish", goalOrder: "Maqsadlar tartibi", resetViewsFilters: "Ko‘rinish va filtrlarni tiklash", listView: "Ro‘yxat", cardView: "Kartalar", deadlineSort: "Muddat", progressSort: "Jarayon", nameSort: "Nom", completed: "Bajarilgan", dueInWeek: "7 kunda muddati", adjustProgress: "Jarayonni o‘zgartirish", noGoalsInFilter: "Bu filtrda maqsad yo‘q.", noGoalsYet: "Hozircha maqsad yo‘q.",
  budgetLimit: "Budjet chegarasi", savingsTarget: "Jamg‘arma maqsadi", categoryCap: "Turkum chegarasi", billReserve: "To‘lov zaxirasi", toGo: "qoldi", left: "qoldi", late: "Kechikdi", done: "Tayyor", deleteQuestion: "O‘chirasizmi?", yes: "Ha", no: "Yo‘q",
  language: "Til", languageDescription: "MMV Hub interfeysi tilini tanlang.", timeZone: "Vaqt mintaqasi", english: "English", uzbek: "O‘zbekcha", russian: "Русский",
  home: "Bosh sahifa", today: "Bugun", overview: "Umumiy", habits: "Odatlar", habitTracker: "Odatlar kuzatuvi", subscriptions: "Obunalar", recurringBills: "Doimiy to‘lovlar", oneTimePurchases: "Bir martalik xaridlar", calendar: "Taqvim", reports: "Hisobotlar", goals: "Maqsadlar", goalsBudgets: "Maqsadlar va budjet", settings: "Sozlamalar", more: "Boshqa",
  openMenu: "Menyuni ochish", openNotifications: "Bildirishnomalarni ochish", appNavigation: "Ilova navigatsiyasi", addNewItem: "Yangi element qo‘shish", openAllSections: "Barcha bo‘limlarni ochish", allModules: "Barcha bo‘limlar", allModulesDescription: "MMV Hub imkoniyatlarining barchasi bir joyda.", newItem: "Yangi element", notifications: "Bildirishnomalar", notificationCenter: "Bildirishnomalar markazi", dueSoon: "Yaqin muddat", overdue: "Kechikkan", upcoming: "Yaqin", connect: "Ulash", syncNow: "Hozir sinxronlash", exchangeRate: "Valyuta kursi: 1 USD dan UZS ga",
  thisMonthSpending: "Bu oy xarajatlari", thisYearSpending: "Bu yil xarajatlari", fullYear: "{year} yil", projectedOutflow: "30 kunlik kutilayotgan xarajat", forecast: "Prognoz", peak: "Eng yuqori: {date}", upcomingPayments: "Yaqin to‘lovlar", recentPayments: "So‘nggi to‘lovlar", overduePayments: "Kechikkan to‘lovlar", noUpcomingPayments: "Yaqin to‘lovlar yo‘q.", noRecentPayments: "Hozircha to‘lov tarixi yo‘q.", addFirstPayment: "Birinchi to‘lovni qo‘shing", openFullCalendar: "To‘liq taqvimni ochish", previousMonth: "Oldingi oy", nextMonth: "Keyingi oy", dueToday: "Bugun {count} ta", active: "Faol", spendingSavingsGoals: "Xarajat va jamg‘arma maqsadlari",
  themeAppearance: "Mavzu va ko‘rinish", dark: "Tungi", light: "Kunduzgi", default: "Standart", currencyConversion: "Valyuta va konvertatsiya", currencyPriority: "Valyuta tartibi va ko‘rinishi", createdCurrencyTop: "Yaratilgan valyuta tepada", usdTop: "USD tepada, UZS pastda", uzsTop: "UZS tepada, USD pastda", manualExchangeRate: "Qo‘lda valyuta kursi", uzsPerUsd: "1 USD uchun UZS", update: "Yangilash", saved: "Saqlandi",
  telegramNotifications: "Telegram bildirishnomalari", enableTelegramAlerts: "Telegram xabarlarini yoqish", telegramChatId: "Telegram Chat ID", manualFallback: "qo‘lda ulash", saveTelegram: "Telegram sozlamalarini saqlash", sendTest: "Sinov xabarini yuborish", availableBotCommands: "Telegram bot buyruqlari", calendarReminders: "Taqvim eslatmalari", connectGoogleCalendar: "Google Taqvimni ulash", connectNow: "Hozir ulash", browserAlerts: "Brauzer bildirishnomalari", deviceAlerts: "Qurilma eslatmalari", enableBrowserAlerts: "Brauzer bildirishnomalarini yoqish", enableDeviceAlerts: "Qurilma eslatmalarini yoqish", dataManagement: "Ma’lumotlarni boshqarish", exportPayments: "To‘lovlarni eksport qilish (JSON)", clearData: "Ma’lumotlarni tozalash",
  onThisDevice: "Ushbu qurilmada", readyForToday: "Bugunga tayyor", remindersActive: "Eslatmalar faol", enableReminders: "Eslatmalarni yoqish", deviceCalendar: "Qurilma taqvimi", remindersScheduled: "{count} ta eslatma rejalashtirildi", permissionDenied: "Bildirishnoma ruxsati berilmadi",
  telegramLogin: "Telegram orqali kirish", telegramLoginDescription: "Telegram shaxsingizni tasdiqlaydi va Chat ID ni avtomatik kiritadi. MMV Hub bot tokeningizni olmaydi.", verifyingTelegram: "Telegram hisobi tekshirilmoqda…", telegramUnavailable: "Telegram orqali kirish vaqtincha mavjud emas. Quyidagi Chat ID maydonidan foydalaning.", connectThroughTelegram: "Telegram orqali ulash", telegramApkInstructions: "Botni oching, Start tugmasini bosing va yuborilgan Chat ID ni quyidagi maydonga kiriting.", findingBot: "Bot qidirilmoqda…",
  paymentItem: "To‘lov", subscription: "Obuna", recurringBill: "Doimiy to‘lov", billShort: "To‘lov", oneTimePurchase: "Bir martalik xarid", purchaseShort: "Xarid", habit: "Odat", edit: "Tahrirlash", delete: "O‘chirish", cancel: "Bekor qilish", saveChanges: "O‘zgarishlarni saqlash", createItem: "Element yaratish", createGoal: "Maqsad yaratish", close: "Yopish", name: "Nomi", category: "Turkum", price: "Narx", renewalDate: "Yangilanish sanasi", dueDate: "To‘lov sanasi", purchaseDate: "Xarid sanasi", frequency: "Takrorlanish", amount: "Miqdor", date: "Sana", notes: "Qaydlar", optional: "Ixtiyoriy", icon: "Belgi", every: "Har", days: "Kun", weeks: "Hafta", months: "Oy", years: "Yil", mmvClassics: "MMV klassikasi", mmvClassicsDescription: "Avvalgi MMV loyihalaringizdan qayta yaratilgan foydali bo‘limlar.", tasks: "Vazifalar", bookmarks: "Xatcho‘plar", focus: "Diqqat", reflection: "Kundalik", salaryPlan: "Maosh rejasi", debtCalculator: "Qarz hisoblagich", qrGenerator: "QR generator", jsonEditor: "JSON muharriri", clock: "Soat", tradeCalculator: "Savdo hisoblagich", backToModules: "Bo‘limlarga qaytish", reminders: "Eslatmalar", reminderShort: "Eslatma", addReminder: "Eslatma qo‘shish", noReminders: "Hozircha eslatma yo‘q.", markPaid: "To‘landi deb belgilash", manageReminders: "Eslatmalarni boshqarish", statistics: "Statistika", history: "Tarix", noItems: "Hozircha hech narsa yo‘q.",
};

const ru: Record<TranslationKey, string> = {
  settingsAppearance: "Внешний вид", settingsViews: "Виды", settingsFinance: "Финансы", settingsConnections: "Подключения", settingsAccount: "Аккаунт", settingsData: "Данные",
  googleAccount: "Аккаунт Google", googleAccountDescription: "Войдите, чтобы сохранять платежи, привычки, цели и историю в аккаунте.", continueWithGoogle: "Войти через Google", connectingGoogle: "Подключение…", cloudSyncActive: "Данные подключены к вашему аккаунту Google.", cloudDataConflict: "Данные на устройстве отличаются от данных в аккаунте. Выберите, какие сохранить; другие будут заменены.", useCloudData: "Взять данные из облака", keepDeviceData: "Сохранить данные устройства", signOutAccount: "Выйти", retryCloud: "Повторить подключение", deviceProfile: "Профиль устройства", deviceProfileDescription: "Необязательные имя и контакты, сохранённые на этом устройстве.",
  typographyLayout: "Шрифт и компоновка", fontLabel: "Шрифт", textSizeLabel: "Размер текста", cornerRadius: "Скругление", spacingLabel: "Интервалы", reduceMotion: "Уменьшить анимацию",
  all: "Все", small: "Мелкий", normal: "Обычный", large: "Крупный", square: "Прямые", soft: "Мягкие", round: "Круглые", compact: "Компактно", comfortable: "Свободно",
  savedViewsFilters: "Сохранённые виды и фильтры", rememberViews: "Запоминать виды и фильтры", goalOrder: "Сортировка целей", resetViewsFilters: "Сбросить виды и фильтры", listView: "Список", cardView: "Карточки", deadlineSort: "Срок", progressSort: "Прогресс", nameSort: "Название", completed: "Завершено", dueInWeek: "Срок за 7 дней", adjustProgress: "Изменить прогресс", noGoalsInFilter: "В этом фильтре целей нет.", noGoalsYet: "Целей пока нет.",
  budgetLimit: "Лимит бюджета", savingsTarget: "Цель накопления", categoryCap: "Лимит категории", billReserve: "Резерв на счета", toGo: "осталось", left: "осталось", late: "Просрочено", done: "Готово", deleteQuestion: "Удалить?", yes: "Да", no: "Нет",
  language: "Язык", languageDescription: "Выберите язык интерфейса MMV Hub.", timeZone: "Часовой пояс", english: "English", uzbek: "O‘zbekcha", russian: "Русский",
  home: "Главная", today: "Сегодня", overview: "Обзор", habits: "Привычки", habitTracker: "Трекер привычек", subscriptions: "Подписки", recurringBills: "Регулярные счета", oneTimePurchases: "Разовые покупки", calendar: "Календарь", reports: "Отчёты", goals: "Цели", goalsBudgets: "Цели и бюджет", settings: "Настройки", more: "Ещё",
  openMenu: "Открыть меню", openNotifications: "Открыть уведомления", appNavigation: "Навигация приложения", addNewItem: "Добавить новый элемент", openAllSections: "Открыть все разделы", allModules: "Все разделы", allModulesDescription: "Все возможности MMV Hub в одном месте.", newItem: "Новый элемент", notifications: "Уведомления", notificationCenter: "Центр уведомлений", dueSoon: "Скоро", overdue: "Просрочено", upcoming: "Предстоит", connect: "Подключить", syncNow: "Синхронизировать", exchangeRate: "Курс: 1 USD к UZS",
  thisMonthSpending: "Расходы за месяц", thisYearSpending: "Расходы за год", fullYear: "Весь {year} год", projectedOutflow: "Прогноз расходов на 30 дней", forecast: "Прогноз", peak: "Пик: {date}", upcomingPayments: "Предстоящие платежи", recentPayments: "Последние платежи", overduePayments: "Просроченные платежи", noUpcomingPayments: "Предстоящих платежей нет.", noRecentPayments: "История платежей пока пуста.", addFirstPayment: "Добавить первый платёж", openFullCalendar: "Открыть весь календарь", previousMonth: "Предыдущий месяц", nextMonth: "Следующий месяц", dueToday: "Сегодня: {count}", active: "Активно", spendingSavingsGoals: "Цели расходов и накоплений",
  themeAppearance: "Тема и оформление", dark: "Тёмная", light: "Светлая", default: "По умолчанию", currencyConversion: "Валюта и конвертация", currencyPriority: "Порядок и отображение валют", createdCurrencyTop: "Исходная валюта сверху", usdTop: "USD сверху, UZS снизу", uzsTop: "UZS сверху, USD снизу", manualExchangeRate: "Ручной курс обмена", uzsPerUsd: "UZS за 1 USD", update: "Обновить", saved: "Сохранено",
  telegramNotifications: "Уведомления Telegram", enableTelegramAlerts: "Включить уведомления Telegram", telegramChatId: "Telegram Chat ID", manualFallback: "ручное подключение", saveTelegram: "Сохранить настройки Telegram", sendTest: "Отправить тест", availableBotCommands: "Команды Telegram-бота", calendarReminders: "Напоминания календаря", connectGoogleCalendar: "Подключить Google Календарь", connectNow: "Подключить", browserAlerts: "Уведомления браузера", deviceAlerts: "Напоминания устройства", enableBrowserAlerts: "Включить уведомления браузера", enableDeviceAlerts: "Включить напоминания устройства", dataManagement: "Управление данными", exportPayments: "Экспорт платежей (JSON)", clearData: "Удалить данные",
  onThisDevice: "На этом устройстве", readyForToday: "Готово на сегодня", remindersActive: "Напоминания включены", enableReminders: "Включить напоминания", deviceCalendar: "Календарь устройства", remindersScheduled: "Запланировано напоминаний: {count}", permissionDenied: "Разрешение на уведомления не предоставлено",
  telegramLogin: "Вход через Telegram", telegramLoginDescription: "Telegram подтвердит личность и автоматически заполнит Chat ID. MMV Hub не получает токен вашего бота.", verifyingTelegram: "Проверка аккаунта Telegram…", telegramUnavailable: "Вход через Telegram временно недоступен. Используйте поле Chat ID ниже.", connectThroughTelegram: "Подключить через Telegram", telegramApkInstructions: "Откройте бота, нажмите Start и вставьте полученный Chat ID в поле ниже.", findingBot: "Поиск бота…",
  paymentItem: "Платёж", subscription: "Подписка", recurringBill: "Регулярный счёт", billShort: "Счёт", oneTimePurchase: "Разовая покупка", purchaseShort: "Покупка", habit: "Привычка", edit: "Изменить", delete: "Удалить", cancel: "Отмена", saveChanges: "Сохранить изменения", createItem: "Создать", createGoal: "Создать цель", close: "Закрыть", name: "Название", category: "Категория", price: "Цена", renewalDate: "Дата продления", dueDate: "Срок оплаты", purchaseDate: "Дата покупки", frequency: "Периодичность", amount: "Сумма", date: "Дата", notes: "Заметки", optional: "Необязательно", icon: "Значок", every: "Каждые", days: "дн.", weeks: "нед.", months: "мес.", years: "г.", mmvClassics: "Классика MMV", mmvClassicsDescription: "Полезные разделы, воссозданные из ваших прежних проектов MMV.", tasks: "Задачи", bookmarks: "Закладки", focus: "Фокус", reflection: "Дневник", salaryPlan: "План зарплаты", debtCalculator: "Расчёт долгов", qrGenerator: "QR-генератор", jsonEditor: "JSON-редактор", clock: "Часы", tradeCalculator: "Расчёт сделки", backToModules: "Назад к разделам", reminders: "Напоминания", reminderShort: "Напом.", addReminder: "Добавить напоминание", noReminders: "Напоминаний пока нет.", markPaid: "Отметить оплаченным", manageReminders: "Управление напоминаниями", statistics: "Статистика", history: "История", noItems: "Здесь пока ничего нет.",
};

const dictionaries = { en, uz, ru };
const STORAGE_KEY = "mmv_hub_language";

interface I18nContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
  locale: string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function initialLanguage(): AppLanguage {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "uz" || stored === "ru") return stored;
  const browserLanguage = navigator.language.toLowerCase();
  if (browserLanguage.startsWith("uz")) return "uz";
  if (browserLanguage.startsWith("ru")) return "ru";
  return "en";
}

export const I18nProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(initialLanguage);

  const setLanguage = (nextLanguage: AppLanguage) => {
    localStorage.setItem(STORAGE_KEY, nextLanguage);
    setLanguageState(nextLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    locale: language === "uz" ? "uz-UZ" : language === "ru" ? "ru-RU" : "en-US",
    t: (key, values = {}) => Object.entries(values).reduce(
      (result, [name, replacement]) => result.replaceAll(`{${name}}`, String(replacement)),
      dictionaries[language][key] || en[key],
    ),
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
