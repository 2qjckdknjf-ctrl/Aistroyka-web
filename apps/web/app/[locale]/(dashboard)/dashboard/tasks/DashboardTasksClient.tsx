"use client";

import { useState, useEffect, useCallback } from "react";
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

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

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
  const { params, setParam } = useFilterParams();
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
  }, [params.project_id, params.from, params.to, params.status, params.q, params.page, params.pageSize]);

  useEffect(() => {
    fetch("/api/v1/projects", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data?: { id: string; name: string }[] }) => setProjects(json.data ?? []));
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
        showProject={true}
        showWorker={false}
        showDateRange={true}
        showStatus={true}
        statusOptions={STATUS_OPTIONS}
        showSearch={true}
        searchPlaceholder="Search tasks…"
        showSavedViews={false}
      />
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-aistroyka-border-subtle px-4 py-3">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Tasks</h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={exportCsv} className="text-sm">
              Export CSV
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="text-sm">
              Create task
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
              title="No tasks"
              subtitle="Create a task or adjust filters."
            />
          </div>
        ) : (
          <>
            <Table aria-label="Tasks">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Title</TableHeaderCell>
                  <TableHeaderCell>Project</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Assigned</TableHeaderCell>
                  <TableHeaderCell>Due</TableHeaderCell>
                  <TableHeaderCell>Report</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
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
                          Report
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {r.status === "pending" || r.status === "in_progress" ? (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => patchStatus(r.id, "done")} className="mr-1 text-xs">
                            Done
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => patchStatus(r.id, "cancelled")} className="text-xs">
                            Cancel
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
        <Modal open={true} title="Create task" onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate}>
            <div className="space-y-3">
              <label className="block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
                Project
              </label>
              <Select name="project_id" required>
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <label className="block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
                Title
              </label>
              <Input name="title" required placeholder="Task title" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </Modal>
      )}

      {assignTaskId && (
        <Modal open={true} title="Assign task" onClose={() => setAssignTaskId(null)}>
          <div className="space-y-3">
            <label className="block text-aistroyka-caption font-medium text-aistroyka-text-secondary">
              Worker
            </label>
            <Select value={assigningWorkerId} onChange={(e) => setAssigningWorkerId(e.target.value)}>
              <option value="">Select worker</option>
              {workers.map((w) => (
                <option key={w.user_id} value={w.user_id}>
                  {w.user_id.slice(0, 8)}…
                </option>
              ))}
            </Select>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAssignTaskId(null)}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={!assigningWorkerId}>
                Assign
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
