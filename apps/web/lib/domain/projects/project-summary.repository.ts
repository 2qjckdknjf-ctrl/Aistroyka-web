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

/** Bounded page for PostgREST `range` / `.in()` lists. Do not raise this to hide truncation. */
export const PROJECT_SUMMARY_ID_PAGE_SIZE = 200;

type IdProjectRow = { id: string; project_id: string | null };
type SubmittedTaskReportRow = { id: string; day_id: string | null };

export function chunkIds<T>(ids: readonly T[], size: number = PROJECT_SUMMARY_ID_PAGE_SIZE): T[][] {
  if (size < 1) throw new Error(PENDING_REPORT_COUNT_FAILED);
  const out: T[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    out.push(ids.slice(i, i + size) as T[]);
  }
  return out;
}

async function listAllRowIds(
  supabase: SupabaseClient,
  table: "worker_tasks" | "worker_day",
  tenantId: string,
  projectId: string
): Promise<string[]> {
  const ids: string[] = [];
  let from = 0;
  for (;;) {
    const to = from + PROJECT_SUMMARY_ID_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("project_id", projectId)
      .order("id", { ascending: true })
      .range(from, to);
    if (error) throw new Error(PENDING_REPORT_COUNT_FAILED);
    const rows = (data ?? []) as { id: string }[];
    for (const row of rows) {
      if (row.id) ids.push(row.id);
    }
    if (rows.length < PROJECT_SUMMARY_ID_PAGE_SIZE) break;
    from += PROJECT_SUMMARY_ID_PAGE_SIZE;
  }
  return ids;
}

async function selectInChunks<T>(
  ids: string[],
  loadPage: (
    chunk: string[],
    from: number,
    to: number
  ) => Promise<{ data: T[] | null; error: { message?: string } | null }>
): Promise<T[]> {
  const acc: T[] = [];
  for (const chunk of chunkIds(ids)) {
    if (chunk.length === 0) continue;
    let from = 0;
    for (;;) {
      const to = from + PROJECT_SUMMARY_ID_PAGE_SIZE - 1;
      const { data, error } = await loadPage(chunk, from, to);
      if (error) throw new Error(PENDING_REPORT_COUNT_FAILED);
      const rows = data ?? [];
      acc.push(...rows);
      if (rows.length < PROJECT_SUMMARY_ID_PAGE_SIZE) break;
      from += PROJECT_SUMMARY_ID_PAGE_SIZE;
    }
  }
  return acc;
}

function presentDayId(dayId: string | null | undefined): dayId is string {
  return typeof dayId === "string" && dayId.length > 0;
}

/**
 * `worker_reports` has no `project_id`. Match the report list: the day's project
 * wins, otherwise the linked task's project.
 *
 * A worker_day row with `project_id = null` is treated as missing day
 * attribution, so the task project is used (`fromDay ?? fromTask`).
 * A day row pointing at a different project wins and excludes this task path.
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
    const dayReports = await selectInChunks<{ id: string }>(projectDayIds, async (chunk, from, to) => {
      const { data, error } = await supabase
        .from("worker_reports")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("status", "submitted")
        .in("day_id", chunk)
        .order("id", { ascending: true })
        .range(from, to);
      return { data, error };
    });
    for (const row of dayReports) ids.add(row.id);
  }

  const taskIds = await listAllRowIds(supabase, "worker_tasks", tenantId, projectId);
  if (taskIds.length === 0) return ids.size;

  const reports = await selectInChunks<SubmittedTaskReportRow>(taskIds, async (chunk, from, to) => {
    const { data, error } = await supabase
      .from("worker_reports")
      .select("id, day_id")
      .eq("tenant_id", tenantId)
      .eq("status", "submitted")
      .in("task_id", chunk)
      .order("id", { ascending: true })
      .range(from, to);
    return { data, error };
  });
  const otherDayIds = [
    ...new Set(
      reports.map((row) => row.day_id).filter((dayId): dayId is string => presentDayId(dayId) && !dayIdSet.has(dayId))
    ),
  ];
  const otherDayProject = await projectIdByRowId(supabase, tenantId, otherDayIds);

  for (const row of reports) {
    if (ids.has(row.id)) continue;
    if (!presentDayId(row.day_id) || dayIdSet.has(row.day_id)) {
      ids.add(row.id);
      continue;
    }
    const dayProject = otherDayProject.get(row.day_id);
    // Missing day row or null day.project_id → task fallback (matches report list: fromDay ?? fromTask).
    if (dayProject == null || dayProject === "") {
      ids.add(row.id);
      continue;
    }
    if (dayProject === projectId) ids.add(row.id);
  }

  return ids.size;
}

async function projectIdByRowId(
  supabase: SupabaseClient,
  tenantId: string,
  ids: string[]
): Promise<Map<string, string | null>> {
  const byId = new Map<string, string | null>();
  if (ids.length === 0) return byId;
  const rows = await selectInChunks<IdProjectRow>(ids, async (chunk, from, to) => {
    const { data, error } = await supabase
      .from("worker_day")
      .select("id, project_id")
      .eq("tenant_id", tenantId)
      .in("id", chunk)
      .order("id", { ascending: true })
      .range(from, to);
    return { data, error };
  });
  for (const row of rows) {
    byId.set(row.id, row.project_id);
  }
  return byId;
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

  const projectDayIds = await listAllRowIds(supabase, "worker_day", tenantId, projectId);
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
