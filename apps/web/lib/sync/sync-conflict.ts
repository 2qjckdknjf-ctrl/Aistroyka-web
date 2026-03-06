import { NextResponse } from "next/server";

/** Deterministic 409 conflict body for sync (changes/ack). Uses snake_case for API consistency. */
export interface SyncConflictBody {
  error: "conflict";
  code: "sync_conflict";
  server_cursor: number;
  hint?: string;
  must_bootstrap?: boolean;
}

export function syncConflictResponse(
  serverCursor: number,
  mustBootstrap = true,
  hint?: string
): NextResponse {
  const defaultHint = mustBootstrap
    ? "Call bootstrap, reset cursor to server_cursor, then retry changes/ack."
    : undefined;
  const body: SyncConflictBody = {
    error: "conflict",
    code: "sync_conflict",
    server_cursor: serverCursor,
    must_bootstrap: mustBootstrap,
    hint: hint ?? defaultHint,
  };
  return NextResponse.json(body, { status: 409 });
}
