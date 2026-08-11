import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { submitExpertReview, skipExpertReviewQueueItem } from "./expert-review-queue.submission";

const pendingItem = {
  id: "q1",
  tenant_id: "t1",
  source_table: "manual_seed",
  source_id: "s1",
  task_type: "copilot_chat",
  audience: "manager",
  input_json: { prompt: "test" },
  model_output_json: { answer: "bad" },
  priority: "normal",
  status: "pending",
  assigned_expert_user_id: null,
  provenance: "manual",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function mockSupabase(overrides: {
  queueItem?: typeof pendingItem | null;
  reviewInsert?: { id: string } | null;
  reviewError?: string;
} = {}) {
  const item = overrides.queueItem === undefined ? pendingItem : overrides.queueItem;
  return {
    from: vi.fn((table: string) => {
      if (table === "ai_expert_review_queue") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: item, error: null }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        };
      }
      if (table === "ai_expert_reviews") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: overrides.reviewInsert ?? { id: "review-1" },
                error: overrides.reviewError ? { message: overrides.reviewError } : null,
              }),
            }),
          }),
        };
      }
      return {};
    }),
  } as unknown as import("@supabase/supabase-js").SupabaseClient;
}

describe("submitExpertReview", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.AI_EXPERT_REVIEW_GOLD_MEMORY_BRIDGE_ENABLED;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("creates review for valid submission", async () => {
    const sb = mockSupabase();
    const result = await submitExpertReview(sb, {
      queueId: "q1",
      tenantId: "t1",
      expertUserId: "u1",
      verdict: "model_wrong",
      expertConclusion: "Corrected summary",
      correctedOutputJson: { answer: "Better answer" },
    });
    expect(result.ok).toBe(true);
    expect(result.reviewId).toBe("review-1");
    expect(result.goldMemoryBridgeDryRun).toBeFalsy();
  });

  it("rejects invalid verdict", async () => {
    const sb = mockSupabase();
    const result = await submitExpertReview(sb, {
      queueId: "q1",
      tenantId: "t1",
      expertUserId: "u1",
      verdict: "invalid" as "model_wrong",
      expertConclusion: "x",
    });
    expect(result.ok).toBe(false);
  });

  it("prevents duplicate completion", async () => {
    const sb = mockSupabase({ queueItem: { ...pendingItem, status: "completed" } });
    const result = await submitExpertReview(sb, {
      queueId: "q1",
      tenantId: "t1",
      expertUserId: "u1",
      verdict: "model_wrong",
      expertConclusion: "x",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("already_completed");
  });

  it("bridge disabled by default", async () => {
    const sb = mockSupabase();
    const result = await submitExpertReview(sb, {
      queueId: "q1",
      tenantId: "t1",
      expertUserId: "u1",
      verdict: "model_partially_correct",
      expertConclusion: "Adjusted",
    });
    expect(result.goldMemoryBridgeDryRun).toBeFalsy();
  });
});

describe("skipExpertReviewQueueItem", () => {
  it("skips pending item", async () => {
    const sb = mockSupabase();
    const result = await skipExpertReviewQueueItem(sb, "t1", "q1", "u1");
    expect(result.ok).toBe(true);
  });
});
