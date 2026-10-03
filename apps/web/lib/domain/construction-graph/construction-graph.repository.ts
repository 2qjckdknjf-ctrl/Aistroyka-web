import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildConstructionGraphFromSources,
  type ConstructionGraphQuery,
} from "./construction-graph.model";

/**
 * Overlay tables store references only (source_table + source_id).
 * This query always rebuilds from source-of-truth rows so the API stays useful
 * even before overlay persistence is applied remotely.
 */
export async function queryProjectConstructionGraph(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string
): Promise<ConstructionGraphQuery | null> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !project?.id) return null;

  const [tasksRes, mediaRes, defectsRes, documentsRes, daysRes] = await Promise.all([
    supabase
      .from("worker_tasks")
      .select("id, title, assigned_to")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .limit(200),
    supabase
      .from("media")
      .select("id, type")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .limit(200),
    supabase
      .from("project_defects")
      .select("id, title")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .limit(200),
    supabase
      .from("project_documents")
      .select("id, title, status")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .limit(200),
    supabase
      .from("worker_day")
      .select("id")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .limit(200),
  ]);

  const tasks = (tasksRes.data ?? []) as Array<{
    id: string;
    title: string | null;
    assigned_to: string | null;
  }>;
  const taskIds = tasks.map((t) => t.id);
  const dayIds = ((daysRes.data ?? []) as Array<{ id: string }>).map((d) => d.id);

  type ReportRow = { id: string; task_id: string | null; user_id: string | null };
  const reportById = new Map<string, ReportRow>();
  if (taskIds.length > 0) {
    const { data } = await supabase
      .from("worker_reports")
      .select("id, task_id, user_id")
      .eq("tenant_id", tenantId)
      .in("task_id", taskIds)
      .limit(200);
    for (const row of (data ?? []) as ReportRow[]) reportById.set(row.id, row);
  }
  if (dayIds.length > 0) {
    const { data } = await supabase
      .from("worker_reports")
      .select("id, task_id, user_id")
      .eq("tenant_id", tenantId)
      .in("day_id", dayIds)
      .limit(200);
    for (const row of (data ?? []) as ReportRow[]) {
      if (!reportById.has(row.id)) reportById.set(row.id, row);
    }
  }
  const reports = Array.from(reportById.values());

  return buildConstructionGraphFromSources(tenantId, projectId, {
    project: { id: project.id, name: project.name ?? null },
    tasks,
    reports,
    media: (mediaRes.data ?? []) as Array<{ id: string; type: string | null }>,
    defects: (defectsRes.data ?? []) as Array<{ id: string; title: string | null }>,
    documents: (documentsRes.data ?? []) as Array<{
      id: string;
      title: string | null;
      status: string | null;
    }>,
  });
}
