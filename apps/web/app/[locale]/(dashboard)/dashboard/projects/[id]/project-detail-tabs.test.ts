import { describe, expect, it } from "vitest";
import { DEFAULT_PROJECT_DETAIL_TAB, resolveProjectDetailTab } from "./project-detail-tabs";

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
  });

  it("falls back safely for missing or unknown tabs", () => {
    expect(resolveProjectDetailTab(null)).toBe(DEFAULT_PROJECT_DETAIL_TAB);
    expect(resolveProjectDetailTab(undefined)).toBe(DEFAULT_PROJECT_DETAIL_TAB);
    expect(resolveProjectDetailTab("unknown")).toBe(DEFAULT_PROJECT_DETAIL_TAB);
  });
});
