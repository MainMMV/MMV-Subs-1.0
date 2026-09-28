import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface ApiKeyRecord {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface AppServerData {
  items: any[];
  habits: any[];
  habitLogs: Record<string, Record<string, any>>;
  goals: any[];
  records: any[];
  exchangeRateUsdToUzs: number;
  telegramConfig?: {
    chatId?: string;
    isEnabled?: boolean;
    remindDaysBefore?: number[];
    notifyPastDue?: boolean;
  };
  updatedAt: string;
}

const KEYS_FILE = path.join(process.cwd(), "data", "server-keys.json");
const DATA_FILE = path.join(process.cwd(), "data", "server-data.json");

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

// -------------------------------------------------------------
// API Keys Management
// -------------------------------------------------------------
export function listApiKeys(): ApiKeyRecord[] {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const content = fs.readFileSync(KEYS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Failed reading API keys file:", err);
  }
  return [];
}

export function generateApiKey(name = "Default Connector Key"): ApiKeyRecord {
  ensureDirectoryExistence(KEYS_FILE);
  const keys = listApiKeys();
  const rawKey = `mmv_${crypto.randomBytes(24).toString("hex")}`;
  const newRecord: ApiKeyRecord = {
    id: `key_${Date.now()}`,
    name,
    key: rawKey,
    createdAt: new Date().toISOString(),
  };
  keys.push(newRecord);
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), "utf-8");
  return newRecord;
}

export function deleteApiKey(keyId: string): boolean {
  const keys = listApiKeys();
  const filtered = keys.filter((k) => k.id !== keyId && k.key !== keyId);
  if (filtered.length !== keys.length) {
    ensureDirectoryExistence(KEYS_FILE);
    fs.writeFileSync(KEYS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    return true;
  }
  return false;
}

export function validateApiKey(apiKeyCandidate?: string): boolean {
  if (!apiKeyCandidate) return false;
  const keys = listApiKeys();
  // If no keys exist yet, allow an initial default key or create one automatically
  if (keys.length === 0) {
    return true;
  }
  const match = keys.find((k) => k.key === apiKeyCandidate);
  if (match) {
    match.lastUsedAt = new Date().toISOString();
    try {
      fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), "utf-8");
    } catch {}
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// Application Data Management (Items, Habits, Goals)
// -------------------------------------------------------------
const DEFAULT_SERVER_ITEMS = [
  {
    id: "sub-1",
    type: "subscription",
    name: "Netflix",
    icon: "tv",
    iconBgColor: "#E50914",
    notes: "Premium 4K plan shared with family",
    price: 19.99,
    currency: "USD",
    date: "2026-10-18",
    time: "09:00",
    frequency: { interval: 1, unit: "months" },
    status: "upcoming",
    reminders: [
      { id: "rem-1", timing: "before", duration: 3, unit: "days", exactTime: "09:00", channel: "both", enabled: true }
    ],
    createdAt: "2024-01-15T00:00:00Z"
  },
  {
    id: "sub-2",
    type: "subscription",
    name: "Spotify Premium",
    icon: "music",
    iconBgColor: "#1DB954",
    notes: "Individual ad-free streaming",
    price: 11.99,
    currency: "USD",
    date: "2026-10-21",
    time: "10:00",
    frequency: { interval: 1, unit: "months" },
    status: "upcoming",
    createdAt: "2024-02-01T00:00:00Z"
  },
  {
    id: "sub-5",
    type: "subscription",
    name: "GitHub Copilot",
    icon: "code",
    iconBgColor: "#24292F",
    notes: "Coding companion",
    price: 10.00,
    currency: "USD",
    date: "2026-09-28",
    time: "14:00",
    frequency: { interval: 1, unit: "months" },
    status: "upcoming",
    createdAt: "2023-08-14T00:00:00Z"
  },
  {
    id: "bill-2",
    type: "bill",
    name: "Apartment Rent",
    icon: "home",
    iconBgColor: "#059669",
    notes: "Monthly landlord payment",
    price: 600,
    currency: "USD",
    date: "2026-10-01",
    time: "12:00",
    frequency: { interval: 1, unit: "months" },
    status: "upcoming",
    createdAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "bill-3",
    type: "bill",
    name: "Electricity & Utilities",
    icon: "zap",
    iconBgColor: "#D97706",
    notes: "Municipal utility account",
    price: 450000,
    currency: "UZS",
    date: "2026-09-25",
    time: "15:00",
    frequency: { interval: 1, unit: "months" },
    status: "upcoming",
    createdAt: "2024-02-01T00:00:00Z"
  },
  {
    id: "purch-1",
    type: "purchase",
    name: "Mechanical Keyboard",
    icon: "keyboard",
    iconBgColor: "#0284C7",
    notes: "Custom mechanical keyboard for workstation",
    price: 1450000,
    currency: "UZS",
    date: "2026-10-05",
    time: "11:00",
    status: "upcoming",
    createdAt: "2026-09-10T00:00:00Z"
  }
];

const DEFAULT_SERVER_GOALS = [
  {
    id: "goal-1",
    title: "Monthly Subscriptions Ceiling",
    type: "category_cap",
    category: "subscription",
    targetAmount: 120,
    currentAmount: 71.97,
    currency: "USD",
    period: "monthly",
    isCompleted: false,
    createdAt: "2026-09-01T00:00:00Z"
  },
  {
    id: "goal-2",
    title: "Quarterly Emergency Bill Reserve",
    type: "bill_reserve",
    category: "bill",
    targetAmount: 1500,
    currentAmount: 960,
    currency: "USD",
    deadline: "2026-12-31",
    isCompleted: false,
    createdAt: "2026-09-05T00:00:00Z"
  },
  {
    id: "goal-3",
    title: "Workstation Upgrade Fund",
    type: "savings_target",
    category: "purchase",
    targetAmount: 1800,
    currentAmount: 1439,
    currency: "USD",
    deadline: "2026-10-30",
    isCompleted: false,
    createdAt: "2026-09-08T00:00:00Z"
  }
];

const DEFAULT_SERVER_HABITS = [
  {
    id: "habit-water",
    name: "Drink 2.5L Water",
    category: "Health",
    type: "quantity",
    unit: "L",
    targetValue: 2.5,
    scheduleType: "daily",
    startDate: "2026-08-01",
    isPaused: false,
    createdAt: "2026-08-01T00:00:00Z"
  },
  {
    id: "habit-reading",
    name: "Read 25 Pages",
    category: "Study",
    type: "quantity",
    unit: "pages",
    targetValue: 25,
    scheduleType: "weekdays",
    weekdays: [1, 2, 3, 4, 5],
    startDate: "2026-08-01",
    isPaused: false,
    createdAt: "2026-08-01T00:00:00Z"
  }
];

export function getServerData(): AppServerData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading server-data.json:", err);
  }

  const initialData: AppServerData = {
    items: DEFAULT_SERVER_ITEMS,
    habits: DEFAULT_SERVER_HABITS,
    habitLogs: {},
    goals: DEFAULT_SERVER_GOALS,
    records: [],
    exchangeRateUsdToUzs: 12800,
    updatedAt: new Date().toISOString()
  };

  saveServerData(initialData);
  return initialData;
}

export function saveServerData(data: AppServerData): void {
  try {
    ensureDirectoryExistence(DATA_FILE);
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving server-data.json:", err);
  }
}

// -------------------------------------------------------------
// Recurring item date calculation helper
// -------------------------------------------------------------
export function computeNextRecurrenceDate(
  currentDateStr: string,
  frequency?: { interval: number; unit: "days" | "weeks" | "months" | "years" }
): string {
  if (!frequency) return currentDateStr;
  const parts = currentDateStr.split("-").map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const { interval, unit } = frequency;

  switch (unit) {
    case "days":
      date.setUTCDate(date.getUTCDate() + interval);
      break;
    case "weeks":
      date.setUTCDate(date.getUTCDate() + interval * 7);
      break;
    case "months":
      date.setUTCMonth(date.getUTCMonth() + interval);
      break;
    case "years":
      date.setUTCFullYear(date.getUTCFullYear() + interval);
      break;
  }
  return date.toISOString().slice(0, 10);
}
