import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { canWriteFieldDailyLogs } from "@/lib/domain/field-daily-log/field-daily-log-ui";

const panelSrc = readFileSync(
  join(process.cwd(), "app/[locale]/(dashboard)/projects/ProjectFieldDailyLogPanel.tsx"),
  "utf8"
);

describe("ProjectFieldDailyLogPanel write chrome", () => {
  it("gates Create, Save, and Confirm behind canWrite", () => {
    expect(panelSrc).toContain("canWriteFieldDailyLogs(tenantRole)");
    expect(panelSrc).toContain('data-testid="field-daily-create"');
    expect(panelSrc).toContain('data-testid="field-daily-save"');
    expect(panelSrc).toContain('data-testid="field-daily-confirm"');
    expect(panelSrc).toMatch(/canWrite && !selected/);
    expect(panelSrc).toMatch(/canWrite && selected && isDraft/);
  });

  it("does not show mutation controls for viewer", () => {
    expect(canWriteFieldDailyLogs("viewer")).toBe(false);
  });

  it("shows mutation controls for member", () => {
    expect(canWriteFieldDailyLogs("member")).toBe(true);
  });
});
