import { describe, expect, it } from "vitest";
import { hasSupportingEvidence, toAgentEvidence } from "./evidence.types";

describe("evidence contract", () => {
  it("requires a source entity id for supporting evidence", () => {
    expect(hasSupportingEvidence([])).toBe(false);
    expect(
      hasSupportingEvidence([
        toAgentEvidence({
          type: "USER_INPUT",
          sourceEntityType: "user",
          sourceEntityId: "u1",
        }),
      ])
    ).toBe(false);
    expect(
      hasSupportingEvidence([
        toAgentEvidence({
          type: "TASK",
          sourceEntityType: "worker_tasks",
          sourceEntityId: "task-1",
        }),
      ])
    ).toBe(true);
  });
});
