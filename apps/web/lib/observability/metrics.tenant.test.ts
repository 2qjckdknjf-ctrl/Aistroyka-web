/**
 * getSystemMetrics active-tenant filter contract (mocked client).
 */

import { describe, expect, it, vi } from "vitest";
import { getSystemMetrics } from "./metrics";
import type { SupabaseClient } from "@supabase/supabase-js";

function chainMock(rows: unknown[]) {
  const state: { tenantId?: string } = {};
  const api: Record<string, unknown> = {};
  api.select = vi.fn(() => api);
  api.order = vi.fn(() => api);
  api.limit = vi.fn(() => api);
  api.eq = vi.fn((col: string, val: string) => {
    if (col === "tenant_id") state.tenantId = val;
    return Promise.resolve({ data: rows, error: null, count: rows.length });
  });
  // When no eq(tenant_id), terminal methods resolve
  api.then = undefined;
  const limitFn = api.limit as ReturnType<typeof vi.fn>;
  limitFn.mockImplementation(() => {
    if (state.tenantId) {
      return Promise.resolve({ data: rows, error: null });
    }
    // Allow either .eq after limit or direct await of limit
    return {
      eq: api.eq,
      then: (resolve: (v: unknown) => unknown) =>
        resolve({ data: rows, error: null }),
    };
  });
  return { api, state };
}

describe("getSystemMetrics tenant scoping", () => {
  it("applies tenant_id filter when tenantId is provided", async () => {
    const jobs = chainMock([]);
    const analyses = chainMock([]);
    const media = chainMock([]);

    const from = vi.fn((table: string) => {
      if (table === "analysis_jobs") return jobs.api;
      if (table === "ai_analysis") return analyses.api;
      if (table === "media") return media.api;
      return jobs.api;
    });

    const supabase = { from } as unknown as SupabaseClient;
    const tenantId = "11111111-1111-4111-8111-111111111111";
    await getSystemMetrics(supabase, tenantId);

    expect(jobs.state.tenantId).toBe(tenantId);
    expect(analyses.state.tenantId).toBe(tenantId);
  });
});
