/**
 * Server-side proof that a project belongs to a tenant.
 * UUID shape alone is never authorization.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { AI_ERROR_CODES, type AIErrorCode } from "./ai-media-errors";
import { isUuid } from "./media-path-tenant-guard";

export type ProjectOwnershipProof =
  | { ok: true; projectId: string }
  | {
      ok: false;
      code: AIErrorCode;
      retryable: boolean;
      /** Safe reason — never includes foreign ids. */
      reason: string;
    };

/**
 * Fail-closed ownership check:
 * `projects.id = projectId AND projects.tenant_id = tenantId`
 */
export async function verifyProjectBelongsToTenant(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ProjectOwnershipProof> {
  if (!isUuid(tenantId) || !isUuid(projectId)) {
    return {
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
      retryable: false,
      reason: "Invalid project or tenant scope",
    };
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        code: AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY,
        retryable: true,
        reason: "Temporary error verifying project ownership",
      };
    }

    if (!data?.id) {
      return {
        ok: false,
        code: AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
        retryable: false,
        reason: "Project not in tenant scope",
      };
    }

    return { ok: true, projectId };
  } catch {
    return {
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY,
      retryable: true,
      reason: "Temporary error verifying project ownership",
    };
  }
}
