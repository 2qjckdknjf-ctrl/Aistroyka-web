import { describe, expect, it, vi } from "vitest";
import { persistQuantitySnapshot } from "./quantity-storage.service";
import { hashQuantityRequest } from "./quantity-storage";
import type { QuantityRequest } from "./quantity-engine";

const request: QuantityRequest = {
  kind: "area", rule_version: "1.0.0", work_code: "Q-TILE-FLOOR", quantity_kind: "planned",
  surfaces: [{ id: "floor", shape: { kind: "rectangle", origin: { x: "0", y: "0" }, width: "4.2", height: "2.1" },
    geometry_known: true, mapping_complete: true, deductions_complete: true, selection: "whole", zones: [], deductions: [] }],
};
function fixture() {
  const snapshot = {
    id: "snapshot", tenant_id: "tenant", project_id: "project", work_specification_id: "spec",
    work_code: request.work_code, rule_version: request.rule_version, quantity_kind: request.quantity_kind,
    request_kind: request.kind, request_hash: hashQuantityRequest(request), evidence_refs: [],
    created_by: "actor", created_at: "2026-11-27T00:00:00.000Z",
  };
  const rpc = vi.fn().mockResolvedValue({ data: { snapshot, created: true }, error: null });
  const from = vi.fn((table: string) => {
    expect(table).toBe("quantity_input_snapshots");
    const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: null, error: null }) };
    return query;
  });
  return { client: { from, rpc } as never, from, rpc, snapshot };
}
const input = { tenantId: "tenant", projectId: "project", actorUserId: "actor", request, compute: false };
describe("snapshot transaction boundary", () => {
  it("sends the resolved specification and snapshot to one atomic operation", async () => {
    const db = fixture();
    expect(await persistQuantitySnapshot(db.client, input)).toMatchObject({ ok: true, created: true, snapshot: { id: "snapshot" } });
    expect(db.rpc).toHaveBeenCalledTimes(1);
    expect(db.rpc).toHaveBeenCalledWith("create_quantity_snapshot_atomic", expect.objectContaining({
      p_tenant_id: "tenant", p_project_id: "project", p_actor_user_id: "actor", p_request: request,
      p_request_hash: hashQuantityRequest(request), p_spec: expect.objectContaining({ work_code: request.work_code }),
    }));
    expect(db.from).toHaveBeenCalledTimes(1);
  });
  it("preserves a transaction winner's reused identity", async () => {
    const db = fixture(); db.rpc.mockResolvedValue({ data: { snapshot: db.snapshot, created: false }, error: null });
    expect(await persistQuantitySnapshot(db.client, input)).toMatchObject({ ok: true, created: false, work_specification_id: "spec" });
  });
  it.each(["project_id", "request_hash"])("fails closed on a mismatched returned %s", async (field) => {
    const db = fixture(); (db.snapshot as Record<string, unknown>)[field] = "wrong";
    expect(await persistQuantitySnapshot(db.client, input)).toMatchObject({ ok: false, code: "INSERT_FAILED" });
  });
  it("requires the migration and never falls back to separate writes", async () => {
    const db = fixture(); db.rpc.mockResolvedValue({ data: null, error: { code: "PGRST202", message: "RPC missing" } });
    expect(await persistQuantitySnapshot(db.client, input)).toMatchObject({ ok: false, code: "PERSISTENCE_UNAVAILABLE" });
    expect(db.from).toHaveBeenCalledTimes(1);
  });
});
