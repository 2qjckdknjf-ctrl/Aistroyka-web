import { describe, expect, it } from "vitest";
import { isProhibitedAiAction, assertAiActionNotProhibited, PROHIBITED_AI_ACTIONS } from "./prohibited-actions";
import { getPilotActionDefinition, listPilotActions, isPilotActionId } from "./action-registry";

describe("prohibited-actions", () => {
  it("blocks all prohibited action ids", () => {
    for (const id of PROHIBITED_AI_ACTIONS) {
      expect(isProhibitedAiAction(id)).toBe(true);
      expect(assertAiActionNotProhibited(id).ok).toBe(false);
    }
  });

  it("allows pilot action ids", () => {
    expect(isProhibitedAiAction("draft_daily_summary")).toBe(false);
    expect(assertAiActionNotProhibited("draft_daily_summary").ok).toBe(true);
  });
});

describe("action-registry", () => {
  it("registers all nine pilot actions", () => {
    expect(listPilotActions()).toHaveLength(9);
  });

  it("marks draft_owner_message as consequential", () => {
    const def = getPilotActionDefinition("draft_owner_message");
    expect(def?.riskClass).toBe("CONSEQUENTIAL_REQUIRES_APPROVAL");
    expect(def?.requiresHumanApproval).toBe(true);
  });

  it("recognizes pilot action ids", () => {
    expect(isPilotActionId("validate_before_after_photos")).toBe(true);
    expect(isPilotActionId("approve_report")).toBe(false);
  });
});
