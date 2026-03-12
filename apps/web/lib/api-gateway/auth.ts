/**
 * API gateway — auth abstraction for v1 routes.
 * Wraps tenant context; does not replace existing auth.
 */

import type { TenantContextOrAbsent } from "@/lib/tenant/tenant.types";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { requireTenant, TenantRequiredError } from "@/lib/tenant";
import { apiError, errorToStatus } from "./api-response";

export type ApiAuthResult =
  | { ok: true; tenantId: string; userId: string; ctx: TenantContextOrAbsent & { tenantId: string; userId: string } }
  | { ok: false; status: number; body: ReturnType<typeof apiError> };

/**
 * Require tenant context for API route. Returns result for consistent error response.
 */
export async function requireApiAuth(request: Request): Promise<ApiAuthResult> {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return {
        ok: false,
        status: 401,
        body: apiError("auth_required", e.message),
      };
    }
    throw e;
  }
  const tenantId = ctx.tenantId!;
  const userId = ctx.userId ?? "";
  return {
    ok: true,
    tenantId,
    userId,
    ctx: { ...ctx, tenantId, userId },
  };
}

/**
 * Optional auth: get context if present, no error when absent.
 */
export async function getOptionalApiAuth(request: Request): Promise<TenantContextOrAbsent> {
  return getTenantContextFromRequest(request);
}

export { errorToStatus };
