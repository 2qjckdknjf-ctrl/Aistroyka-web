import { describe, expect, it } from "vitest";
import { summarizeAuthMethods, type IdentityRow } from "./multi-provider";

function identity(provider: IdentityRow["provider"]): IdentityRow {
  return {
    id: `${provider}-1`,
    user_id: "user-1",
    provider,
    provider_user_id: `${provider}-sub`,
    email: null,
    username: null,
    full_name: null,
    avatar_url: null,
    metadata: {},
    created_at: "",
    updated_at: "",
  };
}

describe("summarizeAuthMethods", () => {
  it("counts email apple telegram and google", () => {
    const summary = summarizeAuthMethods("a@b.com", [
      identity("apple"),
      identity("google"),
      identity("telegram"),
    ]);
    expect(summary).toEqual({
      email: true,
      apple: true,
      google: true,
      telegram: true,
      linkedCount: 4,
    });
  });

  it("ignores blank email", () => {
    const summary = summarizeAuthMethods("  ", [identity("google")]);
    expect(summary.email).toBe(false);
    expect(summary.google).toBe(true);
    expect(summary.linkedCount).toBe(1);
  });
});
