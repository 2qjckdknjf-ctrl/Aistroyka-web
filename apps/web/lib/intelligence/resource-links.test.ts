import { describe, it, expect } from "vitest";
import { getResourceHref } from "./resource-links";

describe("getResourceHref", () => {
  it("returns task route for task resource", () => {
    expect(getResourceHref("task", "task-123")).toBe("/dashboard/tasks/task-123");
  });

  it("returns report route for report resource", () => {
    expect(getResourceHref("report", "report-456")).toBe(
      "/dashboard/reports/report-456"
    );
  });

  it("returns approvals page for reports_pending", () => {
    expect(getResourceHref("reports_pending", "list")).toBe(
      "/dashboard/approvals"
    );
  });

  it("returns project route for project resource", () => {
    expect(getResourceHref("project", "proj-789")).toBe(
      "/dashboard/projects/proj-789"
    );
  });

  it("returns daily-reports list for worker_day", () => {
    expect(getResourceHref("worker_day", "day-1")).toBe("/dashboard/daily-reports");
  });

  it("returns project route for project_risk when projectId provided", () => {
    expect(getResourceHref("project_risk", "risk-1", "proj-abc")).toBe(
      "/dashboard/projects/proj-abc"
    );
  });

  it("returns null for project_risk when projectId not provided", () => {
    expect(getResourceHref("project_risk", "risk-1")).toBeNull();
  });

  it("returns project schedule route for project_milestone when projectId provided", () => {
    expect(getResourceHref("project_milestone", "m1", "proj-abc")).toBe(
      "/dashboard/projects/proj-abc?tab=schedule"
    );
  });

  it("returns project documents tab for documents resource", () => {
    expect(getResourceHref("documents", "proj-xyz")).toBe(
      "/dashboard/projects/proj-xyz?tab=documents"
    );
  });

  it("returns null for documents when resourceId empty", () => {
    expect(getResourceHref("documents", "")).toBeNull();
  });

  it("returns project costs tab for costs resource", () => {
    expect(getResourceHref("costs", "proj-xyz")).toBe(
      "/dashboard/projects/proj-xyz?tab=costs"
    );
  });

  it("returns project costs tab for project_budget resource", () => {
    expect(getResourceHref("project_budget", "proj-abc")).toBe(
      "/dashboard/projects/proj-abc?tab=costs"
    );
  });

  it("returns null for costs when resourceId empty", () => {
    expect(getResourceHref("costs", "")).toBeNull();
  });

  it("returns null for unknown resource type", () => {
    expect(getResourceHref("unknown", "id-1")).toBeNull();
  });
});
