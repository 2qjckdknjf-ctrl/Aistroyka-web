import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { buildExpertReviewQueueFromCandidates } from "./expert-review-queue.candidate-builder";
import type { ExpertReviewQueueCandidate } from "./expert-review-queue.types";

describe("buildExpertReviewQueueFromCandidates", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.AI_FLYWHEEL_ENABLED;
    delete process.env.AI_EXPERT_REVIEW_QUEUE_ENABLED;
    delete process.env.AI_EXPERT_REVIEW_WRITE_ENABLED;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const candidate: ExpertReviewQueueCandidate = {
    tenantId: "t1",
    sourceTable: "manual_seed",
    sourceId: "00000000-0000-4000-8000-000000000201",
    taskType: "copilot_chat",
    audience: "manager",
    inputJson: { prompt: "Daily control" },
    modelOutputJson: { answer: "Check defects" },
    provenance: "manual",
  };

  it("dry-run writes nothing", async () => {
    const { stats } = await buildExpertReviewQueueFromCandidates(null, [candidate], { dryRun: true });
    expect(stats.eligible).toBe(1);
    expect(stats.written).toBe(0);
  });

  it("write flag false writes nothing", async () => {
    const { stats } = await buildExpertReviewQueueFromCandidates(null, [candidate], { dryRun: false });
    expect(stats.written).toBe(0);
  });

  it("duplicate source skipped in batch", async () => {
    const { stats } = await buildExpertReviewQueueFromCandidates(null, [candidate, candidate], {
      dryRun: true,
    });
    expect(stats.duplicateSkipped).toBe(1);
    expect(stats.eligible).toBe(1);
  });

  it("finance-sensitive owner candidate rejected", async () => {
    const { stats } = await buildExpertReviewQueueFromCandidates(
      null,
      [
        {
          ...candidate,
          sourceId: "00000000-0000-4000-8000-000000000202",
          audience: "owner",
          modelOutputJson: { text: "subcontractor cost overrun" },
        },
      ],
      { dryRun: true }
    );
    expect(stats.financeRejected).toBe(1);
  });
});
