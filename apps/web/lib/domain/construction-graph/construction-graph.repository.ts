import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildConstructionGraphFromSources,
  type ConstructionGraphQuery,
} from "./construction-graph.model";

export const CONSTRUCTION_GRAPH_SOURCE_PAGE = 200;

type ReportRow = { id: string; task_id: string | null; user_id: string | null };

/**
 * Overlay tables store references only (source_table + source_id).
 * This query always rebuilds from source-of-truth rows so the API stays useful
 * even before overlay persistence is applied remotely.
 */
export async function queryProjectConstructionGraph(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string
): Promise<{ graph: ConstructionGraphQuery | null; error: string }> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) return { graph: null, error: error.message };
  if (!project?.id) return { graph: null, error: "Not found" };

  const [tasksPage, mediaPage, defectsPage, documentsPage, daysPage] = await Promise.all([
    fetchOrderedPage(supabase, "worker_tasks", "id, title, assigned_to", tenantId, projectId),
    fetchOrderedPage(supabase, "media", "id, type", tenantId, projectId),
    fetchOrderedPage(supabase, "project_defects", "id, title", tenantId, projectId),
    fetchOrderedPage(supabase, "project_documents", "id, title, status", tenantId, projectId),
    fetchOrderedPage(supabase, "worker_day", "id", tenantId, projectId),
  ]);
  const pages = [tasksPage, mediaPage, defectsPage, documentsPage, daysPage];
  const firstError = pages.find((p) => p.error)?.error;
  if (firstError) return { graph: null, error: firstError };

  const tasks = tasksPage.rows as Array<{ id: string; title: string | null; assigned_to: string | null }>;
  const taskIds = tasks.map((t) => t.id);
  const dayIds = (daysPage.rows as Array<{ id: string }>).map((d) => d.id);

  const reportsResult = await loadProjectReports(supabase, taskIds, dayIds);
  if (reportsResult.error) return { graph: null, error: reportsResult.error };

  const truncated =
    pages.some((p) => p.truncated) || reportsResult.truncated;

  const graph = buildConstructionGraphFromSources(tenantId, projectId, {
    project: { id: project.id, name: project.name ?? null },
    tasks,
    reports: reportsResult.rows,
    media: mediaPage.rows as Array<{ id: string; type: string | null }>,
    defects: defectsPage.rows as Array<{ id: string; title: string | null }>,
    documents: documentsPage.rows as Array<{
      id: string;
      title: string | null;
      status: string | null;
    }>,
  });
  graph.truncated = truncated;
  return { graph, error: "" };
}

async function fetchOrderedPage(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  tenantId: string,
  projectId: string
): Promise<{ rows: Array<Record<string, unknown>>; truncated: boolean; error: string }> {
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("id")
    .limit(CONSTRUCTION_GRAPH_SOURCE_PAGE + 1);
  if (error) return { rows: [], truncated: false, error: error.message };
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const truncated = rows.length > CONSTRUCTION_GRAPH_SOURCE_PAGE;
  return { rows: truncated ? rows.slice(0, CONSTRUCTION_GRAPH_SOURCE_PAGE) : rows, truncated, error: "" };
}

async function loadProjectReports(
  supabase: SupabaseClient,
  taskIds: string[],
  dayIds: string[]
): Promise<{ rows: ReportRow[]; truncated: boolean; error: string }> {
  const batches: Array<Promise<{ rows: ReportRow[]; truncated: boolean; error: string }>> = [];
  if (taskIds.length > 0) {
    batches.push(fetchReportsIn(supabase, "task_id", taskIds));
  }
  if (dayIds.length > 0) {
    batches.push(fetchReportsIn(supabase, "day_id", dayIds));
  }
  if (batches.length === 0) return { rows: [], truncated: false, error: "" };
  const results = await Promise.all(batches);
  const err = results.find((r) => r.error)?.error;
  if (err) return { rows: [], truncated: false, error: err };
  const byId = new Map<string, ReportRow>();
  for (const result of results) {
    for (const row of result.rows) byId.set(row.id, row);
  }
  return {
    rows: [...byId.values()],
    truncated: results.some((r) => r.truncated),
    error: "",
  };
}

async function fetchReportsIn(
  supabase: SupabaseClient,
  column: "task_id" | "day_id",
  ids: string[]
): Promise<{ rows: ReportRow[]; truncated: boolean; error: string }> {
  const { data, error } = await supabase
    .from("worker_reports")
    .select("id, task_id, user_id")
    .in(column, ids)
    .order("id")
    .limit(CONSTRUCTION_GRAPH_SOURCE_PAGE + 1);
  if (error) return { rows: [], truncated: false, error: error.message };
  const rows = (data ?? []) as ReportRow[];
  const truncated = rows.length > CONSTRUCTION_GRAPH_SOURCE_PAGE;
  return { rows: truncated ? rows.slice(0, CONSTRUCTION_GRAPH_SOURCE_PAGE) : rows, truncated, error: "" };
}
