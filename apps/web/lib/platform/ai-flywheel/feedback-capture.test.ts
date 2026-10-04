import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { captureAiPreferencePair, computeEditDistance } from "./feedback-capture";

describe("feedback capture", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.AI_FLYWHEEL_ENABLED;
    delete process.env.AI_FEEDBACK_CAPTURE_ENABLED;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("computeEditDistance for trivial edits", () => {
    expect(computeEditDistance("abc", "abc")).toBe(0);
    expect(computeEditDistance("abc", "abd")).toBe(1);
    expect(computeEditDistance("hello", "hello!")).toBe(1);
  });

  it("flag false = no pair created", async () => {
    const supabase = { from: vi.fn() };
    const result = await captureAiPreferencePair(supabase as never, {
      tenantId: "t1",
      taskType: "copilot",
      inputJson: { q: "a" },
      rejectedJson: { a: 1 },
      chosenJson: { a: 2 },
    });
    expect(result.captured).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("flag true = pair created with low_value when edit_distance < 8", async () => {
    process.env.AI_FLYWHEEL_ENABLED = "true";
    process.env.AI_FEEDBACK_CAPTURE_ENABLED = "true";

    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "pair-1" }, error: null }),
      }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ insert }) };

    const result = await captureAiPreferencePair(supabase as never, {
      tenantId: "t1",
      taskType: "copilot",
      inputJson: { q: "x" },
      rejectedJson: { text: "same" },
      chosenJson: { text: "same!" },
    });

    expect(result.captured).toBe(true);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: "t1",
        low_value: true,
        edit_distance: expect.any(Number),
      })
    );
    const row = insert.mock.calls[0][0];
    expect(row.edit_distance).toBeLessThan(8);
  });
});
