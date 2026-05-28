import { describe, expect, it, vi } from "vitest";
import { addDiscussionEntry, resolveDiscussion } from "./stakeholder-discussions.service";
import * as repo from "./stakeholder-discussions.repository";
import * as policy from "./stakeholder-discussions.policy";

vi.mock("./stakeholder-discussions.repository", () => ({
  insertDiscussion: vi.fn(),
  listByProject: vi.fn(),
  getById: vi.fn(),
  listEntries: vi.fn(),
  insertEntry: vi.fn(),
  updateDiscussion: vi.fn(),
  updateDiscussionStatusAsPortal: vi.fn(),
  listForTimeline: vi.fn(),
}));

vi.mock("./stakeholder-discussions.policy", () => ({
  canManageStakeholderDiscussions: vi.fn(),
  canReadStakeholderDiscussions: vi.fn(),
  canParticipateStakeholderDiscussion: vi.fn(),
}));

describe("stakeholder-discussions.service", () => {
  const ctx = {
    tenantId: "t1",
    userId: "u1",
    role: "owner",
  } as never;
  const supabase = {} as never;
  const adminSupabase = {} as never;

  it("resolveDiscussion requires summary", async () => {
    vi.mocked(policy.canManageStakeholderDiscussions).mockResolvedValue(true);
    vi.mocked(repo.getById).mockResolvedValue({
      id: "d1",
      project_id: "p1",
      tenant_id: "t1",
      status: "awaiting_manager",
    } as never);
    const r = await resolveDiscussion(supabase, ctx, "p1", "d1", "   ");
    expect(r.ok).toBe(false);
  });

  it("addDiscussionEntry rejects resolution_note for non-manager", async () => {
    vi.mocked(policy.canManageStakeholderDiscussions).mockResolvedValue(false);
    vi.mocked(policy.canParticipateStakeholderDiscussion).mockResolvedValue(true);
    vi.mocked(repo.getById).mockResolvedValue({
      id: "d1",
      project_id: "p1",
      tenant_id: "t1",
      status: "awaiting_stakeholder",
    } as never);
    const r = await addDiscussionEntry(supabase, adminSupabase, ctx, "p1", "d1", {
      entry_kind: "resolution_note",
      body: "x",
    });
    expect(r.error).toBe("Invalid entry kind for participant");
  });

  it("addDiscussionEntry requires admin client for participant status changes", async () => {
    vi.mocked(policy.canManageStakeholderDiscussions).mockResolvedValue(false);
    vi.mocked(policy.canParticipateStakeholderDiscussion).mockResolvedValue(true);
    vi.mocked(repo.getById).mockResolvedValue({
      id: "d1",
      project_id: "p1",
      tenant_id: "t1",
      status: "awaiting_stakeholder",
    } as never);
    const r = await addDiscussionEntry(supabase, undefined, ctx, "p1", "d1", {
      entry_kind: "feedback",
      body: "Thanks",
    });
    expect(r).toEqual({
      data: null,
      error: "Discussion updates require server configuration",
    });
    expect(repo.insertEntry).not.toHaveBeenCalled();
    expect(repo.updateDiscussion).not.toHaveBeenCalled();
  });

  it("addDiscussionEntry uses admin client for status when participant responds", async () => {
    vi.mocked(policy.canManageStakeholderDiscussions).mockResolvedValue(false);
    vi.mocked(policy.canParticipateStakeholderDiscussion).mockResolvedValue(true);
    vi.mocked(repo.getById).mockResolvedValue({
      id: "d1",
      project_id: "p1",
      tenant_id: "t1",
      status: "awaiting_stakeholder",
    } as never);
    vi.mocked(repo.insertEntry).mockResolvedValue({ id: "e1" } as never);
    vi.mocked(repo.updateDiscussionStatusAsPortal).mockResolvedValue(true);
    const r = await addDiscussionEntry(supabase, adminSupabase, ctx, "p1", "d1", {
      entry_kind: "feedback",
      body: "Thanks",
    });
    expect(r.data?.id).toBe("e1");
    expect(repo.updateDiscussion).toHaveBeenCalledWith(
      adminSupabase,
      "d1",
      "t1",
      { status: "awaiting_manager" }
    );
    expect(repo.updateDiscussionStatusAsPortal).not.toHaveBeenCalled();
  });
});
