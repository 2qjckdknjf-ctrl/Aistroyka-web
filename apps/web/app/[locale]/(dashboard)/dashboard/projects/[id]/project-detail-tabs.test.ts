import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROJECT_DETAIL_TAB,
  PROJECT_DETAIL_TAB_IDS,
  projectDetailTabHref,
  resolveProjectDetailTab,
} from "./project-detail-tabs";

describe("resolveProjectDetailTab", () => {
  it("resolves project subnav tabs from query params", () => {
    expect(resolveProjectDetailTab("reports")).toBe("reports");
    expect(resolveProjectDetailTab("documents")).toBe("documents");
    expect(resolveProjectDetailTab("schedule")).toBe("schedule");
    expect(resolveProjectDetailTab("decisions")).toBe("decisions");
  });

  it("keeps existing internal tabs working", () => {
    expect(resolveProjectDetailTab("workers")).toBe("workers");
    expect(resolveProjectDetailTab("uploads")).toBe("uploads");
    expect(resolveProjectDetailTab("ai")).toBe("ai");
    expect(resolveProjectDetailTab("costs")).toBe("costs");
    expect(resolveProjectDetailTab("estimate")).toBe("estimate");
    expect(resolveProjectDetailTab("contractors")).toBe("contractors");
    expect(resolveProjectDetailTab("intelligence")).toBe("intelligence");
  });

  it("falls back safely for missing or unknown tabs", () => {
    expect(resolveProjectDetailTab(null)).toBe(DEFAULT_PROJECT_DETAIL_TAB);
    expect(resolveProjectDetailTab(undefined)).toBe(DEFAULT_PROJECT_DETAIL_TAB);
    expect(resolveProjectDetailTab("unknown")).toBe(DEFAULT_PROJECT_DETAIL_TAB);
  });
});

describe("PROJECT_DETAIL_TAB_IDS primary navigation (PD-P1-04)", () => {
  it("exposes one complete destination set without duplicates", () => {
    expect(PROJECT_DETAIL_TAB_IDS).toEqual([
      "workers",
      "contractors",
      "reports",
      "uploads",
      "ai",
      "intelligence",
      "schedule",
      "documents",
      "decisions",
      "costs",
      "estimate",
    ]);
    expect(new Set(PROJECT_DETAIL_TAB_IDS).size).toBe(PROJECT_DETAIL_TAB_IDS.length);
  });

  it("builds shareable hrefs for every destination", () => {
    expect(projectDetailTabHref("project-1", "workers")).toBe("/dashboard/projects/project-1");
    expect(projectDetailTabHref("project-1", "reports")).toBe(
      "/dashboard/projects/project-1?tab=reports"
    );
    expect(projectDetailTabHref("project-1", "costs")).toBe(
      "/dashboard/projects/project-1?tab=costs"
    );
  });
});
