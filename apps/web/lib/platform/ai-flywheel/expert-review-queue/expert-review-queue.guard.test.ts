import { describe, expect, it } from "vitest";
import { guardQueueCandidate } from "./expert-review-queue.guard";
import type { ExpertReviewQueueCandidate } from "./expert-review-queue.types";

function base(overrides: Partial<ExpertReviewQueueCandidate> = {}): ExpertReviewQueueCandidate {
  return {
    tenantId: "t1",
    sourceTable: "manual_seed",
    sourceId: "s1",
    taskType: "copilot_chat",
    audience: "manager",
    inputJson: { prompt: "Schedule" },
    modelOutputJson: { answer: "Review milestones" },
    provenance: "manual",
    ...overrides,
  };
}

describe("guardQueueCandidate", () => {
  it("blocks owner audience with internal finance", () => {
    const r = guardQueueCandidate(
      base({
        audience: "owner",
        modelOutputJson: { text: "internal margin risk 12%" },
      })
    );
    expect("reject" in r && r.reject.kind).toBe("finance");
  });

  it("passes safe manager candidate", () => {
    const r = guardQueueCandidate(base());
    expect("payload" in r).toBe(true);
  });
});
