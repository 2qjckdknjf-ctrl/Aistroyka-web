import { describe, expect, it, vi } from "vitest";
import { getSloDaily } from "./slo.service";

const sloRows = [
  { tenant_id: "t1", date: "2026-03-01", endpoint_group: "worker", requests: 100, errors: 1, p95_latency_ms: 50 },
];

function mockChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: (fn: (r: typeof result) => unknown) => Promise.resolve(fn(result)),
  };
  return chain;
}

describe("slo.service", () => {
  it("returns rows from supabase in range", async () => {
    const supabase = { from: vi.fn(() => mockChain({ data: sloRows, error: null })) } as any;
    const result = await getSloDaily(supabase, { tenantId: "t1", rangeDays: 30 });
    expect(result).toEqual(sloRows);
  });

  it("returns empty array on query error", async () => {
    const supabase = { from: vi.fn(() => mockChain({ data: null, error: new Error("db") })) } as any;
    const result = await getSloDaily(supabase, { tenantId: "t1", rangeDays: 7 });
    expect(result).toEqual([]);
  });
});
