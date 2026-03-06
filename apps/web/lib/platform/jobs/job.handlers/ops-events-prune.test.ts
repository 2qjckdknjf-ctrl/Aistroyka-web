import { describe, expect, it, vi } from "vitest";
import { handleOpsEventsPrune } from "./ops-events-prune";

describe("handleOpsEventsPrune", () => {
  it("deletes ops_events older than retention and logs pruned count", async () => {
    const fromMock = vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [{ id: "e1" }, { id: "e2" }] }),
          }),
        }),
      }),
    });
    const admin = { from: fromMock };
    const job = {
      id: "j1",
      tenant_id: "t1",
      user_id: null,
      type: "ops_events_prune" as const,
      payload: {},
      status: "running",
      attempts: 0,
      max_attempts: 2,
      run_after: new Date().toISOString(),
      locked_by: null,
      locked_at: null,
      last_error: null,
      last_error_type: null,
      trace_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await handleOpsEventsPrune(admin as any, job);
    expect(fromMock).toHaveBeenCalledWith("ops_events");
  });
});
