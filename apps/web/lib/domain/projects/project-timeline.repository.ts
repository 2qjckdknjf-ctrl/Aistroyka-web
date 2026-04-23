/**
 * Project timeline — read model aggregation
 *
 * Collects events from issues, reports, documents, tasks.
 * Read-time only, no background sync.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimelineItem } from "./project-timeline.types";

export async function getProjectTimeline(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  limit = 30
): Promise<TimelineItem[]> {
  const [issuesRes, docsRes, tasksDoneRes, tasksAssignedRes, dayIdsRes, taskIdsRes, serviceReqRes] = await Promise.all([
    supabase
      .from("project_issues")
      .select("id, title, created_at, updated_at, resolved_at, resolved_by, status, created_by")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("project_documents")
      .select("id, title, type, status, created_at, updated_at, created_by, decided_by")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .in("status", ["under_review", "approved", "rejected", "changes_requested"])
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("worker_tasks")
      .select("id, title, status, updated_at")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .eq("status", "done")
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("worker_tasks")
      .select("id, title, status, updated_at, assigned_to")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .not("assigned_to", "is", null)
      .in("status", ["pending", "in_progress"])
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("worker_day")
      .select("id")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId),
    supabase
      .from("worker_tasks")
      .select("id")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId),
    supabase
      .from("project_service_requests")
      .select("id, title, created_at, resolved_at, status")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .order("updated_at", { ascending: false })
      .limit(40),
  ]);

  const items: TimelineItem[] = [];
  const baseUrl = `/dashboard/projects/${projectId}`;

  // 1. Issues — created + resolved
  const issues = (issuesRes.data ?? []) as Array<{
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
    resolved_by: string | null;
    status: string;
    created_by: string | null;
  }>;
  for (const i of issues) {
    items.push({
      id: `issue_created:${i.id}`,
      eventType: "issue_created",
      occurredAt: i.created_at,
      actorId: i.created_by ?? undefined,
      actorLabel: null,
      title: `Issue created: ${i.title}`,
      description: null,
      projectId,
      entityType: "issue",
      entityId: i.id,
      targetUrl: `${baseUrl}?tab=issues`,
    });
    if (i.status === "in_review") {
      items.push({
        id: `issue_status_changed:${i.id}`,
        eventType: "issue_status_changed",
        occurredAt: i.updated_at,
        actorId: undefined,
        actorLabel: null,
        title: `Issue moved to review: ${i.title}`,
        description: null,
        projectId,
        entityType: "issue",
        entityId: i.id,
        targetUrl: `${baseUrl}?tab=issues`,
      });
    }
    if (i.resolved_at) {
      items.push({
        id: `issue_resolved:${i.id}`,
        eventType: "issue_resolved",
        occurredAt: i.resolved_at,
        actorId: i.resolved_by ?? undefined,
        actorLabel: null,
        title: `Issue resolved: ${i.title}`,
        description: null,
        projectId,
        entityType: "issue",
        entityId: i.id,
        targetUrl: `${baseUrl}?tab=issues`,
      });
    }
  }

  // 2. Documents — submitted for review, owner decisions
  const docs = (docsRes.data ?? []) as Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    decided_by: string | null;
  }>;
  for (const d of docs) {
    if (d.status === "under_review") {
      const isResubmission = d.decided_by != null;
      items.push({
        id: isResubmission ? `doc_resubmitted:${d.id}` : `doc_submitted:${d.id}`,
        eventType: isResubmission ? "document_resubmitted_for_review" : "document_submitted_for_review",
        occurredAt: d.updated_at,
        actorId: d.created_by ?? undefined,
        actorLabel: null,
        title: isResubmission
          ? `${d.type} resubmitted for review: ${d.title}`
          : `${d.type} submitted for review: ${d.title}`,
        description: null,
        projectId,
        entityType: "document",
        entityId: d.id,
        targetUrl: `${baseUrl}?tab=documents`,
      });
    } else if (d.status === "approved") {
      items.push({
        id: `doc_approved:${d.id}`,
        eventType: "owner_decision_approved",
        occurredAt: d.updated_at,
        actorId: d.decided_by ?? undefined,
        actorLabel: null,
        title: `${d.type} approved: ${d.title}`,
        description: null,
        projectId,
        entityType: "document",
        entityId: d.id,
        targetUrl: `${baseUrl}?tab=documents`,
      });
    } else if (d.status === "rejected") {
      items.push({
        id: `doc_rejected:${d.id}`,
        eventType: "owner_decision_rejected",
        occurredAt: d.updated_at,
        actorId: d.decided_by ?? undefined,
        actorLabel: null,
        title: `${d.type} rejected: ${d.title}`,
        description: null,
        projectId,
        entityType: "document",
        entityId: d.id,
        targetUrl: `${baseUrl}?tab=documents`,
      });
    } else if (d.status === "changes_requested") {
      items.push({
        id: `doc_changes:${d.id}`,
        eventType: "owner_decision_changes_requested",
        occurredAt: d.updated_at,
        actorId: d.decided_by ?? undefined,
        actorLabel: null,
        title: `Changes requested: ${d.title}`,
        description: null,
        projectId,
        entityType: "document",
        entityId: d.id,
        targetUrl: `${baseUrl}?tab=documents`,
      });
    }
  }

  // 3. Tasks — assigned + completed
  const tasksAssigned = (tasksAssignedRes.data ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    updated_at: string;
    assigned_to: string;
  }>;
  for (const t of tasksAssigned) {
    items.push({
      id: `task_assigned:${t.id}`,
      eventType: "task_assigned",
      occurredAt: t.updated_at,
      actorId: undefined,
      actorLabel: null,
      title: `Task assigned: ${t.title}`,
      description: null,
      projectId,
      entityType: "task",
      entityId: t.id,
      targetUrl: `${baseUrl}?tab=schedule`,
    });
  }

  const tasksDone = (tasksDoneRes.data ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    updated_at: string;
  }>;
  for (const t of tasksDone) {
    items.push({
      id: `task_done:${t.id}`,
      eventType: "task_completed",
      occurredAt: t.updated_at,
      actorId: undefined,
      actorLabel: null,
      title: `Task completed: ${t.title}`,
      description: null,
      projectId,
      entityType: "task",
      entityId: t.id,
      targetUrl: `${baseUrl}?tab=schedule`,
    });
  }

  // 4. Reports — submitted (via worker_day.project_id or task_id)
  const dayIds = (dayIdsRes.data ?? []).map((d: { id: string }) => d.id);
  const projectTaskIds = ((taskIdsRes.data ?? []) as { id: string }[]).map((t) => t.id);
  const reportDayIds = dayIds.length > 0 ? dayIds : [];
  const reportTaskIds = projectTaskIds.length > 0 ? projectTaskIds : [];

  let reportRows: Array<{ id: string; user_id: string; submitted_at: string }> = [];
  if (reportDayIds.length > 0) {
    const { data } = await supabase
      .from("worker_reports")
      .select("id, user_id, submitted_at")
      .eq("tenant_id", tenantId)
      .eq("status", "submitted")
      .in("day_id", reportDayIds)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(50);
    reportRows = (data ?? []) as typeof reportRows;
  }
  if (reportTaskIds.length > 0 && reportRows.length < 30) {
    const { data } = await supabase
      .from("worker_reports")
      .select("id, user_id, submitted_at")
      .eq("tenant_id", tenantId)
      .eq("status", "submitted")
      .in("task_id", reportTaskIds)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(50);
    const byTask = (data ?? []) as typeof reportRows;
    const existingIds = new Set(reportRows.map((r) => r.id));
    for (const r of byTask) {
      if (!existingIds.has(r.id)) {
        reportRows.push(r);
        existingIds.add(r.id);
      }
    }
  }
  for (const r of reportRows) {
    items.push({
      id: `report_submitted:${r.id}`,
      eventType: "report_submitted",
      occurredAt: r.submitted_at,
      actorId: r.user_id,
      actorLabel: null,
      title: "Report submitted",
      description: null,
      projectId,
      entityType: "report",
      entityId: r.id,
      targetUrl: "/dashboard/daily-reports",
    });
  }

  const serviceReqs = (serviceReqRes.error ? [] : (serviceReqRes.data ?? [])) as Array<{
    id: string;
    title: string;
    created_at: string;
    resolved_at: string | null;
    status: string;
  }>;
  for (const s of serviceReqs) {
    items.push({
      id: `service_req_created:${s.id}`,
      eventType: "service_request_reported",
      occurredAt: s.created_at,
      actorId: undefined,
      actorLabel: null,
      title: `Aftercare request: ${s.title}`,
      description: null,
      projectId,
      entityType: "service_request",
      entityId: s.id,
      targetUrl: `${baseUrl}?tab=aftercare`,
    });
    if (s.resolved_at && (s.status === "resolved" || s.status === "closed")) {
      items.push({
        id: `service_req_resolved:${s.id}`,
        eventType: "service_request_resolved",
        occurredAt: s.resolved_at,
        actorId: undefined,
        actorLabel: null,
        title: `Aftercare resolved: ${s.title}`,
        description: null,
        projectId,
        entityType: "service_request",
        entityId: s.id,
        targetUrl: `${baseUrl}?tab=aftercare`,
      });
    }
  }

  // Sort by occurredAt desc, limit
  items.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  return items.slice(0, limit);
}
