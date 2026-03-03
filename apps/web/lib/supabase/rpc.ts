/**
 * Supabase integration layer aligned to engine contract.
 * Multi-user cabinet: tenant_members define roles; viewer = read-only, member+ = create/upload.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getOrCreateTenantForCurrentUser, createAnalysisJob } from "@/lib/api/engine";
import { hasMinRole } from "@/lib/auth/tenant";

export type ProjectRow = { id: string; name: string; created_at: string };

/** Create a project in the current user's tenant. Requires role member or higher. */
export async function createProject(
  supabase: SupabaseClient,
  name: string
): Promise<{ id: string } | { error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const tenantId = await getOrCreateTenantForCurrentUser(supabase);
  if (!tenantId) return { error: "No tenant configured" };

  const canCreate = await hasMinRole(supabase, tenantId, "member");
  if (!canCreate) return { error: "Insufficient rights: only member and above can create projects" };

  const { data, error } = await supabase
    .from("projects")
    .insert({ name: name.trim(), tenant_id: tenantId })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

/** List projects for the current user only (their tenant). */
export async function listProjectsForUser(
  supabase: SupabaseClient
): Promise<{ data: ProjectRow[] | null; error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Unauthorized" };

    const tenantId = await getOrCreateTenantForCurrentUser(supabase);
    if (!tenantId) return { data: [], error: null };

    const { data, error } = await supabase
      .from("projects")
      .select("id, name, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: null };
    return { data: data ?? [], error: null };
  } catch {
    return { data: [], error: null };
  }
}

/** Get a project by id only if it belongs to the current user's tenant. Returns 404 for others. */
export async function getProjectById(
  supabase: SupabaseClient,
  projectId: string
): Promise<{
  data: { id: string; name: string; tenant_id: string } | null;
  error: string | null;
}> {
  const tenantId = await getOrCreateTenantForCurrentUser(supabase);
  if (!tenantId) return { data: null, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, tenant_id")
    .eq("id", projectId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data ?? null, error: null };
}

/** Statuses that mean "job is active" (not yet completed/failed/dead). */
const ACTIVE_JOB_STATUSES = ["pending", "processing", "queued"] as const;

/**
 * Create analysis job for the given media (engine RPC create_analysis_job).
 * If media already has an active job, returns that job id (idempotent).
 * Caller must ensure media belongs to project and user has access.
 */
export async function triggerAnalysisForMedia(
  supabase: SupabaseClient,
  projectId: string,
  mediaId: string
): Promise<{ jobId: string } | { error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: project } = await getProjectById(supabase, projectId);
  if (!project) return { error: "Project not found" };

  const canTrigger = await hasMinRole(supabase, project.tenant_id, "member");
  if (!canTrigger) return { error: "Insufficient rights: only member and above can run analysis" };

  const { data: media } = await supabase
    .from("media")
    .select("id, tenant_id")
    .eq("id", mediaId)
    .eq("project_id", projectId)
    .single();
  if (!media) return { error: "Media not found" };

  const { data: existing } = await supabase
    .from("analysis_jobs")
    .select("id")
    .eq("media_id", mediaId)
    .in("status", [...ACTIVE_JOB_STATUSES])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return { jobId: existing.id };

  try {
    const job = await createAnalysisJob(supabase, {
      tenant_id: media.tenant_id,
      media_id: mediaId,
      priority: "normal",
    });
    return { jobId: job.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create job";
    return { error: message };
  }
}
