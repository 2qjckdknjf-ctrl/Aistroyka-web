import { describe, expect, it } from "vitest";
import {
  buildPasswordRecoveryRedirectUrl,
  isAuthLocale,
  toSafeRelativePath,
  validateNewPassword,
} from "./password-recovery";

describe("password-recovery helpers", () => {
  it("builds callback URL with recovery flag", () => {
    const url = buildPasswordRecoveryRedirectUrl("https://aistroyka.ai", "en");
    expect(url).toBe("https://aistroyka.ai/api/auth/callback?callback=%2Fen%2Freset-password&recovery=1");
  });

  it("rejects unsafe callback paths", () => {
    expect(toSafeRelativePath("//evil", "/en/reset-password")).toBe("/en/reset-password");
    expect(toSafeRelativePath("https://evil", "/en/reset-password")).toBe("/en/reset-password");
  });

  it("validates password length and confirmation", () => {
    expect(validateNewPassword("short", "short")).toBe("too_short");
    expect(validateNewPassword("longenough", "different")).toBe("mismatch");
    expect(validateNewPassword("longenough", "longenough")).toBeNull();
  });

  it("recognizes supported locales", () => {
    expect(isAuthLocale("en")).toBe(true);
    expect(isAuthLocale("de")).toBe(false);
  });
});
