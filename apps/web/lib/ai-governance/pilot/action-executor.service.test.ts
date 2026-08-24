import { describe, expect, it, vi } from "vitest";
import { executeGovernedAiAction } from "./action-executor.service";
import type { SupabaseClient } from "@supabase/supabase-js";

function makeSupabase(opts: {
  member?: boolean;
  existingAudit?: Record<string, unknown> | null;
}) {
  return {
    from: vi.fn((table: string) => {
      if (table === "project_members") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => (opts.member === false ? { data: null } : { data: { id: "m1" } }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "project_stakeholders") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  is: () => ({
                    maybeSingle: async () => ({ data: null }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "ai_action_audit_records") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: opts.existingAudit ?? null }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: "audit-new" }, error: null }),
            }),
          }),
        };
      }
      return {};
    }),
  } as unknown as SupabaseClient;
}

describe("executeGovernedAiAction", () => {
  it("blocks prohibited actions", async () => {
    const result = await executeGovernedAiAction(makeSupabase({}), {
      actionId: "approve_report",
      tenantId: "t1",
      projectId: "p1",
      initiatedBy: "u1",
      userRole: "manager",
    });
    expect(result.status).toBe("blocked");
    expect(result.errorCategory).toBe("prohibited_action");
  });

  it("blocks unknown actions", async () => {
    const result = await executeGovernedAiAction(makeSupabase({ member: true }), {
      actionId: "unknown_action_xyz",
      tenantId: "t1",
      projectId: "p1",
      initiatedBy: "u1",
      userRole: "manager",
    });
    expect(result.status).toBe("blocked");
  });

  it("blocks worker from manager-only remind action", async () => {
    const result = await executeGovernedAiAction(makeSupabase({ member: true }), {
      actionId: "remind_missing_daily_report",
      tenantId: "t1",
      projectId: "p1",
      initiatedBy: "u1",
      userRole: "worker",
    });
    expect(result.status).toBe("blocked");
    expect(result.errorCategory).toBe("role_forbidden");
  });

  it("replays idempotent requests without duplicate execution", async () => {
    const result = await executeGovernedAiAction(
      makeSupabase({
        member: true,
        existingAudit: {
          id: "audit1",
          dry_run: false,
          outcome: "success",
          details: { execution_status: "executed" },
        },
      }),
      {
      actionId: "remind_missing_daily_report",
      tenantId: "t1",
      projectId: "p1",
      initiatedBy: "u1",
      userRole: "manager",
      idempotencyKey: "key-1",
      }
    );
    expect(result.warnings.some((w) => w.includes("Idempotent"))).toBe(true);
    expect(result.status).toBe("executed");
  });

  it("replays idempotent pending approvals with the stored status", async () => {
    const result = await executeGovernedAiAction(
      makeSupabase({
        member: true,
        existingAudit: {
          id: "audit1",
          dry_run: false,
          outcome: "success",
          details: { execution_status: "pending_approval" },
        },
      }),
      {
        actionId: "draft_owner_message",
        tenantId: "t1",
        projectId: "p1",
        initiatedBy: "u1",
        userRole: "manager",
        idempotencyKey: "key-2",
      }
    );
    expect(result.status).toBe("pending_approval");
  });

  it("maps legacy success audits back to pending approval when no stored status exists", async () => {
    const result = await executeGovernedAiAction(
      makeSupabase({
        member: true,
        existingAudit: {
          id: "audit1",
          dry_run: false,
          outcome: "success",
          details: {},
        },
      }),
      {
        actionId: "draft_owner_message",
        tenantId: "t1",
        projectId: "p1",
        initiatedBy: "u1",
        userRole: "manager",
        idempotencyKey: "key-3",
      }
    );
    expect(result.status).toBe("pending_approval");
  });

  it("maps audit error outcomes back to error on replay", async () => {
    const result = await executeGovernedAiAction(
      makeSupabase({
        member: true,
        existingAudit: {
          id: "audit1",
          dry_run: false,
          outcome: "error",
          details: {},
        },
      }),
      {
        actionId: "remind_missing_daily_report",
        tenantId: "t1",
        projectId: "p1",
        initiatedBy: "u1",
        userRole: "manager",
        idempotencyKey: "key-4",
      }
    );
    expect(result.status).toBe("error");
  });
});
