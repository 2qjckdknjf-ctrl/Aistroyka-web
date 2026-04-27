import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProjectSummary {
  activeWorkers: number;
  openReports: number;
  aiAnalyses: number;
  tasksTotal: number;
  tasksInProgress: number;
  tasksDone: number;
  milestonesCount: number;
  overdueMilestonesCount: number;
  pendingReportApprovalsCount: number;
  openIssuesCount: number;
  pendingDecisionsCount: number;
  budgetOverBudget: boolean;
  budgetNearingLimit: boolean;
  costLineOverrunCount: number;
  budgetItemCount: number;
  budgetCurrency: string;
  budgetPlannedTotal: number;
  budgetActualTotal: number;
  budgetVarianceAmount: number;
  commercialItemCount: number;
  commercialOverdueCount: number;
  commercialOutstandingAmount: number;
}

/**
 * Read-only aggregate counts for a project (tenant-scoped).
 * Used by dashboard project detail. RLS enforces tenant isolation.
 */
export async function getProjectSummary(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ProjectSummary> {
  const [
    { data: workerDays },
    dayIdsRes,
    tasksTotalRes,
    tasksDoneRes,
    tasksInProgressRes,
    milestonesRes,
    pendingApprovalsRes,
    issuesRes,
    docsUnderReviewRes,
    costItemsRes,
    commercialItemsRes,
  ] = await Promise.all([
    supabase
      .from("worker_day")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId),
    supabase
      .from("worker_day")
      .select("id")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId),
    supabase
      .from("worker_tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId),
    supabase
      .from("worker_tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .eq("status", "done"),
    supabase
      .from("worker_tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .in("status", ["in_progress", "in-progress", "active"]),
    supabase
      .from("project_milestones")
      .select("id, target_date, status")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId),
    supabase
      .from("worker_reports")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .eq("status", "submitted"),
    supabase
      .from("project_issues")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .not("status", "in", "(resolved,closed)"),
    supabase
      .from("project_documents")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId)
      .eq("status", "under_review"),
    supabase
      .from("project_cost_items")
      .select("planned_amount, actual_amount")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId),
    supabase
      .from("project_commercial_items")
      .select("amount, currency, status, due_date")
      .eq("project_id", projectId)
      .eq("tenant_id", tenantId),
  ]);

  const activeWorkers = new Set((workerDays ?? []).map((r) => r.user_id)).size;

  let openReports = 0;
  const dayIds = dayIdsRes.data ?? [];
  if (dayIds.length > 0) {
    const { count } = await supabase
      .from("worker_reports")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("status", ["draft", "submitted"])
      .in("day_id", dayIds.map((d) => d.id));
    openReports = count ?? 0;
  }

  let aiAnalyses = 0;
  const { data: mediaRows } = await supabase
    .from("media")
    .select("id")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId);
  if (mediaRows?.length) {
    const { count } = await supabase
      .from("analysis_jobs")
      .select("id", { count: "exact", head: true })
      .in("media_id", mediaRows.map((m) => m.id));
    aiAnalyses = count ?? 0;
  }

  const tasksTotal = tasksTotalRes.count ?? 0;
  const tasksDone = tasksDoneRes.count ?? 0;
  const tasksInProgress = tasksInProgressRes.count ?? 0;

  const milestones = (milestonesRes.data ?? []) as Array<{
    target_date?: string | null;
    status?: string | null;
  }>;
  const milestonesCount = milestones.length;
  const todayIso = new Date().toISOString().slice(0, 10);
  const overdueMilestonesCount = milestones.filter((m) => {
    const target = m.target_date ? String(m.target_date).slice(0, 10) : null;
    const status = (m.status ?? "").toLowerCase();
    const closed = status === "done" || status === "completed" || status === "archived";
    return Boolean(target && target < todayIso && !closed);
  }).length;

  const costItems = (costItemsRes.data ?? []) as Array<{
    planned_amount?: number | null;
    actual_amount?: number | null;
  }>;
  const plannedTotal = costItems.reduce((sum, row) => sum + (row.planned_amount ?? 0), 0);
  const actualTotal = costItems.reduce((sum, row) => sum + (row.actual_amount ?? 0), 0);
  const budgetItemCount = costItems.length;
  const costLineOverrunCount = costItems.filter(
    (row) => (row.actual_amount ?? 0) > (row.planned_amount ?? 0)
  ).length;
  const budgetOverBudget = budgetItemCount > 0 && actualTotal > plannedTotal;
  const budgetNearingLimit =
    budgetItemCount > 0 && !budgetOverBudget && plannedTotal > 0 && actualTotal / plannedTotal >= 0.9;

  const commercialItems = (commercialItemsRes.data ?? []) as Array<{
    amount?: number | null;
    currency?: string | null;
    status?: string | null;
    due_date?: string | null;
  }>;
  const budgetCurrency =
    commercialItems.find((row) => typeof row.currency === "string" && row.currency.length > 0)
      ?.currency ?? "RUB";
  const commercialItemCount = commercialItems.length;
  const commercialOutstandingAmount = commercialItems
    .filter((row) => {
      const st = (row.status ?? "").toLowerCase();
      return st === "issued" || st === "due" || st === "overdue";
    })
    .reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const commercialOverdueCount = commercialItems.filter((row) => {
    const due = row.due_date ? String(row.due_date).slice(0, 10) : null;
    const st = (row.status ?? "").toLowerCase();
    return st === "overdue" || (due !== null && due < today && st !== "paid" && st !== "void");
  }).length;
  const budgetVarianceAmount = actualTotal - plannedTotal;

  return {
    activeWorkers,
    openReports,
    aiAnalyses,
    tasksTotal,
    tasksInProgress,
    tasksDone,
    milestonesCount,
    overdueMilestonesCount,
    pendingReportApprovalsCount: pendingApprovalsRes.count ?? 0,
    openIssuesCount: issuesRes.count ?? 0,
    pendingDecisionsCount: docsUnderReviewRes.count ?? 0,
    budgetOverBudget,
    budgetNearingLimit,
    costLineOverrunCount,
    budgetItemCount,
    budgetCurrency,
    budgetPlannedTotal: plannedTotal,
    budgetActualTotal: actualTotal,
    budgetVarianceAmount,
    commercialItemCount,
    commercialOverdueCount,
    commercialOutstandingAmount,
  };
}
