import { describe, expect, it } from "vitest";
import { buildProjectReportsExportHref, canShowProjectReportsExport } from "./reports-export-ui";

describe("project reports export UI helpers", () => {
  it("allows only tenant owner/admin roles", () => {
    expect(canShowProjectReportsExport("owner")).toBe(true);
    expect(canShowProjectReportsExport("admin")).toBe(true);
    expect(canShowProjectReportsExport("member")).toBe(false);
    expect(canShowProjectReportsExport("viewer")).toBe(false);
    expect(canShowProjectReportsExport("stakeholder")).toBe(false);
    expect(canShowProjectReportsExport(null)).toBe(false);
    expect(canShowProjectReportsExport(undefined)).toBe(false);
  });

  it("builds only the project-scoped reports export URL", () => {
    const href = buildProjectReportsExportHref("project 1/with/slash");
    const url = new URL(href, "https://example.test");

    expect(url.pathname).toBe("/api/v1/reports/export");
    expect(url.searchParams.get("project_id")).toBe("project 1/with/slash");
    expect(Array.from(url.searchParams.keys())).toEqual(["project_id"]);
  });

  it("does not include forbidden export scopes or filters", () => {
    const href = buildProjectReportsExportHref("project-1");

    expect(href).not.toMatch(/status|from|to|range_days/i);
    expect(href).not.toMatch(/cost|budget|finance|margin|profit/i);
    expect(href).not.toMatch(/customer|stakeholder|media|note|ai/i);
    expect(href).not.toMatch(/projects\/export/i);
  });
});
