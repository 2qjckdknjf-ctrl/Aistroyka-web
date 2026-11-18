import { describe, expect, it } from "vitest";
import { canWriteFieldDailyLogs } from "./field-daily-log-ui";

describe("canWriteFieldDailyLogs", () => {
  it("hides mutation chrome for viewer and stakeholder", () => {
    expect(canWriteFieldDailyLogs("viewer")).toBe(false);
    expect(canWriteFieldDailyLogs("stakeholder")).toBe(false);
    expect(canWriteFieldDailyLogs(null)).toBe(false);
  });

  it("keeps mutation chrome for member, admin, and owner", () => {
    expect(canWriteFieldDailyLogs("member")).toBe(true);
    expect(canWriteFieldDailyLogs("admin")).toBe(true);
    expect(canWriteFieldDailyLogs("owner")).toBe(true);
  });
});
