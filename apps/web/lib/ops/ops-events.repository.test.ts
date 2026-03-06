import { describe, expect, it, vi } from "vitest";
import { recordSyncConflict } from "./ops-events.repository";

describe("ops-events.repository", () => {
  it("inserts sync_conflict event with tenant_id and metadata", async () => {
    const insertMock = vi.fn().mockResolvedValue({});
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: insertMock,
      }),
    };
    await recordSyncConflict(supabase as any, "t1", { hint: "device_mismatch", device_id: "d1" });
    expect(supabase.from).toHaveBeenCalledWith("ops_events");
    expect(insertMock).toHaveBeenCalledWith({
      tenant_id: "t1",
      type: "sync_conflict",
      metadata: { hint: "device_mismatch", device_id: "d1" },
    });
  });
});
