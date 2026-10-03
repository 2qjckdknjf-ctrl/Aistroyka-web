import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildConstructionGraphFromSources,
  type ConstructionGraphQuery,
} from "./construction-graph.model";

function overlayMissing(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return m.includes("does not exist") || m.includes("schema cache");
}

/**
 * Overlay tables store references only (source_table + source_id).
 * Query always rebuilds from source-of-truth rows. Persistence is best-effort.
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

  const [tasksRes, mediaRes, defectsRes, documentsRes] = await Promise.all([
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
  ]);

  const tasks = (tasksRes.data ?? []) as Array<{
    id: string;
    title: string | null;
    assigned_to: string | null;
  }>;
  const taskIds = tasks.map((t) => t.id);
  const reportsRes =
    taskIds.length === 0
      ? { data: [] as Array<{ id: string; task_id: string | null; created_by: string | null }> }
      : await supabase.from("worker_reports").select("id, task_id, created_by").in("task_id", taskIds).limit(200);

  const reports = ((reportsRes.data ?? []) as Array<{
    id: string;
    task_id: string | null;
    created_by: string | null;
  }>).map((r) => ({ id: r.id, task_id: r.task_id, created_by: r.created_by }));

  const graph = buildConstructionGraphFromSources(tenantId, projectId, {
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

  await persistConstructionGraphOverlay(supabase, graph);
  return graph;
}

export async function persistConstructionGraphOverlay(
  supabase: SupabaseClient,
  graph: ConstructionGraphQuery
): Promise<{ persisted: boolean; reason?: string }> {
  const now = new Date().toISOString();
  const nodeRows = graph.nodes.map((n) => ({
    tenant_id: graph.tenant_id,
    project_id: graph.project_id,
    family: n.family,
    source_table: n.source_table,
    source_type: n.source_table,
    source_id: n.source_id,
    provenance: n.provenance,
    updated_at: now,
  }));

  const upsert = await supabase
    .from("construction_graph_nodes")
    .upsert(nodeRows, { onConflict: "tenant_id,project_id,source_table,source_id" })
    .select("id, source_table, source_id");

  if (upsert.error) {
    if (overlayMissing(upsert.error.message)) {
      return { persisted: false, reason: "overlay_unavailable" };
    }
    return { persisted: false, reason: upsert.error.message };
  }

  const persisted = (upsert.data ?? []) as Array<{
    id: string;
    source_table: string;
    source_id: string;
  }>;
  const key = (table: string, id: string) => `${table}:${id}`;
  const idBySource = new Map(persisted.map((r) => [key(r.source_table, r.source_id), r.id]));

  const del = await supabase
    .from("construction_graph_edges")
    .delete()
    .eq("tenant_id", graph.tenant_id)
    .eq("project_id", graph.project_id);
  if (del.error) {
    if (overlayMissing(del.error.message)) {
      return { persisted: false, reason: "overlay_unavailable" };
    }
    return { persisted: false, reason: del.error.message };
  }

  const edgeRows = graph.edges
    .map((e) => {
      const fromNode = graph.nodes.find((n) => n.id === e.from_id);
      const toNode = graph.nodes.find((n) => n.id === e.to_id);
      if (!fromNode || !toNode) return null;
      const from_node_id = idBySource.get(key(fromNode.source_table, fromNode.source_id));
      const to_node_id = idBySource.get(key(toNode.source_table, toNode.source_id));
      if (!from_node_id || !to_node_id) return null;
      return {
        tenant_id: graph.tenant_id,
        project_id: graph.project_id,
        kind: e.kind,
        from_node_id,
        to_node_id,
        provenance: e.provenance,
        updated_at: now,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (edgeRows.length > 0) {
    const ins = await supabase
      .from("construction_graph_edges")
      .upsert(edgeRows, { onConflict: "tenant_id,project_id,kind,from_node_id,to_node_id" });
    if (ins.error) {
      if (overlayMissing(ins.error.message)) return { persisted: false, reason: "overlay_unavailable" };
      return { persisted: false, reason: ins.error.message };
    }
  }

  return { persisted: true };
}
