import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import * as changeLogRepo from "@/lib/sync/change-log.repository";
import * as syncCursorsRepo from "@/lib/sync/sync-cursors.repository";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "member",
    subscriptionTier: "free",
    clientProfile: "ios_lite",
    traceId: "trace1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));
vi.mock("@/lib/api/lite-idempotency", () => ({
  requireLiteIdempotency: vi.fn().mockResolvedValue({ ok: true }),
  storeLiteIdempotency: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/sync/change-log.repository", () => ({
  getMaxCursor: vi.fn(),
  getMinCursor: vi.fn().mockResolvedValue(0),
}));
vi.mock("@/lib/sync/sync-cursors.repository", () => ({
  getCursor: vi.fn().mockResolvedValue(0),
  upsertCursor: vi.fn().mockResolvedValue(true),
}));

describe("POST /api/v1/sync/ack", () => {
  it("returns 409 with sync_conflict when cursor is ahead of server", async () => {
    vi.mocked(changeLogRepo.getMaxCursor).mockResolvedValue(10);
    const req = new Request("https://test/api/v1/sync/ack", {
      method: "POST",
      headers: { "x-device-id": "device-1", "content-type": "application/json" },
      body: JSON.stringify({ cursor: 20 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "conflict",
      code: "sync_conflict",
      serverCursor: 10,
      must_bootstrap: true,
    });
    expect(syncCursorsRepo.upsertCursor).not.toHaveBeenCalled();
  });

  it("returns 409 with hint retention_window_exceeded when cursor < minCursor", async () => {
    vi.mocked(changeLogRepo.getMaxCursor).mockResolvedValue(100);
    vi.mocked(changeLogRepo.getMinCursor).mockResolvedValue(10);
    const req = new Request("https://test/api/v1/sync/ack", {
      method: "POST",
      headers: { "x-device-id": "device-1", "content-type": "application/json" },
      body: JSON.stringify({ cursor: 5 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.hint).toBe("retention_window_exceeded");
    expect(syncCursorsRepo.upsertCursor).not.toHaveBeenCalled();
  });

  it("returns 409 with hint device_mismatch when cursor does not match stored for device", async () => {
    vi.mocked(changeLogRepo.getMaxCursor).mockResolvedValue(100);
    vi.mocked(changeLogRepo.getMinCursor).mockResolvedValue(0);
    vi.mocked(syncCursorsRepo.getCursor).mockResolvedValue(50);
    const req = new Request("https://test/api/v1/sync/ack", {
      method: "POST",
      headers: { "x-device-id": "device-1", "content-type": "application/json" },
      body: JSON.stringify({ cursor: 30 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.hint).toBe("device_mismatch");
    expect(syncCursorsRepo.upsertCursor).not.toHaveBeenCalled();
  });

  it("returns 200 and upserts when cursor is valid", async () => {
    vi.mocked(changeLogRepo.getMaxCursor).mockResolvedValue(100);
    vi.mocked(changeLogRepo.getMinCursor).mockResolvedValue(0);
    const req = new Request("https://test/api/v1/sync/ack", {
      method: "POST",
      headers: { "x-device-id": "device-1", "content-type": "application/json" },
      body: JSON.stringify({ cursor: 50 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(syncCursorsRepo.upsertCursor).toHaveBeenCalled();
  });
});
