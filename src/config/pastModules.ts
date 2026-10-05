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
  { id: "tasks", labelKey: "tasks", icon: ListTodo, tone: "bg-blue-50 text-blue-700" },
  { id: "notes", labelKey: "notes", icon: StickyNote, tone: "bg-amber-50 text-amber-700" },
  { id: "bookmarks", labelKey: "bookmarks", icon: Bookmark, tone: "bg-orange-50 text-orange-700" },
  { id: "focus", labelKey: "focus", icon: Timer, tone: "bg-teal-50 text-teal-700" },
  { id: "reflection", labelKey: "reflection", icon: BookOpenText, tone: "bg-fuchsia-50 text-fuchsia-700" },
  { id: "salary", labelKey: "salaryPlan", icon: BadgeDollarSign, tone: "bg-emerald-50 text-emerald-700" },
  { id: "debt", labelKey: "debtCalculator", icon: ReceiptText, tone: "bg-rose-50 text-rose-700" },
  { id: "qr", labelKey: "qrGenerator", icon: QrCode, tone: "bg-cyan-50 text-cyan-700" },
  { id: "json", labelKey: "jsonEditor", icon: Braces, tone: "bg-violet-50 text-violet-700" },
  { id: "clock", labelKey: "clock", icon: Clock3, tone: "bg-slate-100 text-slate-700" },
  { id: "trade", labelKey: "tradeCalculator", icon: TrendingUp, tone: "bg-lime-50 text-lime-700" },
];
