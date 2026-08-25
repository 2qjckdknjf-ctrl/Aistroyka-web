import { describe, expect, it, vi, beforeEach } from "vitest";
import { executeGovernedAiAction } from "./action-executor.service";
import { PILOT_AI_ACTION_IDS } from "./action-registry";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: vi.fn() }));

vi.mock("@/lib/domain/reports/report-completeness.service", () => ({
  evaluateReportCompleteness: vi.fn(async () => ({
    report_id: "r1",
    status: "incomplete",
    reasons: ["worker_note_missing"],
    missing_fields: ["worker_note"],
    rules_version: "pilot-v1",
    evaluated_at: new Date().toISOString(),
    has_before: false,
    has_after: false,
    before_after_pair_valid: false,
    media_reference_valid: false,
  })),
}));

function makeSupabase(opts: { member?: boolean; idempotency?: boolean }) {
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
                  eq: () => ({
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
                maybeSingle: async () =>
                  opts.idempotency ? { data: { id: "audit1", dry_run: false, outcome: "success" } } : { data: null },
              }),
            }),
          }),
        };
      }
      return {};
    }),
  } as unknown as SupabaseClient;
}

function mockAdminInsert(id = "audit-new") {
  vi.mocked(getAdminClient).mockReturnValue({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: { id }, error: null })),
        })),
      })),
    })),
  } as unknown as ReturnType<typeof getAdminClient>);
}

describe("executeGovernedAiAction", () => {
  beforeEach(() => {
    vi.mocked(getAdminClient).mockReset();
    mockAdminInsert();
  });

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
    const result = await executeGovernedAiAction(makeSupabase({ member: true, idempotency: true }), {
      actionId: "remind_missing_daily_report",
      tenantId: "t1",
      projectId: "p1",
      initiatedBy: "u1",
      userRole: "manager",
      idempotencyKey: "key-1",
    });
    expect(result.warnings.some((w) => w.includes("Idempotent"))).toBe(true);
  });

  it("executes dry-run for all registry actions with audit record", async () => {
    for (const actionId of PILOT_AI_ACTION_IDS) {
      const result = await executeGovernedAiAction(makeSupabase({ member: true }), {
        actionId,
        tenantId: "t1",
        projectId: "p1",
        initiatedBy: "u1",
        userRole: "manager",
        dryRun: true,
        input: { report_id: "r1" },
      });
      expect(result.status).toBe("dry_run");
      expect(result.auditRecordId).toBeTruthy();
    }
  });

  it("blocks when audit write fails", async () => {
    vi.mocked(getAdminClient).mockReturnValue(null);
    const result = await executeGovernedAiAction(makeSupabase({ member: true }), {
      actionId: "remind_missing_daily_report",
      tenantId: "t1",
      projectId: "p1",
      initiatedBy: "u1",
      userRole: "manager",
      dryRun: true,
    });
    expect(result.status).toBe("blocked");
    expect(result.errorCategory).toBe("audit_write_failed");
  });
});
