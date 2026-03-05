import { NextResponse } from "next/server";

/** Deterministic 409 conflict body for sync (changes/ack). */
export interface SyncConflictBody {
  error: "conflict";
  code: "sync_conflict";
  serverCursor: number;
  hint?: string;
  must_bootstrap?: boolean;
}

const DEFAULT_HINT = "Call bootstrap, reset cursor to serverCursor, then retry changes/ack.";

export function syncConflictResponse(
  serverCursor: number,
  mustBootstrap = true,
  hint?: string
): NextResponse {
  const body: SyncConflictBody = {
    error: "conflict",
    code: "sync_conflict",
    serverCursor,
    must_bootstrap: mustBootstrap,
    hint: hint ?? (mustBootstrap ? DEFAULT_HINT : undefined),
  };
  return NextResponse.json(body, { status: 409 });
}
