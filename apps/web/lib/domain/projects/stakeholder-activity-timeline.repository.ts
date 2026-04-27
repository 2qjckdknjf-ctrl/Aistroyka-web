/**
 * Stakeholder / portal activity timeline — normalized read model (Wave 4 Step 9).
 * Sources: project_client_request_events, project_stakeholders (manager + self).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import * as crRepo from "@/lib/domain/client-requests/client-requests.repository";
import type { ClientRequestEventType } from "@/lib/domain/client-requests/client-requests.types";
import * as sdRepo from "@/lib/domain/stakeholder-discussions/stakeholder-discussions.repository";
import * as coRepo from "@/lib/domain/change-orders/change-orders.repository";
import * as handoverRepo from "@/lib/domain/project-handover/project-handover.repository";
import * as shRepo from "@/lib/domain/stakeholders/stakeholders.repository";
import type {
  StakeholderActivityItem,
  StakeholderActivityEventType,
} from "./stakeholder-activity-timeline.types";

function mapClientRequestEventType(t: ClientRequestEventType): StakeholderActivityEventType | null {
  switch (t) {
    case "created":
      return "client_request_created";
    case "responded":
      return "client_request_responded";
    case "completed":
      return "client_request_completed";
    case "cancelled":
      return "client_request_cancelled";
    case "updated":
      return "client_request_updated";
    default:
      return null;
  }
}

function titleForClientRequestEvent(
  eventType: StakeholderActivityEventType,
  requestTitle: string
): string {
  switch (eventType) {
    case "client_request_created":
      return `Request created: ${requestTitle}`;
    case "client_request_responded":
      return `Response received: ${requestTitle}`;
    case "client_request_completed":
      return `Request completed: ${requestTitle}`;
    case "client_request_cancelled":
      return `Request cancelled: ${requestTitle}`;
    case "client_request_updated":
      return `Request updated: ${requestTitle}`;
    default:
      return requestTitle;
  }
}

export async function getStakeholderActivityTimeline(
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    projectId: string;
    viewer: "manager" | "stakeholder";
    userId: string;
    limit?: number;
  }
): Promise<StakeholderActivityItem[]> {
  const { tenantId, projectId, viewer, userId } = params;
  const limit = Math.min(params.limit ?? 50, 100);
  const baseUrl = `/dashboard/projects/${projectId}`;
  const portalRequestsUrl = `${baseUrl}/client`;

  const items: StakeholderActivityItem[] = [];

  const events = await crRepo.listEventsForProject(supabase, projectId, tenantId, { limit: 250 });
  const requestIds = [...new Set(events.map((e) => e.request_id))];
  let titleById = new Map<string, string>();
  let metaById = new Map<
    string,
    { status: string; action_mode: string }
  >();

  if (requestIds.length > 0) {
    const { data: reqRows } = await supabase
      .from("project_client_requests")
      .select("id, title, status, action_mode")
      .eq("tenant_id", tenantId)
      .in("id", requestIds);
    for (const r of reqRows ?? []) {
      const row = r as { id: string; title: string; status: string; action_mode: string };
      titleById.set(row.id, row.title);
      metaById.set(row.id, { status: row.status, action_mode: row.action_mode });
    }
  }

  const handoverEvents = await handoverRepo.listRecentEventsForTimeline(supabase, projectId, tenantId, { limit: 15 });
  for (const he of handoverEvents) {
    const eventType =
      he.to_status === "handover_ready"
        ? ("handover_ready" as const)
        : he.to_status === "handed_over"
          ? ("handed_over" as const)
          : he.to_status === "completed"
            ? ("project_completed" as const)
            : null;
    if (!eventType) continue;
    const title =
      he.to_status === "handover_ready"
        ? "Project ready for handover"
        : he.to_status === "handed_over"
          ? "Project handed over to client"
          : "Project marked completed";
    items.push({
      id: `hv:${he.created_at}:${he.to_status}`,
      eventType,
      occurredAt: he.created_at,
      title,
      description: null,
      projectId,
      targetUrl: portalRequestsUrl,
      actorId: null,
      visibility: "both",
      actionNeeded: false,
    });
  }

  const changeOrders = await coRepo.listForTimeline(supabase, projectId, tenantId, { limit: 40 });
  const changeOrdersUrl = `${baseUrl}/client/change-orders`;
  for (const co of changeOrders) {
    items.push({
      id: `co:open:${co.id}`,
      eventType: "change_order_opened",
      occurredAt: co.created_at,
      title: `Change order: ${co.title}`,
      description: co.status.replace(/_/g, " "),
      projectId,
      targetUrl: `${changeOrdersUrl}/${co.id}`,
      actorId: null,
      visibility: "both",
      actionNeeded: false,
    });
    if (co.implemented_at) {
      items.push({
        id: `co:impl:${co.id}`,
        eventType: "change_order_implemented",
        occurredAt: co.implemented_at,
        title: `Change order implemented: ${co.title}`,
        description: null,
        projectId,
        targetUrl: `${changeOrdersUrl}/${co.id}`,
        actorId: null,
        visibility: "both",
        actionNeeded: false,
      });
    }
  }

  const discussions = await sdRepo.listForTimeline(supabase, projectId, tenantId, { limit: 40 });
  const discussionsUrl = `${baseUrl}/client/discussions`;
  for (const disc of discussions) {
    items.push({
      id: `sd:open:${disc.id}`,
      eventType: "discussion_opened",
      occurredAt: disc.created_at,
      title: `Discussion opened: ${disc.title}`,
      description: null,
      projectId,
      targetUrl: `${discussionsUrl}/${disc.id}`,
      actorId: null,
      visibility: "both",
      actionNeeded:
        disc.status === "awaiting_stakeholder" && viewer === "stakeholder",
    });
    if (disc.resolved_at) {
      items.push({
        id: `sd:res:${disc.id}`,
        eventType: "discussion_resolved",
        occurredAt: disc.resolved_at,
        title: `Discussion resolved: ${disc.title}`,
        description: null,
        projectId,
        targetUrl: `${discussionsUrl}/${disc.id}`,
        actorId: null,
        visibility: "both",
        actionNeeded: false,
      });
    }
  }

  for (const ev of events) {
    const mapped = mapClientRequestEventType(ev.event_type);
    if (!mapped) continue;
    if (mapped === "client_request_updated" && viewer === "stakeholder") {
      continue;
    }
    const title = titleForClientRequestEvent(mapped, titleById.get(ev.request_id) ?? "Request");
    const meta = metaById.get(ev.request_id);
    const isUpdatedInternal = mapped === "client_request_updated";
    const actionNeeded =
      mapped === "client_request_created" &&
      meta?.status === "open" &&
      meta?.action_mode === "action_required";

    items.push({
      id: `cr:${ev.id}`,
      eventType: mapped,
      occurredAt: ev.created_at,
      title,
      description: null,
      projectId,
      targetUrl: portalRequestsUrl,
      actorId: ev.actor_user_id,
      visibility: isUpdatedInternal ? "internal" : "both",
      actionNeeded,
    });
  }

  if (viewer === "manager") {
    const stakeholders = await shRepo.listByProject(supabase, tenantId, projectId);
    for (const s of stakeholders) {
      items.push({
        id: `sh:invite:${s.id}`,
        eventType: "stakeholder_invite_sent",
        occurredAt: s.created_at,
        title: `Invitation sent: ${s.email}`,
        description: s.status === "invited" ? "Pending acceptance" : null,
        projectId,
        targetUrl: `${baseUrl}?tab=activity`,
        actorId: null,
        visibility: "internal",
        actionNeeded: s.status === "invited",
      });
      if (s.accepted_at && s.status === "active") {
        items.push({
          id: `sh:join:${s.id}`,
          eventType: "stakeholder_joined_portal",
          occurredAt: s.accepted_at,
          title: `Stakeholder joined portal: ${s.email}`,
          description: null,
          projectId,
          targetUrl: `${baseUrl}?tab=activity`,
          actorId: s.user_id,
          visibility: "internal",
          actionNeeded: false,
        });
      }
    }
  } else {
    const self = await shRepo.getActiveForUserOnProject(supabase, tenantId, projectId, userId);
    if (self?.accepted_at && self.status === "active") {
      items.push({
        id: `sh:self:${self.id}`,
        eventType: "stakeholder_joined_portal",
        occurredAt: self.accepted_at,
        title: "You joined the client portal",
        description: null,
        projectId,
        targetUrl: portalRequestsUrl,
        actorId: null,
        visibility: "stakeholder",
        actionNeeded: false,
      });
    }
  }

  items.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  return items.slice(0, limit);
}

/** Strip internal-only rows and sensitive fields for stakeholder API responses. */
export function shapeStakeholderAudience(items: StakeholderActivityItem[]): Omit<
  StakeholderActivityItem,
  "actorId" | "visibility"
>[] {
  return items
    .filter((i) => i.visibility === "stakeholder" || i.visibility === "both")
    .map(({ actorId: _a, visibility: _v, ...rest }) => rest);
}

/** Manager response includes full audit rows (still excludes nothing except visibility is unused in JSON). */
export function shapeManagerAudience(items: StakeholderActivityItem[]): StakeholderActivityItem[] {
  return items;
}
