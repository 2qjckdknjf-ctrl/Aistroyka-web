import { NextResponse } from "next/server";

/**
 * 307 to the same path under /api/v1 (query string preserved).
 * Example: /api/tenant/invite → /api/v1/tenant/invite
 */
export function redirectToV1PreservePath(request: Request): NextResponse {
  const u = new URL(request.url);
  const v1Path = u.pathname.replace(/^\/api\//, "/api/v1/");
  return NextResponse.redirect(new URL(v1Path + u.search, u.origin), 307);
}
