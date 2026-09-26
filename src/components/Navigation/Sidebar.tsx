import React from "react";
import { 
  Home, 
  CreditCard, 
  Repeat, 
  ShoppingBag, 
  Calendar, 
  Target,
  Settings, 
  Plus, 
  PanelLeftClose, 
  PanelLeft,
  X,
  CheckCircle2 
} from "lucide-react";
import { AppPage, PaymentItem } from "../../types";

interface SidebarProps {
  currentPage: AppPage;
  onSelectPage: (page: AppPage) => void;
  items: PaymentItem[];
  habitsCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenAddModal: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  items = [],
  habitsCount = 0,
  isCollapsed = false,
  onToggleCollapse,
  onOpenAddModal,
  onCloseMobile,
}) => {
  const subscriptionsCount = items.filter((i) => i.type === "subscription").length;
  const billsCount = items.filter((i) => i.type === "bill").length;
  const purchasesCount = items.filter((i) => i.type === "purchase").length;

  const navItems = [
    {
      id: "home" as AppPage,
      label: "Home",
      icon: Home,
    },
    {
      id: "habits" as AppPage,
      label: "Habits",
      icon: CheckCircle2,
      count: habitsCount > 0 ? habitsCount : undefined,
      counterColor: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    },
    {
      id: "subscriptions" as AppPage,
      label: "Subscriptions",
      icon: CreditCard,
      count: subscriptionsCount,
      counterColor: "bg-blue-100 text-blue-700 border border-blue-200",
    },
    {
      id: "bills" as AppPage,
      label: "Recurring Bills",
      icon: Repeat,
      count: billsCount,
      counterColor: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    },
    {
      id: "purchases" as AppPage,
      label: "One-Time Purchases",
      icon: ShoppingBag,
      count: purchasesCount,
      counterColor: "bg-purple-100 text-purple-700 border border-purple-200",
    },
    {
      id: "calendar" as AppPage,
      label: "Calendar",
      icon: Calendar,
    },
    {
      id: "goals" as AppPage,
      label: "Goals",
      icon: Target,
    },
    {
      id: "settings" as AppPage,
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } h-screen bg-white border-r border-neutral-200 flex flex-col justify-between select-none flex-shrink-0 transition-all duration-200`}
    >
      <div>
        {/* Brand Header */}
        <div className={`px-4 pt-4 pb-3 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            {!isCollapsed && (
              <div>
                <span className="font-medium text-neutral-900 text-sm tracking-tight">
                  MMV subs
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 md:hidden"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* New Item Action Button */}
        <div className="px-3 pt-2 pb-3">
          <button
            onClick={onOpenAddModal}
            className={`w-full flex items-center ${
              isCollapsed ? "justify-center px-0" : "justify-center gap-2 px-3"
            } py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors text-xs font-medium`}
            title="New Item"
          >
            <Plus size={16} />
            {!isCollapsed && (
              <span>New Item</span>
            )}
          </button>
        </div>

        {/* Fixed Navigation List */}
        <nav className="px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center ${
                  isCollapsed ? "justify-center px-0 py-2.5" : "justify-between px-3 py-2"
                } rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
                title={item.label}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon size={16} className={isActive ? "text-neutral-900" : "text-neutral-500"} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.count !== undefined && (
                  <span
                    className={`min-w-5 h-5 px-1.5 flex items-center justify-center rounded text-[11px] font-medium ${item.counterColor}`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-neutral-200 hidden md:block">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          {isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          {!isCollapsed && <span className="text-[11px]">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};
