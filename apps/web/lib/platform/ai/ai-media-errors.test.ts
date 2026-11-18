import { describe, expect, it } from "vitest";
import {
  AI_ERROR_CODES,
  isRetryableAIErrorCode,
  sanitizeAIErrorForTenant,
  userMessageKeyForAIErrorCode,
} from "./ai-media-errors";

describe("ai-media-errors", () => {
  it("marks temporary codes retryable and permanent codes not", () => {
    expect(isRetryableAIErrorCode(AI_ERROR_CODES.AI_MEDIA_NOT_READY)).toBe(true);
    expect(isRetryableAIErrorCode(AI_ERROR_CODES.AI_PROVIDERS_EXHAUSTED)).toBe(true);
    expect(isRetryableAIErrorCode(AI_ERROR_CODES.AI_PROVIDER_NOT_CONFIGURED)).toBe(false);
    expect(isRetryableAIErrorCode(AI_ERROR_CODES.AI_MEDIA_NOT_FOUND)).toBe(false);
  });

  it("maps provider not configured to user key", () => {
    expect(userMessageKeyForAIErrorCode(AI_ERROR_CODES.AI_PROVIDER_NOT_CONFIGURED)).toBe(
      "aiStatusNotConfigured"
    );
    expect(userMessageKeyForAIErrorCode(AI_ERROR_CODES.AI_MEDIA_NOT_READY)).toBe(
      "aiStatusTemporary"
    );
  });

  it("redacts secrets and storage URLs from tenant-facing errors", () => {
    const raw =
      "Bearer sk-abcdefghijklmnopqrstuvwxyz123456 failed at https://abc.supabase.co/storage/v1/object/sign/media/t/x\n    at Handler (node_modules/x.js:1:1)";
    const cleaned = sanitizeAIErrorForTenant(raw) ?? "";
    expect(cleaned).not.toContain("sk-");
    expect(cleaned).not.toContain("Bearer sk");
    expect(cleaned).not.toContain("storage/v1");
    expect(cleaned).not.toContain("node_modules");
  });
});
