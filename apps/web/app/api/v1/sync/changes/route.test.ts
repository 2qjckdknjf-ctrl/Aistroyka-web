import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import * as changeLogRepo from "@/lib/sync/change-log.repository";
import * as syncCursorsRepo from "@/lib/sync/sync-cursors.repository";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "member",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));
vi.mock("@/lib/sync/change-log.repository", () => ({
  getMaxCursor: vi.fn(),
  getMinCursor: vi.fn().mockResolvedValue(0),
  getChangesAfter: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/sync/sync-cursors.repository", () => ({
  getCursor: vi.fn().mockResolvedValue(0),
}));

describe("GET /api/v1/sync/changes", () => {
  it("returns 409 with sync_conflict when cursor is ahead of server", async () => {
    vi.mocked(changeLogRepo.getMaxCursor).mockResolvedValue(10);
    const req = new Request("https://test/api/v1/sync/changes?cursor=20&limit=50", {
      headers: { "x-device-id": "device-1" },
    });
    const res = await GET(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "conflict",
      code: "sync_conflict",
      serverCursor: 10,
      must_bootstrap: true,
    });
    expect(changeLogRepo.getChangesAfter).not.toHaveBeenCalled();
  });

  it("returns 409 with hint retention_window_exceeded when cursor < minCursor", async () => {
    vi.mocked(changeLogRepo.getMaxCursor).mockResolvedValue(100);
    vi.mocked(changeLogRepo.getMinCursor).mockResolvedValue(10);
    const req = new Request("https://test/api/v1/sync/changes?cursor=5&limit=50", {
      headers: { "x-device-id": "device-1" },
    });
    const res = await GET(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.hint).toBe("retention_window_exceeded");
    expect(changeLogRepo.getChangesAfter).not.toHaveBeenCalled();
  });

  it("returns 409 with hint device_mismatch when cursor does not match stored for device", async () => {
    vi.mocked(changeLogRepo.getMaxCursor).mockResolvedValue(100);
    vi.mocked(changeLogRepo.getMinCursor).mockResolvedValue(0);
    vi.mocked(syncCursorsRepo.getCursor).mockResolvedValue(50);
    const req = new Request("https://test/api/v1/sync/changes?cursor=30&limit=50", {
      headers: { "x-device-id": "device-1" },
    });
    const res = await GET(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.hint).toBe("device_mismatch");
    expect(changeLogRepo.getChangesAfter).not.toHaveBeenCalled();
  });

  it("returns 200 with changes when cursor is valid", async () => {
    vi.mocked(changeLogRepo.getMaxCursor).mockResolvedValue(100);
    vi.mocked(changeLogRepo.getMinCursor).mockResolvedValue(0);
    vi.mocked(changeLogRepo.getChangesAfter).mockResolvedValue([
      {
        id: 5,
        tenant_id: "t1",
        resource_type: "report",
        resource_id: "r1",
        change_type: "upsert",
        changed_by: null,
        ts: "2024-01-01T00:00:00Z",
        payload: {},
      },
    ]);
    const req = new Request("https://test/api/v1/sync/changes?cursor=0&limit=50", {
      headers: { "x-device-id": "device-1" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.nextCursor).toBe(5);
    expect(data.data.changes).toHaveLength(1);
  });
});
