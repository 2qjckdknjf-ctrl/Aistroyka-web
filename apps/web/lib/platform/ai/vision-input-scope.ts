import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant";
import { getProjectForInternalWorkspace } from "@/lib/domain/projects/project.service";

/** Shared caller-RLS binding for optional image/video project and media references. */
export async function resolveVisionInputScope(
  client: SupabaseClient,
  ctx: TenantContext,
  input: { projectId?: string | null; mediaId?: string | null }
): Promise<{ projectId: string | null; error: null } | { projectId: null; error: string; status: 403 | 404 }> {
  let projectId = input.projectId?.trim().toLowerCase() || null;
  if (input.mediaId) {
    const { data: media, error } = await client.from("media").select("id, project_id, tenant_id")
      .eq("id", input.mediaId.trim()).eq("tenant_id", ctx.tenantId).maybeSingle();
    if (error || !media || media.tenant_id !== ctx.tenantId ||
        (projectId && media.project_id !== projectId)) {
      return { projectId: null, error: "Media not found", status: 404 };
    }
    projectId = media.project_id;
  }
  if (projectId) {
    const { data, error } = await getProjectForInternalWorkspace(client, ctx, projectId);
    if (error || !data) return { projectId: null, error: error ?? "Not found", status: error === "Insufficient rights" ? 403 : 404 };
  }
  return { projectId, error: null };
}
