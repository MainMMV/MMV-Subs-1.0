import React, { useEffect, useState } from "react";
import { BellRing, CalendarPlus, Check, Clock3 } from "lucide-react";
import { PaymentItem } from "../types";
import { areDeviceRemindersEnabled, enableDeviceReminders, syncDeviceReminders } from "../services/deviceReminders";
import { useI18n } from "../i18n";
import { tashkentDateKey } from "../utils/timezone";

interface NativeQuickSetupProps {
  items: PaymentItem[];
  onOpenCalendar: () => void;
}

export const NativeQuickSetup: React.FC<NativeQuickSetupProps> = ({ items, onOpenCalendar }) => {
  const { t } = useI18n();
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    areDeviceRemindersEnabled().then(setRemindersEnabled).catch(() => setRemindersEnabled(false));
  }, []);

  const today = tashkentDateKey();
  const dueToday = items.filter((item) => item.date === today && item.manualStatus !== "paid" && item.manualStatus !== "skipped").length;

  const enableReminders = async () => {
    try {
      const granted = await enableDeviceReminders();
      setRemindersEnabled(granted);
      const count = granted ? await syncDeviceReminders(items) : 0;
      setStatus(granted ? t("remindersScheduled", { count }) : t("permissionDenied"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not schedule reminders");
    }
  };

  return (
    <section className="mb-4 rounded-2xl border border-emerald-900/10 bg-emerald-950 p-4 text-white shadow-sm" aria-label={t("onThisDevice")}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-200">{t("onThisDevice")}</p>
          <h2 className="mt-0.5 text-sm font-medium">{t("readyForToday")}</h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-emerald-100">
          <Clock3 size={13} />
          <span>{t("dueToday", { count: dueToday })}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={enableReminders}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-medium text-emerald-950 active:scale-[0.98]"
        >
          {remindersEnabled ? <Check size={16} /> : <BellRing size={16} />}
          <span>{remindersEnabled ? t("remindersActive") : t("enableReminders")}</span>
        </button>
        <button
          type="button"
          onClick={onOpenCalendar}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-medium text-white active:scale-[0.98]"
        >
          <CalendarPlus size={16} />
          <span>{t("deviceCalendar")}</span>
        </button>
      </div>
      {status ? <p className="mt-2 text-[11px] text-emerald-100" role="status">{status}</p> : null}
    </section>
  );
};
