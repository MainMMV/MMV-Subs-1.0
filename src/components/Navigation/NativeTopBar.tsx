import React from "react";
import { Bell } from "lucide-react";
import { AppPage } from "../../types";
import { MMVLogo } from "../MMVLogo";

interface NativeTopBarProps {
  currentPage: AppPage;
  notificationCount: number;
  onOpenNotifications: () => void;
}

const PAGE_TITLES: Record<AppPage, string> = {
  home: "Today",
  habits: "Habits",
  subscriptions: "Subscriptions",
  bills: "Bills",
  purchases: "Purchases",
  calendar: "Calendar",
  goals: "Goals",
  settings: "Settings",
};

export const NativeTopBar: React.FC<NativeTopBarProps> = ({
  currentPage,
  notificationCount,
  onOpenNotifications,
}) => (
  <header className="native-top-bar flex min-h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
    <div className="flex min-w-0 items-center gap-2.5">
      <MMVLogo size={30} />
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500">MMV Hub</p>
        <h1 className="truncate text-base font-medium text-neutral-900">{PAGE_TITLES[currentPage]}</h1>
      </div>
    </div>
    <button
      type="button"
      onClick={onOpenNotifications}
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 active:scale-95"
      aria-label="Open notifications"
    >
      <Bell size={19} />
      {notificationCount > 0 ? (
        <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-medium text-white">
          {Math.min(notificationCount, 9)}
        </span>
      ) : null}
    </button>
  </header>
);
