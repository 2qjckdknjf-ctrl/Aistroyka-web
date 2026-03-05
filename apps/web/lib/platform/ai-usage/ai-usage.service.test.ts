import { describe, expect, it, vi } from "vitest";
import { checkQuota, checkBudgetAlert, estimateMaxVisionCostUsd, estimateVisionCostUsd } from "./ai-usage.service";
import { estimateCostUsd } from "./cost-estimator";

vi.mock("@/lib/platform/subscription/subscription.service", () => ({
  getLimitsForTenant: vi.fn().mockResolvedValue({ monthly_ai_budget_usd: 10 }),
}));
vi.mock("./ai-usage.repository", () => ({
  getOrCreateBillingState: vi.fn().mockResolvedValue({ spent_usd: 3, budget_usd: 10, period_start: "2026-03-01", period_end: "2026-03-31" }),
}));
vi.mock("@/lib/sre/alert.service", () => ({
  createAlert: vi.fn().mockResolvedValue(undefined),
}));

describe("ai-usage.service", () => {
  it("returns null when under budget", async () => {
    const msg = await checkQuota({} as any, "t1", 5);
    expect(msg).toBeNull();
  });
  it("returns message when over budget", async () => {
    const msg = await checkQuota({} as any, "t1", 10);
    expect(msg).toContain("budget");
  });
  it("checkBudgetAlert does not throw when under soft threshold", async () => {
    await expect(checkBudgetAlert({} as any, "t1", 1)).resolves.toBeUndefined();
  });
});
describe("estimateMaxVisionCostUsd", () => {
  it("returns openai default cost when no providers given", () => {
    const cost = estimateMaxVisionCostUsd([]);
    expect(cost).toBe(estimateVisionCostUsd("gpt-4o"));
  });
  it("returns cost for single configured provider", () => {
    const cost = estimateMaxVisionCostUsd(["openai"]);
    expect(cost).toBe(estimateVisionCostUsd("gpt-4o"));
  });
  it("returns max cost across multiple configured providers", () => {
    const single = estimateMaxVisionCostUsd(["openai"]);
    const multi = estimateMaxVisionCostUsd(["openai", "anthropic", "gemini"]);
    expect(multi).toBeGreaterThanOrEqual(single);
  });
});

describe("cost-estimator", () => {
  it("estimates cost for gpt-4o", () => {
    expect(estimateCostUsd("gpt-4o", 1000, 500)).toBeGreaterThan(0);
  });
});
