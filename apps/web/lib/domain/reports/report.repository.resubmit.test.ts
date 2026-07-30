import { describe, it, expect, vi } from "vitest";
import * as repo from "./report.repository";

function mockStatusUpdate(result: { data: unknown[] | null; error: { message: string } | null }) {
  let updatePayload: Record<string, unknown> = {};
  const select = vi.fn().mockResolvedValue(result);
  const statusEq = vi.fn().mockReturnValue({ select });
  const tenantEq = vi.fn().mockReturnValue({ eq: statusEq });
  const idEq = vi.fn().mockReturnValue({ eq: tenantEq });
  const mockUpdate = vi.fn().mockImplementation((payload: Record<string, unknown>) => {
    updatePayload = payload;
    return { eq: idEq };
  });
  const supabase = {
    from: vi.fn().mockReturnValue({
      update: mockUpdate,
    }),
  } as any;
  return { supabase, updatePayload: () => updatePayload, select };
}

describe("report.repository resubmit", () => {
  it("resubmit updates status to submitted and sets submitted_at", async () => {
    const { supabase, updatePayload } = mockStatusUpdate({
      data: [{ id: "rpt-1" }],
      error: null,
    });
    const result = await repo.resubmit(supabase, "rpt-1", "tenant-1");
    expect(result).toBe(true);
    expect(updatePayload().status).toBe("submitted");
    expect(updatePayload().submitted_at).toBeDefined();
  });

  it("returns false when no changes_requested row matched", async () => {
    const { supabase } = mockStatusUpdate({ data: [], error: null });
    const result = await repo.resubmit(supabase, "rpt-1", "tenant-1");
    expect(result).toBe(false);
  });
});

describe("report.repository submit", () => {
  it("returns true when a draft row is updated", async () => {
    const { supabase } = mockStatusUpdate({
      data: [{ id: "rpt-1" }],
      error: null,
    });
    await expect(repo.submit(supabase, "rpt-1", "tenant-1")).resolves.toBe(true);
  });

  it("returns false on zero-row update (lost race / wrong status)", async () => {
    const { supabase } = mockStatusUpdate({ data: [], error: null });
    await expect(repo.submit(supabase, "rpt-1", "tenant-1")).resolves.toBe(false);
  });
});
