import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { inviteStakeholder, acceptStakeholderInvite } from "./stakeholders.service";

vi.mock("./stakeholders.policy", () => ({
  canManageProjectStakeholders: vi.fn(),
}));
vi.mock("./stakeholders.repository", () => ({
  insertInvite: vi.fn(),
  getByToken: vi.fn(),
  updateRow: vi.fn(),
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
});
