import { describe, expect, it } from "vitest";
import { buildActionEnvelope } from "./action-envelope";

describe("action envelope", () => {
  it("copies tenant/project from caller, not from result payload", () => {
    const env = buildActionEnvelope({
      actionId: "a1",
      skill: "find_project_blockers",
      mode: "READ",
      riskLevel: "LOW",
      tenantId: "t-real",
      projectId: "p-real",
      status: "COMPLETED",
      result: { tenantId: "t-forged", projectId: "p-forged" },
      evidence: [
        {
          evidenceId: "TASK:t1",
          type: "TASK",
          sourceEntityType: "worker_tasks",
          sourceEntityId: "t1",
          sourceUrl: null,
          storageObject: null,
          capturedAt: "2026-08-29T00:00:00.000Z",
          metadata: {},
        },
      ],
    });
    expect(env.tenantId).toBe("t-real");
    expect(env.projectId).toBe("p-real");
    expect(env.provenance[0]?.sourceEntityId).toBe("t1");
    expect(env.mode).toBe("READ");
  });
});
