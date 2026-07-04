import { NextResponse } from "next/server";
import { listAuditRunSummaries, ROMA_AUDIT_RUN_HISTORY_META } from "@/lib/platform-admin/roma-run-history.service";
import { getAdminClient } from "@/lib/supabase/admin";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";

export const dynamic = "force-dynamic";

/** GET /api/v1/platform/testing/safe-audit/runs — latest audit run summaries (owner only). */
export async function GET(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "read" });
  if (!auth.ok) return auth.response;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: { message: "Admin client unavailable — cannot list audit runs." } },
      { status: 503 }
    );
  }

  try {
    const runs = await listAuditRunSummaries(admin, ROMA_AUDIT_RUN_HISTORY_META.listLimit);
    return NextResponse.json({ data: { runs, limit: ROMA_AUDIT_RUN_HISTORY_META.listLimit } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "list_audit_runs_failed";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
