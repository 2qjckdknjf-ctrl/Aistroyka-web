import { describe, expect, it, vi } from "vitest";
import { getCircuitState, recordSuccess, canInvoke } from "./circuit-breaker";

const mockSupabase = (state: string, failureCount = 0, lastFailureAt: string | null = null) => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { state, failure_count: failureCount, last_failure_at: lastFailureAt },
          error: null,
        }),
      })),
    })),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  })),
});

describe("circuit-breaker", () => {
  it("getCircuitState returns closed when no row", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
    } as any;
    const state = await getCircuitState(supabase, "openai");
    expect(state).toBe("closed");
  });

  it("canInvoke returns false when state open", async () => {
    const supabase = mockSupabase("open", 5, new Date().toISOString()) as any;
    const state = await getCircuitState(supabase, "openai");
    expect(state).toBe("open");
    const ok = await canInvoke(supabase, "openai");
    expect(ok).toBe(false);
  });

  it("recordSuccess upserts closed state", async () => {
    const supabase = mockSupabase("closed") as any;
    await recordSuccess(supabase, "openai");
    expect(supabase.from).toHaveBeenCalledWith("ai_provider_health");
  });
});
