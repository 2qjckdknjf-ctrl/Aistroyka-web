/**
 * Guard: require tenant context; throw typed error if missing.
 */

import type { TenantContext, TenantContextOrAbsent } from "./tenant.types";
import { isTenantContextPresent } from "./tenant.types";

export class TenantRequiredError extends Error {
  constructor(message = "Tenant context required") {
    super(message);
    this.name = "TenantRequiredError";
  }
}

/** Thrown when request uses service_role JWT (API should return 403). */
export class TenantForbiddenError extends Error {
  constructor(message = "Service role JWT not allowed") {
    super(message);
    this.name = "TenantForbiddenError";
  }
}

/**
 * Throws TenantRequiredError if context is absent. Use in routes that must have an active tenant.
 */
export function requireTenant(ctx: TenantContextOrAbsent): asserts ctx is TenantContext {
  if (!isTenantContextPresent(ctx)) {
    throw new TenantRequiredError(ctx.userId ? "User has no tenant membership" : "Authentication required");
  }
}
