import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import {
  canReadClientPortalView,
  canRespondToClientRequests,
} from "@/lib/domain/stakeholders/stakeholders.policy";
import * as projectRepo from "@/lib/domain/projects/project.repository";
import { getProjectSummary } from "@/lib/domain/projects/project-summary.repository";
import * as milestoneRepo from "@/lib/domain/milestones/milestone.repository";
import * as docRepo from "@/lib/domain/documents/document.repository";
import { canManageClientPortalSettings } from "./client-portal.policy";
import type { ClientProjectView } from "./client-portal.types";
import * as crRepo from "@/lib/domain/client-requests/client-requests.repository";
import { rowToPublic as clientRequestToPublic } from "@/lib/domain/client-requests/client-requests.service";
import { listCustomerEstimates } from "@/lib/domain/customer-estimates/customer-estimates.service";
import type { CustomerEstimatePublic } from "@/lib/domain/customer-estimates/customer-estimates.types";
import { getHandoverPublicSummary } from "@/lib/domain/project-handover/project-handover.service";

/**
 * Project owner read model: only when `client_portal_enabled` is true.
 * Does not expose file paths, internal notes, or cost line items.
 */
export async function getClientProjectView(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: ClientProjectView | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };

  const project = await projectRepo.getById(supabase, projectId, ctx.tenantId);
  if (!project) return { data: null, error: "Project not found" };
  if (!(await canReadClientPortalView(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }

  const [summary, milestones, documents, estimatesRes] = await Promise.all([
    getProjectSummary(supabase, projectId, ctx.tenantId),
    milestoneRepo.listByProject(supabase, projectId, ctx.tenantId),
    docRepo.listByProject(supabase, projectId, ctx.tenantId),
    listCustomerEstimates(supabase, ctx, projectId, "customer"),
  ]);

  const visibleMilestones = milestones.filter(
    (m) => m.client_visible && m.status !== "archived"
  );
  const visibleDocs = documents.filter((d) => d.client_visible && d.status !== "archived");

  const decisions = visibleDocs
    .filter((d) => d.status === "under_review" || d.status === "changes_requested")
    .map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      kind:
        d.status === "changes_requested"
          ? ("changes_requested" as const)
          : ("document_review_needed" as const),
    }));

  const requestRows = await crRepo.listByProject(supabase, projectId, ctx.tenantId, { status: "all" });
  const client_requests = requestRows
    .filter((r) => r.status !== "cancelled")
    .slice(0, 50)
    .map(clientRequestToPublic);

  const can_respond_to_requests = await canRespondToClientRequests(supabase, ctx, projectId);

  const customer_estimates: CustomerEstimatePublic[] = estimatesRes.error
    ? []
    : (estimatesRes.data as CustomerEstimatePublic[]);

  const handoverRes = await getHandoverPublicSummary(supabase, ctx, projectId);
  const handover = handoverRes.error ? null : handoverRes.data;

  return {
    data: {
      project: { id: project.id, name: project.name },
      progress: {
        tasks_done: summary.tasksDone,
        tasks_total: summary.tasksTotal,
      },
      milestones: visibleMilestones.map((m) => ({
        id: m.id,
        title: m.title,
        target_date: m.target_date,
        status: m.status,
      })),
      documents: visibleDocs.map((d) => ({
        id: d.id,
        title: d.title,
        type: d.type,
        status: d.status,
        updated_at: d.updated_at,
      })),
      decisions,
      customer_estimates,
      client_requests,
      capabilities: { can_respond_to_requests },
      handover,
    },
    error: "",
  };
}

export async function updateClientPortalSettings(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  input: { client_portal_enabled?: boolean }
): Promise<{ data: { client_portal_enabled: boolean } | null; error: string }> {
  if (!(await canManageClientPortalSettings(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };

  const updated = await projectRepo.updateClientPortalSettings(supabase, projectId, ctx.tenantId, input);
  if (!updated) return { data: null, error: "Update failed" };

  return {
    data: {
      client_portal_enabled: updated.client_portal_enabled ?? false,
    },
    error: "",
  };
}
