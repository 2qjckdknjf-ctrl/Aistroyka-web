import { describe, expect, it, vi } from "vitest";
import { requireAdmin } from "./require-admin";
import type { TenantContext } from "@/lib/tenant/tenant.types";

function ctx(role: TenantContext["role"]): TenantContext {
  return {
    tenantId: "t1",
    userId: "u1",
    role,
  } as TenantContext;
}

describe("requireAdmin", () => {
  it("returns null for owner with read scope", () => {
    expect(requireAdmin(ctx("owner"), "read")).toBeNull();
  });

  it("returns null for admin with read scope", () => {
    expect(requireAdmin(ctx("admin"), "read")).toBeNull();
  });

  it("returns null for admin with write scope", () => {
    expect(requireAdmin(ctx("admin"), "write")).toBeNull();
  });

  it("returns 403 response for member with read scope", async () => {
    const res = requireAdmin(ctx("member"), "read");
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const body = await res!.json();
    expect(body).toEqual({ error: "Insufficient rights" });
  });

  it("returns 403 response for viewer with read scope", async () => {
    const res = requireAdmin(ctx("viewer"), "read");
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });

  it("returns 403 response for member with write scope", async () => {
    const res = requireAdmin(ctx("member"), "write");
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });
});
