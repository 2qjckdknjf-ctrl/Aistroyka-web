/**
 * Fail-closed guard for legacy (non-v1) routes that must not be reachable by
 * field-worker mobile clients. Enforce in the route handler before any side effect.
 */

import { NextResponse } from "next/server";

const FIELD_WORKER_CLIENTS = new Set([
  "ios_lite",
  "android_lite",
  "ios_worker",
  "android_worker",
]);

export function isFieldWorkerClientHeader(xClient: string | null | undefined): boolean {
  const v = xClient?.toLowerCase().trim();
  return typeof v === "string" && FIELD_WORKER_CLIENTS.has(v);
}

/**
 * Returns a 403 response when `x-client` is a field-worker profile.
 * Otherwise returns null (caller may redirect or proceed).
 */
export function forbidLiteOnLegacyRoute(request: Request): NextResponse | null {
  if (!isFieldWorkerClientHeader(request.headers.get("x-client"))) return null;
  return NextResponse.json(
    { error: "forbidden", code: "lite_client_path_forbidden" },
    { status: 403 }
  );
}
