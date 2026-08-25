import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROJECT_DETAIL_TAB,
  PROJECT_COMMAND_TAB_ORDER,
  resolveProjectDetailTab,
} from "./project-detail-tabs";

describe("resolveProjectDetailTab", () => {
  it("uses canonical command-center tab order", () => {
    expect(PROJECT_COMMAND_TAB_ORDER[0]).toBe("overview");
    expect(PROJECT_COMMAND_TAB_ORDER).toContain("reports");
    expect(PROJECT_COMMAND_TAB_ORDER).toContain("decisions");
    expect(new Set(PROJECT_COMMAND_TAB_ORDER).size).toBe(PROJECT_COMMAND_TAB_ORDER.length);
  });

  it("resolves known tabs from query params", () => {
    expect(resolveProjectDetailTab("overview")).toBe("overview");
    expect(resolveProjectDetailTab("reports")).toBe("reports");
    expect(resolveProjectDetailTab("documents")).toBe("documents");
    expect(resolveProjectDetailTab("schedule")).toBe("schedule");
    expect(resolveProjectDetailTab("decisions")).toBe("decisions");
    expect(resolveProjectDetailTab("defects")).toBe("defects");
    expect(resolveProjectDetailTab("change-orders")).toBe("change-orders");
    expect(resolveProjectDetailTab("handover")).toBe("handover");
    expect(resolveProjectDetailTab("review-pack")).toBe("review-pack");
    expect(resolveProjectDetailTab("workers")).toBe("workers");
    expect(resolveProjectDetailTab("uploads")).toBe("uploads");
    expect(resolveProjectDetailTab("ai")).toBe("ai");
    expect(resolveProjectDetailTab("costs")).toBe("costs");
  });

  it("falls back to overview for missing or unknown tabs", () => {
    expect(DEFAULT_PROJECT_DETAIL_TAB).toBe("overview");
    expect(resolveProjectDetailTab(null)).toBe("overview");
    expect(resolveProjectDetailTab(undefined)).toBe("overview");
    expect(resolveProjectDetailTab("unknown")).toBe("overview");
  });
});
