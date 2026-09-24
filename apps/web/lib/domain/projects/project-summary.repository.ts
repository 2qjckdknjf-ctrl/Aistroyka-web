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

const PENDING_REPORT_COUNT_FAILED = "Pending report count failed";

type IdProjectRow = { id: string; project_id: string | null };

/**
 * `worker_reports` has no `project_id`. Match the report list: the day's project
 * wins, otherwise the linked task's project.
 */
export async function countSubmittedReportsForProject(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  projectDayIds: string[]
): Promise<number> {
  const dayIdSet = new Set(projectDayIds);
  const ids = new Set<string>();

  if (projectDayIds.length > 0) {
    const { data, error } = await supabase
      .from("worker_reports")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("status", "submitted")
      .in("day_id", projectDayIds);
    if (error) throw new Error(PENDING_REPORT_COUNT_FAILED);
    for (const row of (data ?? []) as { id: string }[]) ids.add(row.id);
  }

  const { data: taskRows, error: taskError } = await supabase
    .from("worker_tasks")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId);
  if (taskError) throw new Error(PENDING_REPORT_COUNT_FAILED);
  const taskIds = ((taskRows ?? []) as { id: string }[]).map((row) => row.id);
  if (taskIds.length === 0) return ids.size;

  const { data: taskReports, error: taskReportError } = await supabase
    .from("worker_reports")
    .select("id, day_id")
    .eq("tenant_id", tenantId)
    .eq("status", "submitted")
    .in("task_id", taskIds);
  if (taskReportError) throw new Error(PENDING_REPORT_COUNT_FAILED);

  const otherDayIds = [
    ...new Set(
      ((taskReports ?? []) as { day_id: string | null }[])
        .map((row) => row.day_id)
        .filter((dayId): dayId is string => Boolean(dayId) && !dayIdSet.has(dayId))
    ),
  ];
  const otherDayProject = await projectIdByRowId(supabase, tenantId, otherDayIds);

  for (const row of (taskReports ?? []) as { id: string; day_id: string | null }[]) {
    if (ids.has(row.id) || !row.day_id || dayIdSet.has(row.day_id)) {
      ids.add(row.id);
      continue;
    }
    const dayProject = otherDayProject[row.day_id];
    if (dayProject == null || dayProject === projectId) ids.add(row.id);
  }

  return ids.size;
}

async function projectIdByRowId(
  supabase: SupabaseClient,
  tenantId: string,
  ids: string[]
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabase
    .from("worker_day")
    .select("id, project_id")
    .eq("tenant_id", tenantId)
    .in("id", ids);
  if (error) throw new Error(PENDING_REPORT_COUNT_FAILED);
  return Object.fromEntries(
    ((data ?? []) as IdProjectRow[]).map((row) => [row.id, row.project_id ?? ""])
  );
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

  if (dayIdsRes.error) throw new Error(PENDING_REPORT_COUNT_FAILED);
  const projectDayIds = ((dayIdsRes.data ?? []) as { id: string }[]).map((row) => row.id);
  const pendingReportApprovalsCount = await countSubmittedReportsForProject(
    supabase,
    tenantId,
    projectId,
    projectDayIds
  );

  let openReports = 0;
  const dayIds = projectDayIds.map((id) => ({ id }));
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
    pendingReportApprovalsCount,
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
