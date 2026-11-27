import { describe, expect, it } from "vitest";
import { validateOutput } from "./phase-a/contracts/output-contracts";
import { validateAiActionDraft } from "./phase-b/contracts/action-contracts";

const outputTypes = [
  "ExecutiveProjectBrief",
  "ManagerProjectInsight",
  "WorkerNextFocusSummary",
  "ClientSafeProjectSummary",
] as const;

const output = {
  projectId: "project-1",
  tenantId: "tenant-1",
  at: "2026-11-27T10:00:00Z",
  projectStatus: "active",
  headline: "Site progress",
  facts: { count: 2, complete: false, absent: null, nested: { ids: ["task-1"] } },
};

const action = {
  actionId: "action-1",
  tenantId: "tenant-1",
  projectId: "project-1",
  mode: "manager",
  actionType: "draft_followup_task",
  riskLevel: "draft_only",
  requiresApproval: true,
  status: "draft_ready",
  title: "Review evidence",
  rationale: "Missing completion photo",
  factsUsed: ["task-1"],
  inferredReasoningSummary: "",
  targetEntityRefs: [{ resourceType: "task", resourceId: "task-1" }],
  payload: { taskId: "task-1", metadata: { attachments: ["photo-1"] }, note: null },
  availabilityFlags: { evidence: true, budget: false },
  warnings: [],
  createdAt: "2026-11-27T10:00:00Z",
};

describe("AI Brain contract validation", () => {
  it.each(outputTypes)("preserves nonempty facts and defaults for %s", (type) => {
    const result = validateOutput(type, { ...output, type });
    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);
    expect(result.data.facts).toEqual(output.facts);
    expect(result.data.inferredStatements).toEqual([]);
    expect(result.data.unavailableData).toEqual([]);
  });

  it.each(outputTypes)("reports invalid %s records without throwing", (type) => {
    expect(validateOutput(type, { ...output, type, facts: [] })).toEqual({
      success: false,
      error: expect.any(String),
    });
    const result = validateOutput(type, {});
    expect(result.success).toBe(false);
    if (result.success) throw new Error("Invalid output was accepted");
    expect(result.error.length).toBeGreaterThan(0);
  });

  it("preserves action payload values and boolean availability flags", () => {
    expect(validateAiActionDraft(action)).toEqual({ success: true, data: action });
  });

  it.each([
    { ...action, payload: [] },
    { ...action, availabilityFlags: { evidence: "yes" } },
    { ...action, requiresApproval: "yes" },
    {},
  ])("returns a validation error for invalid actions without throwing", (input) => {
    const result = validateAiActionDraft(input);
    expect(result.success).toBe(false);
    if (result.success) throw new Error("Invalid action was accepted");
    expect(result.error.length).toBeGreaterThan(0);
  });
});
