import assert from "node:assert/strict";
import test from "node:test";
import type { PaymentItem } from "../types";
import { generateInAppNotifications } from "./notificationService";

const item: PaymentItem = {
  id: "bill-1",
  type: "bill",
  name: "Electricity",
  icon: "zap",
  price: 25,
  currency: "USD",
  date: "2026-10-15",
  time: "09:00",
  status: "upcoming",
  reminders: [{
    id: "three-days",
    timing: "before",
    duration: 3,
    unit: "days",
    exactTime: "10:00",
    channel: "in_app",
    enabled: true,
  }],
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
};

test("in-app reminders appear at the configured local time", () => {
  assert.equal(generateInAppNotifications([item], new Date(2026, 9, 12, 9, 59)).length, 0);
  const due = generateInAppNotifications([item], new Date(2026, 9, 12, 10));
  assert.equal(due.length, 1);
  assert.equal(due[0].daysUntilDue, 3);
});

test("Telegram-only reminders stay out of the in-app drawer", () => {
  const telegramOnly: PaymentItem = {
    ...item,
    reminders: [{ ...item.reminders[0], channel: "telegram" }],
  };
  assert.equal(generateInAppNotifications([telegramOnly], new Date(2026, 9, 15, 10)).length, 0);
});

test("items without custom reminders appear the day before", () => {
  const withoutReminders = { ...item, reminders: [] };
  assert.equal(generateInAppNotifications([withoutReminders], new Date(2026, 9, 13, 10)).length, 0);
  assert.equal(generateInAppNotifications([withoutReminders], new Date(2026, 9, 14, 10)).length, 1);
});
