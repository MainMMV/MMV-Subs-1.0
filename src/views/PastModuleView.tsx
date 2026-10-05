import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Pause, Play, Plus, RotateCcw, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import { useI18n, type TranslationKey } from "../i18n";
import type { PastModuleId } from "../config/pastModules";

const MODULE_LABELS: Record<PastModuleId, TranslationKey> = {
  tasks: "tasks", notes: "notes", bookmarks: "bookmarks", focus: "focus",
  reflection: "reflection", salary: "salaryPlan", debt: "debtCalculator",
  qr: "qrGenerator", json: "jsonEditor", clock: "clock", trade: "tradeCalculator",
};

function useStoredState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) as T : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

const inputClass = "w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-emerald-600 focus:outline-none";
const cardClass = "rounded-2xl bg-white p-4 shadow-sm";

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="min-w-0 space-y-1.5">
      <span className="block text-[11px] font-medium text-neutral-500">{label}</span>
      <input className={inputClass} type="number" inputMode="decimal" value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} />
    </label>
  );
}

function TasksModule() {
  const [tasks, setTasks] = useStoredState<Array<{ id: string; title: string; done: boolean }>>("mmv_hub_tasks_v1", []);
  const [title, setTitle] = useState("");
  const addTask = () => {
    if (!title.trim()) return;
    setTasks([{ id: crypto.randomUUID(), title: title.trim(), done: false }, ...tasks]);
    setTitle("");
  };
  return (
    <div className="space-y-3">
      <div className={`${cardClass} flex gap-2`}>
        <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addTask()} placeholder="Add a task" />
        <button type="button" onClick={addTask} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white"><Plus size={18} /></button>
      </div>
      {tasks.map((task) => (
        <div key={task.id} className={`${cardClass} flex items-center gap-3`}>
          <button type="button" onClick={() => setTasks(tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${task.done ? "border-emerald-700 bg-emerald-700 text-white" : "border-neutral-300 text-transparent"}`}><Check size={15} /></button>
          <span className={`min-w-0 flex-1 break-words text-sm ${task.done ? "text-neutral-400 line-through" : "text-neutral-800"}`}>{task.title}</span>
          <button type="button" onClick={() => setTasks(tasks.filter((item) => item.id !== task.id))} className="p-2 text-neutral-400"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  );
}

function TextModule({ storageKey, placeholder }: { storageKey: string; placeholder: string }) {
  const [text, setText] = useStoredState(storageKey, "");
  return <textarea className={`${inputClass} min-h-72 resize-none leading-6`} value={text} onChange={(event) => setText(event.target.value)} placeholder={placeholder} />;
}

function BookmarksModule() {
  const [items, setItems] = useStoredState<Array<{ id: string; title: string; url: string }>>("mmv_hub_bookmarks_v1", []);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const add = () => {
    if (!title.trim() || !url.trim()) return;
    const normalizedUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    setItems([{ id: crypto.randomUUID(), title: title.trim(), url: normalizedUrl }, ...items]);
    setTitle(""); setUrl("");
  };
  return (
    <div className="space-y-3">
      <div className={`${cardClass} space-y-2`}>
        <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Name" />
        <input className={inputClass} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Website address" inputMode="url" />
        <button type="button" onClick={add} className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white">Save bookmark</button>
      </div>
      {items.map((item) => (
        <div key={item.id} className={`${cardClass} flex items-center gap-2`}>
          <a href={item.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800">{item.title}</a>
          <button type="button" onClick={() => setItems(items.filter((entry) => entry.id !== item.id))} className="p-2 text-neutral-400"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  );
}

function FocusModule() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running, seconds]);
  useEffect(() => { if (seconds === 0) setRunning(false); }, [seconds]);
  const display = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <div className={`${cardClass} flex min-h-72 flex-col items-center justify-center gap-6`}>
      <div className="text-6xl font-medium tabular-nums tracking-tight text-neutral-900">{display}</div>
      <div className="flex gap-3">
        <button type="button" onClick={() => setRunning(!running)} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white">{running ? <Pause size={20} /> : <Play size={20} />}</button>
        <button type="button" onClick={() => { setRunning(false); setSeconds(25 * 60); }} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700"><RotateCcw size={19} /></button>
      </div>
    </div>
  );
}

function SalaryModule() {
  const [gross, setGross] = useState(0); const [bonus, setBonus] = useState(0); const [deductions, setDeductions] = useState(12);
  const net = (gross + bonus) * (1 - deductions / 100);
  return <div className={`${cardClass} space-y-4`}><div className="grid grid-cols-2 gap-3"><NumberField label="Base salary" value={gross} onChange={setGross} /><NumberField label="Bonus" value={bonus} onChange={setBonus} /></div><NumberField label="Deductions %" value={deductions} onChange={setDeductions} /><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs text-emerald-700">Estimated net salary</p><p className="mt-1 text-2xl font-medium tabular-nums text-emerald-900">{net.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></div></div>;
}

function DebtModule() {
  const [principal, setPrincipal] = useState(0); const [rate, setRate] = useState(0); const [months, setMonths] = useState(12);
  const monthlyRate = rate / 1200;
  const payment = principal > 0 && months > 0 ? (monthlyRate ? principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)) : principal / months) : 0;
  return <div className={`${cardClass} space-y-4`}><NumberField label="Debt amount" value={principal} onChange={setPrincipal} /><div className="grid grid-cols-2 gap-3"><NumberField label="Annual interest %" value={rate} onChange={setRate} /><NumberField label="Months" value={months} onChange={setMonths} /></div><div className="grid grid-cols-2 gap-3 rounded-2xl bg-amber-50 p-4"><div><p className="text-[11px] text-amber-700">Monthly payment</p><p className="mt-1 font-medium tabular-nums text-amber-950">{payment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></div><div><p className="text-[11px] text-amber-700">Total repayment</p><p className="mt-1 font-medium tabular-nums text-amber-950">{(payment * months).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></div></div></div>;
}

function QrModule() {
  const [value, setValue] = useState("MMV Hub"); const [svg, setSvg] = useState("");
  useEffect(() => { QRCode.toString(value || " ", { type: "svg", margin: 1, color: { dark: "#17201c", light: "#ffffff" } }).then(setSvg).catch(() => setSvg("")); }, [value]);
  return <div className={`${cardClass} space-y-4`}><input className={inputClass} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Text or address" /><div className="mx-auto aspect-square w-full max-w-64 overflow-hidden rounded-2xl bg-white p-3 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} /></div>;
}

function JsonModule() {
  const [value, setValue] = useStoredState("mmv_hub_json_v1", "{\n  \"name\": \"MMV Hub\"\n}"); const [error, setError] = useState("");
  const format = (compact: boolean) => { try { setValue(JSON.stringify(JSON.parse(value), null, compact ? 0 : 2)); setError(""); } catch (reason) { setError(reason instanceof Error ? reason.message : "Invalid JSON"); } };
  return <div className="space-y-3"><div className="flex gap-2"><button type="button" onClick={() => format(false)} className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-medium text-white">Format</button><button type="button" onClick={() => format(true)} className="rounded-xl bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-700">Minify</button></div>{error ? <p className="break-words rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{error}</p> : null}<textarea className={`${inputClass} min-h-80 resize-none font-mono leading-5`} value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} /></div>;
}

function ClockModule() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  return <div className={`${cardClass} flex min-h-72 flex-col items-center justify-center text-center`}><p className="text-6xl font-medium tabular-nums tracking-tight text-neutral-900">{now.toLocaleTimeString("en-GB", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p><p className="mt-3 text-sm text-neutral-500">{now.toLocaleDateString(undefined, { timeZone: "Asia/Tashkent", weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p></div>;
}

function TradeModule() {
  const [entry, setEntry] = useState(0); const [exit, setExit] = useState(0); const [quantity, setQuantity] = useState(1);
  const result = (exit - entry) * quantity; const change = entry ? ((exit - entry) / entry) * 100 : 0;
  return <div className={`${cardClass} space-y-4`}><div className="grid grid-cols-2 gap-3"><NumberField label="Entry price" value={entry} onChange={setEntry} /><NumberField label="Exit price" value={exit} onChange={setExit} /></div><NumberField label="Quantity" value={quantity} onChange={setQuantity} /><div className={`rounded-2xl p-4 ${result >= 0 ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}><p className="text-xs opacity-70">Profit / loss</p><p className="mt-1 text-2xl font-medium tabular-nums">{result.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p><p className="mt-1 text-xs tabular-nums">{change.toFixed(2)}%</p></div></div>;
}

export function PastModuleView({ moduleId, onBack }: { moduleId: PastModuleId; onBack: () => void }) {
  const { t } = useI18n();
  const content = useMemo(() => {
    switch (moduleId) {
      case "tasks": return <TasksModule />;
      case "notes": return <TextModule storageKey="mmv_hub_notes_v1" placeholder="Write a note…" />;
      case "bookmarks": return <BookmarksModule />;
      case "focus": return <FocusModule />;
      case "reflection": return <TextModule storageKey="mmv_hub_reflection_v1" placeholder="What happened today?" />;
      case "salary": return <SalaryModule />;
      case "debt": return <DebtModule />;
      case "qr": return <QrModule />;
      case "json": return <JsonModule />;
      case "clock": return <ClockModule />;
      case "trade": return <TradeModule />;
    }
  }, [moduleId]);

  return (
    <section className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700" aria-label={t("backToModules")}><ArrowLeft size={19} /></button>
        <div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500">{t("mmvClassics")}</p><h2 className="truncate text-lg font-medium text-neutral-900">{t(MODULE_LABELS[moduleId])}</h2></div>
      </div>
      {content}
    </section>
  );
}
