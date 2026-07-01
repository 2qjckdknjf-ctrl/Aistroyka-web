import { describe, expect, it } from "vitest";
import { rateLimitKey } from "./rate-limit.store";
import { HIGH_RISK_ENDPOINTS } from "./rate-limit.service";

describe("rate-limit", () => {
  describe("rateLimitKey", () => {
    it("builds tenant key with safe endpoint", () => {
      expect(rateLimitKey("tenant", "t1", "/api/v1/ai/analyze-image")).toBe("tenant:t1:_api_v1_ai_analyze-image");
    });
    it("builds ip key", () => {
      expect(rateLimitKey("ip", "1.2.3.4", "/api/auth/login")).toBe("ip:1.2.3.4:_api_auth_login");
    });
  });
  describe("HIGH_RISK_ENDPOINTS", () => {
    it("includes analyze-image, report submit, login", () => {
      expect(HIGH_RISK_ENDPOINTS).toContain("/api/v1/ai/analyze-image");
      expect(HIGH_RISK_ENDPOINTS).toContain("/api/auth/login");
    });
  });
});
