"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import {
  Card,
  Badge,
  Skeleton,
  Button,
  Modal,
  Select,
} from "@/components/ui";

interface TaskDetail {
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
  updated_at?: string;
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

export function DashboardTaskDetailClient({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [workers, setWorkers] = useState<{ user_id: string }[]>([]);
  const [assigningWorkerId, setAssigningWorkerId] = useState("");

  const fetchTask = () => {
    setLoading(true);
    fetch(`/api/v1/tasks/${taskId}`, { credentials: "include" })
      .then((r) => {
        if (r.status === 404) throw new Error("Not found");
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((json: { data?: TaskDetail }) => {
        setTask(json.data ?? null);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setTask(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  useEffect(() => {
    if (assignOpen && task) {
      const projectId = task.project_id;
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
  }, [assignOpen, task]);

  const handleAssign = () => {
    if (!assigningWorkerId) return;
    fetch(`/api/v1/tasks/${taskId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ worker_id: assigningWorkerId }),
    })
      .then((r) => {
        if (r.ok) {
          setAssignOpen(false);
          fetchTask();
        } else return Promise.reject();
      })
      .catch(() => {});
  };

  const patchStatus = (status: string) => {
    fetch(`/api/v1/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    })
      .then((r) => (r.ok ? fetchTask() : Promise.reject()))
      .catch(() => {});
  };

  if (loading && !task) {
    return (
      <Card>
        <Skeleton lines={6} />
      </Card>
    );
  }

  if (error || !task) {
    return (
      <Card>
        <p className="text-aistroyka-text-secondary">{error ?? "Not found"}</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
              {task.title}
            </h2>
            <Badge variant={statusVariant(task.status)} className="mt-1">
              {task.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            {(task.status === "pending" || task.status === "in_progress") && (
              <>
                <Button variant="secondary" size="sm" onClick={() => patchStatus("done")}>
                  Mark done
                </Button>
                <Button variant="secondary" size="sm" onClick={() => patchStatus("cancelled")}>
                  Cancel task
                </Button>
              </>
            )}
            <Button variant="secondary" size="sm" onClick={() => setAssignOpen(true)}>
              {task.assigned_to ? "Reassign" : "Assign"}
            </Button>
          </div>
        </div>
        {task.description ? (
          <p className="text-aistroyka-body text-aistroyka-text-secondary">{task.description}</p>
        ) : null}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-aistroyka-caption">
          <div>
            <dt className="text-aistroyka-text-tertiary">Project</dt>
            <dd>
              {task.project_id ? (
                <Link href={`/dashboard/projects/${task.project_id}`} className="text-aistroyka-accent hover:underline">
                  {task.project_id}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-aistroyka-text-tertiary">Assigned</dt>
            <dd>
              {task.assigned_to ? (
                <Link href={`/dashboard/workers/${task.assigned_to}`} className="text-aistroyka-accent hover:underline">
                  {task.assigned_to}
                </Link>
              ) : (
                "Unassigned"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-aistroyka-text-tertiary">Due</dt>
            <dd>{task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-text-tertiary">Linked report</dt>
            <dd>
              {task.report_id ? (
                <Link href={`/dashboard/daily-reports/${task.report_id}`} className="text-aistroyka-accent hover:underline">
                  View report ({task.report_status ?? ""})
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </Card>

      {assignOpen && (
        <Modal open={true} title="Assign task" onClose={() => setAssignOpen(false)}>
          <div className="space-y-3">
            <Select value={assigningWorkerId} onChange={(e) => setAssigningWorkerId(e.target.value)}>
              <option value="">Select worker</option>
              {workers.map((w) => (
                <option key={w.user_id} value={w.user_id}>
                  {w.user_id.slice(0, 8)}…
                </option>
              ))}
            </Select>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAssignOpen(false)}>
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
