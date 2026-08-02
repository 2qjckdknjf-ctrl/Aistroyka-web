import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { getClientProjectView } from "@/lib/domain/client-portal/client-portal.service";
import type { ClientProjectView } from "@/lib/domain/client-portal/client-portal.types";
import { getProjectSummary } from "@/lib/domain/projects/project-summary.repository";
import * as projectRepo from "@/lib/domain/projects/project.repository";
import { listDefects } from "@/lib/domain/defects/defects.service";
import type { DefectListItem } from "@/lib/domain/defects/defects.types";
import type { HandoverReadinessResult } from "./project-handover.types";
import { computeHandoverReadiness } from "./handover-readiness";
import { canManageProjectHandover, canReadProjectHandover } from "./project-handover.policy";
import type {
  HandoverManagerPackPayload,
  HandoverOwnerPackPayload,
  HandoverPackSection,
  HandoverPackTranslate,
} from "./handover-pack.types";

function terminalDefectStatuses(s: string): boolean {
  return s === "closed" || s === "resolved";
}

function translateMilestoneStatus(status: string, t: HandoverPackTranslate): string {
  const normalized = status.trim().toLowerCase().replace(/-/g, "_").replace(/\s+/g, "_");
  const key = `milestoneStatus_${normalized}`;
  const label = t(key);
  const missing = label === key || label === `handoverPack.${key}`;
  if (missing) return t("milestoneStatus_unknown", { status });
  return label;
}

function translateDecisionKind(kind: string, t: HandoverPackTranslate): string {
  const key = `decisionKind_${kind}`;
  const label = t(key);
  const missing = label === key || label === `handoverPack.${key}`;
  if (missing) return kind;
  return label;
}

function localizeReadiness(readiness: HandoverReadinessResult, t: HandoverPackTranslate): HandoverReadinessResult {
  return {
    ready: readiness.ready,
    blockers: readiness.blockers.map((b) => {
      const titleKey = `readinessBlocker_${b.code}_title`;
      const detailKey = `readinessBlocker_${b.code}_detail`;
      const titleT = t(titleKey);
      const detailT = t(detailKey);
      const titleMissing =
        titleT === titleKey || titleT === `handoverPack.${titleKey}`;
      const detailMissing =
        detailT === detailKey || detailT === `handoverPack.${detailKey}`;
      return {
        ...b,
        title: titleMissing ? b.title : titleT,
        detail: detailMissing ? b.detail : detailT,
      };
    }),
  };
}

function sectionsFromClientView(
  view: ClientProjectView,
  projectId: string,
  defects: DefectListItem[],
  t: HandoverPackTranslate
): HandoverPackSection[] {
  const clientBase = `/dashboard/projects/${projectId}/client`;
  const sections: HandoverPackSection[] = [];

  sections.push({
    id: "progress",
    summary: t("summaryProgress", { done: view.progress.tasks_done, total: view.progress.tasks_total }),
    href: clientBase,
  });

  if (view.milestones.length > 0) {
    sections.push({
      id: "milestones",
      summary: t("summaryMilestones", { count: view.milestones.length }),
      lines: view.milestones
        .slice(0, 12)
        .map((m) =>
          t("lineMilestone", { title: m.title, status: translateMilestoneStatus(m.status, t) })
        ),
      href: clientBase,
    });
  }

  const docApproved = view.documents.filter((d) => d.status === "approved").length;
  const docPending = view.documents.length - docApproved;
  sections.push({
    id: "documents",
    summary: t("summaryDocuments", {
      total: view.documents.length,
      approved: docApproved,
      pending: docPending,
    }),
    href: clientBase,
  });

  if (view.customer_estimates.length > 0) {
    sections.push({
      id: "estimates",
      summary: t("summaryEstimates", { count: view.customer_estimates.length }),
      href: clientBase,
    });
  }

  if (view.decisions.length > 0) {
    sections.push({
      id: "decisions",
      summary: t("summaryDecisions", { count: view.decisions.length }),
      lines: view.decisions
        .slice(0, 8)
        .map((d) =>
          t("lineDecision", { title: d.title, kind: translateDecisionKind(d.kind, t) })
        ),
      href: clientBase,
    });
  }

  const openRequests = view.client_requests.filter((r) => r.status === "open").length;
  if (view.client_requests.length > 0) {
    sections.push({
      id: "requests",
      summary: t("summaryRequests", { open: openRequests, total: view.client_requests.length }),
      href: clientBase,
    });
  }

  const openDef = defects.filter((d) => !terminalDefectStatuses(d.status)).length;
  const closedDef = defects.length - openDef;
  sections.push({
    id: "punch_list",
    summary:
      defects.length === 0
        ? t("punchListEmpty")
        : t("punchListSummary", { open: openDef, closed: closedDef }),
    href: `${clientBase}/defects`,
  });

  return sections;
}

function minimalSectionsFromSummary(
  projectId: string,
  projectName: string,
  tasksDone: number,
  tasksTotal: number,
  defects: DefectListItem[],
  t: HandoverPackTranslate
): HandoverPackSection[] {
  const openDef = defects.filter((d) => !terminalDefectStatuses(d.status)).length;
  return [
    {
      id: "progress",
      summary: t("minimalProgress", {
        projectName,
        done: tasksDone,
        total: tasksTotal,
      }),
      href: `/dashboard/projects/${projectId}`,
    },
    {
      id: "punch_list",
      summary:
        defects.length === 0 ? t("minimalPunchEmpty") : t("minimalPunchSummary", { open: openDef, total: defects.length }),
      href: `/dashboard/projects/${projectId}?tab=defects`,
    },
    {
      id: "portal_note",
      summary: t("minimalPortalNote"),
      href: `/dashboard/projects/${projectId}`,
    },
  ];
}

export async function buildOwnerHandoverPack(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  translate: HandoverPackTranslate
): Promise<{ data: HandoverOwnerPackPayload | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canReadProjectHandover(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }

  const viewRes = await getClientProjectView(supabase, ctx, projectId);
  if (!viewRes.data) return { data: null, error: viewRes.error || "Client portal view not available" };

  const defectsRes = await listDefects(supabase, ctx, projectId);
  const defects = defectsRes.data ?? [];

  const sections = sectionsFromClientView(viewRes.data, projectId, defects, translate);
  const h = viewRes.data.handover;

  return {
    data: {
      audience: "owner",
      generated_at: new Date().toISOString(),
      project: viewRes.data.project,
      handover: h
        ? {
            status: h.status,
            handover_notes: h.handover_notes,
            handed_over_at: h.handed_over_at,
            completed_at: h.completed_at,
          }
        : null,
      sections,
    },
    error: "",
  };
}

export async function buildManagerHandoverPack(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  translate: HandoverPackTranslate
): Promise<{ data: HandoverManagerPackPayload | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!(await canManageProjectHandover(supabase, ctx, projectId))) {
    return { data: null, error: "Insufficient rights" };
  }

  const project = await projectRepo.getById(supabase, projectId, ctx.tenantId);
  if (!project) return { data: null, error: "Project not found" };

  const [readinessRaw, viewRes, defectsRes, summary] = await Promise.all([
    computeHandoverReadiness(supabase, projectId, ctx.tenantId),
    getClientProjectView(supabase, ctx, projectId),
    listDefects(supabase, ctx, projectId),
    getProjectSummary(supabase, projectId, ctx.tenantId),
  ]);

  const readiness = localizeReadiness(readinessRaw, translate);

  const defects = defectsRes.data ?? [];
  let sections: HandoverPackSection[];
  let portal_preview_full: boolean;

  if (viewRes.data) {
    sections = sectionsFromClientView(viewRes.data, projectId, defects, translate);
    portal_preview_full = true;
  } else {
    sections = minimalSectionsFromSummary(
      projectId,
      project.name,
      summary.tasksDone,
      summary.tasksTotal,
      defects,
      translate
    );
    portal_preview_full = false;
  }

  return {
    data: {
      audience: "manager",
      generated_at: new Date().toISOString(),
      project: { id: project.id, name: project.name },
      readiness,
      sections,
      portal_preview_full,
    },
    error: "",
  };
}
