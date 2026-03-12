/**
 * GET /api/v1/users — scaffold using API gateway foundation.
 * Demonstrates envelope, auth, pagination. Returns empty list until user list is implemented.
 */

import { NextResponse } from "next/server";
import {
  requireApiAuth,
  success,
  apiError,
  errorToStatus,
  parseOffsetPagination,
  type ApiEnvelope,
} from "@/lib/api-gateway";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  const pagination = parseOffsetPagination(request);
  const limit = pagination.limit ?? 20;
  const offset = pagination.offset ?? 0;
  const requestId = request.headers.get("x-request-id") ?? undefined;
  // Scaffold: no user list implementation; return empty with pagination meta
  const envelope: ApiEnvelope<{ users: unknown[]; meta: { limit: number; offset: number } }> = success(
    {
      users: [],
      meta: { limit, offset },
    },
    { requestId, at: new Date().toISOString() }
  );
  return NextResponse.json(envelope);
}
