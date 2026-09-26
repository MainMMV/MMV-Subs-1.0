import React, { useState, useEffect } from "react";
import { 
  X, 
  Calendar as CalendarIcon, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  LogOut, 
  CheckCircle2, 
  ShieldCheck,
  Clock,
  Tag,
  CheckSquare,
  Square
} from "lucide-react";
import { PaymentItem, GoogleCalendarSyncState } from "../types";
import { 
  signInGoogleCalendar, 
  disconnectGoogleCalendar, 
  syncItemsToGoogleCalendar, 
  SyncResult 
} from "../services/googleCalendar";
import { formatCurrency } from "../utils/calculations";

interface GoogleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PaymentItem[];
  syncState: GoogleCalendarSyncState;
  onSyncStateChange: (state: GoogleCalendarSyncState) => void;
}

export const GoogleCalendarSyncModal: React.FC<GoogleCalendarSyncModalProps> = ({
  isOpen,
  onClose,
  items,
  syncState,
  onSyncStateChange,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSubscriptions, setSyncSubscriptions] = useState(true);
  const [syncBills, setSyncBills] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected item IDs for synchronization
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Calculate items eligible for sync based on filters
  const eligibleItems = items.filter((item) => {
    if (item.type === "subscription" && !syncSubscriptions) return false;
    if (item.type === "bill" && !syncBills) return false;
    if (item.type === "purchase") return false;
    if (item.manualStatus === "paid" || item.manualStatus === "skipped") return false;
    return Boolean(item.date);
  });

  // Keep selected IDs in sync with eligible items
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(eligibleItems.map((i) => i.id)));
    }
  }, [isOpen, syncSubscriptions, syncBills, items.length]);

  if (!isOpen) return null;

  const handleToggleSelectAll = () => {
    if (selectedIds.size === eligibleItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligibleItems.map((i) => i.id)));
    }
  };

  const handleToggleItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectedItemsList = eligibleItems.filter((i) => selectedIds.has(i.id));

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await signInGoogleCalendar();
      if (res) {
        onSyncStateChange({
          isConnected: true,
          userEmail: res.user.email,
          userName: res.user.displayName,
          userPhoto: res.user.photoURL,
          lastSyncedAt: syncState.lastSyncedAt,
          syncedEventCount: syncState.syncedEventCount,
        });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to sign in with Google Calendar");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGoogleCalendar();
      onSyncStateChange({
        isConnected: false,
        userEmail: null,
        userName: null,
        userPhoto: null,
        lastSyncedAt: null,
        syncedEventCount: 0,
      });
      setSyncResult(null);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to disconnect Google Calendar");
    }
  };

  const handleExecuteSync = async () => {
    setShowConfirmDialog(false);
    setIsSyncing(true);
    setErrorMessage(null);
    setSyncResult(null);

    try {
      const res = await syncItemsToGoogleCalendar(items, {
        syncSubscriptions,
        syncBills,
        selectedItemIds: Array.from(selectedIds),
      });
      setSyncResult(res);
      onSyncStateChange({
        ...syncState,
        lastSyncedAt: new Date().toISOString(),
        syncedEventCount: res.createdCount,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to synchronize events to Google Calendar");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-2xs select-none">
      <div 
        className="w-full max-w-xl bg-white rounded-lg border border-neutral-200 shadow-xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0">
              <CalendarIcon size={16} />
            </div>
            <div>
              <h2 className="text-sm font-medium text-neutral-900">Google Calendar Synchronization</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/60 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Account Status Card */}
          <div className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {syncState.isConnected && syncState.userPhoto ? (
                <img
                  src={syncState.userPhoto}
                  alt={syncState.userName || "User"}
                  className="w-10 h-10 rounded-full border border-neutral-200 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-medium text-xs">
                  {syncState.userName ? syncState.userName[0] : "G"}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-900">
                    {syncState.isConnected ? syncState.userName || syncState.userEmail : "Not Connected"}
                  </span>
                  {syncState.isConnected && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-medium border border-emerald-200">
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {syncState.isConnected
                    ? syncState.userEmail
                    : "Sign in to schedule reminders directly on your primary calendar"}
                </p>
              </div>
            </div>

            {/* Google Sign In / Disconnect */}
            <div>
              {!syncState.isConnected ? (
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium flex items-center gap-2 shadow-2xs transition-colors disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{isSigningIn ? "Signing In..." : "Sign in with Google"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-2.5 py-1 text-xs text-neutral-600 hover:text-rose-600 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <LogOut size={13} />
                  <span>Disconnect</span>
                </button>
              )}
            </div>
          </div>

          {/* Type Category Filters */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-neutral-700">Filter Event Types</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-200 bg-white cursor-pointer hover:bg-neutral-50 transition-colors">
                <input
                  type="checkbox"
                  checked={syncSubscriptions}
                  onChange={(e) => setSyncSubscriptions(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
                />
                <div>
                  <span className="font-medium text-neutral-900">Subscriptions</span>
                  <p className="text-[10px] text-neutral-500">Spotify, Netflix, software licenses</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-200 bg-white cursor-pointer hover:bg-neutral-50 transition-colors">
                <input
                  type="checkbox"
                  checked={syncBills}
                  onChange={(e) => setSyncBills(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
                />
                <div>
                  <span className="font-medium text-neutral-900">Recurring Bills</span>
                  <p className="text-[10px] text-neutral-500">Rent, electricity, internet utilities</p>
                </div>
              </label>
            </div>
          </div>

          {/* ITEM PREVIEW LIST: Shows what is being added to the calendar */}
          <div className="space-y-2 pt-1 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-neutral-900">
                  Events to Add to Google Calendar
                </h3>
                <p className="text-[11px] text-neutral-500">
                  {selectedIds.size} of {eligibleItems.length} items selected
                </p>
              </div>

              {eligibleItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-[11px] text-neutral-700 hover:text-neutral-950 font-medium underline"
                >
                  {selectedIds.size === eligibleItems.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            {eligibleItems.length === 0 ? (
              <div className="p-6 text-center border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500 text-xs">
                No items eligible for calendar synchronization.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1.5 border border-neutral-200 rounded-lg p-2 bg-neutral-50/50">
                {eligibleItems.map((item) => {
                  const isChecked = selectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                        isChecked
                          ? "bg-white border-neutral-300 shadow-2xs"
                          : "bg-neutral-100/60 border-neutral-200 text-neutral-400 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleItem(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-neutral-300 text-neutral-900 focus:ring-0 shrink-0"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-neutral-900 truncate">
                              {item.name}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                              item.type === "subscription"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {item.type === "subscription" ? "Subscription" : "Recurring Bill"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <CalendarIcon size={11} className="text-neutral-400" />
                              <span>Due: {item.date}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={11} className="text-neutral-400" />
                              <span>24h & 2h alerts</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-medium text-neutral-900 block">
                          {formatCurrency(item.price, item.currency)}
                        </span>
                        <span className="text-[10px] text-neutral-500 capitalize">
                          {item.frequency ? `Every ${item.frequency.interval} ${item.frequency.unit}` : "Monthly"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sync Results Toast */}
          {syncResult && (
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  Synchronized {syncResult.createdCount} payment reminders into Google Calendar!
                </span>
              </div>
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-800 font-medium underline flex items-center gap-0.5 hover:text-emerald-950"
              >
                <span>Open Calendar</span>
                <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-medium transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmDialog(true)}
            disabled={!syncState.isConnected || isSyncing || selectedItemsList.length === 0}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "Syncing..." : `Sync ${selectedItemsList.length} Events to Calendar`}</span>
          </button>
        </div>

        {/* MANDATORY USER CONFIRMATION MODAL - Explicit list of what is adding to calendar */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-2xs">
            <div className="w-full max-w-md bg-white rounded-lg border border-neutral-200 p-4 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-neutral-900 font-medium text-xs">
                <CalendarIcon size={16} className="text-neutral-800" />
                <span>Confirm Calendar Event Creation</span>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                The following <strong className="font-medium text-neutral-900">{selectedItemsList.length} payment reminder events</strong> will be published with 24-hour notifications to your primary Google Calendar (<strong>{syncState.userEmail}</strong>):
              </p>

              {/* Exact Preview List of What's Adding to Calendar */}
              <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                {selectedItemsList.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1 border-b border-neutral-100 last:border-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" />
                      <span className="font-medium text-neutral-900 truncate">{item.name}</span>
                      <span className="text-[10px] text-neutral-400">({item.date})</span>
                    </div>
                    <span className="text-[11px] font-medium text-neutral-700 shrink-0">
                      {formatCurrency(item.price, item.currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-700 text-xs font-medium hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSync}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors shadow-2xs"
                >
                  Confirm & Sync {selectedItemsList.length} Events
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
