import { describe, expect, it } from "vitest";
import { canWriteQuantitySnapshot } from "./quantity-write-policy";
import type { TenantContext } from "@/lib/tenant/tenant.types";

function ctx(role: TenantContext["role"]): TenantContext {
  return {
    userId: "u1",
    tenantId: "t1",
    role,
    email: "x@example.com",
  } as TenantContext;
}

describe("Stage2a A03 quantity write policy", () => {
  it("allows managers any quantity_kind", () => {
    expect(canWriteQuantitySnapshot(ctx("admin"), "planned").ok).toBe(true);
    expect(canWriteQuantitySnapshot(ctx("owner"), "accepted").ok).toBe(true);
  });

  it("allows members only reported/measured", () => {
    expect(canWriteQuantitySnapshot(ctx("member"), "reported").ok).toBe(true);
    expect(canWriteQuantitySnapshot(ctx("member"), "measured").ok).toBe(true);
    expect(canWriteQuantitySnapshot(ctx("member"), "planned").ok).toBe(false);
    expect(canWriteQuantitySnapshot(ctx("member"), "accepted").ok).toBe(false);
  });

  it("denies viewer and stakeholder", () => {
    expect(canWriteQuantitySnapshot(ctx("viewer"), "reported").ok).toBe(false);
    expect(canWriteQuantitySnapshot(ctx("stakeholder"), "measured").ok).toBe(false);
  });
});
