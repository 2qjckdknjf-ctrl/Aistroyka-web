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
            eq: vi.fn().mockResolvedValue({ error: null }),
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
});
