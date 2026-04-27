import { describe, it, expect, vi } from "vitest";
import { evaluateSetupReadiness, evaluateSetupReadinessV2 } from "./setup-readiness.evaluator";

function createSupabaseMock(overrides: {
  projectCount?: number;
  tenantName?: string | null;
  memberCount?: number;
  invitationCount?: number;
  projectsError?: unknown;
}) {
  const {
    projectCount = 0,
    tenantName = null,
    memberCount = 0,
    invitationCount = 0,
    projectsError = null,
  } = overrides;

  const from = vi.fn((table: string) => {
    if (table === "projects") {
      return {
        select: () => ({
          eq: () =>
            Promise.resolve(
              projectsError
                ? { count: null, error: projectsError }
                : { count: projectCount, error: null }
            ),
        }),
      };
    }
    if (table === "tenants") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: tenantName != null ? { name: tenantName } : null,
                error: null,
              }),
          }),
        }),
      };
    }
    if (table === "tenant_members") {
      return {
        select: () => ({
          eq: () => Promise.resolve({ count: memberCount, error: null }),
        }),
      };
    }
    if (table === "tenant_invitations") {
      return {
        select: () => ({
          eq: () => Promise.resolve({ count: invitationCount, error: null }),
        }),
      };
    }
    return {};
  });

  return { from } as unknown as import("@supabase/supabase-js").SupabaseClient;
}

describe("evaluateSetupReadiness", () => {
  it("returns ready_for_dashboard when project count > 0", async () => {
    const supabase = createSupabaseMock({
      projectCount: 2,
      tenantName: "Acme",
      memberCount: 1,
    });
    const r = await evaluateSetupReadiness(supabase, "tenant-1");
    expect(r.kind).toBe("ready_for_dashboard");
    expect(r.projectCount).toBe(2);
  });

  it("returns setup_incomplete when project count is 0", async () => {
    const supabase = createSupabaseMock({
      projectCount: 0,
      tenantName: "Acme",
      memberCount: 1,
    });
    const r = await evaluateSetupReadiness(supabase, "tenant-1");
    expect(r.kind).toBe("setup_incomplete");
    expect(r.projectCount).toBe(0);
  });

  it("returns setup_incomplete on DB error", async () => {
    const supabase = createSupabaseMock({
      projectCount: 0,
      projectsError: { message: "db error" },
    });
    const r = await evaluateSetupReadiness(supabase, "tenant-1");
    expect(r.kind).toBe("setup_incomplete");
    expect(r.projectCount).toBe(0);
  });
});

describe("evaluateSetupReadinessV2", () => {
  it("returns setup_missing when no project and no name", async () => {
    const supabase = createSupabaseMock({
      projectCount: 0,
      tenantName: null,
      memberCount: 1,
    });
    const r = await evaluateSetupReadinessV2(supabase, "tenant-1");
    expect(r.kind).toBe("setup_missing");
    expect(r.nextActionKey).toBe("create_first_project");
    expect(r.missingSteps).toContain("first_project_created");
  });

  it("returns setup_incomplete when no project but has name", async () => {
    const supabase = createSupabaseMock({
      projectCount: 0,
      tenantName: "Acme",
      memberCount: 1,
    });
    const r = await evaluateSetupReadinessV2(supabase, "tenant-1");
    expect(r.kind).toBe("setup_incomplete");
    expect(r.nextActionKey).toBe("create_first_project");
  });

  it("returns minimally_ready when has project but no name", async () => {
    const supabase = createSupabaseMock({
      projectCount: 1,
      tenantName: "",
      memberCount: 1,
    });
    const r = await evaluateSetupReadinessV2(supabase, "tenant-1");
    expect(r.kind).toBe("minimally_ready");
    expect(r.nextActionKey).toBe("set_workspace_name");
    expect(r.completedSteps).toContain("first_project_created");
  });

  it("returns minimally_ready when has project and name but no invite", async () => {
    const supabase = createSupabaseMock({
      projectCount: 1,
      tenantName: "Acme",
      memberCount: 1,
      invitationCount: 0,
    });
    const r = await evaluateSetupReadinessV2(supabase, "tenant-1");
    expect(r.kind).toBe("minimally_ready");
    expect(r.nextActionKey).toBe("invite_team");
  });

  it("returns ready_for_dashboard when all checkpoints complete", async () => {
    const supabase = createSupabaseMock({
      projectCount: 1,
      tenantName: "Acme",
      memberCount: 2,
      invitationCount: 0,
    });
    const r = await evaluateSetupReadinessV2(supabase, "tenant-1");
    expect(r.kind).toBe("ready_for_dashboard");
    expect(r.nextActionKey).toBe("open_dashboard");
    expect(r.completedSteps).toHaveLength(3);
  });

  it("returns ready_for_dashboard when has invitation", async () => {
    const supabase = createSupabaseMock({
      projectCount: 1,
      tenantName: "Acme",
      memberCount: 1,
      invitationCount: 1,
    });
    const r = await evaluateSetupReadinessV2(supabase, "tenant-1");
    expect(r.kind).toBe("ready_for_dashboard");
  });

  it("legacy operational: projectCount > 0 maps to ready in simple evaluator", async () => {
    const supabase = createSupabaseMock({
      projectCount: 3,
      tenantName: "Legacy",
      memberCount: 1,
    });
    const r = await evaluateSetupReadiness(supabase, "tenant-1");
    expect(r.kind).toBe("ready_for_dashboard");
    expect(r.projectCount).toBe(3);
  });
});
