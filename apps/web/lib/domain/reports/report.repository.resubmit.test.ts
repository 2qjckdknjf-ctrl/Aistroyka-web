import { describe, it, expect, vi } from "vitest";
import * as repo from "./report.repository";

describe("report.repository resubmit", () => {
  it("resubmit updates status to submitted and sets submitted_at", async () => {
    let updatePayload: Record<string, unknown> = {};
    const mockUpdate = vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      updatePayload = payload;
      return {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "rpt-1" }, error: null }),
              }),
            }),
          }),
        }),
      };
    });
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: mockUpdate,
      }),
    } as any;
    const result = await repo.resubmit(supabase, "rpt-1", "tenant-1");
    expect(result).toBe(true);
    expect(updatePayload.status).toBe("submitted");
    expect(updatePayload.submitted_at).toBeDefined();
  });

  it("returns false when no changes_requested row is updated", async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ update: mockUpdate }) } as any;
    expect(await repo.resubmit(supabase, "rpt-1", "tenant-1")).toBe(false);
  });
});
