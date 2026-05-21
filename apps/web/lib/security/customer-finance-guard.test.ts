import { describe, expect, it } from "vitest";
import { assertCustomerFinanceSafePayload } from "./customer-finance-guard";

describe("customer-finance-guard", () => {
  it("passes for customer-safe payloads", () => {
    const result = assertCustomerFinanceSafePayload({
      project: { id: "p1", name: "Tower" },
      progress: { tasks_done: 3, tasks_total: 7 },
      approved_commercial_changes: [{ title: "Additional work", amount: 1200 }],
    });

    expect(result.ok).toBe(true);
  });

  it("fails for forbidden internal finance keys", () => {
    const result = assertCustomerFinanceSafePayload({
      project: {
        id: "p1",
        budget_pressure: "high",
      },
    });

    expect(result.ok).toBe(false);
    expect(result.path).toBe("project.budget_pressure");
    expect(result.key).toBe("budget_pressure");
  });

  it("fails for nested internal_cost keys", () => {
    const result = assertCustomerFinanceSafePayload({
      data: [{ meta: { internal_cost_bucket: 4 } }],
    });

    expect(result.ok).toBe(false);
    expect(result.path).toBe("data.0.meta.internal_cost_bucket");
  });
});
