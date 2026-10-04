import { describe, expect, it } from "vitest";
import { buildPreferencePairFields, textOutput } from "./buildPreferencePairFields";

describe("buildPreferencePairFields", () => {
  it("returns null when taskType missing", () => {
    expect(
      buildPreferencePairFields({
        taskType: "",
        originalOutput: textOutput("a"),
        chosenOutput: textOutput("b"),
      })
    ).toBeNull();
  });

  it("returns null when outputs are not objects", () => {
    expect(
      buildPreferencePairFields({
        taskType: "copilot",
        originalOutput: "plain",
        chosenOutput: textOutput("b"),
      })
    ).toBeNull();
  });

  it("builds fields when data is complete", () => {
    const fields = buildPreferencePairFields({
      aiRequestId: "req-1",
      taskType: "copilot",
      audience: "internal",
      inputContext: { question: "risk?" },
      originalOutput: textOutput("old"),
      chosenOutput: textOutput("new"),
    });
    expect(fields).toEqual({
      aiRequestId: "req-1",
      taskType: "copilot",
      audience: "internal",
      inputContext: { question: "risk?" },
      rejectedOutput: { text: "old" },
      chosenOutput: { text: "new" },
    });
  });
});
