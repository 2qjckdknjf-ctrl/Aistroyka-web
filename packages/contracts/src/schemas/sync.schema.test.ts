import { describe, expect, it } from "vitest";
import { SyncChangeEntrySchema, SyncChangesResponseSchema } from "./sync.schema";

const change = {
  id: 1,
  tenant_id: "tenant-1",
  resource_type: "task",
  resource_id: "task-1",
  change_type: "updated",
  changed_by: null,
  ts: "2026-11-27T10:00:00Z",
  payload: { title: "Review photo", complete: false, count: 2, note: null, nested: { ids: [1] } },
};

describe("sync change payload contract", () => {
  it("preserves arbitrary JSON values in nonempty payload records", () => {
    expect(SyncChangeEntrySchema.parse(change)).toEqual(change);
    const response = { data: { changes: [change] }, next_cursor: 1, server_time: change.ts };
    expect(SyncChangesResponseSchema.parse(response)).toEqual(response);
  });

  it.each([[], "invalid", null])("rejects payloads that are not records", (payload) => {
    expect(SyncChangeEntrySchema.safeParse({ ...change, payload }).success).toBe(false);
  });
});
