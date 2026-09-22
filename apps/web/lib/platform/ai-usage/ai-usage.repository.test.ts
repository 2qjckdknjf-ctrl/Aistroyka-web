import { describe, expect, it, vi } from "vitest";
import { getOrCreateBillingState, recordUsageAndSpendAtomic } from "./ai-usage.repository";

const usage = {
  tenant_id: "11111111-1111-1111-1111-111111111111",
  user_id: "22222222-2222-2222-2222-222222222222",
  trace_id: "trace-1",
  provider: "openai",
  model: "gpt-test",
  tokens_input: 10,
  tokens_output: 5,
  tokens_total: 15,
  cost_usd: 0.01,
  status: "success" as const,
  error_type: null,
  duration_ms: 42,
};

function selectChain(result: { data: unknown; error: unknown }) {
  const api: Record<string, unknown> = {};
  const self = () => api;
  for (const key of ["select", "eq"]) api[key] = self;
  api.maybeSingle = async () => result;
  return api;
}

describe("AI usage repository", () => {
  it("records tenant usage and spend through one transactional RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    await recordUsageAndSpendAtomic({ rpc } as never, usage);

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith(
      "record_ai_usage_and_spend_atomic",
      expect.objectContaining({
        p_tenant_id: usage.tenant_id,
        p_trace_id: "trace-1",
        p_cost_usd: 0.01,
        p_tokens_total: 15,
      })
    );
  });

  it("fails closed when the atomic accounting transaction is rejected", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: { message: "db down" } });
    await expect(recordUsageAndSpendAtomic({ rpc } as never, usage)).rejects.toThrow(
      "ai_usage_atomic_record_failed"
    );
  });

  it("initializes billing state with conflict-safe upsert and rereads the winning row", async () => {
    let selectCall = 0;
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({
      select: () => {
        selectCall += 1;
        return selectChain(
          selectCall === 1
            ? { data: null, error: null }
            : {
                data: {
                  period_start: "2026-09-01",
                  period_end: "2026-09-30",
                  budget_usd: 25,
                  spent_usd: 3,
                },
                error: null,
              }
        );
      },
      upsert,
    }));

    const result = await getOrCreateBillingState({ from } as never, usage.tenant_id);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: usage.tenant_id }),
      { onConflict: "tenant_id", ignoreDuplicates: true }
    );
    expect(result).toMatchObject({ budget_usd: 25, spent_usd: 3 });
  });
});
