import { useSyncExternalStore } from "react";

export type ViewKind = "list" | "card";
export type ViewSection = "subscriptions" | "bills" | "purchases" | "goals";

export interface UiPreferences {
  font: "google" | "system" | "mono";
  textSize: "small" | "normal" | "large";
  radius: "square" | "soft" | "round";
  density: "compact" | "comfortable";
  reducedMotion: boolean;
  rememberViews: boolean;
  views: Record<ViewSection, ViewKind>;
  filters: Record<ViewSection, string>;
  goalSort: "deadline" | "progress" | "name";
}

const STORAGE_KEY = "mmv_hub_ui_preferences_v1";

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  font: "google",
  textSize: "normal",
  radius: "soft",
  density: "comfortable",
  reducedMotion: false,
  rememberViews: true,
  views: { subscriptions: "list", bills: "list", purchases: "list", goals: "card" },
  filters: { subscriptions: "all", bills: "all", purchases: "all", goals: "all" },
  goalSort: "deadline",
};

function readPreferences(): UiPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const choose = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
      allowed.includes(value as T) ? value as T : fallback;
    const views = saved.rememberViews === false ? DEFAULT_UI_PREFERENCES.views : saved.views || {};
    const filters = saved.rememberViews === false ? DEFAULT_UI_PREFERENCES.filters : saved.filters || {};
    return {
      ...DEFAULT_UI_PREFERENCES,
      font: choose(saved.font, ["google", "system", "mono"], "google"),
      textSize: choose(saved.textSize, ["small", "normal", "large"], "normal"),
      radius: choose(saved.radius, ["square", "soft", "round"], "soft"),
      density: choose(saved.density, ["compact", "comfortable"], "comfortable"),
      reducedMotion: saved.reducedMotion === true,
      rememberViews: saved.rememberViews !== false,
      views: {
        subscriptions: choose(views.subscriptions, ["list", "card"], "list"),
        bills: choose(views.bills, ["list", "card"], "list"),
        purchases: choose(views.purchases, ["list", "card"], "list"),
        goals: choose(views.goals, ["list", "card"], "card"),
      },
      filters: {
        subscriptions: choose(filters.subscriptions, ["all", "active", "overdue", "due_today", "upcoming", "paid"], "all"),
        bills: choose(filters.bills, ["all", "active", "overdue", "due_today", "upcoming", "paid"], "all"),
        purchases: choose(filters.purchases, ["all", "upcoming", "paid"], "all"),
        goals: choose(filters.goals, ["all", "active", "completed"], "all"),
      },
      goalSort: choose(saved.goalSort, ["deadline", "progress", "name"], "deadline"),
    };
  } catch {
    return DEFAULT_UI_PREFERENCES;
  }
}

let current = readPreferences();
const listeners = new Set<() => void>();
let storageListening = false;

function emit() {
  listeners.forEach((listener) => listener());
}

export function updateUiPreferences(patch: Partial<UiPreferences>) {
  current = {
    ...current,
    ...patch,
    views: { ...current.views, ...patch.views },
    filters: { ...current.filters, ...patch.filters },
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current.rememberViews ? current : {
      ...current,
      views: DEFAULT_UI_PREFERENCES.views,
      filters: DEFAULT_UI_PREFERENCES.filters,
    }));
  } catch {
    // Preferences still apply for this session when storage is unavailable.
  }
  emit();
}

export function setSectionView(section: ViewSection, view: ViewKind) {
  updateUiPreferences({ views: { ...current.views, [section]: view } });
}

export function setSectionFilter(section: ViewSection, filter: string) {
  updateUiPreferences({ filters: { ...current.filters, [section]: filter } });
}

export function useUiPreferences() {
  return useSyncExternalStore(subscribe, () => current, () => DEFAULT_UI_PREFERENCES);
}

function onStorage(event: StorageEvent) {
  if (event.key === STORAGE_KEY) {
    current = readPreferences();
    emit();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!storageListening) {
    window.addEventListener("storage", onStorage);
    storageListening = true;
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", onStorage);
      storageListening = false;
    }
  };
}
