"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Skeleton, EmptyState, Button } from "@/components/ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";
import {
  buildLookaheadDayStrip,
  isMilestoneOverdue,
  parseScheduleLookaheadDays,
  partitionScheduleMilestones,
  summarizeScheduleHealth,
  type ScheduleLookaheadDays,
  type SchedulePartitionKey,
} from "./schedule-health";

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
  if (isMilestoneOverdue(status, targetDate, today())) return "bg-aistroyka-error/20 text-aistroyka-error";
  return "bg-aistroyka-warning/20 text-aistroyka-warning";
}

export function ProjectSchedulePanel({ projectId }: { projectId: string }) {
  const tDetail = useTranslations("dashboardDetail");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lookaheadDays, setLookaheadDays] = useState<ScheduleLookaheadDays>(7);
  const queryClient = useQueryClient();
  const todayIso = useMemo(() => today(), []);

  const { data: milestones, isPending, isError } = useQuery({
    queryKey: ["project-milestones", projectId],
    queryFn: () => fetchMilestones(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  const health = useMemo(
    () => summarizeScheduleHealth(milestones ?? [], todayIso),
    [milestones, todayIso],
  );
  const partitions = useMemo(
    () => partitionScheduleMilestones(milestones ?? [], todayIso, lookaheadDays),
    [milestones, todayIso, lookaheadDays],
  );
  const dayStrip = useMemo(
    () => buildLookaheadDayStrip(milestones ?? [], todayIso, 7),
    [milestones, todayIso],
  );

  if (isPending) return <Skeleton className="h-48" />;
  if (isError) return <p className="text-aistroyka-text-secondary p-4">{tDetail("failedLoadMilestones")}</p>;

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
          title={tDetail("schedule")}
          subtitle={tDetail("noMilestonesYet")}
        />
        <Button variant="secondary" className="mt-4" onClick={() => setShowForm(true)}>
          {tDetail("addMilestone")}
        </Button>
      </div>
    );
  }

  const sectionMeta: Record<
    SchedulePartitionKey,
    { title: string; border: string; empty: string }
  > = {
    overdue: {
      title: tDetail("scheduleOverdue"),
      border: "border-l-aistroyka-error",
      empty: tDetail("scheduleSectionEmptyOverdue"),
    },
    lookahead: {
      title: tDetail("scheduleLookahead", { days: lookaheadDays }),
      border: "border-l-aistroyka-warning",
      empty: tDetail("scheduleSectionEmptyLookahead"),
    },
    later: {
      title: tDetail("scheduleLater"),
      border: "border-l-aistroyka-info",
      empty: tDetail("scheduleSectionEmptyLater"),
    },
    done: {
      title: tDetail("scheduleDone"),
      border: "border-l-aistroyka-success",
      empty: tDetail("scheduleSectionEmptyDone"),
    },
  };

  const renderMilestone = (m: Milestone) => {
    const overdue = isMilestoneOverdue(m.status, m.target_date, todayIso);
    return (
      <li
        key={m.id}
        className={`rounded-[var(--aistroyka-radius-lg)] border px-4 py-3 ${
          overdue ? "border-l-4 border-l-aistroyka-error bg-aistroyka-error/5" : "border-aistroyka-border-subtle"
        }`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-medium text-aistroyka-text-primary">{m.title}</span>
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadge(m.status, m.target_date)}`}>
            {m.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">
          {tDetail("target")}: {new Date(m.target_date).toLocaleDateString()}
          {overdue ? <span className="ml-2 font-medium text-aistroyka-error">{tDetail("overdue")}</span> : null}
        </p>
        {m.description ? <p className="mt-1 text-xs text-aistroyka-text-tertiary">{m.description}</p> : null}
        <Link
          href={`/dashboard/tasks?project_id=${m.project_id}`}
          className="mt-2 inline-block text-sm font-medium text-aistroyka-accent hover:underline"
        >
          {tDetail("viewProjectTasks")}
        </Link>
      </li>
    );
  };

  return (
    <div className="space-y-4 p-4">
      <div className="grid gap-3 sm:grid-cols-3" aria-label={tDetail("schedule")}>
        <DashboardGlassCard className="border-l-4 border-l-aistroyka-error">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">
            {tDetail("scheduleOverdue")}
          </p>
          <p className="mt-1 text-aistroyka-title3 font-semibold tabular-nums">{health.overdue}</p>
        </DashboardGlassCard>
        <DashboardGlassCard className="border-l-4 border-l-aistroyka-warning">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">
            {tDetail("scheduleUpcoming")}
          </p>
          <p className="mt-1 text-aistroyka-title3 font-semibold tabular-nums">{health.upcoming}</p>
        </DashboardGlassCard>
        <DashboardGlassCard className="border-l-4 border-l-aistroyka-success">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">
            {tDetail("scheduleDone")}
          </p>
          <p className="mt-1 text-aistroyka-title3 font-semibold tabular-nums">{health.done}</p>
        </DashboardGlassCard>
      </div>

      <DashboardGlassCard contentClassName="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
            {tDetail("scheduleLookaheadStrip")}
          </h3>
          <div
            role="group"
            aria-label={tDetail("scheduleLookaheadWindow")}
            className="flex rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle p-0.5"
          >
            {([7, 14, 30] as const).map((days) => {
              const selected = lookaheadDays === days;
              return (
                <button
                  key={days}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setLookaheadDays(parseScheduleLookaheadDays(String(days)))}
                  className={`min-h-aistroyka-touch rounded-[var(--aistroyka-radius-md)] px-3 text-aistroyka-caption font-medium ${
                    selected
                      ? "bg-aistroyka-accent-light text-aistroyka-accent"
                      : "text-aistroyka-text-secondary hover:text-aistroyka-text-primary"
                  }`}
                >
                  {tDetail("scheduleLookaheadDays", { days })}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1" aria-label={tDetail("scheduleLookaheadStrip")}>
          {dayStrip.map((day) => (
            <div
              key={day.date}
              className={`rounded-[var(--aistroyka-radius-md)] border px-1 py-2 text-center ${
                day.count > 0
                  ? "border-aistroyka-warning/50 bg-aistroyka-warning/10"
                  : "border-aistroyka-border-subtle bg-aistroyka-surface-muted/30"
              }`}
            >
              <p className="text-[10px] font-medium uppercase text-aistroyka-text-tertiary">
                {new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}
              </p>
              <p className="mt-0.5 text-aistroyka-caption tabular-nums text-aistroyka-text-primary">
                {new Date(`${day.date}T12:00:00`).getDate()}
              </p>
              <p className="mt-1 text-aistroyka-caption font-semibold tabular-nums text-aistroyka-text-secondary">
                {day.count}
              </p>
            </div>
          ))}
        </div>
      </DashboardGlassCard>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-aistroyka-text-primary">{tDetail("milestones")}</h3>
        {!showForm ? (
          <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
            {tDetail("addMilestone")}
          </Button>
        ) : null}
      </div>
      {showForm ? (
        <form onSubmit={handleCreate} className="space-y-3 rounded-lg border border-aistroyka-border-subtle p-4">
          <input
            type="text"
            placeholder={tDetail("milestoneTitle")}
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
              {tDetail("create")}
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
              {tDetail("cancel")}
            </Button>
          </div>
        </form>
      ) : null}

      {(["overdue", "lookahead", "later", "done"] as const).map((key) => {
        const meta = sectionMeta[key];
        const items = partitions[key];
        if (key === "done" && items.length === 0) return null;
        return (
          <DashboardGlassCard key={key} className={`border-l-4 ${meta.border}`} contentClassName="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{meta.title}</h4>
              <span className="tabular-nums text-aistroyka-caption text-aistroyka-text-secondary">{items.length}</span>
            </div>
            {items.length === 0 ? (
              <p className="text-aistroyka-caption text-aistroyka-text-tertiary">{meta.empty}</p>
            ) : (
              <ul className="space-y-3" aria-label={meta.title}>
                {items.map(renderMilestone)}
              </ul>
            )}
          </DashboardGlassCard>
        );
      })}
    </div>
  );
}
