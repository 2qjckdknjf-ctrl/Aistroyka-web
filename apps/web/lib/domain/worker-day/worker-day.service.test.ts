import { describe, expect, it, vi } from "vitest";
import { startDay } from "./worker-day.service";

const setStarted = vi.fn();

vi.mock("./worker-day.repository", () => ({
  setStarted: (...args: unknown[]) => setStarted(...args),
  setEnded: vi.fn(),
}));

const ctx = {
  tenantId: "tenant-1",
  userId: "worker-1",
  role: "member" as const,
  subscriptionTier: "free",
  clientProfile: "ios_worker" as const,
  traceId: "trace-1",
};

describe("startDay", () => {
  it("persists optional start location evidence", async () => {
    setStarted.mockResolvedValue({
      id: "day-1",
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      day_date: "2026-08-25",
      started_at: "2026-08-25T12:00:00.000Z",
      ended_at: null,
      latitude: 55.75,
      longitude: 37.61,
      accuracy_m: 12,
    });
    const evidence = { latitude: 55.75, longitude: 37.61, accuracy_m: 12 };
    const result = await startDay({} as never, ctx, evidence);
    expect(result.error).toBe("");
    expect(setStarted).toHaveBeenCalledWith({}, ctx.tenantId, ctx.userId, expect.any(String), evidence);
    expect(result.data?.latitude).toBe(55.75);
  });

  it("starts a day without location", async () => {
    setStarted.mockResolvedValue({
      id: "day-2",
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      day_date: "2026-08-25",
      started_at: "2026-08-25T12:00:00.000Z",
      ended_at: null,
    });
    const result = await startDay({} as never, ctx);
    expect(result.error).toBe("");
    expect(setStarted).toHaveBeenCalledWith({}, ctx.tenantId, ctx.userId, expect.any(String), undefined);
  });
});
