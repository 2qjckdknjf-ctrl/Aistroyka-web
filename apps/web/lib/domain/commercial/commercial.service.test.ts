import { describe, it, expect } from "vitest";
import { canTransitionCommercialStatus } from "./commercial.service";
import { isEffectivelyOverdue } from "./commercial.overdue";

describe("commercial.service", () => {
  it("canTransitionCommercialStatus allows draft→issued and paid terminal", () => {
    expect(canTransitionCommercialStatus("draft", "issued")).toBe(true);
    expect(canTransitionCommercialStatus("draft", "paid")).toBe(false);
    expect(canTransitionCommercialStatus("overdue", "paid")).toBe(true);
    expect(canTransitionCommercialStatus("paid", "draft")).toBe(false);
  });
});

describe("commercial.overdue", () => {
  it("isEffectivelyOverdue when due_date before today on issued", () => {
    expect(
      isEffectivelyOverdue({
        status: "issued",
        due_date: "2000-01-01",
      })
    ).toBe(true);
    expect(
      isEffectivelyOverdue({
        status: "issued",
        due_date: "2099-01-01",
      })
    ).toBe(false);
  });
});
