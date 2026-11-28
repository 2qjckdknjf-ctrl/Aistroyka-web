import { describe, expect, it } from "vitest";
import {
  assertCustomerFinanceSafePayload,
  assertCustomerProjectionAllowed,
} from "./customer-finance-guard";

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

  it("assertCustomerProjectionAllowed allows safe authorized read", () => {
    const result = assertCustomerProjectionAllowed(
      { project: { id: "p1", name: "Tower" } },
      { principalId: "u1", tenantId: "t1", authorized: true }
    );
    expect(result.ok).toBe(true);
    expect(result.boundary?.decision).toBe("allow");
  });

  it("assertCustomerProjectionAllowed denies unauthorized principal", () => {
    const result = assertCustomerProjectionAllowed(
      { project: { id: "p1" } },
      { principalId: "u1", tenantId: "t1", authorized: false }
    );
    expect(result.ok).toBe(false);
    expect(result.boundary?.decision).toBe("deny");
  });

  it("assertCustomerProjectionAllowed attaches finance exfiltrate deny on leak", () => {
    const result = assertCustomerProjectionAllowed(
      { project: { margin: 12 } },
      { principalId: "u1", tenantId: "t1", authorized: true }
    );
    expect(result.ok).toBe(false);
    expect(result.boundary?.decision).toBe("deny");
    expect(result.boundary?.rule_hits).toContain("protected_resource_denied");
  });
});
