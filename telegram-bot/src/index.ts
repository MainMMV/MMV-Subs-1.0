import "dotenv/config";
import { createServer } from "node:http";
import { allItems, activeGoals, addCalendarDays, daysBetween, ensureFirestoreApiEnabled, findUserByChatId, formatMoney, getLocalClock, isHabitComplete, isHabitScheduled, listUserStates, markHabitDone, rememberDelivery, wasDelivered, type UserState } from "./data.js";
import { answerCallbackQuery, escapeHtml, mainKeyboard, sendMessage, telegram, type Keyboard } from "./telegram.js";
import type { Goal, Habit, ItemReminder, PaymentItem } from "./types.js";

if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is required.");

type Update = {
  update_id: number;
  message?: { text?: string; chat: { id: number } };
  callback_query?: { id: string; data?: string; message?: { chat: { id: number } } };
};

const TZ = process.env.TIME_ZONE || "Asia/Tashkent";
const PORT = Number(process.env.PORT || 10_000);
let updateOffset = 0;
let lastScheduledMinute = "";
let stopping = false;

function paymentKeyboard(item: PaymentItem): Keyboard {
  return [[{ text: "Open payment list", callback_data: "payments" }, { text: "Refresh", callback_data: "home" }]];
}

function habitKeyboard(habit: Habit, date: string): Keyboard {
  return [[{ text: "Mark done", callback_data: `done:${habit.id}:${date}` }, { text: "My habits", callback_data: "habits" }]];
}

function linkedHelp(chatId: number) {
  return `Welcome to <b>MMV Subs Bot</b>\n\nYour Chat ID: <code>${chatId}</code>\n\nTo link your data, open <b>MMV Subs → Settings → Telegram Notifications</b>, paste this Chat ID, enable alerts, and save. The bot then reads your synced subscriptions, bills, one-time purchases, habits, goals, and calendar dates.\n\nUse the buttons below after saving.`;
}

function daysLabel(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  return `in ${days} days`;
}

async function stateFor(chatId: number): Promise<UserState | undefined> {
  return findUserByChatId(chatId);
}

async function showHome(chatId: number) {
  const state = await stateFor(chatId);
  if (!state) return sendMessage(chatId, linkedHelp(chatId), mainKeyboard);
  const clock = getLocalClock(undefined, TZ);
  const items = allItems(state.data).filter((item) => item.manualStatus !== "paid" && item.manualStatus !== "skipped");
  const dueToday = items.filter((item) => item.date === clock.date);
  const upcoming = items.filter((item) => daysBetween(clock.date, item.date) > 0 && daysBetween(clock.date, item.date) <= 7);
  const habitCount = (state.data.habits || []).filter((habit) => isHabitScheduled(habit, clock) && !isHabitComplete(state.data, habit, clock.date)).length;
  const activeGoalCount = activeGoals(state.data.goals || []).length;
  const text = [
    `<b>MMV Subs · ${clock.date}</b>`,
    `Payments due today: <b>${dueToday.length}</b>`,
    `Upcoming in 7 days: <b>${upcoming.length}</b>`,
    `Habits still open: <b>${habitCount}</b>`,
    `Active goals: <b>${activeGoalCount}</b>`,
    "\nChoose a section for full details.",
  ].join("\n");
  return sendMessage(chatId, text, mainKeyboard);
}

async function showPayments(chatId: number, type?: PaymentItem["type"]) {
  const state = await stateFor(chatId);
  if (!state) return sendMessage(chatId, linkedHelp(chatId), mainKeyboard);
  const clock = getLocalClock(undefined, TZ);
  const items = allItems(state.data)
    .filter((item) => !type || item.type === type)
    .filter((item) => item.manualStatus !== "paid" && item.manualStatus !== "skipped")
    .sort((a, b) => a.date.localeCompare(b.date));
  const title = type === "subscription" ? "Subscriptions" : type === "bill" ? "Recurring bills" : type === "purchase" ? "One-time purchases" : "All payments";
  if (!items.length) return sendMessage(chatId, `<b>${title}</b>\n\nNo active items.`, mainKeyboard);
  const text = items.slice(0, 12).map((item) => {
    const days = daysBetween(clock.date, item.date);
    const recurrence = item.frequency ? ` · every ${item.frequency.interval} ${item.frequency.unit}` : "";
    return `• <b>${escapeHtml(item.name)}</b> — ${escapeHtml(formatMoney(item.price, item.currency))}\n  ${item.date} (${daysLabel(days)})${recurrence}`;
  }).join("\n\n");
  const extra = items.length > 12 ? `\n\n…and ${items.length - 12} more.` : "";
  return sendMessage(chatId, `<b>${title}</b>\n\n${text}${extra}`, mainKeyboard);
}

async function showHabits(chatId: number) {
  const state = await stateFor(chatId);
  if (!state) return sendMessage(chatId, linkedHelp(chatId), mainKeyboard);
  const clock = getLocalClock(undefined, TZ);
  const scheduled = (state.data.habits || []).filter((habit) => isHabitScheduled(habit, clock));
  if (!scheduled.length) return sendMessage(chatId, "<b>Habits</b>\n\nNo habits are scheduled for today.", mainKeyboard);
  const text = scheduled.slice(0, 12).map((habit) => {
    const done = isHabitComplete(state.data, habit, clock.date);
    const target = habit.targetValue ? ` · target ${habit.targetValue}${habit.unit ? ` ${habit.unit}` : ""}` : "";
    return `${done ? "Done" : "Open"} · <b>${escapeHtml(habit.name)}</b>${target}`;
  }).join("\n");
  const buttons: Keyboard = scheduled.filter((habit) => !isHabitComplete(state.data, habit, clock.date)).slice(0, 6)
    .map((habit) => [{ text: `Done: ${habit.name.slice(0, 20)}`, callback_data: `done:${habit.id}:${clock.date}` }]);
  buttons.push([{ text: "Home", callback_data: "home" }]);
  return sendMessage(chatId, `<b>Habits · ${clock.date}</b>\n\n${text}`, buttons);
}

async function showGoals(chatId: number) {
  const state = await stateFor(chatId);
  if (!state) return sendMessage(chatId, linkedHelp(chatId), mainKeyboard);
  const goals = activeGoals(state.data.goals || []);
  if (!goals.length) return sendMessage(chatId, "<b>Goals</b>\n\nNo active goals.", mainKeyboard);
  const text = goals.slice(0, 12).map((goal) => {
    const percent = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
    return `• <b>${escapeHtml(goal.title)}</b> — ${percent}%\n  ${escapeHtml(formatMoney(goal.currentAmount, goal.currency))} / ${escapeHtml(formatMoney(goal.targetAmount, goal.currency))}${goal.deadline ? ` · deadline ${goal.deadline}` : ""}`;
  }).join("\n\n");
  return sendMessage(chatId, `<b>Goals</b>\n\n${text}`, mainKeyboard);
}

async function showCalendar(chatId: number) {
  const state = await stateFor(chatId);
  if (!state) return sendMessage(chatId, linkedHelp(chatId), mainKeyboard);
  const clock = getLocalClock(undefined, TZ);
  const end = addCalendarDays(clock.date, 14);
  const items = allItems(state.data).filter((item) => item.date >= clock.date && item.date <= end && item.manualStatus !== "paid" && item.manualStatus !== "skipped").sort((a, b) => a.date.localeCompare(b.date));
  if (!items.length) return sendMessage(chatId, `<b>Calendar · next 14 days</b>\n\nNo payments scheduled.`, mainKeyboard);
  const text = items.map((item) => `• <b>${item.date}</b> — ${escapeHtml(item.name)} (${escapeHtml(formatMoney(item.price, item.currency))})`).join("\n");
  return sendMessage(chatId, `<b>Calendar · next 14 days</b>\n\n${text}`, mainKeyboard);
}

async function showInfo(chatId: number) {
  return sendMessage(chatId, `<b>How MMV Subs Bot works</b>\n\n• <b>Subscriptions & bills:</b> sends each Telegram or global reminder once per payment cycle. When you mark a recurring item paid in the app, its next date becomes the next cycle.\n• <b>One-time purchases:</b> sends reminders once until you mark the item paid or skipped.\n• <b>Habits:</b> sends enabled habit reminders only on scheduled days; the Done button updates the habit log.\n• <b>Goals:</b> sends deadline alerts 7 days, 1 day, and on the deadline.\n• <b>Calendar:</b> displays upcoming payment dates from the same data.\n\nTimes use <b>${TZ}</b>.`, mainKeyboard);
}

function reminderMoment(item: PaymentItem, reminder: ItemReminder): { date: string; time: string } {
  const [year, month, day] = item.date.split("-").map(Number);
  const [hour, minute] = (reminder.exactTime || item.time || "09:00").split(":").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, hour || 0, minute || 0));
  const direction = reminder.timing === "before" ? -1 : reminder.timing === "after" ? 1 : 0;
  const duration = Math.max(0, reminder.duration || 0) * direction;
  if (reminder.unit === "minutes") value.setUTCMinutes(value.getUTCMinutes() + duration);
  if (reminder.unit === "hours") value.setUTCHours(value.getUTCHours() + duration);
  if (reminder.unit === "days") value.setUTCDate(value.getUTCDate() + duration);
  if (reminder.unit === "weeks") value.setUTCDate(value.getUTCDate() + duration * 7);
  return { date: value.toISOString().slice(0, 10), time: value.toISOString().slice(11, 16) };
}

function paymentMessage(item: PaymentItem, label: string) {
  const recurrence = item.frequency ? `\nRepeat: every ${item.frequency.interval} ${item.frequency.unit}` : "";
  return `🔔 <b>${label}</b>\n\n<b>${escapeHtml(item.name)}</b>\n${escapeHtml(formatMoney(item.price, item.currency))}\nDue: ${item.date}${item.time ? ` ${item.time}` : ""}${recurrence}${item.notes ? `\n${escapeHtml(item.notes)}` : ""}`;
}

async function sendOnce(state: UserState, key: string, text: string, keyboard?: Keyboard) {
  if (await wasDelivered(state, key)) return;
  const chatId = state.data.telegramConfig?.chatId;
  if (!chatId) return;
  await sendMessage(chatId, text, keyboard);
  await rememberDelivery(state, key, { type: key.split(":")[0] });
}

async function checkPayments(state: UserState, clock = getLocalClock(undefined, TZ)) {
  const config = state.data.telegramConfig;
  if (!config?.isEnabled || !config.chatId) return;
  for (const item of allItems(state.data)) {
    if (item.manualStatus === "paid" || item.manualStatus === "skipped" || !item.date) continue;
    const telegramReminders = (item.reminders || []).filter((reminder) => reminder.enabled && (reminder.channel === "telegram" || reminder.channel === "both"));
    for (const reminder of telegramReminders) {
      const target = reminderMoment(item, reminder);
      if (target.date === clock.date && target.time === clock.time) {
        await sendOnce(state, `payment:${item.id}:${item.date}:${reminder.id}`, paymentMessage(item, "Payment reminder"), paymentKeyboard(item));
      }
    }
    // Global notification days are a simple fallback for items without their own Telegram reminder.
    if (telegramReminders.length === 0 && config.remindDaysBefore?.includes(daysBetween(clock.date, item.date)) && clock.time === (item.time || "09:00")) {
      await sendOnce(state, `payment:${item.id}:${item.date}:global:${daysBetween(clock.date, item.date)}`, paymentMessage(item, daysBetween(clock.date, item.date) === 0 ? "Payment due today" : "Upcoming payment"), paymentKeyboard(item));
    }
    if (config.notifyPastDue && clock.date === addCalendarDays(item.date, 1) && clock.time === (item.time || "09:00")) {
      await sendOnce(state, `overdue:${item.id}:${item.date}`, paymentMessage(item, "Payment overdue"), paymentKeyboard(item));
    }
  }
}

async function checkHabits(state: UserState, clock = getLocalClock(undefined, TZ)) {
  const config = state.data.telegramConfig;
  if (!config?.isEnabled || !config.chatId) return;
  for (const habit of state.data.habits || []) {
    if (!isHabitScheduled(habit, clock)) continue;
    for (const reminder of habit.reminders || []) {
      if (!reminder.enabled || reminder.time !== clock.time || (reminder.days && !reminder.days.includes(clock.weekday))) continue;
      if (reminder.incompleteOnly && isHabitComplete(state.data, habit, clock.date)) continue;
      const target = habit.targetValue ? `\nTarget: ${habit.targetValue}${habit.unit ? ` ${escapeHtml(habit.unit)}` : ""}` : "";
      await sendOnce(state, `habit:${habit.id}:${clock.date}:${reminder.id}`, `Habit reminder\n\n<b>${escapeHtml(habit.name)}</b>${target}${habit.description ? `\n${escapeHtml(habit.description)}` : ""}`, habitKeyboard(habit, clock.date));
    }
  }
}

async function checkGoals(state: UserState, clock = getLocalClock(undefined, TZ)) {
  const config = state.data.telegramConfig;
  if (!config?.isEnabled || !config.chatId || clock.time !== "09:00") return;
  for (const goal of activeGoals(state.data.goals || [])) {
    if (!goal.deadline) continue;
    const days = daysBetween(clock.date, goal.deadline);
    if (![7, 1, 0].includes(days)) continue;
    const progress = goal.targetAmount ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
    await sendOnce(state, `goal:${goal.id}:${goal.deadline}:${days}`, `Goal deadline ${days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}\n\n<b>${escapeHtml(goal.title)}</b>\nProgress: ${progress}%\n${escapeHtml(formatMoney(goal.currentAmount, goal.currency))} / ${escapeHtml(formatMoney(goal.targetAmount, goal.currency))}`, mainKeyboard);
  }
}

async function runScheduler() {
  const clock = getLocalClock(undefined, TZ);
  const minuteKey = `${clock.date} ${clock.time}`;
  if (minuteKey === lastScheduledMinute) return;
  lastScheduledMinute = minuteKey;
  const states = await listUserStates();
  for (const state of states) {
    try {
      await checkPayments(state, clock);
      await checkHabits(state, clock);
      await checkGoals(state, clock);
    } catch (error) {
      console.error(`Scheduler failed for ${state.uid}:`, error);
    }
  }
}

async function handleCallback(callback: NonNullable<Update["callback_query"]>) {
  const chatId = callback.message?.chat.id;
  if (!chatId) return;
  await answerCallbackQuery(callback.id);
  const action = callback.data || "home";
  if (action.startsWith("done:")) {
    const [, habitId, date] = action.split(":");
    const state = await stateFor(chatId);
    if (!state) return sendMessage(chatId, linkedHelp(chatId), mainKeyboard);
    await markHabitDone(state, habitId, date);
    return sendMessage(chatId, "Done — your habit log has been updated.", mainKeyboard);
  }
  if (action === "today" || action === "home") return showHome(chatId);
  if (action === "payments") return showPayments(chatId);
  if (action === "subscriptions") return showPayments(chatId, "subscription");
  if (action === "bills") return showPayments(chatId, "bill");
  if (action === "purchases") return showPayments(chatId, "purchase");
  if (action === "habits") return showHabits(chatId);
  if (action === "goals") return showGoals(chatId);
  if (action === "calendar") return showCalendar(chatId);
  return showInfo(chatId);
}

async function handleMessage(message: NonNullable<Update["message"]>) {
  const chatId = message.chat.id;
  const command = message.text?.trim().split(/\s+/)[0]?.split("@")[0];
  if (command === "/start") return showHome(chatId);
  if (command === "/help") return showInfo(chatId);
  return showHome(chatId);
}

async function poll() {
  if (stopping) return;
  let retryDelay = 250;
  try {
    const updates = await telegram<Update[]>("getUpdates", { offset: updateOffset, timeout: 25, allowed_updates: ["message", "callback_query"] });
    for (const update of updates) {
      updateOffset = update.update_id + 1;
      if (update.callback_query) await handleCallback(update.callback_query);
      else if (update.message) await handleMessage(update.message);
    }
  } catch (error) {
    console.error("Telegram polling error:", error);
    retryDelay = 3_000;
  }
  if (!stopping) setTimeout(poll, retryDelay);
}

async function startPolling() {
  while (!stopping) {
    try {
      await telegram<boolean>("deleteWebhook", { drop_pending_updates: false });
      console.log("Telegram webhook cleared; long polling enabled.");
      return poll();
    } catch (error) {
      console.error("Could not prepare Telegram polling; retrying in 5 seconds:", error);
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  }
}

console.log(`MMV Subs Telegram bot started. Time zone: ${TZ}`);
const healthServer = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "ok", service: "mmv-subs-telegram-bot", time: new Date().toISOString() }));
    return;
  }
  response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  response.end("MMV Subs Telegram Bot is running.");
});
healthServer.listen(PORT, "0.0.0.0", () => console.log(`Health server listening on 0.0.0.0:${PORT}`));
void ensureFirestoreApiEnabled()
  .then(() => runScheduler())
  .catch((error) => console.error("Firestore initialization error:", error));
const schedulerTimer = setInterval(() => void runScheduler().catch((error) => console.error("Scheduler error:", error)), 30_000);
void startPolling();

function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  clearInterval(schedulerTimer);
  healthServer.close();
  console.log(`${signal} received. Finishing the active Telegram long poll before shutdown.`);
  setTimeout(() => process.exit(0), 27_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
