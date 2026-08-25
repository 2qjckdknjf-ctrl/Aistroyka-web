"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Badge,
  Skeleton,
  EmptyState,
  TablePagination,
  Button,
  Modal,
  Input,
  Select,
} from "@/components/ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";
import { useFilterParams } from "@/lib/cockpit/useFilterParams";
import { FilterBar } from "@/components/cockpit/FilterBar";
import { exportTableToCsv } from "@/lib/cockpit/csvExport";
import { DashboardTaskDetailClient } from "./[id]/DashboardTaskDetailClient";
import {
  TASK_BOARD_COLUMNS,
  groupTasksByBoardColumn,
  isTaskOverdue,
  parseTasksWorkspaceView,
  sortTasksForPhonePriority,
  taskStatusBadgeVariant,
  type TaskBoardColumnId,
  type TasksWorkspaceView,
} from "./tasks-workspace.utils";

interface TaskRow {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: string;
  assigned_to: string | null;
  due_date: string | null;
  report_id?: string | null;
  report_status?: string | null;
  created_at?: string;
  priority?: string | null;
}

function priorityLabelKey(priority: string): "priorityLow" | "priorityMedium" | "priorityHigh" {
  switch (priority) {
    case "low":
      return "priorityLow";
    case "high":
      return "priorityHigh";
    case "medium":
      return "priorityMedium";
    default:
      return "priorityMedium";
  }
}

function columnLabelKey(column: TaskBoardColumnId): "pending" | "inProgress" | "done" | "cancelled" {
  switch (column) {
    case "pending":
      return "pending";
    case "in_progress":
      return "inProgress";
    case "done":
      return "done";
    case "cancelled":
      return "cancelled";
    default: {
      const _exhaustive: never = column;
      return _exhaustive;
    }
  }
}

export function DashboardTasksClient({
  skin = "default",
  onRegisterCreateHandler,
}: {
  skin?: "default" | "canon";
  onRegisterCreateHandler?: (openCreate: () => void) => void;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const { params, setParam } = useFilterParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const view = skin === "canon" ? "board" : parseTasksWorkspaceView(searchParams?.get("view"));
  const selectedTaskId = searchParams?.get("task")?.trim() || null;
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const STATUS_OPTIONS = [
    { value: "", label: tDetail("all") },
    { value: "pending", label: tDetail("pending") },
    { value: "in_progress", label: tDetail("inProgress") },
    { value: "done", label: tDetail("done") },
    { value: "cancelled", label: tDetail("cancelled") },
  ];
  const [data, setData] = useState<TaskRow[]>([]);
  const [total, setTotal] = useState(0);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignTaskId, setAssignTaskId] = useState<string | null>(null);
  const [workers, setWorkers] = useState<{ user_id: string }[]>([]);
  const [assigningWorkerId, setAssigningWorkerId] = useState<string>("");

  useEffect(() => {
    if (onRegisterCreateHandler) {
      onRegisterCreateHandler(() => setCreateOpen(true));
    }
  }, [onRegisterCreateHandler]);

  const setWorkspaceParam = useCallback(
    (key: "view" | "task", value: string | null) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      if (!value || (key === "view" && value === "list")) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const setView = useCallback(
    (nextView: TasksWorkspaceView) => {
      setWorkspaceParam("view", nextView === "list" ? null : nextView);
    },
    [setWorkspaceParam],
  );

  const selectTask = useCallback(
    (taskId: string | null) => {
      setWorkspaceParam("task", taskId);
    },
    [setWorkspaceParam],
  );

  const fetchTasks = useCallback(() => {
    const qs = new URLSearchParams();
    if (params.project_id) qs.set("project_id", params.project_id);
    if (params.worker_id) qs.set("assigned_to", params.worker_id);
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    if (params.status) qs.set("status", params.status);
    if (params.q) qs.set("q", params.q);
    qs.set("limit", params.pageSize);
    qs.set("offset", String((parseInt(params.page, 10) - 1) * parseInt(params.pageSize, 10)));
    setLoading(true);
    fetch(`/api/v1/tasks?${qs}`, { credentials: "include" })
      .then((res) => {
        if (res.status === 403) throw new Error("Forbidden");
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json: { data?: TaskRow[]; total?: number }) => {
        setData(json.data ?? []);
        setTotal(json.total ?? 0);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [params.project_id, params.worker_id, params.from, params.to, params.status, params.q, params.page, params.pageSize]);

  useEffect(() => {
    fetch("/api/v1/projects", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data?: { id: string; name: string }[] }) => setProjects(json.data ?? []));
  }, []);

  const [workersForFilter, setWorkersForFilter] = useState<{ user_id: string }[]>([]);
  useEffect(() => {
    fetch("/api/v1/workers", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data?: { user_id: string }[] }) => setWorkersForFilter(json.data ?? []));
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!assignTaskId && !createOpen) {
      setWorkers([]);
      setAssigningWorkerId("");
      return;
    }
    const task = assignTaskId ? data.find((t) => t.id === assignTaskId) : null;
    const projectId = task?.project_id ?? searchParams?.get("project_id")?.trim() ?? undefined;

    if (projectId) {
      fetch(`/api/v1/projects/${projectId}/workers?limit=100`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((json: { data?: { user_id: string }[] }) => setWorkers(json.data ?? []));
    } else {
      fetch("/api/v1/workers", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((json: { data?: { user_id: string }[] }) => setWorkers(json.data ?? []));
    }
  }, [assignTaskId, createOpen, data, searchParams]);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const project_id = (form.querySelector('[name="project_id"]') as HTMLSelectElement)?.value;
    const title = (form.querySelector('[name="title"]') as HTMLInputElement)?.value?.trim();
    const description = (form.querySelector('[name="description"]') as HTMLInputElement)?.value?.trim();
    const due_at = (form.querySelector('[name="due_at"]') as HTMLInputElement)?.value;
    const assign_to = (form.querySelector('[name="assign_to"]') as HTMLSelectElement)?.value;
    const priority = (form.querySelector('[name="priority"]') as HTMLSelectElement)?.value;
    if (!project_id || !title) return;
    fetch("/api/v1/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        project_id,
        title,
        description: description || undefined,
        due_at: due_at || undefined,
        report_required: true,
        priority: priority || undefined,
      }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.statusText);
        const json = (await r.json()) as { data?: { id?: string } };
        const taskId = json.data?.id;
        if (taskId && assign_to) {
          await fetch(`/api/v1/tasks/${taskId}/assign`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ worker_id: assign_to }),
          });
        }
        return json;
      })
      .then(() => {
        setCreateOpen(false);
        fetchTasks();
      })
      .catch(() => {});
  };

  const handleAssign = () => {
    if (!assignTaskId || !assigningWorkerId) return;
    fetch(`/api/v1/tasks/${assignTaskId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ worker_id: assigningWorkerId }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        setAssignTaskId(null);
        fetchTasks();
      })
      .catch(() => {});
  };

  const patchStatus = (taskId: string, status: string) => {
    fetch(`/api/v1/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    })
      .then((r) => (r.ok ? fetchTasks() : Promise.reject()))
      .catch(() => {});
  };

  const exportCsv = () => {
    const headers = ["ID", "Title", "Project", "Status", "Assigned", "Due", "Report", "Created"];
    const rows = displayData.slice(0, 500).map((r) => [
      r.id,
      r.title,
      r.project_id ?? "",
      r.status,
      r.assigned_to ?? "",
      r.due_date ?? "",
      r.report_id ?? "",
      r.created_at ?? "",
    ]);
    exportTableToCsv(headers, rows, "tasks.csv");
  };

  const boardGroups = useMemo(() => {
    const scope = searchParams?.get("scope");
    const scoped =
      scope === "overdue"
        ? data.filter((r) => isTaskOverdue(r.status, r.due_date, todayIso))
        : data;
    return groupTasksByBoardColumn(scoped);
  }, [data, searchParams, todayIso]);
  const phonePriorityTasks = useMemo(() => {
    const scope = searchParams?.get("scope");
    const scoped =
      scope === "overdue"
        ? data.filter((r) => isTaskOverdue(r.status, r.due_date, todayIso))
        : data;
    return sortTasksForPhonePriority(scoped, todayIso);
  }, [data, searchParams, todayIso]);

  const displayData = useMemo(() => {
    const scope = searchParams?.get("scope");
    if (scope === "overdue") {
      return data.filter((r) => isTaskOverdue(r.status, r.due_date, todayIso));
    }
    return data;
  }, [data, searchParams, todayIso]);

  if (error) {
    return (
      <DashboardGlassCard>
        <p className="text-aistroyka-text-secondary">{error}</p>
      </DashboardGlassCard>
    );
  }

  const page = parseInt(params.page, 10) || 1;
  const pageSize = parseInt(params.pageSize, 10) || 25;

  const renderTaskActions = (r: TaskRow) => (
    <>
      {r.status === "pending" || r.status === "in_progress" ? (
        <>
          <Button variant="secondary" size="sm" onClick={() => patchStatus(r.id, "done")} className="mr-1 text-xs">
            {tDetail("done")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => patchStatus(r.id, "cancelled")} className="text-xs">
            {tDetail("cancel")}
          </Button>
        </>
      ) : null}
      {!r.assigned_to && (
        <Button variant="secondary" size="sm" onClick={() => setAssignTaskId(r.id)} className="ml-1 text-xs">
          {tDetail("assign")}
        </Button>
      )}
    </>
  );

  const listTable = (
    <>
      <Table aria-label={tDetail("tasks")}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{tDetail("title")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("project")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("assigned")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("due")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("report")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("actions")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayData.map((r) => {
            const selected = selectedTaskId === r.id;
            const overdue = isTaskOverdue(r.status, r.due_date, todayIso);
            return (
              <TableRow
                key={r.id}
                className={selected ? "bg-aistroyka-accent-light/40" : undefined}
              >
                <TableCell>
                  <button
                    type="button"
                    onClick={() => selectTask(r.id)}
                    className="hidden text-left font-medium text-aistroyka-accent hover:underline lg:inline"
                  >
                    {r.title}
                    {r.priority ? (
                      <span className="ml-2 text-aistroyka-caption text-aistroyka-text-secondary">
                        {tDetail("priority")}: {tDetail(priorityLabelKey(r.priority))}
                      </span>
                    ) : null}
                  </button>
                  <Link
                    href={`/dashboard/tasks/${r.id}`}
                    className="font-medium text-aistroyka-accent hover:underline lg:hidden"
                  >
                    {r.title}
                  </Link>
                  {overdue ? (
                    <Badge variant="danger" className="ml-2 align-middle">
                      {tDetail("overdue")}
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell>
                  {r.project_id ? (
                    <Link href={`/dashboard/projects/${r.project_id}`} className="text-aistroyka-text-secondary hover:underline">
                      {r.project_id.slice(0, 8)}…
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={taskStatusBadgeVariant(r.status)}>{r.status}</Badge>
                </TableCell>
                <TableCell>
                  {r.assigned_to ? (
                    <Link href={`/dashboard/workers/${r.assigned_to}`} className="text-aistroyka-caption text-aistroyka-text-secondary hover:underline">
                      {r.assigned_to.slice(0, 8)}…
                    </Link>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setAssignTaskId(r.id)} className="text-xs">
                      {tDetail("assign")}
                    </Button>
                  )}
                </TableCell>
                <TableCell className="tabular-nums text-aistroyka-text-secondary">
                  {r.due_date ? new Date(r.due_date).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell>
                  {r.report_id ? (
                    <Link href={`/dashboard/daily-reports/${r.report_id}`} className="text-aistroyka-caption text-aistroyka-accent hover:underline">
                      {tDetail("report")}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{renderTaskActions(r)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <TablePagination
        page={page}
        pageSize={pageSize}
        totalCount={total}
        onPageChange={(p) => setParam("page", String(p))}
        onPageSizeChange={(s) => {
          setParam("pageSize", String(s));
          setParam("page", "1");
        }}
        pageSizeOptions={[25, 50, 100]}
      />
    </>
  );

  const phoneCards = (
    <ul className="space-y-2 p-3 lg:hidden">
      {phonePriorityTasks.map((r) => {
        const overdue = isTaskOverdue(r.status, r.due_date, todayIso);
        return (
          <li key={r.id}>
            <div className="rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised/60 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link href={`/dashboard/tasks/${r.id}`} className="font-medium text-aistroyka-accent hover:underline">
                  {r.title}
                </Link>
                <Badge variant={taskStatusBadgeVariant(r.status)}>{r.status}</Badge>
              </div>
              <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">
                {r.due_date ? new Date(r.due_date).toLocaleDateString() : "—"}
                {overdue ? ` · ${tDetail("overdue")}` : ""}
                {r.priority ? ` · ${tDetail("priority")}: ${tDetail(priorityLabelKey(r.priority))}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">{renderTaskActions(r)}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );

  const boardView = (
    <div className={skin === "canon" ? "canon-kanban-board" : "flex gap-3 overflow-x-auto p-3 pb-4"}>
      {TASK_BOARD_COLUMNS.map((column) => {
        const columnTasks = boardGroups[column];
        const columnTone =
          column === "pending"
            ? "canon-kanban-column--todo"
            : column === "in_progress"
              ? "canon-kanban-column--progress"
              : column === "done"
                ? "canon-kanban-column--done"
                : "canon-kanban-column--review";
        return (
          <section
            key={column}
            className={
              skin === "canon"
                ? `canon-kanban-column ${columnTone} flex flex-col`
                : "flex w-[min(18rem,85vw)] shrink-0 flex-col rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle bg-aistroyka-surface-muted/30"
            }
            aria-label={tDetail(columnLabelKey(column))}
          >
            <header
              className={
                skin === "canon"
                  ? "flex items-center justify-between gap-2 border-b border-[var(--canon-border-glass)] px-3 py-2"
                  : "flex items-center justify-between gap-2 border-b border-aistroyka-border-subtle px-3 py-2"
              }
            >
              <h3
                className={
                  skin === "canon"
                    ? "text-xs font-bold uppercase tracking-wide text-[var(--canon-text-muted)]"
                    : "text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary"
                }
              >
                {skin === "canon" ? tDetail(columnLabelKey(column)) : tDetail(columnLabelKey(column))}
              </h3>
              <span
                className={
                  skin === "canon"
                    ? "text-xs tabular-nums text-[var(--canon-text-secondary)]"
                    : "tabular-nums text-aistroyka-caption text-aistroyka-text-secondary"
                }
              >
                {columnTasks.length}
              </span>
            </header>
            <ul className="flex max-h-[min(70vh,36rem)] flex-col gap-2 overflow-y-auto p-2">
              {columnTasks.length === 0 ? (
                <li
                  className={
                    skin === "canon"
                      ? "px-1 py-4 text-center text-xs text-[var(--canon-text-muted)]"
                      : "px-1 py-4 text-center text-aistroyka-caption text-aistroyka-text-tertiary"
                  }
                >
                  {tDetail("boardColumnEmpty")}
                </li>
              ) : (
                columnTasks.map((r) => {
                  const selected = selectedTaskId === r.id;
                  const overdue = isTaskOverdue(r.status, r.due_date, todayIso);
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => selectTask(r.id)}
                        className={
                          skin === "canon"
                            ? `canon-kanban-card w-full ${selected ? "canon-kanban-card--selected" : ""}`
                            : `w-full rounded-[var(--aistroyka-radius-md)] border p-3 text-left transition-colors ${
                                selected
                                  ? "border-aistroyka-accent bg-aistroyka-accent-light/50"
                                  : "border-aistroyka-border-subtle bg-aistroyka-bg-primary hover:border-aistroyka-accent/40"
                              }`
                        }
                      >
                        <p
                          className={
                            skin === "canon"
                              ? "font-medium text-[var(--canon-text-primary)]"
                              : "font-medium text-aistroyka-text-primary"
                          }
                        >
                          {r.title}
                        </p>
                        <p
                          className={
                            skin === "canon"
                              ? "mt-1 text-xs text-[var(--canon-text-muted)]"
                              : "mt-1 text-aistroyka-caption text-aistroyka-text-secondary"
                          }
                        >
                          {r.due_date ? new Date(r.due_date).toLocaleDateString() : "—"}
                          {overdue ? ` · ${tDetail("overdue")}` : ""}
                        </p>
                      </button>
                      {skin !== "canon" ? (
                        <>
                          <div className="mt-1 flex flex-wrap gap-1 px-1">{renderTaskActions(r)}</div>
                          <Link
                            href={`/dashboard/tasks/${r.id}`}
                            className="mt-1 inline-block px-1 text-aistroyka-caption text-aistroyka-accent hover:underline lg:hidden"
                          >
                            {tDetail("openFullTask")}
                          </Link>
                        </>
                      ) : null}
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );

  const cardShellClass = skin === "canon" ? "canon-glass overflow-hidden" : undefined;

  return (
    <>
      {skin !== "canon" ? (
        <FilterBar
          projects={projects}
          workers={workersForFilter}
          showProject={true}
          showWorker={true}
          showDateRange={true}
          showStatus={true}
          statusOptions={STATUS_OPTIONS}
          showSearch={true}
          searchPlaceholder={tDetail("searchTasks")}
          showSavedViews={false}
        />
      ) : null}
      <div
        className={`grid gap-4 ${
          selectedTaskId && skin !== "canon" ? "lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.9fr)]" : ""
        }`}
      >
        {skin === "canon" ? (
          <div className={cardShellClass}>
            {loading && data.length === 0 ? (
              <div className="p-4">
                <Skeleton lines={6} />
              </div>
            ) : data.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<span className="text-2xl">📋</span>}
                  title={tDetail("noTasks")}
                  subtitle={tDetail("createTaskOrAdjustFilters")}
                  action={<Button onClick={() => setCreateOpen(true)}>{tDetail("createTask")}</Button>}
                />
              </div>
            ) : (
              boardView
            )}
          </div>
        ) : (
        <DashboardGlassCard contentClassName="p-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-aistroyka-border-subtle px-4 py-3">
            <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{tDetail("tasks")}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label={tDetail("tasksViewMode")}
                className="flex rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle p-0.5"
              >
                <button
                  type="button"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                  className={`min-h-aistroyka-touch rounded-[var(--aistroyka-radius-md)] px-3 text-aistroyka-caption font-medium ${
                    view === "list"
                      ? "bg-aistroyka-accent-light text-aistroyka-accent"
                      : "text-aistroyka-text-secondary hover:text-aistroyka-text-primary"
                  }`}
                >
                  {tDetail("tasksViewList")}
                </button>
                <button
                  type="button"
                  aria-pressed={view === "board"}
                  onClick={() => setView("board")}
                  className={`min-h-aistroyka-touch rounded-[var(--aistroyka-radius-md)] px-3 text-aistroyka-caption font-medium ${
                    view === "board"
                      ? "bg-aistroyka-accent-light text-aistroyka-accent"
                      : "text-aistroyka-text-secondary hover:text-aistroyka-text-primary"
                  }`}
                >
                  {tDetail("tasksViewBoard")}
                </button>
              </div>
              <Button variant="secondary" onClick={exportCsv} className="text-sm">
                {tDetail("exportCsv")}
              </Button>
              <Button onClick={() => setCreateOpen(true)} className="text-sm">
                {tDetail("createTask")}
              </Button>
            </div>
          </div>
          {loading && data.length === 0 ? (
            <div className="p-4">
              <Skeleton lines={6} />
            </div>
          ) : data.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<span className="text-2xl">📋</span>}
                title={tDetail("noTasks")}
                subtitle={tDetail("createTaskOrAdjustFilters")}
                action={<Button onClick={() => setCreateOpen(true)}>{tDetail("createTask")}</Button>}
              />
            </div>
          ) : view === "board" ? (
            boardView
          ) : (
            <>
              <div className="hidden lg:block">{listTable}</div>
              {phoneCards}
            </>
          )}
        </DashboardGlassCard>
        )}

        {selectedTaskId && skin !== "canon" ? (
          <aside className="hidden min-w-0 lg:block" aria-label={tDetail("tasks")}>
            <div className="sticky top-20 space-y-3">
              <DashboardGlassCard contentClassName="flex flex-wrap items-center justify-between gap-2 p-3">
                <Link
                  href={`/dashboard/tasks/${selectedTaskId}`}
                  className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
                >
                  {tDetail("openFullTask")}
                </Link>
                <Button variant="secondary" size="sm" onClick={() => selectTask(null)}>
                  {tDetail("closeTaskInspector")}
                </Button>
              </DashboardGlassCard>
              <DashboardTaskDetailClient taskId={selectedTaskId} />
            </div>
          </aside>
        ) : null}
      </div>

      {createOpen && (
        <Modal open={true} title={tDetail("createTask")} onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate}>
            <div className="space-y-3">
              <label className="block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
                {tDetail("project")}
              </label>
              <Select name="project_id" required>
                <option value="">{tDetail("selectProject")}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <label className="block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
                {tDetail("title")}
              </label>
              <Input name="title" required placeholder={tDetail("taskTitle")} />
              <label className="block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
                {tDetail("descriptionOptional")}
              </label>
              <Input name="description" placeholder={tDetail("descriptionOptional")} />
              <label className="block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
                {tDetail("dueDate")}
              </label>
              <Input name="due_at" type="date" />
              <label className="block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
                {tDetail("priority")}
              </label>
              <Select name="priority" defaultValue="medium">
                <option value="low">{tDetail("priorityLow")}</option>
                <option value="medium">{tDetail("priorityMedium")}</option>
                <option value="high">{tDetail("priorityHigh")}</option>
              </Select>
              <label className="block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
                {tDetail("worker")}
              </label>
              <Select name="assign_to">
                <option value="">{tDetail("unassigned")}</option>
                {workers.map((w) => (
                  <option key={w.user_id} value={w.user_id}>
                    {w.user_id.slice(0, 8)}…
                  </option>
                ))}
              </Select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                {tDetail("cancel")}
              </Button>
              <Button type="submit">{tDetail("create")}</Button>
            </div>
          </form>
        </Modal>
      )}

      {assignTaskId && (
        <Modal open={true} title={tDetail("assignTask")} onClose={() => setAssignTaskId(null)}>
          <div className="space-y-3">
            <label className="block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
              {tDetail("worker")}
            </label>
            <Select value={assigningWorkerId} onChange={(e) => setAssigningWorkerId(e.target.value)}>
              <option value="">{tDetail("selectWorker")}</option>
              {workers.map((w) => (
                <option key={w.user_id} value={w.user_id}>
                  {w.user_id.slice(0, 8)}…
                </option>
              ))}
            </Select>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAssignTaskId(null)}>
                {tDetail("cancel")}
              </Button>
              <Button onClick={handleAssign} disabled={!assigningWorkerId}>
                {tDetail("assign")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
