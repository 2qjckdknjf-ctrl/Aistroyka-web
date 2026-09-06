import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicConfig } from "@/lib/config";
import { publicMediaObjectUrl } from "@/lib/platform/ai/media-path";
import type { ProjectIssue, CreateIssueInput, UpdateIssueInput } from "./issue.types";

const ISSUE_SELECT =
  "id, project_id, tenant_id, title, description, status, task_id, milestone_id, created_by, resolved_at, resolved_by, created_at, updated_at, evidence_upload_session_id";

export async function listByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  opts?: { status?: string }
): Promise<ProjectIssue[]> {
  let query = supabase
    .from("project_issues")
    .select(ISSUE_SELECT)
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (opts?.status) {
    query = query.eq("status", opts.status);
  }
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as ProjectIssue[];
}

export async function getById(
  supabase: SupabaseClient,
  issueId: string,
  tenantId: string
): Promise<ProjectIssue | null> {
  const { data, error } = await supabase
    .from("project_issues")
    .select(ISSUE_SELECT)
    .eq("id", issueId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProjectIssue;
}

export async function create(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string | null,
  input: CreateIssueInput
): Promise<ProjectIssue | null> {
  const trimmed = input.title.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from("project_issues")
    .insert({
      project_id: input.project_id,
      tenant_id: tenantId,
      title: trimmed,
      description: input.description?.trim() || null,
      status: "open",
      task_id: input.task_id ?? null,
      milestone_id: input.milestone_id ?? null,
      created_by: userId,
      evidence_upload_session_id: input.evidence_upload_session_id?.trim() || null,
    })
    .select(ISSUE_SELECT)
    .single();
  if (error || !data) return null;
  return data as ProjectIssue;
}

export async function update(
  supabase: SupabaseClient,
  issueId: string,
  tenantId: string,
  input: UpdateIssueInput & { resolved_by?: string | null }
): Promise<ProjectIssue | null> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.description !== undefined) payload.description = input.description?.trim() || null;
  if (input.status !== undefined) {
    payload.status = input.status;
    if (input.status === "resolved" || input.status === "closed") {
      payload.resolved_at = new Date().toISOString();
      if (input.resolved_by !== undefined) payload.resolved_by = input.resolved_by;
    }
  }
  if (input.task_id !== undefined) payload.task_id = input.task_id;
  if (input.milestone_id !== undefined) payload.milestone_id = input.milestone_id;
  if (input.evidence_upload_session_id !== undefined) {
    payload.evidence_upload_session_id = input.evidence_upload_session_id;
  }

  const { data, error } = await supabase
    .from("project_issues")
    .update(payload)
    .eq("id", issueId)
    .eq("tenant_id", tenantId)
    .select(ISSUE_SELECT)
    .single();
  if (error || !data) return null;
  return data as ProjectIssue;
}

export async function countOpenByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("project_issues")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .in("status", ["open", "in_review"]);
  if (error) return 0;
  return count ?? 0;
}

/** Display URL from a finalized `issue_evidence` upload session. Same public-media helper reports use. */
export async function attachEvidenceUrls(
  supabase: SupabaseClient,
  issues: ProjectIssue[]
): Promise<ProjectIssue[]> {
  const sessionIds = [
    ...new Set(
      issues
        .map((issue) => issue.evidence_upload_session_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];
  if (sessionIds.length === 0) {
    return issues.map((issue) => ({ ...issue, evidence_url: issue.evidence_url ?? null }));
  }

  const { data } = await supabase
    .from("upload_sessions")
    .select("id, object_path, status")
    .in("id", sessionIds);

  const pathBySessionId = new Map<string, string>();
  for (const row of data ?? []) {
    const session = row as { id: string; object_path?: string | null; status?: string | null };
    if (session.status === "finalized" && typeof session.object_path === "string" && session.object_path) {
      pathBySessionId.set(session.id, session.object_path);
    }
  }

  let baseUrl = "";
  try {
    baseUrl = getPublicConfig().NEXT_PUBLIC_SUPABASE_URL ?? "";
  } catch {
    baseUrl = "";
  }

  return issues.map((issue) => {
    const sessionId = issue.evidence_upload_session_id;
    const objectPath = sessionId ? pathBySessionId.get(sessionId) : undefined;
    return {
      ...issue,
      evidence_url: objectPath && baseUrl ? publicMediaObjectUrl(baseUrl, objectPath) : null,
    };
  });
}
