import { describe, expect, it, vi } from "vitest";
import { supabaseTableSink } from "./sink.supabase_table";

describe("sink.supabase_table", () => {
  it("writes rows to export_rows", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: vi.fn(() => ({ insert })) } as any;
    const result = await supabaseTableSink.write(supabase, "batch-1", [{ a: 1 }, { b: 2 }]);
    expect(result.ok).toBe(true);
    expect(result.rowsWritten).toBe(2);
    expect(insert).toHaveBeenCalledWith([
      { batch_id: "batch-1", seq: 1, payload: { a: 1 } },
      { batch_id: "batch-1", seq: 2, payload: { b: 2 } },
    ]);
  });

  it("returns ok and 0 when rows empty", async () => {
    const result = await supabaseTableSink.write({} as any, "b", []);
    expect(result.ok).toBe(true);
    expect(result.rowsWritten).toBe(0);
  });
});
