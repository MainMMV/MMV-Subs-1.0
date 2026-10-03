import { PaymentItem, TelegramConfig } from "../types";
import { formatCurrency } from "./calculations";
import { APP_TIME_ZONE, tashkentDateKey } from "./timezone";

export interface SendTelegramResult {
  success: boolean;
  error?: string;
  botUsername?: string;
}

/**
 * Format a list of upcoming items for Telegram HTML output
 */
export function formatUpcomingBillsMessage(items: PaymentItem[]): string {
  if (items.length === 0) {
    return (
      `✨ <b>MMV Hub Notification</b>\n\n` +
      `You have no upcoming payments due in the next 7 days! All set. 🎉\n\n` +
      `<i>Updated on ${new Date().toLocaleDateString(undefined, { timeZone: APP_TIME_ZONE, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</i>`
    );
  }

  let msg = `📅 <b>MMV Hub: Upcoming Payments Alert</b>\n\n`;
  msg += `You have <b>${items.length} ${items.length === 1 ? "payment" : "payments"}</b> due soon:\n\n`;

  items.forEach((item) => {
    msg += `• <b>${item.name}</b> (${item.type}): <b>${formatCurrency(item.price, item.currency)}</b>\n  🗓 Due: ${item.date} ${item.time || ""}\n\n`;
  });

  msg += `💡 <i>Tap into MMV Hub to manage or mark as paid.</i>`;
  return msg;
}

/**
 * Format a list of past-due items for Telegram HTML output
 */
export function formatPastDueBillsMessage(items: PaymentItem[]): string {
  if (items.length === 0) {
    return (
      `✅ <b>MMV Hub Notice</b>\n\n` +
      `Great news! You have zero past-due payments. Everything is up to date!`
    );
  }

  let msg = `🚨 <b>MMV Hub: Overdue Payments Alert!</b>\n\n`;
  msg += `⚠️ The following <b>${items.length} ${items.length === 1 ? "payment" : "payments"}</b> require your attention:\n\n`;

  items.forEach((item) => {
    msg += `❌ <b>${item.name}</b>: <b>${formatCurrency(item.price, item.currency)}</b>\n  🗓 Was due: ${item.date}\n\n`;
  });

  msg += `🔔 <i>Please check your account or update payment status in MMV Hub.</i>`;
  return msg;
}

/**
 * Format a single payment item reminder
 */
export function formatSingleBillMessage(item: PaymentItem): string {
  const isToday = tashkentDateKey() === item.date;
  const isPast = new Date() > new Date(item.date + "T23:59:59");

  const header = isPast 
    ? "🚨 <b>Past Due Payment Notice</b>" 
    : isToday 
      ? "⏰ <b>Payment Due Today!</b>" 
      : "🗓 <b>Upcoming Payment Reminder</b>";

  return (
    `🔔 <b>MMV Hub Reminder</b>\n${header}\n\n` +
    `• <b>Item</b>: ${item.name} (${item.type})\n` +
    `• <b>Amount</b>: <b>${formatCurrency(item.price, item.currency)}</b>\n` +
    `• <b>Date</b>: ${item.date} ${item.time || ""}\n` +
    (item.notes ? `• <b>Notes</b>: ${item.notes}\n` : "") +
    `\n<i>Powered by MMV Hub</i>`
  );
}

/**
 * Dispatches a Telegram message
 */
export async function sendTelegramNotification(
  config: TelegramConfig,
  htmlText: string
): Promise<SendTelegramResult> {
  if (!config.botToken || !config.chatId) {
    return { success: false, error: "Telegram Bot Token and Chat ID must be configured in Settings" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: htmlText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      return { success: false, error: data.description || "Telegram API rejected the message" };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to reach Telegram network" };
  }
}
