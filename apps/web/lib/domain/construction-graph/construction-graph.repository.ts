import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildConstructionGraphFromSources,
  type ConstructionGraphQuery,
  type ConstructionGraphSourceRows,
} from "./construction-graph.model";

export const CONSTRUCTION_GRAPH_SOURCE_PAGE = 200;

type TaskRow = ConstructionGraphSourceRows["tasks"][number];
type MediaRow = ConstructionGraphSourceRows["media"][number];
type DefectRow = ConstructionGraphSourceRows["defects"][number];
type DocumentRow = ConstructionGraphSourceRows["documents"][number];
type DayRow = { id: string };
type ReportRow = ConstructionGraphSourceRows["reports"][number];

type GraphSourceTable =
  | "worker_tasks"
  | "media"
  | "project_defects"
  | "project_documents"
  | "worker_day";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requiredId(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function optionalString(value: unknown): string | null {
  if (value == null) return null;
  return typeof value === "string" ? value : null;
}

function parseObjectPage<T>(
  data: unknown,
  parseRow: (row: Record<string, unknown>) => T | null
): { rows: T[] } | { error: string } {
  if (data == null) return { rows: [] };
  if (!Array.isArray(data)) return { error: "Malformed source page" };
  const rows: T[] = [];
  for (const item of data) {
    if (!isRecord(item)) return { error: "Malformed source row" };
    const parsed = parseRow(item);
    if (!parsed) return { error: "Malformed source row" };
    rows.push(parsed);
  }
  return { rows };
}

function parseTaskRow(row: Record<string, unknown>): TaskRow | null {
  const id = requiredId(row.id);
  if (!id) return null;
  return { id, title: optionalString(row.title), assigned_to: optionalString(row.assigned_to) };
}

function parseMediaRow(row: Record<string, unknown>): MediaRow | null {
  const id = requiredId(row.id);
  if (!id) return null;
  return { id, type: optionalString(row.type) };
}

function parseDefectRow(row: Record<string, unknown>): DefectRow | null {
  const id = requiredId(row.id);
  if (!id) return null;
  return { id, title: optionalString(row.title) };
}

function parseDocumentRow(row: Record<string, unknown>): DocumentRow | null {
  const id = requiredId(row.id);
  if (!id) return null;
  return { id, title: optionalString(row.title), status: optionalString(row.status) };
}

function parseDayRow(row: Record<string, unknown>): DayRow | null {
  const id = requiredId(row.id);
  return id ? { id } : null;
}

function parseReportRow(row: Record<string, unknown>): ReportRow | null {
  const id = requiredId(row.id);
  if (!id) return null;
  return { id, task_id: optionalString(row.task_id), user_id: optionalString(row.user_id) };
}

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
  if (!isRecord(project) || !requiredId(project.id)) return { graph: null, error: "Not found" };

  const [tasksPage, mediaPage, defectsPage, documentsPage, daysPage] = await Promise.all([
    fetchOrderedPage(supabase, "worker_tasks", "id, title, assigned_to", tenantId, projectId, parseTaskRow),
    fetchOrderedPage(supabase, "media", "id, type", tenantId, projectId, parseMediaRow),
    fetchOrderedPage(supabase, "project_defects", "id, title", tenantId, projectId, parseDefectRow),
    fetchOrderedPage(supabase, "project_documents", "id, title, status", tenantId, projectId, parseDocumentRow),
    fetchOrderedPage(supabase, "worker_day", "id", tenantId, projectId, parseDayRow),
  ]);
  const pages = [tasksPage, mediaPage, defectsPage, documentsPage, daysPage];
  const firstError = pages.find((p) => p.error)?.error;
  if (firstError) return { graph: null, error: firstError };

  const tasks = tasksPage.rows;
  const taskIds = tasks.map((t) => t.id);
  const dayIds = daysPage.rows.map((d) => d.id);

  const reportsResult = await loadProjectReports(supabase, taskIds, dayIds);
  if (reportsResult.error) return { graph: null, error: reportsResult.error };

  const truncated = pages.some((p) => p.truncated) || reportsResult.truncated;

  const graph = buildConstructionGraphFromSources(tenantId, projectId, {
    project: { id: String(project.id), name: optionalString(project.name) },
    tasks,
    reports: reportsResult.rows,
    media: mediaPage.rows,
    defects: defectsPage.rows,
    documents: documentsPage.rows,
  });
  graph.truncated = truncated;
  return { graph, error: "" };
}

async function fetchOrderedPage<T>(
  supabase: SupabaseClient,
  table: GraphSourceTable,
  columns: string,
  tenantId: string,
  projectId: string,
  parseRow: (row: Record<string, unknown>) => T | null
): Promise<{ rows: T[]; truncated: boolean; error: string }> {
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("id")
    .limit(CONSTRUCTION_GRAPH_SOURCE_PAGE + 1);
  if (error) return { rows: [], truncated: false, error: error.message };
  const parsed = parseObjectPage(data as unknown, parseRow);
  if ("error" in parsed) return { rows: [], truncated: false, error: parsed.error };
  const truncated = parsed.rows.length > CONSTRUCTION_GRAPH_SOURCE_PAGE;
  return {
    rows: truncated ? parsed.rows.slice(0, CONSTRUCTION_GRAPH_SOURCE_PAGE) : parsed.rows,
    truncated,
    error: "",
  };
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
  const parsed = parseObjectPage(data as unknown, parseReportRow);
  if ("error" in parsed) return { rows: [], truncated: false, error: parsed.error };
  const truncated = parsed.rows.length > CONSTRUCTION_GRAPH_SOURCE_PAGE;
  return {
    rows: truncated ? parsed.rows.slice(0, CONSTRUCTION_GRAPH_SOURCE_PAGE) : parsed.rows,
    truncated,
    error: "",
  };
}
