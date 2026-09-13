import { describe, expect, it } from "vitest";
import {
  financeDatasetGuard,
  ownerAudienceDatasetGuard,
  isLikelyOwnerSafeCommercial,
} from "./finance-dataset-guard";

describe("finance dataset guard", () => {
  it("owner-safe commercial examples pass", () => {
    const ex = {
      id: "ok1",
      audience: "owner" as const,
      text: "Estimate for approval: kitchen renovation approved amount €12,000",
    };
    expect(ownerAudienceDatasetGuard(ex).passed).toBe(true);
    expect(isLikelyOwnerSafeCommercial(ex.text)).toBe(true);
  });

  it("internal margin/profit/cost leakage fails for owner audience", () => {
    const ex = {
      id: "bad1",
      audience: "owner" as const,
      text: "Internal budget pressure: margin risk 15% on subcontractor cost €8000",
    };
    const result = ownerAudienceDatasetGuard(ex);
    expect(result.passed).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("internal audience examples are not blocked by owner guard", () => {
    const ex = {
      id: "int1",
      audience: "internal" as const,
      text: "margin risk and planned cost overrun",
    };
    expect(ownerAudienceDatasetGuard(ex).passed).toBe(true);
  });

  it("guard report counts blocked examples", () => {
    const report = financeDatasetGuard([
      {
        id: "ok",
        audience: "owner",
        text: "Change order payment schedule",
      },
      {
        id: "bad",
        audience: "customer",
        text: "Profit margin internal cost item list",
      },
    ]);
    expect(report.blockedCount).toBe(1);
    expect(report.blockedIds).toContain("bad");
    expect(report.passed).toBe(false);
  });
});
