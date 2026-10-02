import React, { useState, useEffect } from "react";
import { 
  X, 
  Bell, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Check, 
  ExternalLink, 
  CalendarSync, 
  Volume2, 
  Trash2,
  Smartphone
} from "lucide-react";
import { PaymentItem, CurrencyCode, InAppNotification, GoogleCalendarSyncState } from "../types";
import { formatCurrency } from "../utils/calculations";
import { ServiceIcon } from "./ServiceIcon";
import { downloadPhoneCalendarEvent } from "../utils/phoneCalendar";
import { isNativeApp } from "../services/deviceCalendar";
import { areDeviceRemindersEnabled, enableDeviceReminders, syncDeviceReminders } from "../services/deviceReminders";
import { 
  generateInAppNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  dismissNotification, 
  requestBrowserPushPermission, 
  isBrowserPushEnabled, 
  triggerBrowserDueAlerts 
} from "../services/notificationService";

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: PaymentItem[];
  displayCurrency: CurrencyCode;
  exchangeRateUsdToUzs: number;
  onSelectItem: (item: PaymentItem) => void;
  onMarkPaid: (item: PaymentItem) => void;
  onOpenCalendarSync?: () => void;
  calendarSyncState?: GoogleCalendarSyncState;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  items,
  displayCurrency,
  exchangeRateUsdToUzs,
  onSelectItem,
  onMarkPaid,
  onOpenCalendarSync,
  calendarSyncState,
}) => {
  const [activeTab, setActiveTab] = useState<"urgent" | "overdue" | "all">("urgent");
  const [browserPushActive, setBrowserPushActive] = useState<boolean>(false);
  const [pushStatusMsg, setPushStatusMsg] = useState<string | null>(null);
  const [phoneExportNotice, setPhoneExportNotice] = useState<string | null>(null);

  // Compute notifications
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  useEffect(() => {
    const list = generateInAppNotifications(items);
    setNotifications(list);
    if (isNativeApp()) areDeviceRemindersEnabled().then(setBrowserPushActive).catch(() => setBrowserPushActive(false));
    else setBrowserPushActive(isBrowserPushEnabled());

    // Dispatches browser alert if permitted
    triggerBrowserDueAlerts(list);
  }, [items, isOpen]);

  if (!isOpen) return null;

  const urgentList = notifications.filter(
    (n) => n.urgency === "due_today" || (n.urgency === "upcoming" && n.daysUntilDue <= 3)
  );

  const overdueList = notifications.filter((n) => n.urgency === "overdue");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const currentList =
    activeTab === "urgent"
      ? urgentList
      : activeTab === "overdue"
      ? overdueList
      : notifications;

  const handleToggleBrowserPush = async () => {
    if (isNativeApp()) {
      try {
        const granted = await enableDeviceReminders();
        setBrowserPushActive(granted);
        const count = granted ? await syncDeviceReminders(items) : 0;
        setPushStatusMsg(granted ? `${count} device reminders scheduled.` : "Notification permission was not granted.");
      } catch (error) {
        setPushStatusMsg(error instanceof Error ? error.message : "Could not schedule reminders.");
      }
      return;
    }
    if (!("Notification" in window)) {
      setPushStatusMsg("Web notifications are not supported by this browser.");
      return;
    }

    if (Notification.permission === "granted") {
      setPushStatusMsg("Browser push notifications are already enabled.");
      setTimeout(() => setPushStatusMsg(null), 3000);
      return;
    }

    const perm = await requestBrowserPushPermission();
    if (perm === "granted") {
      setBrowserPushActive(true);
      setPushStatusMsg("Browser notifications enabled successfully!");
      triggerBrowserDueAlerts(notifications);
    } else {
      setBrowserPushActive(false);
      setPushStatusMsg("Notification permission was denied in browser settings.");
    }
    setTimeout(() => setPushStatusMsg(null), 3500);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(notifications);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismiss = (id: string) => {
    dismissNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkSingleRead = (id: string) => {
    markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-50 flex justify-end bg-neutral-900/30 backdrop-blur-xs select-none"
    >
      <div 
        className="w-full max-w-md h-full bg-white shadow-xl border-l border-neutral-200 flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800">
              <Bell size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-neutral-900">Notification Center</h2>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-100 text-rose-700 font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded hover:bg-neutral-100 transition-colors"
                title="Mark all as read"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {phoneExportNotice && (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
            <Smartphone size={13} className="text-emerald-600 shrink-0" />
            <span className="truncate">{phoneExportNotice}</span>
          </div>
        )}

        {/* Browser Push Banner */}
        <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Volume2 size={14} className="text-neutral-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-medium text-neutral-900 block truncate">
                {isNativeApp() ? (browserPushActive ? "Device reminders active" : "Enable device reminders") : (browserPushActive ? "Browser alerts active" : "Enable browser alerts")}
              </span>
              <span className="text-[10px] text-neutral-500 block truncate">
                {browserPushActive
                  ? (isNativeApp() ? "Scheduled even while the app is closed" : "Alerts when this app is open")
                  : (isNativeApp() ? "Schedule reminders on this device" : "Allow alerts while this app is open")}
              </span>
            </div>
          </div>

          {!browserPushActive && (
            <button
              type="button"
              onClick={handleToggleBrowserPush}
              className="px-2.5 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium hover:bg-neutral-800 transition-colors shrink-0 shadow-2xs"
            >
              Enable
            </button>
          )}
        </div>

        {pushStatusMsg && (
          <div className="px-4 py-2 bg-neutral-100 text-[11px] text-neutral-700 border-b border-neutral-200 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-neutral-700 shrink-0" />
            <span>{pushStatusMsg}</span>
          </div>
        )}

        {/* Tab switch */}
        <div className="p-3 border-b border-neutral-100 bg-neutral-100/60">
          <div className="flex rounded-lg bg-neutral-200/60 p-0.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab("urgent")}
              className={`flex-1 py-1.5 px-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "urgent"
                  ? "bg-white text-neutral-900 shadow-2xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <span>Due Soon</span>
              {urgentList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-medium">
                  {urgentList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("overdue")}
              className={`flex-1 py-1.5 px-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "overdue"
                  ? "bg-white text-neutral-900 shadow-2xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <span>Overdue</span>
              {overdueList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-100 text-rose-700 font-medium">
                  {overdueList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-1.5 px-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "all"
                  ? "bg-white text-neutral-900 shadow-2xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <span>All ({notifications.length})</span>
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {currentList.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-400 space-y-1.5">
              <p className="font-medium text-neutral-600">No {activeTab} notifications</p>
              <p className="text-[11px] text-neutral-400">All recurring items and bills are in good standing.</p>
            </div>
          ) : (
            currentList.map((notif) => {
              const matchedItem = items.find((i) => i.id === notif.itemId);
              const isOverdue = notif.urgency === "overdue";
              const isDueToday = notif.urgency === "due_today";

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    handleMarkSingleRead(notif.id);
                    if (matchedItem) {
                      onSelectItem(matchedItem);
                      onClose();
                    }
                  }}
                  className={`p-3 rounded-lg border transition-all text-xs cursor-pointer relative ${
                    !notif.read ? "ring-1 ring-neutral-300" : ""
                  } ${
                    isOverdue
                      ? "border-rose-200 bg-rose-50/40 hover:bg-rose-50/70"
                      : isDueToday
                      ? "border-amber-200 bg-amber-50/40 hover:bg-amber-50/70"
                      : "border-neutral-200 bg-white hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0">
                        <ServiceIcon icon={matchedItem?.icon || "credit-card"} size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-medium text-neutral-900 truncate">{notif.itemName}</h4>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5">
                          <span>{notif.dueDate}</span>
                          <span>•</span>
                          <span className="font-medium">
                            {isOverdue
                              ? `${Math.abs(notif.daysUntilDue)} days overdue`
                              : isDueToday
                              ? "Due today"
                              : `Due in ${notif.daysUntilDue} days`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <div className="font-medium text-neutral-900 tabular-nums">
                        {formatCurrency(notif.price, notif.currency)}
                      </div>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mt-0.5 ${
                          isOverdue
                            ? "bg-rose-100 text-rose-700"
                            : isDueToday
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {isOverdue ? "Overdue" : isDueToday ? "Due Today" : "Upcoming"}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Quick Mark Paid / Add to Phone Calendar / Dismiss */}
                  <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (matchedItem) {
                          onMarkPaid(matchedItem);
                          handleDismiss(notif.id);
                        }
                      }}
                      className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark Paid</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {matchedItem && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isNativeApp()) {
                              onClose();
                              onOpenCalendarSync?.();
                              return;
                            }
                            downloadPhoneCalendarEvent(matchedItem);
                            setPhoneExportNotice(`Exported .ics reminder for ${matchedItem.name}.`);
                            setTimeout(() => setPhoneExportNotice(null), 3500);
                          }}
                          className="text-neutral-600 hover:text-neutral-900 px-2 py-0.5 rounded border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Add this reminder to iPhone Apple Calendar or Android Calendar"
                        >
                          <Smartphone size={12} className="text-neutral-500" />
                          <span>{isNativeApp() ? "Calendar" : "Export .ics"}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(notif.id);
                        }}
                        className="text-neutral-400 hover:text-neutral-700 p-1 rounded hover:bg-neutral-100 transition-colors"
                        title="Dismiss notification"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Google Calendar Sync Link */}
        {onOpenCalendarSync && (
          <div className="p-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-neutral-700">
              <CalendarSync size={15} className="text-neutral-500" />
              <div>
                <span className="font-medium block">Calendar reminders</span>
                <span className="text-[10px] text-neutral-500 block">
                  {calendarSyncState?.isConnected
                    ? `Connected (${calendarSyncState.userEmail})`
                    : "Publish payments directly to your calendar"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCalendarSync();
              }}
              className="px-2.5 py-1 text-xs font-medium text-neutral-700 border border-neutral-200 rounded-lg hover:bg-white transition-colors"
            >
              {calendarSyncState?.isConnected ? "Sync Now" : "Connect"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
