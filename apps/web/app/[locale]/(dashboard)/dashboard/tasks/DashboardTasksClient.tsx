"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Card,
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
  Textarea,
  Select,
} from "@/components/ui";
import { useFilterParams } from "@/lib/cockpit/useFilterParams";
import { FilterBar } from "@/components/cockpit/FilterBar";
import { exportTableToCsv } from "@/lib/cockpit/csvExport";

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
}

function statusVariant(s: string): "neutral" | "success" | "warning" | "danger" {
  switch (s) {
    case "done":
      return "success";
    case "cancelled":
      return "danger";
    case "in_progress":
      return "warning";
    default:
      return "neutral";
  }
}

export function DashboardTasksClient() {
  const tDetail = useTranslations("dashboardDetail");
  const { params, setParam } = useFilterParams();
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
    if (assignTaskId) {
      const task = data.find((t) => t.id === assignTaskId);
      const projectId = task?.project_id;
      if (projectId) {
        fetch(`/api/v1/projects/${projectId}/workers?limit=100`, { credentials: "include" })
          .then((r) => (r.ok ? r.json() : { data: [] }))
          .then((json: { data?: { user_id: string }[] }) => setWorkers(json.data ?? []));
      } else {
        fetch("/api/v1/workers", { credentials: "include" })
          .then((r) => (r.ok ? r.json() : { data: [] }))
          .then((json: { data?: { user_id: string }[] }) => setWorkers(json.data ?? []));
      }
    } else {
      setWorkers([]);
      setAssigningWorkerId("");
    }
  }, [assignTaskId, data]);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const project_id = (form.querySelector('[name="project_id"]') as HTMLSelectElement)?.value;
    const title = (form.querySelector('[name="title"]') as HTMLInputElement)?.value?.trim();
    if (!project_id || !title) return;
    fetch("/api/v1/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ project_id, title, report_required: true }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
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
    const rows = data.slice(0, 500).map((r) => [
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

  if (error) {
    return (
      <Card>
        <p className="text-aistroyka-text-secondary">{error}</p>
      </Card>
    );
  }

  const page = parseInt(params.page, 10) || 1;
  const pageSize = parseInt(params.pageSize, 10) || 25;

  return (
    <>
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
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-aistroyka-border-subtle px-4 py-3">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{tDetail("tasks")}</h2>
          <div className="flex items-center gap-2">
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
            />
          </div>
        ) : (
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
                {data.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link href={`/dashboard/tasks/${r.id}`} className="font-medium text-aistroyka-accent hover:underline">
                        {r.title}
                      </Link>
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
                      <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.assigned_to ? (
                        <Link href={`/dashboard/workers/${r.assigned_to}`} className="text-aistroyka-caption text-aistroyka-text-secondary hover:underline">
                          {r.assigned_to.slice(0, 8)}…
                        </Link>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => setAssignTaskId(r.id)} className="text-xs">
                          Assign
                          
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
                    <TableCell>
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
                          Assign
                          
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
        )}
      </Card>

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
