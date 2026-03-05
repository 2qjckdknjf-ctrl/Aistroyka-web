import { describe, expect, it } from "vitest";
import {
  ProviderUnavailableError,
  ProviderRequestError,
  isRetryableProviderError,
} from "./provider.errors";

describe("provider.errors", () => {
  describe("ProviderUnavailableError", () => {
    it("has name and optional code", () => {
      const e = new ProviderUnavailableError("No key", "missing_key");
      expect(e.name).toBe("ProviderUnavailableError");
      expect(e.message).toBe("No key");
      expect(e.code).toBe("missing_key");
    });
  });

  describe("ProviderRequestError", () => {
    it("has name, code, and optional statusCode", () => {
      const e = new ProviderRequestError("Rate limited", "rate_limit", 429);
      expect(e.name).toBe("ProviderRequestError");
      expect(e.code).toBe("rate_limit");
      expect(e.statusCode).toBe(429);
    });
  });

  describe("isRetryableProviderError", () => {
    it("returns false for ProviderUnavailableError", () => {
      expect(isRetryableProviderError(new ProviderUnavailableError())).toBe(false);
    });

    it("returns false for invalid_input", () => {
      expect(isRetryableProviderError(new ProviderRequestError("Bad", "invalid_input"))).toBe(false);
    });

    it("returns false for auth", () => {
      expect(isRetryableProviderError(new ProviderRequestError("Unauthorized", "auth", 401))).toBe(false);
    });

    it("returns true for timeout", () => {
      expect(isRetryableProviderError(new ProviderRequestError("Timeout", "timeout"))).toBe(true);
    });

    it("returns true for rate_limit", () => {
      expect(isRetryableProviderError(new ProviderRequestError("Rate limited", "rate_limit"))).toBe(true);
    });

    it("returns true for server_error", () => {
      expect(isRetryableProviderError(new ProviderRequestError("500", "server_error"))).toBe(true);
    });

    it("returns true for unknown Error", () => {
      expect(isRetryableProviderError(new Error("Network failed"))).toBe(true);
    });
  });
});
