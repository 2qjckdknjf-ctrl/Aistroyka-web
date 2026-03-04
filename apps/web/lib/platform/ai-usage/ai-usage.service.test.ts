import { describe, expect, it, vi } from "vitest";
import { checkQuota } from "./ai-usage.service";
import { estimateCostUsd } from "./cost-estimator";

vi.mock("@/lib/platform/subscription/subscription.service", () => ({
  getLimitsForTenant: vi.fn().mockResolvedValue({ monthly_ai_budget_usd: 10 }),
}));
vi.mock("./ai-usage.repository", () => ({
  getOrCreateBillingState: vi.fn().mockResolvedValue({ spent_usd: 3, budget_usd: 10 }),
}));

describe("ai-usage.service", () => {
  it("returns null when under budget", async () => {
    const msg = await checkQuota({} as any, "t1", 5);
    expect(msg).toBeNull();
  });
  it("returns message when over budget", async () => {
    const msg = await checkQuota({} as any, "t1", 10);
    expect(msg).toContain("quota");
  });
});
describe("cost-estimator", () => {
  it("estimates cost for gpt-4o", () => {
    expect(estimateCostUsd("gpt-4o", 1000, 500)).toBeGreaterThan(0);
  });
});
