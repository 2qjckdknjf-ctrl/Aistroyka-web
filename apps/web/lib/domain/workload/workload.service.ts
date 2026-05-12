import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import * as projectRepo from "@/lib/domain/projects/project.repository";
import { getProjectSummary } from "@/lib/domain/projects/project-summary.repository";
import { computeHandoverReadinessFromSummary } from "@/lib/domain/project-handover/handover-readiness";
import type { HandoverBlocker } from "@/lib/domain/project-handover/project-handover.types";
import { listActiveProjectIdsForUser } from "@/lib/domain/stakeholders/stakeholders.repository";
import { buildPortfolioControl } from "@/lib/domain/portfolio/portfolio-control.service";
import { listGovernanceCases, ACTIVE_STATUSES } from "@/lib/domain/governance/governance.repository";
import type { GovernanceCaseStatus } from "@/lib/domain/governance/governance.types";
import { listRecentFiresForWorkload } from "@/lib/domain/recurring-operations/recurring-operations.repository";
import { humanRuleLabel } from "@/lib/domain/recurring-operations/recurring-operations.governance";
import type { RecurringRuleKind } from "@/lib/domain/recurring-operations/recurring-operations.types";
import type { WorkloadAudience, WorkloadInboxResult, WorkloadItem, WorkloadKind } from "./workload.types";
import {
  dueStateForManager,
  dueStateStakeholder,
  priorityForManagerSignal,
  priorityStakeholder,
  statusBucketFor,
} from "./workload.governance";

const MAX_PROJECTS = 25;

function countBlocker(blockers: HandoverBlocker[], code: string): number {
  return blockers.find((b) => b.code === code)?.count ?? 0;
}

async function listInternalProjects(supabase: SupabaseClient, ctx: TenantContext) {
  if (!ctx.tenantId || !ctx.userId) return [];
  if (ctx.role === "owner" || ctx.role === "admin") {
    return projectRepo.listByTenant(supabase, ctx.tenantId);
  }
  return projectRepo.listByUserMembership(supabase, ctx.tenantId, ctx.userId);
}

type DiscussionRow = { id: string; project_id: string; title: string };

async function discussionsGrouped(
  supabase: SupabaseClient,
  tenantId: string,
  projectIds: string[],
  status: "awaiting_manager" | "awaiting_stakeholder"
): Promise<Map<string, DiscussionRow[]>> {
  const map = new Map<string, DiscussionRow[]>();
  if (projectIds.length === 0) return map;
  const { data, error } = await supabase
    .from("project_stakeholder_discussions")
    .select("id, project_id, title")
    .eq("tenant_id", tenantId)
    .in("project_id", projectIds)
    .eq("status", status);
  if (error) return map;
  for (const row of (data ?? []) as DiscussionRow[]) {
    const list = map.get(row.project_id) ?? [];
    list.push(row);
    map.set(row.project_id, list);
  }
  return map;
}

async function clientRequestsOpenGrouped(
  supabase: SupabaseClient,
  tenantId: string,
  projectIds: string[]
): Promise<Map<string, { id: string; title: string; due_at: string | null }[]>> {
  const map = new Map<string, { id: string; title: string; due_at: string | null }[]>();
  if (projectIds.length === 0) return map;
  const { data, error } = await supabase
    .from("project_client_requests")
    .select("id, project_id, title, due_at")
    .eq("tenant_id", tenantId)
    .in("project_id", projectIds)
    .eq("status", "open")
    .eq("action_mode", "action_required");
  if (error) return map;
  for (const row of (data ?? []) as {
    id: string;
    project_id: string;
    title: string;
    due_at: string | null;
  }[]) {
    const list = map.get(row.project_id) ?? [];
    list.push({ id: row.id, title: row.title, due_at: row.due_at });
    map.set(row.project_id, list);
  }
  return map;
}

function workloadKindForRecurringRule(kind: string): WorkloadKind | null {
  const m: Record<string, WorkloadKind> = {
    handover_blocked_followup: "recurring_handover_nudge",
    blocking_defects_followup: "recurring_defects_nudge",
    stale_discussion_manager: "recurring_discussion_stale",
    aftercare_open_review: "recurring_aftercare_review",
  };
  return m[kind] ?? null;
}

function actionUrlForRecurringRule(projectId: string, kind: RecurringRuleKind): string {
  const base = `/dashboard/projects/${projectId}`;
  switch (kind) {
    case "blocking_defects_followup":
      return `${base}?tab=defects`;
    case "aftercare_open_review":
      return `${base}?tab=aftercare`;
    case "stale_discussion_manager":
      return `${base}/client/discussions`;
    default:
      return base;
  }
}

async function appendRecurringAutomationWorkload(
  supabase: SupabaseClient,
  tenantId: string,
  allowedProjectIds: Set<string>
): Promise<WorkloadItem[]> {
  const rows = await listRecentFiresForWorkload(supabase, tenantId, 7);
  const out: WorkloadItem[] = [];
  for (const r of rows) {
    if (!r.project_id || !allowedProjectIds.has(r.project_id)) continue;
    const wk = workloadKindForRecurringRule(r.rule_kind);
    if (!wk) continue;
    const rk = r.rule_kind as RecurringRuleKind;
    const pname = r.project_name ?? "Project";
    out.push({
      id: `recurring:${r.rule_kind}:${r.project_id}:${r.fired_at}`,
      audience: "manager",
      kind: wk,
      priority: "high",
      title: `Automation reminder — ${humanRuleLabel(rk)} — ${pname}`,
      reason: `Raised by recurring rule "${r.rule_kind}" (last fired ${r.fired_at.slice(0, 10)}). Review while the condition still applies.`,
      project_id: r.project_id,
      project_name: pname,
      linked_entity_type: "recurring_rule",
      linked_entity_id: r.rule_kind,
      action_url: actionUrlForRecurringRule(r.project_id, rk),
      due_state: "waiting_on_team",
      status_bucket: "review",
    });
  }
  return out;
}

async function aftercareCountsByProject(
  supabase: SupabaseClient,
  tenantId: string,
  projectIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (projectIds.length === 0) return counts;
  const { data, error } = await supabase
    .from("project_service_requests")
    .select("project_id")
    .eq("tenant_id", tenantId)
    .in("project_id", projectIds)
    .neq("status", "closed");
  if (error) return counts;
  for (const row of (data ?? []) as { project_id: string }[]) {
    counts.set(row.project_id, (counts.get(row.project_id) ?? 0) + 1);
  }
  return counts;
}

export async function buildManagerWorkload(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<WorkloadInboxResult> {
  if (!ctx.tenantId || !canManageProjects(ctx)) {
    return { items: [], counts: { urgent: 0, high: 0, normal: 0 }, audience: "manager" };
  }

  const projects = (await listInternalProjects(supabase, ctx)).slice(0, MAX_PROJECTS);
  const tenantId = ctx.tenantId;
  const projectIds = projects.map((p) => p.id);

  const [discMgr, aftercareMap, clientReqMap] = await Promise.all([
    discussionsGrouped(supabase, tenantId, projectIds, "awaiting_manager"),
    aftercareCountsByProject(supabase, tenantId, projectIds),
    clientRequestsOpenGrouped(supabase, tenantId, projectIds),
  ]);

  const items: WorkloadItem[] = [];
  let totalPendingReports = 0;

  const summaries = await Promise.all(
    projects.map((p) => getProjectSummary(supabase, p.id, tenantId))
  );

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const summary = summaries[i];
    totalPendingReports += summary.pendingReportApprovalsCount;
  }

  if (totalPendingReports > 0) {
    items.push({
      id: `manager:pending_reports:${tenantId}`,
      audience: "manager",
      kind: "pending_reports_queue",
      priority: "high",
      title: `${totalPendingReports} field report(s) awaiting review`,
      reason: "Submitted reports need manager approval across your projects.",
      project_id: null,
      project_name: null,
      linked_entity_type: null,
      linked_entity_id: null,
      action_url: "/dashboard/approvals",
      due_state: "waiting_on_team",
      status_bucket: statusBucketFor("high"),
    });
  }

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const summary = summaries[i];
    const handover = await computeHandoverReadinessFromSummary(supabase, p.id, tenantId, summary);
    const blockers = handover.blockers;
    const blockingDefects = countBlocker(blockers, "blocking_punch_defects");
    const aftercareN = aftercareMap.get(p.id) ?? 0;
    const clientReqs = clientReqMap.get(p.id) ?? [];

    const sig = {
      blockingDefects,
      budgetOverBudget: summary.budgetOverBudget,
      handoverBlockerCount: blockers.length,
      overdueMilestones: summary.overdueMilestonesCount,
      pendingDecisions: summary.pendingDecisionsCount,
      aftercareOpen: aftercareN,
    };
    const pri = priorityForManagerSignal(sig);
    const base = `/dashboard/projects/${p.id}`;

    if (summary.overdueMilestonesCount > 0) {
      items.push({
        id: `manager:overdue_milestones:${p.id}`,
        audience: "manager",
        kind: "overdue_milestones",
        priority: pri,
        title: `Overdue milestones — ${p.name}`,
        reason: `${summary.overdueMilestonesCount} active milestone(s) past target date.`,
        project_id: p.id,
        project_name: p.name,
        linked_entity_type: null,
        linked_entity_id: null,
        action_url: `${base}?tab=schedule`,
        due_state: dueStateForManager("overdue_milestones", summary.overdueMilestonesCount, 0),
        status_bucket: statusBucketFor(pri),
      });
    }

    if (summary.budgetOverBudget) {
      items.push({
        id: `manager:budget:${p.id}`,
        audience: "manager",
        kind: "budget_over_planned",
        priority: "urgent",
        title: `Budget over planned — ${p.name}`,
        reason: "Actual costs exceed planned total for this project.",
        project_id: p.id,
        project_name: p.name,
        linked_entity_type: null,
        linked_entity_id: null,
        action_url: `${base}?tab=costs`,
        due_state: "blocking",
        status_bucket: "risk",
      });
    }

    if (summary.pendingDecisionsCount > 0) {
      items.push({
        id: `manager:pending_docs:${p.id}`,
        audience: "manager",
        kind: "pending_document_decisions",
        priority: pri,
        title: `Documents awaiting decision — ${p.name}`,
        reason: `${summary.pendingDecisionsCount} document(s) under review need approval or rejection.`,
        project_id: p.id,
        project_name: p.name,
        linked_entity_type: null,
        linked_entity_id: null,
        action_url: `${base}?tab=documents`,
        due_state: "waiting_on_team",
        status_bucket: statusBucketFor(pri),
      });
    }

    if (blockingDefects > 0) {
      items.push({
        id: `manager:blocking_defects:${p.id}`,
        audience: "manager",
        kind: "blocking_punch_defects",
        priority: "urgent",
        title: `Blocking punch list — ${p.name}`,
        reason: `${blockingDefects} defect(s) marked as blocking handover.`,
        project_id: p.id,
        project_name: p.name,
        linked_entity_type: null,
        linked_entity_id: null,
        action_url: `${base}?tab=defects`,
        due_state: dueStateForManager("blocking_punch_defects", 0, blockingDefects),
        status_bucket: "risk",
      });
    }

    if (aftercareN > 0) {
      items.push({
        id: `manager:aftercare:${p.id}`,
        audience: "manager",
        kind: "aftercare_needs_action",
        priority: priorityForManagerSignal({ ...sig, aftercareOpen: aftercareN }),
        title: `Aftercare / warranty — ${p.name}`,
        reason: `${aftercareN} open service request(s) need triage or follow-up.`,
        project_id: p.id,
        project_name: p.name,
        linked_entity_type: null,
        linked_entity_id: null,
        action_url: `${base}?tab=aftercare`,
        due_state: "waiting_on_team",
        status_bucket: statusBucketFor(pri),
      });
    }

    if (clientReqs.length > 0) {
      const now = Date.now();
      const overdueReqs = clientReqs.filter((r) => r.due_at && new Date(r.due_at).getTime() < now);
      const hasOverdue = overdueReqs.length > 0;
      items.push({
        id: `manager:client_decisions:${p.id}`,
        audience: "manager",
        kind: "client_request_action",
        priority: hasOverdue ? "urgent" : pri,
        title: hasOverdue
          ? `Overdue customer decisions — ${p.name}`
          : `Customer decisions pending — ${p.name}`,
        reason: hasOverdue
          ? `${overdueReqs.length} decision request(s) past due · ${clientReqs.length} open total.`
          : `${clientReqs.length} customer decision request(s) are still open.`,
        project_id: p.id,
        project_name: p.name,
        linked_entity_type: "client_request",
        linked_entity_id: (overdueReqs[0] ?? clientReqs[0]).id,
        action_url: `${base}?tab=decisions`,
        due_state: hasOverdue ? "overdue" : "waiting_on_team",
        status_bucket: hasOverdue ? "risk" : statusBucketFor(pri),
      });
    }

    const discList = discMgr.get(p.id) ?? [];
    if (discList.length > 0) {
      items.push({
        id: `manager:disc_mgr:${p.id}`,
        audience: "manager",
        kind: "discussion_awaiting_manager",
        priority: pri,
        title: `Discussion needs your response — ${p.name}`,
        reason: `${discList.length} structured discussion(s) await the project team.`,
        project_id: p.id,
        project_name: p.name,
        linked_entity_type: "discussion",
        linked_entity_id: discList[0].id,
        action_url: `${base}/client/discussions/${discList[0].id}`,
        due_state: "waiting_on_team",
        status_bucket: statusBucketFor(pri),
      });
    }

    if (!handover.ready && blockers.length > 0) {
      items.push({
        id: `manager:handover:${p.id}`,
        audience: "manager",
        kind: "handover_not_ready",
        priority: blockers.length >= 3 ? "urgent" : "high",
        title: `Handover blocked — ${p.name}`,
        reason: `${blockers.length} readiness issue(s) before handover can complete.`,
        project_id: p.id,
        project_name: p.name,
        linked_entity_type: null,
        linked_entity_id: null,
        action_url: base,
        due_state: dueStateForManager("handover_not_ready", 0, 0),
        status_bucket: "risk",
      });
    }
  }

  const allowedIds = new Set(projects.map((p) => p.id));
  items.push(...(await appendRecurringAutomationWorkload(supabase, tenantId, allowedIds)));

  const counts = computeCounts(items);
  return { items: sortItems(items), counts, audience: "manager" };
}

function sortItems(items: WorkloadItem[]): WorkloadItem[] {
  const order = { urgent: 0, high: 1, normal: 2 };
  return [...items].sort((a, b) => order[a.priority] - order[b.priority] || (a.title > b.title ? 1 : -1));
}

function computeCounts(items: WorkloadItem[]): WorkloadInboxResult["counts"] {
  return {
    urgent: items.filter((i) => i.priority === "urgent").length,
    high: items.filter((i) => i.priority === "high").length,
    normal: items.filter((i) => i.priority === "normal").length,
  };
}

export async function buildStakeholderWorkload(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<WorkloadInboxResult> {
  if (!ctx.tenantId || !ctx.userId) {
    return { items: [], counts: { urgent: 0, high: 0, normal: 0 }, audience: "stakeholder" };
  }
  const ids = await listActiveProjectIdsForUser(supabase, ctx.tenantId, ctx.userId);
  const projects = await projectRepo.listByIds(supabase, ctx.tenantId, ids.slice(0, MAX_PROJECTS));
  const projectIds = projects.map((p) => p.id);

  const [reqMap, discSt] = await Promise.all([
    clientRequestsOpenGrouped(supabase, ctx.tenantId, projectIds),
    discussionsGrouped(supabase, ctx.tenantId, projectIds, "awaiting_stakeholder"),
  ]);

  const items: WorkloadItem[] = [];
  const basePri = priorityStakeholder();

  for (const p of projects) {
    const reqs = reqMap.get(p.id) ?? [];
    if (reqs.length > 0) {
      items.push({
        id: `stakeholder:client_req:${p.id}`,
        audience: "stakeholder",
        kind: "client_request_action",
        priority: basePri,
        title: `Client action needed — ${p.name}`,
        reason: `${reqs.length} open request(s) require your response.`,
        project_id: p.id,
        project_name: p.name,
        linked_entity_type: "client_request",
        linked_entity_id: reqs[0].id,
        action_url: `/dashboard/projects/${p.id}/client`,
        due_state: dueStateStakeholder(),
        status_bucket: "action_needed",
      });
    }
    const discs = discSt.get(p.id) ?? [];
    if (discs.length > 0) {
      items.push({
        id: `stakeholder:disc:${p.id}`,
        audience: "stakeholder",
        kind: "discussion_awaiting_stakeholder",
        priority: basePri,
        title: `Discussion needs you — ${p.name}`,
        reason: `${discs.length} topic(s) await your input.`,
        project_id: p.id,
        project_name: p.name,
        linked_entity_type: "discussion",
        linked_entity_id: discs[0].id,
        action_url: `/dashboard/projects/${p.id}/client/discussions/${discs[0].id}`,
        due_state: dueStateStakeholder(),
        status_bucket: "action_needed",
      });
    }
  }

  const counts = computeCounts(items);
  return { items: sortItems(items), counts, audience: "stakeholder" };
}

export async function buildLeadershipWorkload(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<WorkloadInboxResult> {
  if (!ctx.tenantId || (ctx.role !== "owner" && ctx.role !== "admin")) {
    return { items: [], counts: { urgent: 0, high: 0, normal: 0 }, audience: "leadership" };
  }
  const portfolio = await buildPortfolioControl(supabase, ctx);
  const items: WorkloadItem[] = [];
  for (const row of portfolio.projects) {
    if (row.portfolioState !== "critical") continue;
    items.push({
      id: `leadership:portfolio:${row.id}`,
      audience: "leadership",
      kind: "portfolio_critical",
      priority: "urgent",
      title: `Portfolio critical — ${row.name}`,
      reason: row.primaryReason,
      project_id: row.id,
      project_name: row.name,
      linked_entity_type: null,
      linked_entity_id: null,
      action_url: row.projectHref,
      due_state: "waiting_on_team",
      status_bucket: "risk",
    });
  }

  const govCases = await listGovernanceCases(supabase, ctx.tenantId, {
    status: [...ACTIVE_STATUSES] as GovernanceCaseStatus[],
    limit: 25,
  });
  for (const gc of govCases) {
    const pri =
      gc.severity === "critical" ? "urgent" : gc.severity === "high" ? "high" : "normal";
    const first = gc.projects[0];
    items.push({
      id: `governance:${gc.id}`,
      audience: "leadership",
      kind: "governance_escalation",
      priority: pri,
      title: `Governance case — ${gc.title}`,
      reason: gc.decision_required,
      project_id: first?.project_id ?? null,
      project_name: first?.project_name ?? null,
      linked_entity_type: "governance_case",
      linked_entity_id: gc.id,
      action_url: "/dashboard/governance",
      due_state: "waiting_on_team",
      status_bucket: "risk",
    });
  }

  const counts = computeCounts(items);
  return { items: sortItems(items), counts, audience: "leadership" };
}
