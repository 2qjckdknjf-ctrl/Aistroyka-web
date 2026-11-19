import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { getActiveTenantRoleForUser } from "./tenant-role.server";

type Result = { data: unknown; error: { message: string } | null };

function fakeSupabase(tenants: Result, members: Result): SupabaseClient {
  const query = (result: Result) => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: async () => result,
      then: (resolve: (value: Result) => unknown) => Promise.resolve(result).then(resolve),
    };
    return chain;
  };
  return { from: (table: string) => query(table === "tenants" ? tenants : members) } as unknown as SupabaseClient;
}

describe("getActiveTenantRoleForUser", () => {
  it("returns owner for an owned tenant", async () => {
    const sb = fakeSupabase({ data: { id: "t1" }, error: null }, { data: [], error: null });
    await expect(getActiveTenantRoleForUser(sb, "u1")).resolves.toBe("owner");
  });

  it("returns the primary membership role", async () => {
    const sb = fakeSupabase({ data: null, error: null }, { data: [{ tenant_id: "t1", role: "viewer" }], error: null });
    await expect(getActiveTenantRoleForUser(sb, "u1")).resolves.toBe("viewer");
  });

  it("throws instead of reporting no role when the owner lookup fails", async () => {
    const sb = fakeSupabase({ data: null, error: { message: "db down" } }, { data: [], error: null });
    await expect(getActiveTenantRoleForUser(sb, "u1")).rejects.toThrow("tenant owner lookup failed");
  });

  it("throws instead of reporting no role when the membership lookup fails", async () => {
    const sb = fakeSupabase({ data: null, error: null }, { data: null, error: { message: "db down" } });
    await expect(getActiveTenantRoleForUser(sb, "u1")).rejects.toThrow("tenant membership lookup failed");
  });
});
