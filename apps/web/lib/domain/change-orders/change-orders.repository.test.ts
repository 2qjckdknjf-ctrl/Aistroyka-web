import { describe, expect, it, vi } from "vitest";
import { updateChangeOrder } from "./change-orders.repository";

describe("change-orders.repository updateChangeOrder", () => {
  it("fails closed when update matches zero rows (RLS / missing id)", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const select = vi.fn(() => ({ maybeSingle }));
    const eq2 = vi.fn(() => ({ select }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const update = vi.fn(() => ({ eq: eq1 }));
    const from = vi.fn(() => ({ update }));
    const supabase = { from } as never;

    const ok = await updateChangeOrder(supabase, "c1", "t1", { status: "approved" });
    expect(ok).toBe(false);
    expect(update).toHaveBeenCalled();
    expect(select).toHaveBeenCalledWith("id");
  });

  it("returns true when a row is returned", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "c1" }, error: null });
    const select = vi.fn(() => ({ maybeSingle }));
    const eq2 = vi.fn(() => ({ select }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const update = vi.fn(() => ({ eq: eq1 }));
    const from = vi.fn(() => ({ update }));
    const supabase = { from } as never;

    const ok = await updateChangeOrder(supabase, "c1", "t1", { status: "approved" });
    expect(ok).toBe(true);
  });
});
