import { describe, expect, it } from "vitest";
import {
  isQuantityCommerciallyBindable,
  parseQuantityAcceptanceDecision,
} from "./quantity-acceptance";

describe("Stage2a A04 quantity acceptance", () => {
  it("parses decisions and gates commercial bindability", () => {
    expect(parseQuantityAcceptanceDecision("accepted")).toBe("accepted");
    expect(parseQuantityAcceptanceDecision("REJECTED")).toBe("rejected");
    expect(parseQuantityAcceptanceDecision("insufficient_basis")).toBe("insufficient_basis");
    expect(parseQuantityAcceptanceDecision("pending")).toBeNull();
    expect(isQuantityCommerciallyBindable("accepted")).toBe(true);
    expect(isQuantityCommerciallyBindable("rejected")).toBe(false);
    expect(isQuantityCommerciallyBindable("insufficient_basis")).toBe(false);
  });
});
