import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@aistroyka/contracts", () => ({
  WorkerDayStartRequestSchema: {
    safeParse(raw: unknown) {
      if (!raw || typeof raw !== "object") return { success: true, data: raw };
      const lat = (raw as { latitude?: unknown }).latitude;
      if (typeof lat === "number" && (lat < -90 || lat > 90)) {
        return {
          success: false,
          error: { flatten: () => ({ formErrors: ["Invalid request body"] }) },
        };
      }
      return { success: true, data: raw };
    },
  },
}));

const tenantContext = {
  tenantId: "tenant-1",
  userId: "worker-1",
  role: "member",
  subscriptionTier: "free",
  clientProfile: "ios_worker",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn().mockResolvedValue(tenantContext);
const requireTenant = vi.fn();
const createClientFromRequest = vi.fn().mockResolvedValue({ client: "request-bound" });
const startDay = vi.fn().mockResolvedValue({ data: { id: "day-1" }, error: "" });
const requireLiteIdempotency = vi.fn().mockResolvedValue({ ok: true });
const storeLiteIdempotency = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/domain/worker-day/worker-day.service", () => ({
  startDay: (...args: unknown[]) => startDay(...args),
}));

vi.mock("@/lib/api/lite-idempotency", () => ({
  requireLiteIdempotency: (...args: unknown[]) => requireLiteIdempotency(...args),
  storeLiteIdempotency: (...args: unknown[]) => storeLiteIdempotency(...args),
}));

describe("POST /api/v1/worker/day/start", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    startDay.mockClear();
    requireLiteIdempotency.mockResolvedValue({ ok: true });
  });

  it("starts a day with an empty body", async () => {
    const res = await POST(
      new Request("https://test/api/v1/worker/day/start", {
        method: "POST",
        headers: { "content-type": "application/json", "x-idempotency-key": "k-day-1" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(200);
    expect(startDay).toHaveBeenCalled();
  });

  it("accepts optional location evidence and passes it to startDay", async () => {
    const res = await POST(
      new Request("https://test/api/v1/worker/day/start", {
        method: "POST",
        headers: { "content-type": "application/json", "x-idempotency-key": "k-day-2" },
        body: JSON.stringify({ latitude: 55.75, longitude: 37.61, accuracy_m: 12 }),
      })
    );
    expect(res.status).toBe(200);
    expect(startDay).toHaveBeenCalledWith(
      { client: "request-bound" },
      tenantContext,
      { latitude: 55.75, longitude: 37.61, accuracy_m: 12 }
    );
  });

  it("rejects an invalid latitude", async () => {
    const res = await POST(
      new Request("https://test/api/v1/worker/day/start", {
        method: "POST",
        headers: { "content-type": "application/json", "x-idempotency-key": "k-day-3" },
        body: JSON.stringify({ latitude: 200, longitude: 37.61 }),
      })
    );
    expect(res.status).toBe(400);
    expect(startDay).not.toHaveBeenCalled();
  });
});
