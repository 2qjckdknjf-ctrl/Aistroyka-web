import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeNextDueAt, dedupePeriodKey, isoWeekPeriodKey, utcDayKey } from "./recurring-operations.cadence";

describe("recurring-operations cadence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-28T12:00:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("dedupePeriodKey uses ISO week for weekly and every_n_days >= 7", () => {
    const d = new Date("2026-03-28T12:00:00.000Z");
    expect(dedupePeriodKey("weekly", null)).toBe(isoWeekPeriodKey(d));
    expect(dedupePeriodKey("every_n_days", 7)).toBe(isoWeekPeriodKey(d));
  });

  it("dedupePeriodKey uses UTC day for daily", () => {
    const d = new Date("2026-03-28T12:00:00.000Z");
    expect(dedupePeriodKey("daily", null)).toBe(utcDayKey(d));
  });

  it("computeNextDueAt advances every_n_days by cadence_days", () => {
    const from = new Date("2026-03-28T00:00:00.000Z");
    const next = computeNextDueAt("every_n_days", 7, from);
    expect(new Date(next).getUTCDate()).toBe(4);
  });
});
