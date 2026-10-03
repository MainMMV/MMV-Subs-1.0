import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Edit3, Bell, BarChart2, History, Trash2, Smartphone } from "lucide-react";
import { PaymentItem } from "../types";
import { downloadPhoneCalendarEvent } from "../utils/phoneCalendar";
import { isNativeApp } from "../services/deviceCalendar";
import { useI18n } from "../i18n";

interface ItemActionMenuProps {
  item: PaymentItem;
  onEdit: () => void;
  onManageReminders: () => void;
  onViewStatistics: () => void;
  onViewHistory: () => void;
  onDelete: () => void;
}

export const ItemActionMenu: React.FC<ItemActionMenuProps> = ({
  item,
  onEdit,
  onManageReminders,
  onViewStatistics,
  onViewHistory,
  onDelete,
}) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 190;
      const menuHeight = 210;

      // Position to the left of the button if near right edge
      let left = rect.right - menuWidth;
      if (left < 10) left = 10;
      if (left + menuWidth > window.innerWidth - 10) {
        left = window.innerWidth - menuWidth - 10;
      }

      // Position below or above
      let top = rect.bottom + 4;
      if (top + menuHeight > window.innerHeight - 10) {
        top = rect.top - menuHeight - 4;
      }

      setCoords({ top, left });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const menuContent = isOpen && typeof document !== "undefined" && (
    <>
      {/* Invisible full-screen backdrop so clicking anywhere outside closes the floating menu */}
      <div
        className="fixed inset-0 z-[99998]"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(false);
        }}
      />
      <div
        ref={menuRef}
        style={{
          position: "fixed",
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          zIndex: 99999,
        }}
        className="w-48 bg-white rounded-lg shadow-md border border-neutral-200 py-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          onEdit();
        }}
        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-neutral-700 hover:bg-neutral-50 transition-colors font-medium"
      >
        <Edit3 size={14} className="text-neutral-500" />
        <span>{t("edit")}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          onManageReminders();
        }}
        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-neutral-700 hover:bg-neutral-50 transition-colors font-medium"
      >
        <Bell size={14} className="text-neutral-500" />
        <span>{t("manageReminders")}</span>
      </button>

      {!isNativeApp() && <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          downloadPhoneCalendarEvent(item);
        }}
        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-neutral-700 hover:bg-neutral-50 transition-colors font-medium"
      >
        <Smartphone size={14} className="text-neutral-500" />
        <span>Export .ics</span>
      </button>}

      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          onViewStatistics();
        }}
        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-neutral-700 hover:bg-neutral-50 transition-colors font-medium"
      >
        <BarChart2 size={14} className="text-neutral-500" />
        <span>{t("statistics")}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          onViewHistory();
        }}
        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-neutral-700 hover:bg-neutral-50 transition-colors font-medium"
      >
        <History size={14} className="text-neutral-500" />
        <span>{t("history")}</span>
      </button>

      <div className="my-1 border-t border-neutral-100" />

      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          onDelete();
        }}
        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 transition-colors font-medium"
      >
        <Trash2 size={14} className="text-rose-500" />
        <span>{t("delete")}</span>
      </button>
    </div>
    </>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
        title="More actions"
      >
        <MoreVertical size={16} />
      </button>
      {isOpen && createPortal(menuContent, document.body)}
    </>
  );
};
