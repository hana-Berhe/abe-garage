import test from "node:test";
import assert from "node:assert";
import { periodStarts } from "../../src/shared/time.js";

test("NFR-17: 23:30 local time still counts as today in Addis Ababa (UTC+3)", () => {
  // 2026-10-26 23:30 in Addis Ababa is 20:30 UTC.
  const { today, week, month } = periodStarts(new Date("2026-10-26T20:30:00Z"), "Africa/Addis_Ababa");
  assert.strictEqual(today.toISOString(), "2026-10-25T21:00:00.000Z");
  assert.strictEqual(week.toISOString(), "2026-10-25T21:00:00.000Z"); // 26 Oct 2026 is a Monday
  assert.strictEqual(month.toISOString(), "2026-09-30T21:00:00.000Z");
});

test("UTC zone gives plain midnights", () => {
  const { today } = periodStarts(new Date("2026-10-28T10:00:00Z"), "UTC");
  assert.strictEqual(today.toISOString(), "2026-10-28T00:00:00.000Z");
});
