import React from "react";
import { CalendarDays, CheckCircle2, Grid2X2, Home, Plus } from "lucide-react";
import { AppPage } from "../../types";

interface NativeBottomNavigationProps {
  currentPage: AppPage;
  onSelectPage: (page: AppPage) => void;
  onAdd: () => void;
  onMore: () => void;
}

export const NativeBottomNavigation: React.FC<NativeBottomNavigationProps> = ({
  currentPage,
  onSelectPage,
  onAdd,
  onMore,
}) => {
  const items = [
    { page: "home" as const, label: "Today", icon: Home },
    { page: "habits" as const, label: "Habits", icon: CheckCircle2 },
    { page: "calendar" as const, label: "Calendar", icon: CalendarDays },
  ];

  return (
    <nav
      className="native-bottom-nav relative z-30 grid shrink-0 grid-cols-5 items-end border-t border-neutral-200 bg-white px-2 pt-1 shadow-[0_-8px_24px_rgba(0,0,0,0.05)]"
      data-mobile-bottom-nav="true"
      aria-label="App navigation"
    >
      {items.slice(0, 2).map(({ page, label, icon: Icon }) => {
        const active = currentPage === page;
        return (
          <button
            key={page}
            type="button"
            onClick={() => onSelectPage(page)}
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium transition-colors ${active ? "text-emerald-700" : "text-neutral-500"}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
            <span>{label}</span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        className="mx-auto -mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-950/20 transition-transform active:scale-95"
        aria-label="Add a new item"
      >
        <Plus size={25} />
      </button>

      {items.slice(2).map(({ page, label, icon: Icon }) => {
        const active = currentPage === page;
        return (
          <button
            key={page}
            type="button"
            onClick={() => onSelectPage(page)}
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium transition-colors ${active ? "text-emerald-700" : "text-neutral-500"}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
            <span>{label}</span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onMore}
        className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium text-neutral-500"
        aria-label="Open all sections"
      >
        <Grid2X2 size={19} strokeWidth={1.8} />
        <span>More</span>
      </button>
    </nav>
  );
};
