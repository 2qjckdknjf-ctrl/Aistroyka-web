import { describe, expect, it, vi } from "vitest";
import { scopeMatches, getPermissionsForContext, authorize } from "./authz.service";

vi.mock("./authz.repository", () => ({
  getPermissionsForRoleName: vi.fn().mockResolvedValue(["read", "write", "create"]),
  getUserScopes: vi.fn().mockResolvedValue(["tenant:*"]),
}));

describe("authz.service", () => {
  it("scopeMatches exact", () => {
    expect(scopeMatches("tenant:*", "tenant:*")).toBe(true);
    expect(scopeMatches("project:abc:*", "project:abc:*")).toBe(true);
  });

  it("scopeMatches wildcard prefix", () => {
    expect(scopeMatches("project:xyz:read", "project:*")).toBe(true);
    expect(scopeMatches("project:abc:write", "project:abc:*")).toBe(true);
    expect(scopeMatches("tenant:read", "tenant:*")).toBe(true);
  });

  it("scopeMatches no match", () => {
    expect(scopeMatches("project:other:*", "project:abc:*")).toBe(false);
    expect(scopeMatches("task:1", "project:*")).toBe(false);
  });

  it("authorize allows when permission in set and no scope required", async () => {
    const supabase = {} as any;
    const ctx = {
      tenantId: "t",
      userId: "u",
      role: "member" as const,
      subscriptionTier: "free",
      clientProfile: "web" as const,
      traceId: "x",
    };
    const result = await authorize(supabase, ctx, "read");
    expect(result).toBe(true);
  });

  it("getPermissionsForContext returns set from role", async () => {
    const supabase = {} as any;
    const ctx = {
      tenantId: "t",
      userId: "u",
      role: "member" as const,
      subscriptionTier: "free",
      clientProfile: "web" as const,
      traceId: "x",
    };
    const set = await getPermissionsForContext(supabase, ctx);
    expect(set.has("read")).toBe(true);
    expect(set.has("create")).toBe(true);
  });
});
