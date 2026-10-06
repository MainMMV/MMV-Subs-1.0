import test from "node:test";
import assert from "node:assert/strict";
import type { PaymentItem } from "../types";
import { getPaymentReminderOccurrences } from "./paymentReminderSchedule";

const item: PaymentItem = {
  id: "payment-1",
  type: "subscription",
  name: "Hosting",
  icon: "credit-card",
  price: 10,
  currency: "USD",
  date: "2026-10-10",
  time: "09:00",
  reminders: [
    { id: "early", timing: "before", duration: 5, unit: "days", exactTime: "09:00", channel: "both", enabled: true },
    { id: "follow-up", timing: "after", duration: 3, unit: "days", exactTime: "09:00", channel: "both", enabled: true, onlyIfUnpaid: true },
  ],
  status: "upcoming",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

test("payment calendar includes reminders before and after the due date", () => {
  const occurrences = getPaymentReminderOccurrences([item]);
  assert.deepEqual(occurrences.map((entry) => entry.dateKey), ["2026-10-05", "2026-10-13"]);
});

test("paid items do not expose unpaid follow-up reminders", () => {
  assert.equal(getPaymentReminderOccurrences([{ ...item, manualStatus: "paid" }]).length, 0);
});
