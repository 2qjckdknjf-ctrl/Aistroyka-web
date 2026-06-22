import { describe, expect, it } from "vitest";
import { getProjectSubnavItems, isProjectSubnavItemActive } from "./project-subnav.items";

describe("ProjectSubnav", () => {
  it("returns only safe project-scoped navigation items", () => {
    const items = getProjectSubnavItems("project-1");

    expect(items.map((item) => item.key)).toEqual([
      "overview",
      "reports",
      "documents",
      "schedule",
      "decisions",
    ]);
    expect(items.map((item) => item.href)).toEqual([
      "/dashboard/projects/project-1",
      "/dashboard/projects/project-1?tab=reports",
      "/dashboard/projects/project-1?tab=documents",
      "/dashboard/projects/project-1?tab=schedule",
      "/dashboard/projects/project-1?tab=decisions",
    ]);
  });

  it("does not expose forbidden finance, AI admin, export, customer, stakeholder, or mobile links", () => {
    const serialized = JSON.stringify(getProjectSubnavItems("project-1"));

    expect(serialized).not.toMatch(/cost|budget|finance|margin|profit/i);
    expect(serialized).not.toMatch(/ai|flywheel|expert-review|admin/i);
    expect(serialized).not.toMatch(/export/i);
    expect(serialized).not.toMatch(/owner|customer|stakeholder|portal|client/i);
    expect(serialized).not.toMatch(/mobile|ios|android/i);
  });

  it("marks active items only for safe project subnav tabs", () => {
    const items = getProjectSubnavItems("project-1");
    const overview = items.find((item) => item.key === "overview");
    const reports = items.find((item) => item.key === "reports");

    expect(overview).toBeDefined();
    expect(reports).toBeDefined();
    expect(isProjectSubnavItemActive(overview!, "workers")).toBe(true);
    expect(isProjectSubnavItemActive(reports!, "reports")).toBe(true);
    expect(isProjectSubnavItemActive(overview!, "costs")).toBe(false);
    expect(isProjectSubnavItemActive(overview!, "ai")).toBe(false);
  });
});
