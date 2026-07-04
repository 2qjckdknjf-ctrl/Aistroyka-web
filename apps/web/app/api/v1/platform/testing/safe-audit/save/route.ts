import { NextResponse } from "next/server";
import { saveAuditRunSnapshot } from "@/lib/platform-admin/roma-run-history.service";
import { getAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";
import { insertPlatformOwnerAudit } from "@/lib/platform-owner/owner-audit.service";
import { getRequestClientIp } from "@/lib/platform-owner/client-ip";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";

export const dynamic = "force-dynamic";

/** POST /api/v1/platform/testing/safe-audit/save — owner-only append-only audit snapshot. */
export async function POST(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "write" });
  if (!auth.ok) return auth.response;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: { message: "Admin client unavailable — cannot save audit run." } },
      { status: 503 }
    );
  }

  const sessionUser = await getSessionUser(auth.supabase);
  const ownerEmail = sessionUser?.email ?? null;

  try {
    const saved = await saveAuditRunSnapshot({
      admin,
      userId: auth.userId,
      ownerEmail,
    });

    await insertPlatformOwnerAudit(admin, {
      user_id: auth.userId,
      action: "roma_audit_run_saved",
      entity: "roma_audit_runs",
      entity_id: saved.runId,
      metadata: {
        status: saved.status,
        release_recommendation: saved.releaseRecommendation,
        environment: saved.environment,
      },
      ip: getRequestClientIp(request),
    });

    return NextResponse.json({ data: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "save_audit_run_failed";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
