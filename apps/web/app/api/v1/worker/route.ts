/**
 * GET /api/v1/worker — compatibility discovery endpoint for Worker clients.
 * Canonical worker runtime actions live on explicit subroutes below.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const canonicalRoutes = {
  tasks_today: "/api/v1/worker/tasks/today",
  day_start: "/api/v1/worker/day/start",
  day_end: "/api/v1/worker/day/end",
  report_create: "/api/v1/worker/report/create",
  report_add_media: "/api/v1/worker/report/add-media",
  report_submit: "/api/v1/worker/report/submit",
  sync: "/api/v1/worker/sync",
  sync_bootstrap: "/api/v1/sync/bootstrap",
  sync_changes: "/api/v1/sync/changes",
  sync_ack: "/api/v1/sync/ack",
  upload_sessions: "/api/v1/media/upload-sessions",
  upload_session_finalize: "/api/v1/media/upload-sessions/{id}/finalize",
  config: "/api/v1/config",
  projects: "/api/v1/projects",
} as const;

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "worker",
    status: "available",
    message: "Use canonical worker subroutes for tasks, reports, sync, uploads, and config.",
    canonical_routes: canonicalRoutes,
  });
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Method not allowed",
      code: "method_not_allowed",
      message: "POST /api/v1/worker is not an action endpoint. Use the canonical worker subroutes.",
      canonical_routes: canonicalRoutes,
    },
    { status: 405, headers: { Allow: "GET" } }
  );
}
