import { describe, it, expect, vi } from "vitest";
import {
  actorLabelFromAuthUser,
  collectTenantProjectScopedUserIds,
} from "./traceability-actor-labels";
import type { User } from "@supabase/supabase-js";

describe("actorLabelFromAuthUser", () => {
  it("prefers full_name from metadata", () => {
    const u = {
      id: "x",
      user_metadata: { full_name: "  Alex Builder  " },
    } as User;
    expect(actorLabelFromAuthUser(u)).toBe("Alex Builder");
  });

  it("falls back to email local part", () => {
    const u = {
      id: "x",
      email: "sam@example.com",
      user_metadata: {},
    } as User;
    expect(actorLabelFromAuthUser(u)).toBe("sam");
  });

  it("returns null when no usable label", () => {
    expect(actorLabelFromAuthUser(null)).toBeNull();
    expect(actorLabelFromAuthUser({ id: "x", user_metadata: {} } as User)).toBeNull();
  });
});

describe("collectTenantProjectScopedUserIds", () => {
  it("returns empty for empty candidates", async () => {
    const supabase = { from: vi.fn() } as unknown as import("@supabase/supabase-js").SupabaseClient;
    const s = await collectTenantProjectScopedUserIds(supabase, "t1", "p1", []);
    expect(s.size).toBe(0);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
