import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createDefectManager,
  createDefectStakeholder,
  getDefectDetail,
  transitionDefect,
} from "./defects.service";
import * as repo from "./defects.repository";
import * as policy from "./defects.policy";

vi.mock("./defects.repository", () => ({
  insertDefect: vi.fn(),
  insertEvent: vi.fn(),
  getById: vi.fn(),
  listEvents: vi.fn(),
  updateDefect: vi.fn(),
}));

vi.mock("./defects.policy", () => ({
  canManageDefects: vi.fn(),
  canReadDefects: vi.fn(),
  canReportDefectAsStakeholder: vi.fn(),
}));

describe("defects.service", () => {
  const supabase = {} as never;
  const ctx = { tenantId: "t1", userId: "u1" } as never;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createDefectManager inserts open defect and event", async () => {
    vi.mocked(policy.canManageDefects).mockResolvedValue(true);
    vi.mocked(repo.insertDefect).mockResolvedValue({
      id: "d1",
      title: "Scratch",
      status: "open",
      is_blocking: true,
      due_date: null,
      updated_at: "2026-01-01",
    } as never);
    vi.mocked(repo.insertEvent).mockResolvedValue(undefined as never);

    const r = await createDefectManager(supabase, ctx, "p1", { title: "Scratch", is_blocking: true });
    expect(r.error).toBe("");
    expect(r.data?.id).toBe("d1");
    expect(repo.insertEvent).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ defect_id: "d1", to_status: "open", from_status: null })
    );
  });

  it("createDefectStakeholder does not require insertEvent (portal RLS)", async () => {
    vi.mocked(policy.canReportDefectAsStakeholder).mockResolvedValue(true);
    vi.mocked(repo.insertDefect).mockResolvedValue({
      id: "d2",
      title: "Gap",
      status: "open",
      is_blocking: false,
      due_date: null,
      updated_at: "2026-01-01",
    } as never);

    const r = await createDefectStakeholder(supabase, ctx, "p1", { title: "Gap" });
    expect(r.error).toBe("");
    expect(repo.insertEvent).not.toHaveBeenCalled();
  });

  it("getDefectDetail returns public shape for stakeholders", async () => {
    vi.mocked(policy.canReadDefects).mockResolvedValue(true);
    vi.mocked(policy.canManageDefects).mockResolvedValue(false);
    vi.mocked(repo.getById).mockResolvedValue({
      id: "d1",
      project_id: "p1",
      title: "T",
      description: "D",
      status: "open",
      is_blocking: false,
      assigned_to: "secret",
      due_date: null,
      resolution_note: null,
      resolved_at: null,
      resolved_by: null,
      created_at: "a",
      updated_at: "b",
    } as never);
    vi.mocked(repo.listEvents).mockResolvedValue([]);

    const r = await getDefectDetail(supabase, ctx, "p1", "d1");
    expect(r.error).toBe("");
    const d = r.data as { has_assignee?: boolean; assigned_to?: string };
    expect(d.has_assignee).toBe(true);
    expect(d.assigned_to).toBeUndefined();
  });

  it("getDefectDetail returns row+events for managers", async () => {
    vi.mocked(policy.canReadDefects).mockResolvedValue(true);
    vi.mocked(policy.canManageDefects).mockResolvedValue(true);
    vi.mocked(repo.getById).mockResolvedValue({
      id: "d1",
      project_id: "p1",
      title: "T",
      assigned_to: "u9",
    } as never);
    vi.mocked(repo.listEvents).mockResolvedValue([{ id: "e1" } as never]);

    const r = await getDefectDetail(supabase, ctx, "p1", "d1");
    const d = r.data as { assigned_to: string; events: unknown[] };
    expect(d.assigned_to).toBe("u9");
    expect(d.events).toHaveLength(1);
  });

  it("transitionDefect to resolved requires resolution note", async () => {
    vi.mocked(policy.canManageDefects).mockResolvedValue(true);
    vi.mocked(repo.getById).mockResolvedValue({
      id: "d1",
      project_id: "p1",
      status: "ready_for_verification",
    } as never);

    const bad = await transitionDefect(supabase, ctx, "p1", "d1", "resolved", null, "");
    expect(bad.ok).toBe(false);

    vi.mocked(repo.updateDefect).mockResolvedValue(true);
    vi.mocked(repo.insertEvent).mockResolvedValue(undefined as never);
    const ok = await transitionDefect(supabase, ctx, "p1", "d1", "resolved", null, "Fixed trim");
    expect(ok.ok).toBe(true);
  });
});
