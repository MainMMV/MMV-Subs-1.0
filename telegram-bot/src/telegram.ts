import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const token = process.env.TELEGRAM_BOT_TOKEN;

export type Keyboard = { text: string; callback_data: string }[][];

export interface TelegramBotProfile {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface TelegramLoginIdentity {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

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

export function getBotProfile() {
  return telegram<TelegramBotProfile>("getMe");
}

export function verifyTelegramLogin(payload: Record<string, unknown>): TelegramLoginIdentity | null {
  if (!token || typeof payload.hash !== "string" || !/^[a-f0-9]{64}$/i.test(payload.hash)) return null;
  const authDate = Number(payload.auth_date);
  if (!Number.isFinite(authDate) || Math.abs(Date.now() / 1000 - authDate) > 900) return null;

  const dataCheckString = Object.entries(payload)
    .filter(([key, value]) => key !== "hash" && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("\n");
  const secretKey = createHash("sha256").update(token).digest();
  const expectedHash = createHmac("sha256", secretKey).update(dataCheckString).digest();
  const suppliedHash = Buffer.from(payload.hash, "hex");
  if (suppliedHash.length !== expectedHash.length || !timingSafeEqual(suppliedHash, expectedHash)) return null;

  const id = Number(payload.id);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return {
    id,
    auth_date: authDate,
    hash: payload.hash,
    first_name: typeof payload.first_name === "string" ? payload.first_name : undefined,
    last_name: typeof payload.last_name === "string" ? payload.last_name : undefined,
    username: typeof payload.username === "string" ? payload.username : undefined,
    photo_url: typeof payload.photo_url === "string" ? payload.photo_url : undefined,
  };
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
