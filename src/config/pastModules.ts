import {
  BadgeDollarSign,
  Bookmark,
  BookOpenText,
  Braces,
  Clock3,
  ListTodo,
  QrCode,
  ReceiptText,
  StickyNote,
  Timer,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { TranslationKey } from "../i18n";

export type PastModuleId =
  | "tasks"
  | "notes"
  | "bookmarks"
  | "focus"
  | "reflection"
  | "salary"
  | "debt"
  | "qr"
  | "json"
  | "clock"
  | "trade";

export const PAST_MODULES: ReadonlyArray<{
  id: PastModuleId;
  labelKey: TranslationKey;
  icon: LucideIcon;
  tone: string;
}> = [
  { id: "tasks", labelKey: "tasks", icon: ListTodo, tone: "bg-emerald-50 text-emerald-700" },
  { id: "notes", labelKey: "notes", icon: StickyNote, tone: "bg-emerald-50 text-emerald-700" },
  { id: "bookmarks", labelKey: "bookmarks", icon: Bookmark, tone: "bg-emerald-50 text-emerald-700" },
  { id: "focus", labelKey: "focus", icon: Timer, tone: "bg-emerald-50 text-emerald-700" },
  { id: "reflection", labelKey: "reflection", icon: BookOpenText, tone: "bg-emerald-50 text-emerald-700" },
  { id: "salary", labelKey: "salaryPlan", icon: BadgeDollarSign, tone: "bg-emerald-50 text-emerald-700" },
  { id: "debt", labelKey: "debtCalculator", icon: ReceiptText, tone: "bg-emerald-50 text-emerald-700" },
  { id: "qr", labelKey: "qrGenerator", icon: QrCode, tone: "bg-emerald-50 text-emerald-700" },
  { id: "json", labelKey: "jsonEditor", icon: Braces, tone: "bg-emerald-50 text-emerald-700" },
  { id: "clock", labelKey: "clock", icon: Clock3, tone: "bg-emerald-50 text-emerald-700" },
  { id: "trade", labelKey: "tradeCalculator", icon: TrendingUp, tone: "bg-emerald-50 text-emerald-700" },
];
