import { describe, expect, it } from "vitest";
import { resolveWorkerReportProjectId } from "./report-project-id";

describe("resolveWorkerReportProjectId", () => {
  it("prefers day project over task project", () => {
    expect(resolveWorkerReportProjectId("day-proj", "task-proj")).toBe("day-proj");
  });

  it("falls back to task when day project is null or empty", () => {
    expect(resolveWorkerReportProjectId(null, "task-proj")).toBe("task-proj");
    expect(resolveWorkerReportProjectId("", "task-proj")).toBe("task-proj");
  });

  it("returns null when neither side has a project", () => {
    expect(resolveWorkerReportProjectId(null, null)).toBeNull();
    expect(resolveWorkerReportProjectId("", "")).toBeNull();
  });
});
