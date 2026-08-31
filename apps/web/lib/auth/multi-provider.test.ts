import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  summarizeAuthMethods,
  unlinkSupabaseAuthProvider,
  type IdentityRow,
} from "./multi-provider";

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

describe("unlinkSupabaseAuthProvider", () => {
  it("unlinks the matching Auth identity", async () => {
    const identity = {
      id: "gid",
      user_id: "user-1",
      identity_id: "gid",
      provider: "google",
    };
    const unlinkIdentity = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { identities: [identity] } }, error: null }),
        unlinkIdentity,
      },
    } as unknown as SupabaseClient;
    await expect(unlinkSupabaseAuthProvider(supabase, "google")).resolves.toBe(true);
    expect(unlinkIdentity).toHaveBeenCalledWith(identity);
  });

  it("succeeds when Auth has no matching identity", async () => {
    const unlinkIdentity = vi.fn();
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { identities: [] } }, error: null }),
        unlinkIdentity,
      },
    } as unknown as SupabaseClient;
    await expect(unlinkSupabaseAuthProvider(supabase, "apple")).resolves.toBe(true);
    expect(unlinkIdentity).not.toHaveBeenCalled();
  });
});
