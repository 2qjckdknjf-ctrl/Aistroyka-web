"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Skeleton, EmptyState, Button } from "@/components/ui";

interface ScheduleSignal {
  code: string;
  reason: string;
}

interface MilestoneRow {
  id: string;
  project_id: string;
  tenant_id: string;
  title: string;
  description?: string | null;
  target_date: string;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  client_visible?: boolean;
  linked_tasks_total: number;
  linked_tasks_done: number;
  task_progress_percent: number;
  schedule_signals: ScheduleSignal[];
}

async function fetchMilestones(projectId: string): Promise<MilestoneRow[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/milestones`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

const today = () => new Date().toISOString().slice(0, 10);

const STATUS_LABEL: Record<string, string> = {
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
  delayed: "Delayed",
  archived: "Archived",
};

function statusBadgeClass(status: string, targetDate: string): string {
  if (status === "completed") return "bg-aistroyka-success/20 text-aistroyka-success";
  if (status === "archived") return "bg-aistroyka-text-tertiary/20 text-aistroyka-text-tertiary";
  if (status === "delayed") return "bg-aistroyka-error/20 text-aistroyka-error";
  if (targetDate < today() && ["planned", "in_progress"].includes(status)) {
    return "bg-aistroyka-error/20 text-aistroyka-error";
  }
  return "bg-aistroyka-warning/20 text-aistroyka-warning";
}

export function ProjectSchedulePanel({ projectId }: { projectId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: milestones, isPending, isError } = useQuery({
    queryKey: ["project-milestones", projectId],
    queryFn: () => fetchMilestones(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  if (isPending) return <Skeleton className="h-48" />;
  if (isError) return <p className="text-aistroyka-text-secondary p-4">Failed to load milestones.</p>;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: title.trim(), target_date: targetDate.slice(0, 10) }),
      });
      if (res.ok) {
        setTitle("");
        setTargetDate("");
        setShowForm(false);
        queryClient.invalidateQueries({ queryKey: ["project-milestones", projectId] });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function patchMilestone(milestoneId: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/v1/projects/${projectId}/milestones/${milestoneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectId] });
    }
  }

  if (!milestones?.length && !showForm) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<span className="text-2xl">📅</span>}
          title="Schedule"
          subtitle="No milestones yet. Create milestones to track delivery checkpoints."
        />
        <Button variant="secondary" className="mt-4" onClick={() => setShowForm(true)}>
          Add milestone
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-aistroyka-text-primary">Milestones</h3>
        {!showForm ? (
          <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
            Add milestone
          </Button>
        ) : null}
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border border-aistroyka-border-subtle p-4 space-y-3">
          <input
            type="text"
            placeholder="Milestone title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-aistroyka-border-subtle px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="rounded border border-aistroyka-border-subtle px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={submitting || !title.trim() || !targetDate}>
              Create
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setTitle("");
                setTargetDate("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      <ul className="space-y-3" aria-label="Project milestones">
        {milestones
          .slice()
          .sort((a, b) => a.target_date.localeCompare(b.target_date))
          .map((m) => {
            const overdueVisual = m.target_date < today() && ["planned", "in_progress", "delayed"].includes(m.status);
            return (
              <li
                key={m.id}
                className={`rounded-lg border px-4 py-3 ${
                  overdueVisual ? "border-l-4 border-l-aistroyka-error bg-aistroyka-error/5" : "border-aistroyka-border-subtle"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-aistroyka-text-primary">{m.title}</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(m.status, m.target_date)}`}>
                    {STATUS_LABEL[m.status] ?? m.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-aistroyka-text-secondary">
                  Target: {new Date(m.target_date).toLocaleDateString()}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-aistroyka-text-tertiary">
                  <span>
                    Tasks: {m.linked_tasks_done}/{m.linked_tasks_total} ({m.task_progress_percent}%)
                  </span>
                  {m.linked_tasks_total > 0 && (
                    <div className="h-1.5 flex-1 min-w-[80px] max-w-[200px] rounded-full bg-aistroyka-border-subtle">
                      <div
                        className="h-full rounded-full bg-aistroyka-accent"
                        style={{ width: `${Math.min(100, m.task_progress_percent)}%` }}
                      />
                    </div>
                  )}
                </div>
                {m.schedule_signals.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-aistroyka-text-secondary list-disc pl-4">
                    {m.schedule_signals.map((s) => (
                      <li key={s.code}>
                        <span className="font-medium text-aistroyka-text-primary">{s.code.replace(/_/g, " ")}:</span> {s.reason}
                      </li>
                    ))}
                  </ul>
                )}
                {m.description && <p className="mt-1 text-xs text-aistroyka-text-tertiary">{m.description}</p>}
                <div className="mt-2 flex flex-wrap gap-2 items-center text-xs text-aistroyka-text-tertiary">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!m.client_visible}
                      onChange={() =>
                        patchMilestone(m.id, { client_visible: !m.client_visible })
                      }
                    />
                    Show to client portal
                  </label>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  <Link
                    href={`/dashboard/tasks?project_id=${m.project_id}`}
                    className="text-sm font-medium text-aistroyka-accent hover:underline"
                  >
                    View tasks →
                  </Link>
                  <Link
                    href={`/dashboard/tasks?project_id=${m.project_id}&milestone_id=${m.id}`}
                    className="text-sm font-medium text-aistroyka-accent hover:underline"
                  >
                    Link task →
                  </Link>
                  {editingId === m.id ? (
                    <>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="text-sm rounded border border-aistroyka-border-subtle px-2 py-1"
                      >
                        {(["planned", "in_progress", "completed", "delayed", "archived"] as const).map((st) => (
                          <option key={st} value={st}>
                            {STATUS_LABEL[st]}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={() => patchMilestone(m.id, { status: editStatus })}
                      >
                        Save
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingId(m.id);
                        setEditStatus(m.status);
                      }}
                    >
                      Update status
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
