import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { getById as getUploadSessionById } from "@/lib/domain/upload-session/upload-session.repository";

export type IssueEvidenceValidation =
  | { ok: true }
  | { ok: false; error: string; status: 400 | 403 };

/**
 * An issue may only bind a finalized issue-evidence upload session owned by the
 * current user in the current tenant. This prevents same-tenant session reuse
 * and purpose confusion through direct API calls.
 */
export async function validateIssueEvidenceSession(
  supabase: SupabaseClient,
  ctx: TenantContext,
  sessionId: string
): Promise<IssueEvidenceValidation> {
  if (!ctx.tenantId || !ctx.userId) {
    return { ok: false, error: "Tenant required", status: 403 };
  }

  const session = await getUploadSessionById(supabase, sessionId, ctx.tenantId);
  if (!session) {
    return { ok: false, error: "Evidence session not found", status: 400 };
  }
  if (session.user_id !== ctx.userId) {
    return { ok: false, error: "Evidence session not owned by user", status: 403 };
  }
  if (session.purpose !== "issue_evidence") {
    return { ok: false, error: "Invalid evidence purpose", status: 400 };
  }
  if (session.status !== "finalized") {
    return { ok: false, error: "Evidence session not finalized", status: 400 };
  }

  return { ok: true };
}
