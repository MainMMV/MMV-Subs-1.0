import React, { useEffect, useState } from "react";
import { 
  Home, 
  CreditCard, 
  Repeat, 
  ShoppingBag, 
  Calendar, 
  Target,
  Settings, 
  X,
  CheckCircle2,
  ChevronDown,
  Grid2X2,
} from "lucide-react";
import { AppPage, PaymentItem } from "../../types";
import { MMVLogo } from "../MMVLogo";
import { useI18n } from "../../i18n";
import { PAST_MODULES, type PastModuleId } from "../../config/pastModules";

interface SidebarProps {
  currentPage: AppPage;
  onSelectPage: (page: AppPage) => void;
  items: PaymentItem[];
  habitsCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenAddModal?: () => void;
  onCloseMobile?: () => void;
  forceMobile?: boolean;
  selectedPastModule?: PastModuleId | null;
  onSelectPastModule?: (moduleId: PastModuleId) => void;
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
  forceMobile = false,
  selectedPastModule = null,
  onSelectPastModule,
}) => {
  const { t } = useI18n();
  const [isMoreOpen, setIsMoreOpen] = useState(currentPage === "more");
  useEffect(() => {
    if (currentPage === "more") setIsMoreOpen(true);
  }, [currentPage]);
  const subscriptionsCount = items.filter((i) => i.type === "subscription").length;
  const billsCount = items.filter((i) => i.type === "bill").length;
  const purchasesCount = items.filter((i) => i.type === "purchase").length;

  const navItems = [
    {
      id: "home" as AppPage,
      label: t("home"),
      icon: Home,
    },
    {
      id: "habits" as AppPage,
      label: t("habits"),
      icon: CheckCircle2,
      count: habitsCount > 0 ? habitsCount : undefined,
      counterColor: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    },
    {
      id: "subscriptions" as AppPage,
      label: t("subscriptions"),
      icon: CreditCard,
      count: subscriptionsCount,
      counterColor: "bg-blue-100 text-blue-700 border border-blue-200",
    },
    {
      id: "bills" as AppPage,
      label: t("recurringBills"),
      icon: Repeat,
      count: billsCount,
      counterColor: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    },
    {
      id: "purchases" as AppPage,
      label: t("oneTimePurchases"),
      icon: ShoppingBag,
      count: purchasesCount,
      counterColor: "bg-purple-100 text-purple-700 border border-purple-200",
    },
    {
      id: "calendar" as AppPage,
      label: t("calendar"),
      icon: Calendar,
    },
    {
      id: "goals" as AppPage,
      label: t("goals"),
      icon: Target,
    },
    {
      id: "settings" as AppPage,
      label: t("settings"),
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } h-full bg-white border-r border-neutral-200 flex flex-col justify-between select-none flex-shrink-0 transition-all duration-200`}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Brand Header: Logo button collapses/expands navigation */}
        <div className={`px-4 pt-4 pb-3 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleCollapse?.();
            }}
            className={`flex items-center gap-2.5 p-1.5 -m-1 rounded-lg hover:bg-neutral-100/80 active:bg-neutral-200/60 transition-colors cursor-pointer text-left focus:outline-none group ${
              isCollapsed ? "justify-center" : ""
            }`}
            title={isCollapsed ? "Expand navigation (Click logo)" : "Collapse navigation (Click logo)"}
            aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
          >
            <MMVLogo size={30} showText={false} />
            {!isCollapsed && (
              <div className="flex items-center gap-1 font-medium tracking-tight">
                <span className="font-medium text-neutral-900 text-sm tracking-wide">
                  MMV
                </span>
                <span className="font-medium text-neutral-500 text-sm">
                  Hub
                </span>
              </div>
            )}
          </button>

          {/* Mobile close button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className={`p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 ${forceMobile ? "" : "md:hidden"}`}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Fixed Navigation List */}
        <nav className="px-2 pt-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full h-9 flex items-center ${
                  isCollapsed ? "justify-center px-0" : "justify-between px-3"
                } rounded-lg text-xs font-medium transition-colors border ${
                  isActive
                    ? "bg-neutral-100 text-neutral-900 nav-item-border-active"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 nav-item-border"
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

          <div>
            <button
              type="button"
              onClick={() => {
                if (isCollapsed) onToggleCollapse?.();
                setIsMoreOpen((open) => !open);
              }}
              className={`flex h-9 w-full items-center rounded-lg border text-xs font-medium transition-colors ${
                isCollapsed ? "justify-center px-0" : "justify-between px-3"
              } ${currentPage === "more" ? "bg-neutral-100 text-neutral-900 nav-item-border-active" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 nav-item-border"}`}
              aria-expanded={isMoreOpen}
              title={t("more")}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Grid2X2 size={16} className={currentPage === "more" ? "text-neutral-900" : "text-neutral-500"} />
                {!isCollapsed ? <span>{t("more")}</span> : null}
              </span>
              {!isCollapsed ? <ChevronDown size={14} className={`transition-transform ${isMoreOpen ? "rotate-180" : ""}`} /> : null}
            </button>

            {!isCollapsed && isMoreOpen ? (
              <div className="ml-3 mt-1 space-y-0.5 border-l border-neutral-200 pl-2">
                {PAST_MODULES.map(({ id, labelKey, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectPastModule?.(id)}
                    className={`flex min-h-8 w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] transition-colors ${selectedPastModule === id ? "bg-neutral-100 font-medium text-neutral-900" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"}`}
                    title={t(labelKey)}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span className="truncate">{t(labelKey)}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </nav>
      </div>
    </aside>
  );
};
