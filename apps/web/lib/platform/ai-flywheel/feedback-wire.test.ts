import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { parseFeedbackPreferencePair, tryCaptureFeedbackPreferencePair } from "./feedback-wire";
import { captureAiPreferencePair } from "./feedback-capture";

vi.mock("./feedback-capture", () => ({
  captureAiPreferencePair: vi.fn().mockResolvedValue({ captured: true, id: "p1" }),
}));

describe("feedback wire", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.AI_FLYWHEEL_ENABLED;
    delete process.env.AI_FEEDBACK_CAPTURE_ENABLED;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("parseFeedbackPreferencePair returns null without required fields", () => {
    expect(parseFeedbackPreferencePair({})).toBeNull();
    expect(parseFeedbackPreferencePair({ taskType: "copilot" })).toBeNull();
  });

  it("parseFeedbackPreferencePair parses valid payload", () => {
    const p = parseFeedbackPreferencePair({
      taskType: "copilot",
      rejectedOutput: { text: "a" },
      chosenOutput: { text: "b" },
      audience: "manager",
    });
    expect(p?.taskType).toBe("copilot");
    expect(p?.audience).toBe("manager");
  });

  it("tryCaptureFeedbackPreferencePair no-ops without admin", async () => {
    await tryCaptureFeedbackPreferencePair(null, "t1", {
      taskType: "copilot",
      rejectedOutput: { a: 1 },
      chosenOutput: { a: 2 },
    });
    expect(captureAiPreferencePair).not.toHaveBeenCalled();
  });

  it("tryCaptureFeedbackPreferencePair calls capture when admin present", async () => {
    process.env.AI_FLYWHEEL_ENABLED = "true";
    process.env.AI_FEEDBACK_CAPTURE_ENABLED = "true";
    const admin = {} as never;
    await tryCaptureFeedbackPreferencePair(admin, "t1", {
      taskType: "intelligence",
      rejectedOutput: { x: 1 },
      chosenOutput: { x: 2 },
      inputContext: { q: "risk" },
    });
    expect(captureAiPreferencePair).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({
        tenantId: "t1",
        source: "manager_edit",
        taskType: "intelligence",
      })
    );
  });

  it("tryCaptureFeedbackPreferencePair never throws on capture failure", async () => {
    vi.mocked(captureAiPreferencePair).mockRejectedValueOnce(new Error("db down"));
    process.env.AI_FLYWHEEL_ENABLED = "true";
    process.env.AI_FEEDBACK_CAPTURE_ENABLED = "true";
    await expect(
      tryCaptureFeedbackPreferencePair({} as never, "t1", {
        taskType: "copilot",
        rejectedOutput: { a: 1 },
        chosenOutput: { a: 2 },
      })
    ).resolves.toBeUndefined();
  });
});
