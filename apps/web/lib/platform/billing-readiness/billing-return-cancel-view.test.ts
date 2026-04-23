import { describe, expect, it } from "vitest";
import { getReturnPageCopy, getCancelPageCopy } from "./billing-return-cancel-view";

describe("billing-return-cancel-view (Step 16 boundary)", () => {
  describe("getReturnPageCopy (success return path)", () => {
    it("returns awaiting confirmation state — no paid activation implied", () => {
      const copy = getReturnPageCopy();
      expect(copy.awaitingConfirmation).toBe(true);
      expect(copy.title).toBe("Checkout initiated");
      expect(copy.message).toMatch(/awaiting|confirmed shortly|no immediate entitlement/i);
      expect(copy.backHref).toBe("/billing");
    });

    it("does not imply subscription activation — copy is honest", () => {
      const copy = getReturnPageCopy();
      expect(copy.message).not.toMatch(/activated|paid|active subscription/i);
      expect(copy.message).toMatch(/confirmed shortly|provider confirms/i);
    });
  });

  describe("getCancelPageCopy (cancel return path)", () => {
    it("returns cancelled state — no activation", () => {
      const copy = getCancelPageCopy();
      expect(copy.cancelled).toBe(true);
      expect(copy.title).toBe("Checkout cancelled");
      expect(copy.message).toMatch(/no payment|unchanged/i);
      expect(copy.backHref).toBe("/billing");
    });

    it("does not imply any subscription change", () => {
      const copy = getCancelPageCopy();
      expect(copy.message).not.toMatch(/activated|paid|subscription/i);
    });
  });
});
