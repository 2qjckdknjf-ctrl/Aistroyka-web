import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn(),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {
    constructor(message = "Tenant required") {
      super(message);
    }
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue({ admin: true }),
}));

vi.mock("@/lib/ai-brain/phase-d/feedback/feedback.service", () => ({
  submitFeedback: vi.fn(),
  parsePreferencePairFromBody: vi.fn(),
  validateFeedbackCategory: vi.fn((v) => v === "usefulness" || v === "factuality"),
  validateSourceKind: vi.fn((v) => v === "human" || v === "system" || v === "test"),
  validateScore: vi.fn((v) => (typeof v === "number" ? v : null)),
  validateLinkedRefs: vi.fn(() => []),
}));

import { getTenantContextFromRequest } from "@/lib/tenant";
import {
  submitFeedback,
  parsePreferencePairFromBody,
} from "@/lib/ai-brain/phase-d/feedback/feedback.service";

function postBody(body: Record<string, unknown>) {
  return new Request("http://localhost/api/v1/ai/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/ai/feedback compatibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTenantContextFromRequest).mockResolvedValue({
      tenantId: "t1",
      userId: "u1",
    } as never);
    vi.mocked(parsePreferencePairFromBody).mockReturnValue(null);
    vi.mocked(submitFeedback).mockResolvedValue({ success: true, feedbackId: "fb-old" });
  });

  it("accepts legacy payload without preference fields", async () => {
    const res = await POST(
      postBody({
        runId: "run-1",
        sourceKind: "human",
        feedbackCategory: "usefulness",
        usefulnessScore: 4,
      })
    );
    expect(res.status).toBe(200);
    expect(submitFeedback).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        runId: "run-1",
        preferencePair: null,
      }),
      expect.objectContaining({ adminClient: expect.anything() })
    );
  });

  it("accepts payload with preference fields", async () => {
    const pair = {
      taskType: "copilot",
      rejectedOutput: { text: "a" },
      chosenOutput: { text: "b" },
    };
    vi.mocked(parsePreferencePairFromBody).mockReturnValue(pair);

    const res = await POST(
      postBody({
        runId: "run-2",
        sourceKind: "human",
        feedbackCategory: "usefulness",
        taskType: "copilot",
        rejectedOutput: { text: "a" },
        chosenOutput: { text: "b" },
      })
    );
    expect(res.status).toBe(200);
    expect(submitFeedback).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ preferencePair: pair }),
      expect.anything()
    );
  });

  it("passes null preference pair when optional fields malformed", async () => {
    vi.mocked(parsePreferencePairFromBody).mockReturnValue(null);

    const res = await POST(
      postBody({
        runId: "run-3",
        sourceKind: "human",
        feedbackCategory: "usefulness",
        taskType: "copilot",
        rejectedOutput: "not-an-object",
      })
    );
    expect(res.status).toBe(200);
    expect(submitFeedback).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ preferencePair: null }),
      expect.anything()
    );
  });

  it("returns 400 when primary feedback fails", async () => {
    vi.mocked(submitFeedback).mockResolvedValue({
      success: false,
      error: "Run record not found; feedback requires a recorded run",
    });

    const res = await POST(
      postBody({
        runId: "missing",
        sourceKind: "human",
        feedbackCategory: "usefulness",
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Run record not found");
  });
});
