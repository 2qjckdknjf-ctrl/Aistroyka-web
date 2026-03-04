/**
 * GET /api/v1/worker — stub for Worker Lite. 501 until implemented.
 * See docs/SPEC-API-VERSIONING.md and docs/SPEC-CONTRACTS.md.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { error: "Not implemented", code: "worker_stub", docs: "SPEC-API-VERSIONING.md" },
    { status: 501 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented", code: "worker_stub", docs: "SPEC-API-VERSIONING.md" },
    { status: 501 }
  );
}
