"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Skeleton, EmptyState, Button } from "@/components/ui";

interface Milestone {
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
}

async function fetchMilestones(projectId: string): Promise<Milestone[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/milestones`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

const today = () => new Date().toISOString().slice(0, 10);

function statusBadge(status: string, targetDate: string): string {
  if (status === "done") return "bg-aistroyka-success/20 text-aistroyka-success";
  if (status === "cancelled") return "bg-aistroyka-text-tertiary/20 text-aistroyka-text-tertiary";
  if (targetDate < today()) return "bg-aistroyka-error/20 text-aistroyka-error";
  return "bg-amber-500/20 text-amber-600";
}

export function ProjectSchedulePanel({ projectId }: { projectId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setTitle(""); setTargetDate(""); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      <ul className="space-y-3" aria-label="Project milestones">
        {milestones
          .sort((a, b) => a.target_date.localeCompare(b.target_date))
          .map((m) => {
            const overdue = m.target_date < today() && !["done", "cancelled"].includes(m.status);
            return (
              <li
                key={m.id}
                className={`rounded-lg border px-4 py-3 ${
                  overdue ? "border-l-4 border-l-aistroyka-error bg-aistroyka-error/5" : "border-aistroyka-border-subtle"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-aistroyka-text-primary">{m.title}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadge(m.status, m.target_date)}`}
                  >
                    {m.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-aistroyka-text-secondary">
                  Target: {new Date(m.target_date).toLocaleDateString()}
                  {overdue && (
                    <span className="ml-2 text-aistroyka-error font-medium">Overdue</span>
                  )}
                </p>
                {m.description && (
                  <p className="mt-1 text-xs text-aistroyka-text-tertiary">{m.description}</p>
                )}
                <Link
                  href={`/dashboard/tasks?project_id=${m.project_id}`}
                  className="mt-2 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
                >
                  View project tasks →
                </Link>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
