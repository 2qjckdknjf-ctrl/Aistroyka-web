import type { TraceItem, TraceAudience, TraceLinkedPointer } from "./traceability.types";

const INTERNAL: TraceAudience = "internal_workspace";
const STAKEHOLDER: TraceAudience = "stakeholder_visible";

function pointersFromChangeOrder(row: {
  linked_discussion_id: string | null;
  linked_document_id: string | null;
  linked_request_id: string | null;
}): TraceLinkedPointer[] {
  const out: TraceLinkedPointer[] = [];
  if (row.linked_discussion_id) {
    out.push({
      entityType: "discussion",
      entityId: row.linked_discussion_id,
      role: "context",
    });
  }
  if (row.linked_document_id) {
    out.push({ entityType: "document", entityId: row.linked_document_id, role: "context" });
  }
  if (row.linked_request_id) {
    out.push({
      entityType: "client_request",
      entityId: row.linked_request_id,
      role: "context",
    });
  }
  return out;
}

function pointersFromDefect(row: {
  linked_discussion_id: string | null;
  linked_document_id: string | null;
  linked_request_id: string | null;
  linked_milestone_id: string | null;
}): TraceLinkedPointer[] {
  const out: TraceLinkedPointer[] = [];
  if (row.linked_discussion_id) {
    out.push({
      entityType: "discussion",
      entityId: row.linked_discussion_id,
      role: "context",
    });
  }
  if (row.linked_document_id) {
    out.push({ entityType: "document", entityId: row.linked_document_id, role: "context" });
  }
  if (row.linked_request_id) {
    out.push({
      entityType: "client_request",
      entityId: row.linked_request_id,
      role: "context",
    });
  }
  if (row.linked_milestone_id) {
    out.push({
      entityType: "milestone",
      entityId: row.linked_milestone_id,
      role: "context",
    });
  }
  return out;
}

function pointersFromServiceRequest(row: {
  linked_handover_id: string | null;
  linked_defect_id: string | null;
  linked_discussion_id: string | null;
}): TraceLinkedPointer[] {
  const out: TraceLinkedPointer[] = [];
  if (row.linked_handover_id) {
    out.push({
      entityType: "handover",
      entityId: row.linked_handover_id,
      role: "context",
    });
  }
  if (row.linked_defect_id) {
    out.push({ entityType: "defect", entityId: row.linked_defect_id, role: "consequence" });
  }
  if (row.linked_discussion_id) {
    out.push({
      entityType: "discussion",
      entityId: row.linked_discussion_id,
      role: "context",
    });
  }
  return out;
}

export function mapChangeOrderEvent(
  projectId: string,
  row: {
    id: string;
    change_order_id: string;
    from_status: string | null;
    to_status: string;
    actor_user_id: string;
    note: string | null;
    created_at: string;
  },
  order: {
    title: string;
    linked_discussion_id: string | null;
    linked_document_id: string | null;
    linked_request_id: string | null;
  }
): TraceItem {
  const base = `/dashboard/projects/${projectId}`;
  return {
    id: `coe:${row.id}`,
    occurredAt: row.created_at,
    entityType: "change_order",
    entityId: row.change_order_id,
    action: "status_transition",
    title: `Change order: ${order.title}`,
    summary: row.from_status
      ? `Status ${row.from_status} → ${row.to_status}`
      : `Status → ${row.to_status}`,
    previousState: row.from_status,
    newState: row.to_status,
    actorType: "user",
    actorId: row.actor_user_id,
    actorLabel: null,
    reasonNote: row.note,
    audience: STAKEHOLDER,
    source: "project_change_order_events",
    targetUrl: `${base}?tab=schedule`,
    linkedPointers: pointersFromChangeOrder(order),
  };
}

export function mapHandoverEvent(
  projectId: string,
  row: {
    id: string;
    handover_id: string;
    from_status: string | null;
    to_status: string;
    actor_user_id: string;
    note: string | null;
    created_at: string;
  }
): TraceItem {
  const base = `/dashboard/projects/${projectId}`;
  return {
    id: `hoe:${row.id}`,
    occurredAt: row.created_at,
    entityType: "handover",
    entityId: row.handover_id,
    action: "status_transition",
    title: "Handover / completion",
    summary: row.from_status
      ? `Status ${row.from_status} → ${row.to_status}`
      : `Status → ${row.to_status}`,
    previousState: row.from_status,
    newState: row.to_status,
    actorType: "user",
    actorId: row.actor_user_id,
    actorLabel: null,
    reasonNote: row.note,
    audience: STAKEHOLDER,
    source: "project_handover_events",
    targetUrl: `${base}?tab=schedule`,
    linkedPointers: [],
  };
}

export function mapDefectEvent(
  projectId: string,
  row: {
    id: string;
    defect_id: string;
    from_status: string | null;
    to_status: string;
    actor_user_id: string;
    note: string | null;
    created_at: string;
  },
  defect: {
    title: string;
    linked_discussion_id: string | null;
    linked_document_id: string | null;
    linked_request_id: string | null;
    linked_milestone_id: string | null;
  }
): TraceItem {
  const base = `/dashboard/projects/${projectId}`;
  return {
    id: `pde:${row.id}`,
    occurredAt: row.created_at,
    entityType: "defect",
    entityId: row.defect_id,
    action: "status_transition",
    title: `Punch list: ${defect.title}`,
    summary: row.from_status
      ? `Status ${row.from_status} → ${row.to_status}`
      : `Status → ${row.to_status}`,
    previousState: row.from_status,
    newState: row.to_status,
    actorType: "user",
    actorId: row.actor_user_id,
    actorLabel: null,
    reasonNote: row.note,
    audience: STAKEHOLDER,
    source: "project_defect_events",
    targetUrl: `${base}?tab=defects`,
    linkedPointers: pointersFromDefect(defect),
  };
}

export function mapServiceRequestEvent(
  projectId: string,
  row: {
    id: string;
    service_request_id: string;
    from_status: string | null;
    to_status: string;
    actor_user_id: string;
    note: string | null;
    created_at: string;
  },
  req: {
    title: string;
    linked_handover_id: string | null;
    linked_defect_id: string | null;
    linked_discussion_id: string | null;
  }
): TraceItem {
  const base = `/dashboard/projects/${projectId}`;
  return {
    id: `sre:${row.id}`,
    occurredAt: row.created_at,
    entityType: "aftercare_request",
    entityId: row.service_request_id,
    action: "status_transition",
    title: `Aftercare: ${req.title}`,
    summary: row.from_status
      ? `Status ${row.from_status} → ${row.to_status}`
      : `Status → ${row.to_status}`,
    previousState: row.from_status,
    newState: row.to_status,
    actorType: "user",
    actorId: row.actor_user_id,
    actorLabel: null,
    reasonNote: row.note,
    audience: STAKEHOLDER,
    source: "project_service_request_events",
    targetUrl: `${base}?tab=aftercare`,
    linkedPointers: pointersFromServiceRequest(req),
  };
}

export function mapDiscussionEntry(
  projectId: string,
  row: {
    id: string;
    discussion_id: string;
    author_user_id: string;
    entry_kind: string;
    body: string;
    created_at: string;
  },
  discussionTitle: string
): TraceItem {
  const base = `/dashboard/projects/${projectId}`;
  const preview =
    row.body.length > 160 ? `${row.body.slice(0, 157)}…` : row.body;
  return {
    id: `sde:${row.id}`,
    occurredAt: row.created_at,
    entityType: "discussion_entry",
    entityId: row.id,
    action: "discussion_entry",
    title: `Discussion: ${discussionTitle}`,
    summary: `${row.entry_kind}: ${preview}`,
    previousState: null,
    newState: null,
    actorType: "user",
    actorId: row.author_user_id,
    actorLabel: null,
    reasonNote: null,
    audience: STAKEHOLDER,
    source: "project_stakeholder_discussion_entries",
    targetUrl: `${base}?tab=schedule`,
    linkedPointers: [
      { entityType: "discussion", entityId: row.discussion_id, role: "context" },
    ],
  };
}

export function mapDocumentEvent(
  projectId: string,
  documentId: string,
  documentTitle: string,
  row: {
    id: string;
    event_type: string;
    actor_user_id: string | null;
    note: string | null;
    created_at: string;
  }
): TraceItem {
  const base = `/dashboard/projects/${projectId}`;
  return {
    id: `pdevent:${row.id}`,
    occurredAt: row.created_at,
    entityType: "document",
    entityId: documentId,
    action: "document_lifecycle",
    title: `${documentTitle}`,
    summary: `Document event: ${row.event_type.replace(/_/g, " ")}`,
    previousState: null,
    newState: row.event_type,
    actorType: row.actor_user_id ? "user" : "system",
    actorId: row.actor_user_id,
    actorLabel: null,
    reasonNote: row.note,
    audience: INTERNAL,
    source: "project_document_events",
    targetUrl: `${base}?tab=documents`,
    linkedPointers: [],
  };
}

export function mapReportApprovalEvent(
  reportId: string,
  row: {
    id: string;
    event_type: string;
    actor_user_id: string | null;
    note: string | null;
    created_at: string;
  }
): TraceItem {
  return {
    id: `rae:${row.id}`,
    occurredAt: row.created_at,
    entityType: "report_approval",
    entityId: reportId,
    action: "report_approval",
    title: "Worker report approval",
    summary: row.event_type.replace(/_/g, " "),
    previousState: null,
    newState: row.event_type,
    actorType: row.actor_user_id ? "user" : "system",
    actorId: row.actor_user_id,
    actorLabel: null,
    reasonNote: row.note,
    audience: INTERNAL,
    source: "report_approval_events",
    targetUrl: "/dashboard/daily-reports",
    linkedPointers: [],
  };
}
