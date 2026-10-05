import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { inviteStakeholder, acceptStakeholderInvite, listStakeholders } from "./stakeholders.service";

vi.mock("./stakeholders.policy", () => ({
  canManageProjectStakeholders: vi.fn(),
}));
vi.mock("./stakeholders.repository", () => ({
  insertInvite: vi.fn(),
  getByToken: vi.fn(),
  updateRow: vi.fn(),
  listByProject: vi.fn(),
  normalizeEmail: (e: string) => e.trim().toLowerCase(),
}));

const policy = await import("@/lib/domain/stakeholders/stakeholders.policy");
const repo = await import("@/lib/domain/stakeholders/stakeholders.repository");

const supabase = {
  from: vi.fn(),
} as unknown as SupabaseClient;

describe("stakeholders.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inviteStakeholder requires manager policy", async () => {
    vi.mocked(policy.canManageProjectStakeholders).mockResolvedValue(false);
    const { data, error } = await inviteStakeholder(supabase, { tenantId: "t1", userId: "u1", role: "owner" } as any, "p1", {
      email: "a@b.com",
      stakeholder_role: "client_viewer",
    });
    expect(data).toBeNull();
    expect(error).toBe("Insufficient rights");
  });

  it("acceptStakeholderInvite rejects email mismatch", async () => {
    vi.mocked(repo.getByToken).mockResolvedValue({
      id: "s1",
      tenant_id: "t1",
      project_id: "p1",
      email: "inv@x.com",
      stakeholder_role: "client_viewer",
      token: "tok",
      status: "invited",
      user_id: null,
      invited_by: null,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      accepted_at: null,
      created_at: "",
      updated_at: "",
    } as any);

    const { data, error } = await acceptStakeholderInvite(supabase, "u1", "other@x.com", "tok");
    expect(data).toBeNull();
    expect(error).toContain("Sign in");
  });

  it("acceptStakeholderInvite is idempotent for the same active user", async () => {
    vi.mocked(repo.getByToken).mockResolvedValue({
      id: "s1",
      tenant_id: "t1",
      project_id: "p1",
      email: "inv@x.com",
      stakeholder_role: "client_viewer",
      token: "tok",
      status: "active",
      user_id: "u1",
      invited_by: null,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      accepted_at: "",
      created_at: "",
      updated_at: "",
    } as never);

    const insert = vi.fn();
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { user_id: "owner" } }) }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { id: "tm1", role: "stakeholder" } }) }),
          }),
        }),
        insert,
      };
    });

    const { data, error, activated } = await acceptStakeholderInvite(supabase, "u1", "inv@x.com", "tok");
    expect(error).toBe("");
    expect(activated).toBe(false);
    expect(data?.project_id).toBe("p1");
    expect(repo.updateRow).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("acceptStakeholderInvite restores missing tenant membership on idempotent retry", async () => {
    vi.mocked(repo.getByToken).mockResolvedValue({
      id: "s1",
      tenant_id: "t1",
      project_id: "p1",
      email: "inv@x.com",
      stakeholder_role: "client_viewer",
      token: "tok",
      status: "active",
      user_id: "u1",
      invited_by: null,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      accepted_at: "",
      created_at: "",
      updated_at: "",
    } as never);

    const insert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { user_id: "owner" } }) }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: null }) }),
          }),
        }),
        insert,
      };
    });

    const { data, error, activated } = await acceptStakeholderInvite(supabase, "u1", "inv@x.com", "tok");
    expect(error).toBe("");
    expect(activated).toBe(false);
    expect(data?.project_id).toBe("p1");
    expect(insert).toHaveBeenCalledWith({ tenant_id: "t1", user_id: "u1", role: "stakeholder" });
    expect(repo.updateRow).not.toHaveBeenCalled();
  });

  it("acceptStakeholderInvite does not demote an existing viewer on an already-active invite", async () => {
    vi.mocked(repo.getByToken).mockResolvedValue({
      id: "s1",
      tenant_id: "t1",
      project_id: "p1",
      email: "inv@x.com",
      stakeholder_role: "client_viewer",
      token: "tok",
      status: "active",
      user_id: "u1",
      invited_by: null,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      accepted_at: "",
      created_at: "",
      updated_at: "",
    } as never);

    const update = vi.fn().mockReturnValue({
      eq: () => ({
        eq: async () => ({ error: null }),
      }),
    });
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { user_id: "owner" } }) }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { id: "tm1", role: "viewer" } }) }),
          }),
        }),
        update,
      };
    });

    const { data, error, activated } = await acceptStakeholderInvite(supabase, "u1", "inv@x.com", "tok");
    expect(error).toBe("");
    expect(activated).toBe(false);
    expect(data?.project_id).toBe("p1");
    expect(update).not.toHaveBeenCalled();
  });

  it("acceptStakeholderInvite treats a lost invited-status race as idempotent", async () => {
    const invited = {
      id: "s1",
      tenant_id: "t1",
      project_id: "p1",
      email: "inv@x.com",
      stakeholder_role: "client_viewer",
      token: "tok",
      status: "invited",
      user_id: null,
      invited_by: null,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      accepted_at: null,
      created_at: "",
      updated_at: "",
    };
    const activeSameUser = { ...invited, status: "active", user_id: "u1" };
    vi.mocked(repo.getByToken).mockResolvedValueOnce(invited as never).mockResolvedValueOnce(activeSameUser as never);
    vi.mocked(repo.updateRow).mockResolvedValue(null);
    const chain = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: async () => ({ data: { id: "tm1", role: "stakeholder", user_id: "u1" } }),
    };
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);

    const { data, error, activated } = await acceptStakeholderInvite(supabase, "u1", "inv@x.com", "tok");
    expect(error).toBe("");
    expect(activated).toBe(false);
    expect(data?.project_id).toBe("p1");
    expect(repo.updateRow).toHaveBeenCalledWith(
      expect.anything(),
      "s1",
      "t1",
      expect.objectContaining({ status: "active", user_id: "u1" }),
      "invited"
    );
  });

  it("listStakeholders does not treat a database error as an empty grant list", async () => {
    vi.mocked(policy.canManageProjectStakeholders).mockResolvedValue(true);
    vi.mocked(repo.listByProject).mockResolvedValue({ rows: [], error: "db down" } as never);
    const { data, error } = await listStakeholders(
      supabase,
      { tenantId: "t1", userId: "u1", role: "owner" } as never,
      "p1"
    );
    expect(data).toBeNull();
    expect(error).toBe("List failed");
  });
});
