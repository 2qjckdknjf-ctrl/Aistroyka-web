import { describe, expect, it, vi } from "vitest";
import { getOpsMetrics } from "./ops-metrics.repository";

function chain(count: number) {
  const promise = Promise.resolve({ count });
  const c: Record<string, unknown> = {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  };
  ["select", "eq", "in", "lt", "gte", "lte"].forEach((m) => {
    (c as any)[m] = () => c;
  });
  return c;
}

describe("getOpsMetrics", () => {
  it("returns uploads_stuck for sessions older than threshold", async () => {
    let uploadSessionsCall = 0;
    const supabase = {
      from: (table: string) => {
        if (table === "upload_sessions") {
          uploadSessionsCall++;
          return chain(uploadSessionsCall === 1 ? 1 : 0);
        }
        return chain(0);
      },
      rpc: vi.fn().mockResolvedValue({ data: 0 }),
    };
    const result = await getOpsMetrics(supabase as any, "tenant-1", {});
    expect(result.uploads_stuck).toBe(1);
    expect(result.uploads_expired).toBe(0);
    expect(result).toMatchObject({
      uploads_stuck: 1,
      devices_offline: 0,
      sync_conflicts: 0,
      ai_failed: 0,
      jobs_failed: 0,
      push_failed: 0,
    });
  });

  it("returns uploads_stuck 0 when no sessions older than threshold", async () => {
    const supabase = {
      from: () => chain(0),
      rpc: vi.fn().mockResolvedValue({ data: 0 }),
    };
    const result = await getOpsMetrics(supabase as any, "tenant-1", {});
    expect(result.uploads_stuck).toBe(0);
  });

  it("returns devices_offline from distinct device count (RPC)", async () => {
    const supabase = {
      from: () => chain(0),
      rpc: vi.fn().mockResolvedValue({ data: 5 }),
    };
    const result = await getOpsMetrics(supabase as any, "tenant-1", {});
    expect(result.devices_offline).toBe(5);
    expect(supabase.rpc).toHaveBeenCalledWith("get_offline_device_count", expect.any(Object));
  });

  it("does not double-count devices with multiple tokens", async () => {
    const supabase = {
      from: () => chain(0),
      rpc: vi.fn().mockResolvedValue({ data: 1 }),
    };
    const result = await getOpsMetrics(supabase as any, "tenant-1", {});
    expect(result.devices_offline).toBe(1);
  });

  it("returns sync_conflicts from ops_events count in [from, to]", async () => {
    const supabase = {
      from: (table: string) => {
        const count = table === "ops_events" ? 2 : 0;
        return chain(count);
      },
      rpc: vi.fn().mockResolvedValue({ data: 0 }),
    };
    const result = await getOpsMetrics(supabase as any, "tenant-1", {});
    expect(result.sync_conflicts).toBe(2);
    expect(result).toMatchObject({
      uploads_stuck: 0,
      uploads_expired: 0,
      devices_offline: 0,
      sync_conflicts: 2,
      ai_failed: 0,
      jobs_failed: 0,
      push_failed: 0,
    });
  });
});
