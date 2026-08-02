import { describe, expect, it, vi, beforeEach } from "vitest";
import { gateCopilotLlmRequest } from "./copilot-ai-gate";

const checkRateLimitStrict = vi.fn();
const checkQuota = vi.fn();
const runPolicy = vi.fn();

vi.mock("@/lib/platform/rate-limit/rate-limit.service", () => ({
  checkRateLimitStrict: (...args: unknown[]) => checkRateLimitStrict(...args),
  resolveTrustedClientIp: () => ({ trustedIp: null, source: "none", reason: "trust_flag_off" }),
}));

vi.mock("@/lib/platform/ai-usage/ai-usage.service", () => ({
  checkQuota: (...args: unknown[]) => checkQuota(...args),
  checkBudgetAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/platform/ai-governance/policy.service", () => ({
  runPolicy: (...args: unknown[]) => runPolicy(...args),
}));

describe("gateCopilotLlmRequest", () => {
  beforeEach(() => {
    checkRateLimitStrict.mockReset();
    checkQuota.mockReset();
    runPolicy.mockReset();
    checkRateLimitStrict.mockResolvedValue({ ok: true });
    checkQuota.mockResolvedValue(null);
    runPolicy.mockResolvedValue({ decision: "allow" });
  });

  it("fails closed when rate limit store unavailable (no further provider gates)", async () => {
    checkRateLimitStrict.mockResolvedValueOnce({
      ok: false,
      kind: "unavailable",
      message: "Rate limit service unavailable.",
    });
    const result = await gateCopilotLlmRequest({} as never, {
      tenantId: "t1",
      userId: "u1",
      subscriptionTier: "free",
      requestId: "r1",
      endpoint: "GET /api/v1/projects/:id/copilot",
      request: new Request("http://test/copilot"),
    });
    expect(result).toEqual({
      ok: false,
      httpStatus: 503,
      message: "Rate limit service unavailable.",
      code: "rate_limit_unavailable",
    });
    expect(checkQuota).not.toHaveBeenCalled();
    expect(runPolicy).not.toHaveBeenCalled();
  });

  it("does not trust x-forwarded-for when CF trust flag is off", async () => {
    await gateCopilotLlmRequest({} as never, {
      tenantId: "t1",
      userId: "u1",
      subscriptionTier: "free",
      requestId: "r1",
      endpoint: "GET /api/v1/projects/:id/copilot",
      request: new Request("http://test/copilot", {
        headers: { "x-forwarded-for": "203.0.113.9", "x-real-ip": "198.51.100.1" },
      }),
    });
    expect(checkRateLimitStrict).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ ip: null })
    );
  });
});
