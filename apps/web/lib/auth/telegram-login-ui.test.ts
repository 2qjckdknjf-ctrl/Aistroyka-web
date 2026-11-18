import { describe, expect, it } from "vitest";
import { isTelegramLoginUiEnabled } from "./telegram-login-ui";

describe("isTelegramLoginUiEnabled", () => {
  it("hides Telegram login when the public username is missing", () => {
    expect(isTelegramLoginUiEnabled(undefined)).toBe(false);
    expect(isTelegramLoginUiEnabled(null)).toBe(false);
    expect(isTelegramLoginUiEnabled("")).toBe(false);
    expect(isTelegramLoginUiEnabled("   ")).toBe(false);
    expect(isTelegramLoginUiEnabled("@")).toBe(false);
  });

  it("shows Telegram login when a public bot username is set", () => {
    expect(isTelegramLoginUiEnabled("@AistroykaBot")).toBe(true);
    expect(isTelegramLoginUiEnabled("AistroykaBot")).toBe(true);
  });
});
