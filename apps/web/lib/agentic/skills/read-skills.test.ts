import { describe, expect, it } from "vitest";
import { createReadSkills } from "./read-skills";
import { AgentError } from "../errors";
import type { AgentExecutionContext } from "../types";

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
  for (const k of ["select", "eq", "in", "lt", "order", "limit"]) api[k] = self;
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
});
