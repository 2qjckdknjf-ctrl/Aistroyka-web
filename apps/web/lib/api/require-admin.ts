/**
 * Consistent admin guard for /api/v1/admin/* routes.
 * Call after requireTenant(ctx). Returns 403 response if context is not admin/owner.
 */

import { NextResponse } from "next/server";
import { authorize } from "@/lib/tenant";
import type { TenantContext } from "@/lib/tenant/tenant.types";

const INSUFFICIENT_RIGHTS = { error: "Insufficient rights" } as const;

/**
 * Require admin scope. Returns a 403 NextResponse if the context does not have the required scope.
 * Use after requireTenant(ctx). Scope "read" => admin:read, "write" => admin:write.
 */
export function requireAdmin(ctx: TenantContext, scope: "read" | "write"): NextResponse | null {
  const action = scope === "write" ? "admin:write" : "admin:read";
  if (!authorize(ctx, action)) {
    return NextResponse.json(INSUFFICIENT_RIGHTS, { status: 403 });
  }
  return null;
}
