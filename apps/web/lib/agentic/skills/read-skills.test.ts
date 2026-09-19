import { describe, expect, it, vi } from "vitest";
import { createReadSkills } from "./read-skills";
import { AgentError } from "../errors";
import type { AgentExecutionContext } from "../types";

vi.mock("@/lib/ai-brain/services/missing-evidence.service", () => ({
  getMissingEvidenceInsights: async () => [],
}));
vi.mock("@/lib/ai-brain/phase-a", () => ({
  assembleProjectTruthSnapshot: async () => null,
}));
vi.mock("@/lib/ai-brain/services/project-health-v2.service", () => ({
  getProjectHealthScore: async () => null,
}));
vi.mock("@/lib/ai-brain/services/top-risks.service", () => ({
  getTopRiskInsights: async () => [],
}));

function ctx(): AgentExecutionContext {
  return {
    tenantId: "t1",
    projectId: "p1",
    userId: "u1",
    actorType: "user",
    tenantRole: "member",
    projectRole: "manager",
    roles: ["manager"],
    permissions: [],
    requestId: "r1",
    traceId: "tr1",
    locale: "en",
    source: "WEB",
    timestamp: new Date().toISOString(),
  };
}

function chain(result: { data: unknown; error: unknown }) {
  const api: Record<string, unknown> = {};
  const self = () => api;
  for (const k of ["select", "eq", "in", "lt", "order", "limit", "not", "gte"]) api[k] = self;
  Object.assign(api, result);
  api.then = (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return api;
}

describe("read skills query errors", () => {
  it("does not convert an overdue query error into []", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "worker_tasks") {
          return chain({ data: null, error: { message: "relation does not exist" } });
        }
        return chain({ data: [], error: null });
      },
    };
    const skill = createReadSkills(supabase as never).find((s) => s.definition.name === "get_overdue_tasks");
    await expect(skill!.execute(ctx(), {})).rejects.toMatchObject({
      code: "AGENT_SKILL_FAILED",
      message: "query_failed:get_overdue_tasks",
    });
    await expect(skill!.execute(ctx(), {})).rejects.toBeInstanceOf(AgentError);
  });

  it("does not convert an issues query error into zero issues", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "project_defects" || table === "project_issues") {
          return chain({ data: null, error: { message: "rls denied" } });
        }
        return chain({ data: [], error: null });
      },
    };
    const skill = createReadSkills(supabase as never).find((s) => s.definition.name === "get_open_issues");
    await expect(skill!.execute(ctx(), {})).rejects.toMatchObject({
      code: "AGENT_SKILL_FAILED",
      message: "query_failed:get_open_issues",
    });
  });

  it("does not label an overdue in-progress task blocked without report evidence", async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const supabase = {
      from: (table: string) => {
        if (table === "worker_tasks") {
          return chain({
            data: [{ id: "t1", status: "in_progress", due_date: yesterday, assigned_to: null, title: "Slab" }],
            error: null,
          });
        }
        if (table === "worker_reports") {
          return chain({
            data: [{ task_id: "t1" }],
            error: null,
          });
        }
        return chain({ data: [], error: null });
      },
    };
    const skill = createReadSkills(supabase as never).find((s) => s.definition.name === "find_project_blockers");
    const result = await skill!.execute(ctx(), {});
    const items = (result.output as { items: Array<{ kind: string }> }).items;
    expect(items.some((b) => b.kind === "blocked_task")).toBe(false);
  });

  it("filters open defects in the database before the skill limit", async () => {
    const inCalls: Array<{ col: string; values: unknown }> = [];
    const supabase = {
      from: (table: string) => {
        const api = chain({
          data: table === "project_defects" ? [{ id: "d1", title: "Leak", status: "open", is_blocking: true, due_date: null }] : [],
          error: null,
        });
        const origIn = api.in as () => unknown;
        api.in = (col: string, values: unknown) => {
          if (table === "project_defects") inCalls.push({ col, values });
          return origIn();
        };
        return api;
      },
    };
    const skill = createReadSkills(supabase as never).find((s) => s.definition.name === "get_open_issues");
    await skill!.execute(ctx(), {});
    expect(inCalls.some((c) => c.col === "status" && Array.isArray(c.values) && c.values.includes("open"))).toBe(true);
  });
});
