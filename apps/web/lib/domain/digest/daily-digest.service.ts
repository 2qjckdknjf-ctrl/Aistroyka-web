import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import type { ClientProjectView } from "@/lib/domain/client-portal/client-portal.types";
import { getClientProjectView } from "@/lib/domain/client-portal/client-portal.service";
import { getProjectSummary, type ProjectSummary } from "@/lib/domain/projects/project-summary.repository";
import * as projectRepo from "@/lib/domain/projects/project.repository";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import type { DailyDigestLine, DailyDigestPayload, DailyDigestTranslate } from "./daily-digest.types";

const SEVERITY_RANK: Record<DailyDigestLine["severity"], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function sortDigestLines(lines: DailyDigestLine[]): DailyDigestLine[] {
  return [...lines].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

/**
 * Manager-only lines from operational summary (includes internal budget pressure signals).
 */
export function buildManagerDigestLinesFromSummary(
  projectId: string,
  projectName: string,
  summary: ProjectSummary,
  t: DailyDigestTranslate
): DailyDigestLine[] {
  const base = `/dashboard/projects/${projectId}`;
  const lines: DailyDigestLine[] = [];

  if (summary.tasksTotal > 0) {
    lines.push({
      id: `mgr:${projectId}:progress`,
      severity: "info",
      text: t("mgrLine_progress", {
        projectName,
        done: summary.tasksDone,
        total: summary.tasksTotal,
        inProgress: summary.tasksInProgress,
      }),
      href: base,
    });
  }

  if (summary.budgetOverBudget) {
    lines.push({
      id: `mgr:${projectId}:budget_over`,
      severity: "critical",
      text: t("mgrLine_budget_over", { projectName }),
      href: `${base}?tab=costs`,
    });
  } else if (summary.budgetNearingLimit) {
    lines.push({
      id: `mgr:${projectId}:budget_near`,
      severity: "warning",
      text: t("mgrLine_budget_near", { projectName }),
      href: `${base}?tab=costs`,
    });
  }

  if (summary.overdueMilestonesCount > 0) {
    lines.push({
      id: `mgr:${projectId}:milestones`,
      severity: summary.overdueMilestonesCount > 2 ? "critical" : "warning",
      text: t("mgrLine_milestones", { projectName, count: summary.overdueMilestonesCount }),
      href: `${base}?tab=schedule`,
    });
  }

  if (summary.pendingReportApprovalsCount > 0) {
    lines.push({
      id: `mgr:${projectId}:reports`,
      severity: "warning",
      text: t("mgrLine_reports", { projectName, count: summary.pendingReportApprovalsCount }),
      href: `/dashboard/approvals`,
    });
  }

  if (summary.pendingDecisionsCount > 0) {
    lines.push({
      id: `mgr:${projectId}:documents`,
      severity: "warning",
      text: t("mgrLine_documents", { projectName, count: summary.pendingDecisionsCount }),
      href: `${base}?tab=documents`,
    });
  }

  if (summary.openIssuesCount > 0) {
    lines.push({
      id: `mgr:${projectId}:issues`,
      severity: "warning",
      text: t("mgrLine_issues", { projectName, count: summary.openIssuesCount }),
      href: base,
    });
  }

  if (summary.commercialOverdueCount > 0) {
    lines.push({
      id: `mgr:${projectId}:commercial`,
      severity: "warning",
      text: t("mgrLine_commercial", { projectName, count: summary.commercialOverdueCount }),
      href: `${base}?tab=estimate`,
    });
  }

  return sortDigestLines(lines);
}

/**
 * Customer-facing digest lines — only data already exposed in ClientProjectView.
 * No internal budget, planned/actual cost, margin, or internal overrun wording.
 */
export function buildOwnerDigestLinesFromClientView(
  view: ClientProjectView,
  t: DailyDigestTranslate,
  locale: string
): DailyDigestLine[] {
  const { project, progress, milestones, decisions, client_requests, handover } = view;
  const projectId = project.id;
  const base = `/dashboard/projects/${projectId}/client`;
  const lines: DailyDigestLine[] = [];

  if (progress.tasks_total > 0) {
    lines.push({
      id: `own:${projectId}:progress`,
      severity: "info",
      text: t("ownLine_progress", {
        done: progress.tasks_done,
        total: progress.tasks_total,
        projectName: project.name,
      }),
      href: base,
    });
  }

  const actionOpen = client_requests.filter(
    (r) => r.status === "open" && r.action_mode === "action_required"
  );
  if (actionOpen.length > 0) {
    lines.push({
      id: `own:${projectId}:requests`,
      severity: actionOpen.length > 2 ? "warning" : "info",
      text: t("ownLine_requests", { count: actionOpen.length }),
      href: base,
    });
  }

  if (decisions.length > 0) {
    lines.push({
      id: `own:${projectId}:decisions`,
      severity: "warning",
      text: t("ownLine_decisions", { count: decisions.length }),
      href: base,
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [...milestones]
    .filter((m) => {
      const d = String(m.target_date).slice(0, 10);
      const closed = ["done", "completed", "archived"].includes((m.status ?? "").toLowerCase());
      return d >= today && !closed;
    })
    .sort((a, b) => String(a.target_date).localeCompare(String(b.target_date)))
    .slice(0, 2);

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });

  for (const m of upcoming) {
    lines.push({
      id: `own:${projectId}:ms:${m.id}`,
      severity: "info",
      text: t("ownLine_milestone", { title: m.title, date: dateFmt(m.target_date) }),
      href: base,
    });
  }

  const nowIso = new Date().toISOString();
  const commercialAttention = client_requests.filter(
    (r) =>
      r.status === "open" &&
      (r.decision_type === "estimate_approval" || r.decision_type === "cost_change_customer_facing") &&
      r.due_at != null &&
      r.due_at < nowIso
  );
  if (commercialAttention.length > 0) {
    lines.push({
      id: `own:${projectId}:commercial`,
      severity: "warning",
      text: t("ownLine_commercial", { count: commercialAttention.length }),
      href: base,
    });
  }

  if (handover && handover.status === "in_progress") {
    lines.push({
      id: `own:${projectId}:handover`,
      severity: "info",
      text: t("ownLine_handover", { projectName: project.name }),
      href: base,
    });
  }

  return sortDigestLines(lines);
}

async function listProjectsForDigest(supabase: SupabaseClient, ctx: TenantContext) {
  if (!ctx.tenantId || !ctx.userId) return [];
  if (ctx.role === "owner" || ctx.role === "admin") {
    return projectRepo.listByTenant(supabase, ctx.tenantId);
  }
  return projectRepo.listByUserMembership(supabase, ctx.tenantId, ctx.userId);
}

export async function buildManagerProjectDailyDigest(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  projectName: string,
  t: DailyDigestTranslate
): Promise<DailyDigestPayload> {
  if (!ctx.tenantId) {
    throw new Error("Tenant required");
  }
  const summary = await getProjectSummary(supabase, projectId, ctx.tenantId);
  const lines = buildManagerDigestLinesFromSummary(projectId, projectName, summary, t);
  return {
    audience: "manager",
    headline: t("mgrHeadline_project", { projectName }),
    generated_at: new Date().toISOString(),
    project_id: projectId,
    project_name: projectName,
    lines,
  };
}

export async function buildOwnerProjectDailyDigest(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  t: DailyDigestTranslate,
  locale: string
): Promise<{ data: DailyDigestPayload | null; error: string }> {
  const { data: view, error } = await getClientProjectView(supabase, ctx, projectId);
  if (error || !view) {
    return { data: null, error: error || "Not available" };
  }
  const lines = buildOwnerDigestLinesFromClientView(view, t, locale);
  return {
    data: {
      audience: "owner",
      headline: t("ownHeadline", { projectName: view.project.name }),
      generated_at: new Date().toISOString(),
      project_id: view.project.id,
      project_name: view.project.name,
      lines,
    },
    error: "",
  };
}

const MAX_PORTFOLIO_PROJECTS = 3;
const MAX_PORTFOLIO_LINES = 10;

export interface PortfolioManagerDailyDigest {
  headline: string;
  generated_at: string;
  lines: DailyDigestLine[];
}

export async function buildManagerPortfolioDailyDigest(
  supabase: SupabaseClient,
  ctx: TenantContext,
  t: DailyDigestTranslate
): Promise<PortfolioManagerDailyDigest | null> {
  if (!ctx.tenantId || !ctx.userId || !canManageProjects(ctx)) return null;

  const tenantId = ctx.tenantId;
  const projects = (await listProjectsForDigest(supabase, ctx)).slice(0, MAX_PORTFOLIO_PROJECTS);
  const merged: DailyDigestLine[] = [];

  for (const p of projects) {
    const summary = await getProjectSummary(supabase, p.id, tenantId);
    const lines = buildManagerDigestLinesFromSummary(p.id, p.name, summary, t);
    for (const line of lines) {
      merged.push({
        ...line,
        id: `${p.id}:${line.id}`,
        text: line.text.startsWith(`${p.name}:`) ? line.text : `${p.name}: ${line.text}`,
      });
    }
  }

  const sorted = sortDigestLines(merged);
  return {
    headline: t("mgrHeadline_portfolio"),
    generated_at: new Date().toISOString(),
    lines: sorted.slice(0, MAX_PORTFOLIO_LINES),
  };
}
