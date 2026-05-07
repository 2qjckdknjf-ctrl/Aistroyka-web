import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import type { ClientProjectView } from "@/lib/domain/client-portal/client-portal.types";
import { getClientProjectView } from "@/lib/domain/client-portal/client-portal.service";
import { getProjectSummary, type ProjectSummary } from "@/lib/domain/projects/project-summary.repository";
import * as projectRepo from "@/lib/domain/projects/project.repository";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import type { DailyDigestLine, DailyDigestPayload } from "./daily-digest.types";

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
  summary: ProjectSummary
): DailyDigestLine[] {
  const base = `/dashboard/projects/${projectId}`;
  const lines: DailyDigestLine[] = [];

  if (summary.tasksTotal > 0) {
    lines.push({
      id: `mgr:${projectId}:progress`,
      severity: "info",
      text: `${projectName}: ${summary.tasksDone}/${summary.tasksTotal} tasks completed; ${summary.tasksInProgress} in progress.`,
      href: base,
    });
  }

  if (summary.budgetOverBudget) {
    lines.push({
      id: `mgr:${projectId}:budget_over`,
      severity: "critical",
      text: `${projectName}: internal budget signals show actual above planned — review internal costs.`,
      href: `${base}?tab=costs`,
    });
  } else if (summary.budgetNearingLimit) {
    lines.push({
      id: `mgr:${projectId}:budget_near`,
      severity: "warning",
      text: `${projectName}: internal spend is near the planned ceiling — confirm cost control.`,
      href: `${base}?tab=costs`,
    });
  }

  if (summary.overdueMilestonesCount > 0) {
    lines.push({
      id: `mgr:${projectId}:milestones`,
      severity: summary.overdueMilestonesCount > 2 ? "critical" : "warning",
      text: `${projectName}: ${summary.overdueMilestonesCount} active milestone(s) past target date.`,
      href: `${base}?tab=schedule`,
    });
  }

  if (summary.pendingReportApprovalsCount > 0) {
    lines.push({
      id: `mgr:${projectId}:reports`,
      severity: "warning",
      text: `${projectName}: ${summary.pendingReportApprovalsCount} field report(s) awaiting review.`,
      href: `/dashboard/approvals`,
    });
  }

  if (summary.pendingDecisionsCount > 0) {
    lines.push({
      id: `mgr:${projectId}:documents`,
      severity: "warning",
      text: `${projectName}: ${summary.pendingDecisionsCount} document(s) in review queue.`,
      href: `${base}?tab=documents`,
    });
  }

  if (summary.openIssuesCount > 0) {
    lines.push({
      id: `mgr:${projectId}:issues`,
      severity: "warning",
      text: `${projectName}: ${summary.openIssuesCount} open issue(s) not resolved.`,
      href: base,
    });
  }

  if (summary.commercialOverdueCount > 0) {
    lines.push({
      id: `mgr:${projectId}:commercial`,
      severity: "warning",
      text: `${projectName}: ${summary.commercialOverdueCount} commercial record(s) overdue or need follow-up.`,
      href: `${base}?tab=estimate`,
    });
  }

  return sortDigestLines(lines);
}

/**
 * Customer-facing digest lines — only data already exposed in ClientProjectView.
 * No internal budget, planned/actual cost, margin, or internal overrun wording.
 */
export function buildOwnerDigestLinesFromClientView(view: ClientProjectView): DailyDigestLine[] {
  const { project, progress, milestones, decisions, client_requests, commercial_items, handover } = view;
  const projectId = project.id;
  const base = `/dashboard/projects/${projectId}/client`;
  const lines: DailyDigestLine[] = [];

  if (progress.tasks_total > 0) {
    lines.push({
      id: `own:${projectId}:progress`,
      severity: "info",
      text: `Progress: ${progress.tasks_done}/${progress.tasks_total} tasks marked complete for ${project.name}.`,
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
      text: `You have ${actionOpen.length} open item(s) awaiting your response or approval.`,
      href: base,
    });
  }

  if (decisions.length > 0) {
    lines.push({
      id: `own:${projectId}:decisions`,
      severity: "warning",
      text: `${decisions.length} shared document(s) need your review or follow-up.`,
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

  for (const m of upcoming) {
    lines.push({
      id: `own:${projectId}:ms:${m.id}`,
      severity: "info",
      text: `Upcoming milestone: ${m.title} · ${new Date(m.target_date).toLocaleDateString()}.`,
      href: base,
    });
  }

  const commercialAttention = commercial_items.filter((c) => c.status === "due" || c.status === "overdue");
  if (commercialAttention.length > 0) {
    lines.push({
      id: `own:${projectId}:commercial`,
      severity: "warning",
      text: `${commercialAttention.length} shared commercial record(s) need attention (due or overdue).`,
      href: base,
    });
  }

  if (handover && handover.status === "in_progress") {
    lines.push({
      id: `own:${projectId}:handover`,
      severity: "info",
      text: `Handover preparation is in progress for ${project.name}.`,
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
  projectName: string
): Promise<DailyDigestPayload> {
  if (!ctx.tenantId) {
    throw new Error("Tenant required");
  }
  const summary = await getProjectSummary(supabase, projectId, ctx.tenantId);
  const lines = buildManagerDigestLinesFromSummary(projectId, projectName, summary);
  return {
    audience: "manager",
    headline: `Daily control — ${projectName}`,
    generated_at: new Date().toISOString(),
    project_id: projectId,
    project_name: projectName,
    lines,
  };
}

export async function buildOwnerProjectDailyDigest(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: DailyDigestPayload | null; error: string }> {
  const { data: view, error } = await getClientProjectView(supabase, ctx, projectId);
  if (error || !view) {
    return { data: null, error: error || "Not available" };
  }
  const lines = buildOwnerDigestLinesFromClientView(view);
  return {
    data: {
      audience: "owner",
      headline: `Your project today — ${view.project.name}`,
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
  ctx: TenantContext
): Promise<PortfolioManagerDailyDigest | null> {
  if (!ctx.tenantId || !ctx.userId || !canManageProjects(ctx)) return null;

  const tenantId = ctx.tenantId;
  const projects = (await listProjectsForDigest(supabase, ctx)).slice(0, MAX_PORTFOLIO_PROJECTS);
  const merged: DailyDigestLine[] = [];

  for (const p of projects) {
    const summary = await getProjectSummary(supabase, p.id, tenantId);
    const lines = buildManagerDigestLinesFromSummary(p.id, p.name, summary);
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
    headline: "Daily control snapshot",
    generated_at: new Date().toISOString(),
    lines: sorted.slice(0, MAX_PORTFOLIO_LINES),
  };
}
