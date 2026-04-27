/**
 * Wave 4 Step 19 — project-scoped traceability read model.
 * Assembles append-only event tables + auditable discussion entries; tenant/project filtered in queries.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TraceItem, TraceSummary } from "./traceability.types";
import {
  mapChangeOrderEvent,
  mapDefectEvent,
  mapDiscussionEntry,
  mapDocumentEvent,
  mapHandoverEvent,
  mapReportApprovalEvent,
  mapServiceRequestEvent,
} from "./traceability.mappers";
import { resolveTraceActorLabels } from "./traceability-actor-labels";

const MAX_FETCH = 400;

async function loadIdMap<T extends { id: string }>(
  supabase: SupabaseClient,
  table: string,
  ids: string[],
  select: string
): Promise<Map<string, T>> {
  const uniq = [...new Set(ids)].filter(Boolean);
  const map = new Map<string, T>();
  if (uniq.length === 0) return map;
  const chunk = 120;
  for (let i = 0; i < uniq.length; i += chunk) {
    const slice = uniq.slice(i, i + chunk);
    const { data, error } = await supabase.from(table).select(select).in("id", slice);
    if (error) continue;
    for (const row of (data ?? []) as unknown as T[]) {
      map.set(row.id, row);
    }
  }
  return map;
}

export async function getProjectTraceability(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  limit = 80
): Promise<TraceSummary> {
  const cap = Math.min(Math.max(1, limit), 200);

  const [
    coRes,
    hoRes,
    deRes,
    srRes,
    discEntRes,
    docsRes,
    tasksRes,
    docReportsRes,
    dayRes,
  ] = await Promise.all([
    supabase
      .from("project_change_order_events")
      .select("id, change_order_id, from_status, to_status, actor_user_id, note, created_at")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(MAX_FETCH),
    supabase
      .from("project_handover_events")
      .select("id, handover_id, from_status, to_status, actor_user_id, note, created_at")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(MAX_FETCH),
    supabase
      .from("project_defect_events")
      .select("id, defect_id, from_status, to_status, actor_user_id, note, created_at")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(MAX_FETCH),
    supabase
      .from("project_service_request_events")
      .select("id, service_request_id, from_status, to_status, actor_user_id, note, created_at")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(MAX_FETCH),
    supabase
      .from("project_stakeholder_discussion_entries")
      .select("id, discussion_id, author_user_id, entry_kind, body, created_at")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(MAX_FETCH),
    supabase
      .from("project_documents")
      .select("id, title")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId),
    supabase.from("worker_tasks").select("id").eq("project_id", projectId).eq("tenant_id", tenantId),
    supabase
      .from("project_documents")
      .select("report_id")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .not("report_id", "is", null),
    supabase
      .from("worker_day")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("project_id", projectId),
  ]);

  const docRows = (docsRes.data ?? []) as Array<{ id: string; title: string }>;
  const documentIds = docRows.map((d) => d.id);
  const titleByDocId = new Map(docRows.map((d) => [d.id, d.title] as const));

  let docEvents: Array<{
    id: string;
    document_id: string;
    event_type: string;
    actor_user_id: string | null;
    note: string | null;
    created_at: string;
  }> = [];
  if (documentIds.length > 0) {
    const { data } = await supabase
      .from("project_document_events")
      .select("id, document_id, event_type, actor_user_id, note, created_at")
      .eq("tenant_id", tenantId)
      .in("document_id", documentIds)
      .order("created_at", { ascending: false })
      .limit(MAX_FETCH);
    docEvents = (data ?? []) as typeof docEvents;
  }

  const taskIds = ((tasksRes.data ?? []) as { id: string }[]).map((t) => t.id);
  const reportIdsFromDocs = ((docReportsRes.data ?? []) as { report_id: string | null }[])
    .map((r) => r.report_id)
    .filter((x): x is string => x != null);

  let reportIdsFromTasks: string[] = [];
  if (taskIds.length > 0) {
    const { data: repRows } = await supabase
      .from("worker_reports")
      .select("id")
      .eq("tenant_id", tenantId)
      .in("task_id", taskIds);
    reportIdsFromTasks = ((repRows ?? []) as { id: string }[]).map((r) => r.id);
  }

  const dayIds = ((dayRes.data ?? []) as { id: string }[]).map((d) => d.id);
  let reportIdsFromDays: string[] = [];
  if (dayIds.length > 0) {
    const { data: repDay } = await supabase
      .from("worker_reports")
      .select("id")
      .eq("tenant_id", tenantId)
      .in("day_id", dayIds);
    reportIdsFromDays = ((repDay ?? []) as { id: string }[]).map((r) => r.id);
  }

  const reportIdSet = new Set([...reportIdsFromDocs, ...reportIdsFromTasks, ...reportIdsFromDays]);
  let approvalEvents: Array<{
    id: string;
    report_id: string;
    event_type: string;
    actor_user_id: string | null;
    note: string | null;
    created_at: string;
  }> = [];
  if (reportIdSet.size > 0) {
    const { data } = await supabase
      .from("report_approval_events")
      .select("id, report_id, event_type, actor_user_id, note, created_at")
      .eq("tenant_id", tenantId)
      .in("report_id", [...reportIdSet])
      .order("created_at", { ascending: false })
      .limit(MAX_FETCH);
    approvalEvents = (data ?? []) as typeof approvalEvents;
  }

  const coRows = (coRes.data ?? []) as Array<{
    id: string;
    change_order_id: string;
    from_status: string | null;
    to_status: string;
    actor_user_id: string;
    note: string | null;
    created_at: string;
  }>;
  const coOrderMap = await loadIdMap<{
    id: string;
    title: string;
    linked_discussion_id: string | null;
    linked_document_id: string | null;
    linked_request_id: string | null;
  }>(
    supabase,
    "project_change_orders",
    coRows.map((r) => r.change_order_id),
    "id, title, linked_discussion_id, linked_document_id, linked_request_id"
  );

  const defRows = (deRes.data ?? []) as Array<{
    id: string;
    defect_id: string;
    from_status: string | null;
    to_status: string;
    actor_user_id: string;
    note: string | null;
    created_at: string;
  }>;
  const defectMap = await loadIdMap<{
    id: string;
    title: string;
    linked_discussion_id: string | null;
    linked_document_id: string | null;
    linked_request_id: string | null;
    linked_milestone_id: string | null;
  }>(
    supabase,
    "project_defects",
    defRows.map((r) => r.defect_id),
    "id, title, linked_discussion_id, linked_document_id, linked_request_id, linked_milestone_id"
  );

  const srRows = (srRes.data ?? []) as Array<{
    id: string;
    service_request_id: string;
    from_status: string | null;
    to_status: string;
    actor_user_id: string;
    note: string | null;
    created_at: string;
  }>;
  const srMap = await loadIdMap<{
    id: string;
    title: string;
    linked_handover_id: string | null;
    linked_defect_id: string | null;
    linked_discussion_id: string | null;
  }>(
    supabase,
    "project_service_requests",
    srRows.map((r) => r.service_request_id),
    "id, title, linked_handover_id, linked_defect_id, linked_discussion_id"
  );

  const discEntRows = (discEntRes.data ?? []) as Array<{
    id: string;
    discussion_id: string;
    author_user_id: string;
    entry_kind: string;
    body: string;
    created_at: string;
  }>;
  const discMap = await loadIdMap<{ id: string; title: string }>(
    supabase,
    "project_stakeholder_discussions",
    discEntRows.map((e) => e.discussion_id),
    "id, title"
  );

  const items: TraceItem[] = [];

  for (const row of coRows) {
    const order = coOrderMap.get(row.change_order_id);
    if (!order) continue;
    items.push(mapChangeOrderEvent(projectId, row, order));
  }

  for (const row of (hoRes.data ?? []) as Array<{
    id: string;
    handover_id: string;
    from_status: string | null;
    to_status: string;
    actor_user_id: string;
    note: string | null;
    created_at: string;
  }>) {
    items.push(mapHandoverEvent(projectId, row));
  }

  for (const row of defRows) {
    const d = defectMap.get(row.defect_id);
    if (!d) continue;
    items.push(mapDefectEvent(projectId, row, d));
  }

  for (const row of srRows) {
    const s = srMap.get(row.service_request_id);
    if (!s) continue;
    items.push(mapServiceRequestEvent(projectId, row, s));
  }

  for (const row of discEntRows) {
    const d = discMap.get(row.discussion_id);
    items.push(mapDiscussionEntry(projectId, row, d?.title ?? "Discussion"));
  }

  for (const ev of docEvents) {
    const title = titleByDocId.get(ev.document_id) ?? "Document";
    items.push(mapDocumentEvent(projectId, ev.document_id, title, ev));
  }

  for (const ev of approvalEvents) {
    items.push(mapReportApprovalEvent(ev.report_id, ev));
  }

  items.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  const truncated = items.length > cap;
  const sliced = items.slice(0, cap);

  const labelMap = await resolveTraceActorLabels(
    supabase,
    tenantId,
    projectId,
    sliced.map((i) => i.actorId)
  );
  const withLabels: TraceItem[] = sliced.map((item) => {
    if (!item.actorId) return item;
    const actorLabel = labelMap.get(item.actorId) ?? null;
    return actorLabel ? { ...item, actorLabel } : { ...item, actorLabel: null };
  });

  return {
    projectId,
    tenantId,
    items: withLabels,
    truncated,
  };
}
