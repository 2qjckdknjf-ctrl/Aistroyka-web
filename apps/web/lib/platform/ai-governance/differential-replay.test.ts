import { describe, expect, it } from "vitest";
import { replayProjectStateDifferential, type ProjectStateSnapshot } from "./differential-replay";

function fixture(overrides?: Partial<ProjectStateSnapshot>): ProjectStateSnapshot {
  return {
    permissions: {
      role: "stakeholder",
      canReadProject: true,
      canWriteProject: false,
      canReadFinance: false,
    },
    budget: {
      customerVisible: { estimate_total: 12000, currency: "EUR" },
      internal: { margin: 0.18, planned_amount: 9000, actual_amount: 9400 },
    },
    reports: [{ id: "r1", title: "Week 12 progress", status: "published" }],
    project: { id: "proj-1", status: "active", tenantId: "tenant-a" },
    ...overrides,
  };
}

describe("replayProjectStateDifferential (2026-11-28 P0)", () => {
  it("accepts identical customer surfaces with finance exfiltrate denied", () => {
    const baseline = fixture();
    const candidate = fixture();
    const result = replayProjectStateDifferential({
      baseline,
      candidate,
      principal: { principalId: "user-1", tenantId: "tenant-a", authorized: true },
      sha: "80ffa442",
      runs: 3,
    });
    expect(result.equal_customer_surface).toBe(true);
    expect(result.finance_guard_ok).toBe(true);
    expect(result.boundary.finance_exfiltrate.decision).toBe("deny");
    expect(result.boundary.shell_finance_read.decision).toBe("deny");
    expect(result.boundary.customer_read.decision).toBe("allow");
    expect(result.evidence.accepted).toBe(true);
    expect(result.evidence.overall).toBe("PASS");
  });

  it("fails when candidate permissions drift", () => {
    const result = replayProjectStateDifferential({
      baseline: fixture(),
      candidate: fixture({
        permissions: {
          role: "stakeholder",
          canReadProject: true,
          canWriteProject: true,
          canReadFinance: false,
        },
      }),
      principal: { principalId: "user-1", tenantId: "tenant-a" },
      sha: "80ffa442",
      runs: 3,
    });
    expect(result.equal_customer_surface).toBe(false);
    expect(result.diffs).toContain("permissions");
    expect(result.evidence.overall).toBe("FAIL");
  });

  it("fails security when customerVisible carries internal margin", () => {
    const poisoned = fixture({
      budget: {
        customerVisible: { estimate_total: 12000, margin: 0.2 },
        internal: { margin: 0.2 },
      },
    });
    const result = replayProjectStateDifferential({
      baseline: fixture(),
      candidate: poisoned,
      principal: { principalId: "user-1", tenantId: "tenant-a" },
      sha: "80ffa442",
      runs: 3,
    });
    expect(result.finance_guard_ok).toBe(false);
    expect(result.evidence.overall).toBe("FAIL");
    expect(result.evidence.rule_hits).toContain("security_fail_rejects");
  });

  it("denies unauthorized customer_read and rejects evidence", () => {
    const snap = fixture();
    const result = replayProjectStateDifferential({
      baseline: snap,
      candidate: snap,
      principal: { principalId: "user-1", tenantId: "tenant-a", authorized: false },
      sha: "80ffa442",
      runs: 3,
    });
    expect(result.boundary.customer_read.decision).toBe("deny");
    expect(result.evidence.accepted).toBe(false);
  });

  it("requires three runs for critical evidence", () => {
    const snap = fixture();
    const result = replayProjectStateDifferential({
      baseline: snap,
      candidate: snap,
      principal: { principalId: "user-1", tenantId: "tenant-a" },
      sha: "80ffa442",
      runs: 1,
    });
    expect(result.evidence.accepted).toBe(false);
    expect(result.evidence.rule_hits).toContain("critical_runs_below_three");
  });

  it("rejects missing SHA", () => {
    const snap = fixture();
    const result = replayProjectStateDifferential({
      baseline: snap,
      candidate: snap,
      principal: { principalId: "user-1", tenantId: "tenant-a" },
      sha: "",
      runs: 3,
    });
    expect(result.evidence.rule_hits).toContain("sha_missing");
  });
});
