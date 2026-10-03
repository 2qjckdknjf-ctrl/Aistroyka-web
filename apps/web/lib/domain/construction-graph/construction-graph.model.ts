export type ConstructionGraphFamily =
  | "project"
  | "space"
  | "task"
  | "report"
  | "evidence"
  | "issue"
  | "decision"
  | "document"
  | "participant";

export type ConstructionGraphRelKind =
  | "contains"
  | "reported_on"
  | "evidences"
  | "affects"
  | "decides"
  | "authored_by"
  | "assigned_to";

export interface ConstructionGraphNode {
  id: string;
  family: ConstructionGraphFamily;
  source_table: string;
  source_id: string;
  project_id: string;
  tenant_id: string;
  label: string;
  provenance: { kind: "sot_row"; table: string; id: string };
}

export interface ConstructionGraphEdge {
  id: string;
  kind: ConstructionGraphRelKind;
  from_id: string;
  to_id: string;
  provenance: { kind: "sot_fk"; table: string; column: string };
}

export interface ConstructionGraphQuery {
  project_id: string;
  tenant_id: string;
  nodes: ConstructionGraphNode[];
  edges: ConstructionGraphEdge[];
}

export interface ConstructionGraphSourceRows {
  project: { id: string; name: string | null };
  tasks: Array<{ id: string; title: string | null; assigned_to: string | null }>;
  reports: Array<{ id: string; task_id: string | null; created_by: string | null }>;
  media: Array<{ id: string; type: string | null }>;
  defects: Array<{ id: string; title: string | null }>;
  documents: Array<{ id: string; title: string | null; status: string | null }>;
}

function nodeId(table: string, id: string): string {
  return `${table}:${id}`;
}

export function buildConstructionGraphFromSources(
  tenantId: string,
  projectId: string,
  rows: ConstructionGraphSourceRows
): ConstructionGraphQuery {
  const nodes: ConstructionGraphNode[] = [];
  const edges: ConstructionGraphEdge[] = [];

  const projectNode: ConstructionGraphNode = {
    id: nodeId("projects", rows.project.id),
    family: "project",
    source_table: "projects",
    source_id: rows.project.id,
    project_id: projectId,
    tenant_id: tenantId,
    label: rows.project.name?.trim() || "Project",
    provenance: { kind: "sot_row", table: "projects", id: rows.project.id },
  };
  nodes.push(projectNode);

  for (const task of rows.tasks) {
    const id = nodeId("worker_tasks", task.id);
    nodes.push({
      id,
      family: "task",
      source_table: "worker_tasks",
      source_id: task.id,
      project_id: projectId,
      tenant_id: tenantId,
      label: task.title?.trim() || "Task",
      provenance: { kind: "sot_row", table: "worker_tasks", id: task.id },
    });
    edges.push({
      id: `contains:${projectNode.id}:${id}`,
      kind: "contains",
      from_id: projectNode.id,
      to_id: id,
      provenance: { kind: "sot_fk", table: "worker_tasks", column: "project_id" },
    });
    if (task.assigned_to) {
      const pid = nodeId("participants", task.assigned_to);
      if (!nodes.some((n) => n.id === pid)) {
        nodes.push({
          id: pid,
          family: "participant",
          source_table: "auth.users",
          source_id: task.assigned_to,
          project_id: projectId,
          tenant_id: tenantId,
          label: "Participant",
          provenance: { kind: "sot_row", table: "worker_tasks", id: task.id },
        });
      }
      edges.push({
        id: `assigned_to:${id}:${pid}`,
        kind: "assigned_to",
        from_id: id,
        to_id: pid,
        provenance: { kind: "sot_fk", table: "worker_tasks", column: "assigned_to" },
      });
    }
  }

  const taskIds = new Set(rows.tasks.map((t) => t.id));
  for (const report of rows.reports) {
    const id = nodeId("worker_reports", report.id);
    nodes.push({
      id,
      family: "report",
      source_table: "worker_reports",
      source_id: report.id,
      project_id: projectId,
      tenant_id: tenantId,
      label: "Report",
      provenance: { kind: "sot_row", table: "worker_reports", id: report.id },
    });
    if (report.task_id && taskIds.has(report.task_id)) {
      edges.push({
        id: `reported_on:${id}:${nodeId("worker_tasks", report.task_id)}`,
        kind: "reported_on",
        from_id: id,
        to_id: nodeId("worker_tasks", report.task_id),
        provenance: { kind: "sot_fk", table: "worker_reports", column: "task_id" },
      });
    } else {
      edges.push({
        id: `reported_on:${id}:${projectNode.id}`,
        kind: "reported_on",
        from_id: id,
        to_id: projectNode.id,
        provenance: { kind: "sot_fk", table: "worker_reports", column: "task_id" },
      });
    }
  }

  for (const media of rows.media) {
    const id = nodeId("media", media.id);
    nodes.push({
      id,
      family: "evidence",
      source_table: "media",
      source_id: media.id,
      project_id: projectId,
      tenant_id: tenantId,
      label: media.type?.trim() || "Evidence",
      provenance: { kind: "sot_row", table: "media", id: media.id },
    });
    edges.push({
      id: `evidences:${id}:${projectNode.id}`,
      kind: "evidences",
      from_id: id,
      to_id: projectNode.id,
      provenance: { kind: "sot_fk", table: "media", column: "project_id" },
    });
  }

  for (const defect of rows.defects) {
    const id = nodeId("project_defects", defect.id);
    nodes.push({
      id,
      family: "issue",
      source_table: "project_defects",
      source_id: defect.id,
      project_id: projectId,
      tenant_id: tenantId,
      label: defect.title?.trim() || "Issue",
      provenance: { kind: "sot_row", table: "project_defects", id: defect.id },
    });
    edges.push({
      id: `affects:${id}:${projectNode.id}`,
      kind: "affects",
      from_id: id,
      to_id: projectNode.id,
      provenance: { kind: "sot_fk", table: "project_defects", column: "project_id" },
    });
  }

  for (const doc of rows.documents) {
    const id = nodeId("project_documents", doc.id);
    const isDecision =
      doc.status === "approved" || doc.status === "rejected" || doc.status === "changes_requested";
    nodes.push({
      id,
      family: isDecision ? "decision" : "document",
      source_table: "project_documents",
      source_id: doc.id,
      project_id: projectId,
      tenant_id: tenantId,
      label: doc.title?.trim() || "Document",
      provenance: { kind: "sot_row", table: "project_documents", id: doc.id },
    });
    edges.push({
      id: `${isDecision ? "decides" : "contains"}:${id}:${projectNode.id}`,
      kind: isDecision ? "decides" : "contains",
      from_id: isDecision ? id : projectNode.id,
      to_id: isDecision ? projectNode.id : id,
      provenance: { kind: "sot_fk", table: "project_documents", column: "project_id" },
    });
  }

  return { project_id: projectId, tenant_id: tenantId, nodes, edges };
}
