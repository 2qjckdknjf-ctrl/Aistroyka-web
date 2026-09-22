import { describe, expect, it } from "vitest";
import { AgentResponseSchema, parseAgentPublicResponse, sanitizeProposedActions } from "./structured-output";

describe("structured output", () => {
  it("accepts valid agent response", () => {
    const parsed = AgentResponseSchema.parse({
      summary: "Delivery at risk from overdue tasks",
      health: { score: 55, band: "RED" },
      risks: [{ title: "Overdue slab", severity: "high" }],
      blockers: [{ title: "Task T1 overdue" }],
      observations: [],
      proposedActions: [],
      limitations: [],
    });
    expect(parsed.summary.length).toBeGreaterThan(0);
  });

  it("rejects malformed structured output", () => {
    const r = AgentResponseSchema.safeParse({ health: { score: 9 } });
    expect(r.success).toBe(false);
  });

  it("rejects arbitrary SQL and URL fetch in proposed actions", () => {
    const { accepted, rejected } = sanitizeProposedActions(
      [
        {
          actionType: "run_sql",
          skillName: "suggest",
          reason: "x",
          expectedEffect: "y",
          payload: { sql: "select * from tenants" },
        },
        {
          actionType: "fetch",
          skillName: "suggest",
          reason: "x",
          expectedEffect: "y",
          payload: { url: "https://evil.example" },
        },
        {
          actionType: "suggest_request_evidence",
          skillName: "suggest",
          reason: "Need photos",
          expectedEffect: "Unblock review",
          payload: { taskId: "t1", tenantId: "forged" },
        },
      ],
      ["suggest"]
    );
    expect(rejected.length).toBeGreaterThan(0);
    expect(accepted[0]?.payload.tenantId).toBeUndefined();
    expect(accepted[0]?.payload.taskId).toBe("t1");
  });

  it("rejects untrusted persisted replay JSON", () => {
    expect(parseAgentPublicResponse({ health: "I invented this" })).toBeNull();
    expect(parseAgentPublicResponse({ schemaVersion: 99, runId: "r1", answer: "x" })).toBeNull();
    expect(
      parseAgentPublicResponse({
        schemaVersion: 1,
        runId: "run-1",
        answer: "ok",
        health: { score: 40, band: "AMBER" },
      })
    ).not.toBeNull();
  });

  it("rejects unknown skill names from the model", () => {
    const { accepted, rejected } = sanitizeProposedActions(
      [
        {
          actionType: "hack",
          skillName: "execute_arbitrary",
          reason: "",
          expectedEffect: "",
          payload: {},
        },
      ],
      ["suggest"]
    );
    expect(accepted).toHaveLength(0);
    expect(rejected[0]).toContain("unknown_skill");
  });
});
