import { describe, expect, it } from "vitest";
import { assertCustomerFinanceSafePayload } from "./customer-finance-guard";
import { jsonWithCustomerFinanceGuard } from "./customer-finance-response";

describe("customer-finance-guard", () => {
  it("passes for customer-safe payloads", () => {
    const result = assertCustomerFinanceSafePayload({
      project: { id: "p1", name: "Tower" },
      progress: { tasks_done: 3, tasks_total: 7 },
      approved_commercial_changes: [{ title: "Additional work", amount: 1200 }],
      total_amount: 5000,
      customer_amount_delta: 200,
      customer_visible_amount: 300,
      currency: "EUR",
      schedule_delta_days: 2,
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

  it("fails for budget_delta_amount and budget_impact_level (case-insensitive)", () => {
    expect(
      assertCustomerFinanceSafePayload({ data: { Budget_Delta_Amount: 10 } }).ok
    ).toBe(false);
    expect(
      assertCustomerFinanceSafePayload({ data: { BUDGET_IMPACT_LEVEL: "high" } }).ok
    ).toBe(false);
  });

  it("jsonWithCustomerFinanceGuard returns 500 without leaking forbidden path", async () => {
    const res = jsonWithCustomerFinanceGuard("/api/test", {
      data: { margin: 1 },
    });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string; path?: string; key?: string };
    expect(body.error).toBe("Payload failed finance safety guard");
    expect(body.path).toBeUndefined();
    expect(body.key).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("margin");
  });
});
