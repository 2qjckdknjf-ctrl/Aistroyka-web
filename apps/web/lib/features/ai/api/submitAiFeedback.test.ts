import { describe, expect, it, vi, beforeEach } from "vitest";
import { submitAiFeedback } from "./submitAiFeedback";

describe("submitAiFeedback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("submits legacy payload without preference fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { feedbackId: "fb-1" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await submitAiFeedback({
      runId: "run-1",
      sourceKind: "human",
      feedbackCategory: "usefulness",
      usefulnessScore: 4,
    });

    expect(result.ok).toBe(true);
    expect(result.feedbackId).toBe("fb-1");
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.runId).toBe("run-1");
    expect(body.taskType).toBeUndefined();
  });

  it("includes optional preference fields when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { feedbackId: "fb-2" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await submitAiFeedback({
      runId: "run-2",
      sourceKind: "human",
      feedbackCategory: "usefulness",
      taskType: "copilot",
      rejectedOutput: { text: "a" },
      chosenOutput: { text: "b" },
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.taskType).toBe("copilot");
    expect(body.rejectedOutput).toEqual({ text: "a" });
    expect(body.chosenOutput).toEqual({ text: "b" });
  });

  it("returns error on HTTP failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "Run record not found" }),
      })
    );

    const result = await submitAiFeedback({
      runId: "missing",
      sourceKind: "human",
      feedbackCategory: "usefulness",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Run record not found");
  });
});
