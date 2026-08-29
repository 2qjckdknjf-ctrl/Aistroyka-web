import { describe, expect, it } from "vitest";
import { findProjectBlockers } from "./find-blockers";

describe("findProjectBlockers", () => {
  it("detects overdue critical tasks, blocked tasks, and blocking defects", () => {
    const blockers = findProjectBlockers({
      taskSignals: [
        { taskId: "t1", type: "blocked", severity: "high", message: "Task A blocked" },
        { taskId: "t2", type: "overdue", severity: "high", message: "Task B overdue" },
        { taskId: "t3", type: "on_track", severity: "low", message: "ok" },
      ],
      defects: [
        { id: "d1", title: "Water leak", status: "open", isBlocking: true },
        { id: "d2", title: "Paint", status: "closed", isBlocking: true },
      ],
      missingEvidence: [{ id: "m1", resourceType: "worker_tasks", resourceId: "t1", explanation: "No photos" }],
    });
    const kinds = blockers.map((b) => b.kind);
    expect(kinds).toContain("blocked_task");
    expect(kinds).toContain("overdue_critical_task");
    expect(kinds).toContain("critical_unresolved_issue");
    expect(kinds).toContain("required_evidence_missing");
    expect(blockers.every((b) => b.sourceEntityId.length > 0)).toBe(true);
  });

  it("does not invent dependency blockers", () => {
    const blockers = findProjectBlockers({
      taskSignals: [],
      defects: [],
      missingEvidence: [],
    });
    expect(blockers).toEqual([]);
  });
});
