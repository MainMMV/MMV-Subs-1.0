const token = process.env.TELEGRAM_BOT_TOKEN;

export type Keyboard = { text: string; callback_data: string }[][];

function apiUrl(method: string) {
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  return `https://api.telegram.org/bot${token}/${method}`;
}

export async function telegram<T>(method: string, body: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(apiUrl(method), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json() as { ok: boolean; result?: T; description?: string };
  if (!response.ok || !data.ok) throw new Error(data.description || `Telegram ${method} failed`);
  return data.result as T;
}

export async function sendMessage(chatId: string | number, text: string, keyboard?: Keyboard) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined,
  });
}

export async function answerCallbackQuery(id: string) {
  return telegram("answerCallbackQuery", { callback_query_id: id });
}

export function escapeHtml(value: string | number | undefined | null): string {
  return String(value ?? "").replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] ?? char);
}

export const mainKeyboard: Keyboard = [
  [{ text: "Today", callback_data: "today" }, { text: "Payments", callback_data: "payments" }],
  [{ text: "Habits", callback_data: "habits" }, { text: "Subscriptions", callback_data: "subscriptions" }],
  [{ text: "Bills", callback_data: "bills" }, { text: "One-time", callback_data: "purchases" }],
  [{ text: "Goals", callback_data: "goals" }, { text: "Calendar", callback_data: "calendar" }],
  [{ text: "Refresh", callback_data: "home" }, { text: "How it works", callback_data: "info" }],
];
