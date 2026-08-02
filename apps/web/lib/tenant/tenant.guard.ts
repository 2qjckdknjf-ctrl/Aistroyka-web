/**
 * Guard: require tenant context; throw typed error if missing.
 */

import { NextResponse } from "next/server";
import { LITE_CLIENT_PATH_FORBIDDEN_CODE } from "@/lib/api/lite-allow-list";
import type { TenantContext, TenantContextOrAbsent } from "./tenant.types";
import { isLitePathForbiddenContext, isTenantContextPresent } from "./tenant.types";

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

/** Thrown when field-worker client hits a path outside the lite allow-list. */
export class LitePathForbiddenError extends Error {
  readonly code = LITE_CLIENT_PATH_FORBIDDEN_CODE;
  constructor(message = "forbidden") {
    super(message);
    this.name = "LitePathForbiddenError";
  }
}

/**
 * Throws LitePathForbiddenError or TenantRequiredError if context is absent.
 * Use in routes that must have an active tenant.
 */
export function requireTenant(ctx: TenantContextOrAbsent): asserts ctx is TenantContext {
  if (isLitePathForbiddenContext(ctx)) {
    throw new LitePathForbiddenError();
  }
  if (!isTenantContextPresent(ctx)) {
    throw new TenantRequiredError(ctx.userId ? "User has no tenant membership" : "Authentication required");
  }
}

/** Map tenant/lite guard errors to HTTP responses; null means rethrow. */
export function tenantGuardResponse(e: unknown): NextResponse | null {
  if (e instanceof LitePathForbiddenError) {
    return NextResponse.json(
      { error: "forbidden", code: LITE_CLIENT_PATH_FORBIDDEN_CODE },
      { status: 403 }
    );
  }
  if (e instanceof TenantRequiredError) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
  if (e instanceof TenantForbiddenError) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
  return null;
}
