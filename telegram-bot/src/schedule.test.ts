import assert from "node:assert/strict";
import test from "node:test";
import { dueWithinLookback } from "./schedule.js";

test("catches up a payment reminder after Render wakes", () => {
  assert.equal(dueWithinLookback({ date: "2026-10-09", time: "09:00" }, { date: "2026-10-09", time: "11:30" }), true);
  assert.equal(dueWithinLookback({ date: "2026-10-09", time: "09:00" }, { date: "2026-10-10", time: "08:59" }), true);
});

test("does not send reminders early or more than a day late", () => {
  assert.equal(dueWithinLookback({ date: "2026-10-09", time: "09:00" }, { date: "2026-10-09", time: "08:59" }), false);
  assert.equal(dueWithinLookback({ date: "2026-10-09", time: "09:00" }, { date: "2026-10-10", time: "09:00" }), false);
});
