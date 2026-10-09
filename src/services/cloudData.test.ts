import assert from "node:assert/strict";
import test from "node:test";
import { resolveCloudData, type CloudData } from "./cloudData";

const empty: CloudData = {
  items: [], history: [], habits: [], habitLogs: {}, goals: [],
  telegramConfig: { botToken: "", chatId: "", isEnabled: false, remindDaysBefore: [], notifyPastDue: true },
  displayCurrency: "default", exchangeRateUsdToUzs: 12800, theme: "warm-dark",
};

test("restores cloud records to an empty device", () => {
  assert.equal(resolveCloudData(empty, { items: [{ id: "payment-1" }] as CloudData["items"] }), "restore");
});

test("asks before replacing different local and cloud records", () => {
  const local = { ...empty, items: [{ id: "local" }] as CloudData["items"] };
  assert.equal(resolveCloudData(local, { items: [{ id: "cloud" }] as CloudData["items"] }), "choose");
});

test("keeps local records when cloud is absent or identical", () => {
  const local = { ...empty, items: [{ id: "same" }] as CloudData["items"] };
  assert.equal(resolveCloudData(local, null), "keep");
  assert.equal(resolveCloudData(local, { items: [{ id: "same" }] as CloudData["items"] }), "keep");
});
