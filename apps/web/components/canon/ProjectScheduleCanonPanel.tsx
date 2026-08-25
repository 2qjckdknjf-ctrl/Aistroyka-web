"use client";

import { useMemo, useState } from "react";
import { CalendarDays, LayoutList, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { EmptyState, Input, Skeleton } from "@/components/ui";
import {
  buildGanttBars,
  buildGanttMonthHeaders,
  computeGanttRange,
  computeScheduleCompletionPercent,
  projectedScheduleEnd,
  todayMarkerPercent,
} from "@/app/[locale]/(dashboard)/dashboard/projects/[id]/gantt-layout.utils";
import {
  buildLookaheadDayStrip,
  partitionScheduleMilestones,
  parseScheduleLookaheadDays,
  summarizeScheduleHealth,
  type ScheduleLookaheadDays,
} from "@/app/[locale]/(dashboard)/dashboard/projects/[id]/schedule-health";
import {
  createProjectMilestone,
  fetchProjectMilestones,
  type ProjectMilestoneRow,
} from "@/app/[locale]/(dashboard)/dashboard/projects/[id]/project-schedule.api";
import { CanonGanttChart } from "./CanonGanttChart";
import { CanonPageHeader } from "./CanonPageHeader";
import { CanonProgressRing } from "./CanonProgressRing";

type ScheduleViewMode = "gantt" | "week" | "month";

const todayIso = () => new Date().toISOString().slice(0, 10);

export function ProjectScheduleCanonPanel({ projectId }: { projectId: string }) {
  const t = useTranslations("canon");
  const tCommon = useTranslations("common");
  const tDetail = useTranslations("dashboardDetail");
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("gantt");
  const [lookaheadDays, setLookaheadDays] = useState<ScheduleLookaheadDays>(7);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const today = useMemo(() => todayIso(), []);

  const query = useQuery({
    queryKey: ["project-milestones", projectId],
    queryFn: () => fetchProjectMilestones(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (body: { title: string; target_date: string }) => createProjectMilestone(projectId, body),
    onSuccess: (milestone) => {
      queryClient.invalidateQueries({ queryKey: ["project-milestones", projectId] });
      setShowForm(false);
      setTitle("");
      setTargetDate("");
      setCreateError(null);
      setSelectedId(milestone.id);
    },
    onError: (err) => {
      setCreateError(err instanceof Error ? err.message : tDetail("failed"));
    },
  });

  const milestones = query.data ?? [];
  const health = useMemo(() => summarizeScheduleHealth(milestones, today), [milestones, today]);
  const completionPct = useMemo(() => computeScheduleCompletionPercent(milestones), [milestones]);
  const projectedEnd = useMemo(() => projectedScheduleEnd(milestones, today), [milestones, today]);
  const range = useMemo(() => computeGanttRange(milestones, today), [milestones, today]);
  const ganttBars = useMemo(
    () => buildGanttBars(milestones, range, today),
    [milestones, range, today],
  );
  const monthHeaders = useMemo(() => buildGanttMonthHeaders(range), [range]);
  const todayPercent = useMemo(() => todayMarkerPercent(range, today), [range, today]);
  const partitions = useMemo(
    () => partitionScheduleMilestones(milestones, today, lookaheadDays),
    [milestones, today, lookaheadDays],
  );
  const dayStrip = useMemo(() => buildLookaheadDayStrip(milestones, today, 7), [milestones, today]);
  const selectedBar = ganttBars.find((b) => b.id === selectedId);
  const selectedMilestone = milestones.find((m) => m.id === selectedId);

  if (query.isPending) {
    return (
      <div className="p-4">
        <Skeleton lines={6} />
      </div>
    );
  }

  if (query.isError) {
    return <p className="p-4 text-[var(--canon-text-secondary)]">{tDetail("failedLoadMilestones")}</p>;
  }

  return (
    <div className="space-y-4 p-3 sm:p-4 md:p-5">
      <CanonPageHeader
        title={tDetail("schedule")}
        subtitle={t("screen07Label")}
        showFavorite={false}
        actions={
          <button type="button" className="canon-gold-btn" onClick={() => setShowForm(true)}>
            <Plus size={18} aria-hidden />
            {tDetail("addMilestone")}
          </button>
        }
      />

      <div className="canon-scroll-x flex flex-wrap items-center gap-2">
        {["phase", "status", "assignee", "date"].map((key) => (
          <button key={key} type="button" className="canon-ghost-btn shrink-0 !text-xs">
            {t(`scheduleFilter_${key}`)} ▾
          </button>
        ))}
        <button type="button" className="text-xs text-[var(--canon-text-muted)]">{t("resetFilters")}</button>
        <div className="ml-auto flex rounded-lg border border-[var(--canon-border-glass)] p-0.5">
          {(
            [
              { mode: "gantt" as const, icon: CalendarDays, label: t("scheduleViewGantt") },
              { mode: "week" as const, icon: LayoutList, label: t("scheduleViewWeek") },
              { mode: "month" as const, icon: LayoutList, label: t("scheduleViewMonth") },
            ]
          ).map((item) => (
            <button
              key={item.mode}
              type="button"
              className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium ${
                viewMode === item.mode
                  ? "bg-[rgba(255,193,7,0.15)] text-[var(--canon-gold)]"
                  : "text-[var(--canon-text-muted)]"
              }`}
              onClick={() => setViewMode(item.mode)}
            >
              <item.icon size={14} aria-hidden />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="canon-schedule-workspace">
        <section className="canon-glass min-w-0 overflow-hidden">
          {milestones.length === 0 && !showForm ? (
            <div className="p-8">
              <EmptyState
                icon={<span className="text-2xl">📅</span>}
                title={tDetail("schedule")}
                subtitle={tDetail("noMilestonesYet")}
                action={
                  <button type="button" className="canon-gold-btn" onClick={() => setShowForm(true)}>
                    {tDetail("addMilestone")}
                  </button>
                }
              />
            </div>
          ) : viewMode === "gantt" ? (
            <div className="p-3 sm:p-4">
              <CanonGanttChart
                bars={ganttBars}
                monthHeaders={monthHeaders}
                todayPercent={todayPercent}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          ) : (
            <div className="space-y-4 p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--canon-text-primary)]">
                  {viewMode === "week" ? tDetail("scheduleLookaheadStrip") : t("scheduleMonthOverview")}
                </h3>
                <div className="flex rounded-lg border border-[var(--canon-border-glass)] p-0.5">
                  {([7, 14, 30] as const).map((days) => (
                    <button
                      key={days}
                      type="button"
                      className={`px-2 py-1 text-xs ${
                        lookaheadDays === days ? "text-[var(--canon-gold)]" : "text-[var(--canon-text-muted)]"
                      }`}
                      onClick={() => setLookaheadDays(parseScheduleLookaheadDays(String(days)))}
                    >
                      {tDetail("scheduleLookaheadDays", { days })}
                    </button>
                  ))}
                </div>
              </div>
              <div className="canon-scroll-x grid min-w-0 grid-cols-7 gap-1 sm:grid-cols-7">
                {dayStrip.map((day) => (
                  <div
                    key={day.date}
                    className={`rounded-lg border px-1 py-2 text-center ${
                      day.count > 0
                        ? "border-[rgba(255,193,7,0.35)] bg-[rgba(255,193,7,0.08)]"
                        : "border-[var(--canon-border-glass)]"
                    }`}
                  >
                    <p className="text-[10px] uppercase text-[var(--canon-text-muted)]">
                      {new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}
                    </p>
                    <p className="mt-0.5 text-sm tabular-nums">{new Date(`${day.date}T12:00:00`).getDate()}</p>
                    <p className="mt-1 text-xs font-semibold tabular-nums text-[var(--canon-gold)]">{day.count}</p>
                  </div>
                ))}
              </div>
              <ScheduleMilestoneSections
                partitions={partitions}
                projectId={projectId}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          )}

          {showForm ? (
            <form
              className="border-t border-[var(--canon-border-glass)] p-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!title.trim() || !targetDate) return;
                createMutation.mutate({ title: title.trim(), target_date: targetDate });
              }}
            >
              <Input
                id="canon-milestone-title"
                label={tDetail("milestoneTitle")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={createMutation.isPending}
                required
              />
              <Input
                id="canon-milestone-date"
                label={tDetail("target")}
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                disabled={createMutation.isPending}
                required
              />
              {createError ? (
                <p className="text-sm text-[var(--canon-danger)]" role="alert">{createError}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="canon-gold-btn" disabled={createMutation.isPending || !title.trim() || !targetDate}>
                  {tDetail("create")}
                </button>
                <button
                  type="button"
                  className="canon-ghost-btn"
                  onClick={() => {
                    setShowForm(false);
                    setCreateError(null);
                    createMutation.reset();
                  }}
                >
                  {tCommon("cancel")}
                </button>
              </div>
            </form>
          ) : null}
        </section>

        <aside className="canon-schedule-sidebar space-y-4">
          <div className="canon-glass flex flex-col items-center gap-3 p-4 sm:flex-row sm:items-center">
            <CanonProgressRing value={completionPct} size={88} label={t("scheduleCompletion")} />
            <div className="text-center sm:text-left">
              <p className="text-sm text-[var(--canon-text-muted)]">{t("scheduleProjectedEnd")}</p>
              <p className="text-lg font-semibold text-[var(--canon-text-primary)]">
                {projectedEnd
                  ? new Date(`${projectedEnd}T12:00:00`).toLocaleDateString()
                  : t("deadlinePending")}
              </p>
            </div>
          </div>

          <div className="canon-glass grid grid-cols-3 gap-2 p-3 text-center">
            <div>
              <p className="text-xs text-[var(--canon-text-muted)]">{tDetail("scheduleOverdue")}</p>
              <p className="text-xl font-semibold tabular-nums text-[var(--canon-danger)]">{health.overdue}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--canon-text-muted)]">{tDetail("scheduleUpcoming")}</p>
              <p className="text-xl font-semibold tabular-nums text-[var(--canon-gold)]">{health.upcoming}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--canon-text-muted)]">{tDetail("scheduleDone")}</p>
              <p className="text-xl font-semibold tabular-nums text-[var(--canon-success)]">{health.done}</p>
            </div>
          </div>

          {(selectedBar || selectedMilestone) && (
            <div className="canon-glass p-4">
              <p className="font-semibold text-[var(--canon-text-primary)]">
                {selectedMilestone?.title ?? selectedBar?.title}
              </p>
              <p className="mt-1 text-sm text-[var(--canon-text-secondary)]">
                {tDetail("target")}:{" "}
                {new Date(`${(selectedMilestone?.target_date ?? selectedBar?.targetDate)!}T12:00:00`).toLocaleDateString()}
              </p>
              {selectedMilestone?.description ? (
                <p className="mt-2 text-xs text-[var(--canon-text-muted)]">{selectedMilestone.description}</p>
              ) : null}
              <Link
                href={`/dashboard/tasks?project_id=${encodeURIComponent(projectId)}`}
                className="mt-3 inline-block text-sm text-[var(--canon-cyan)] hover:underline"
              >
                {tDetail("viewProjectTasks")}
              </Link>
            </div>
          )}

          <div className="canon-ai-panel rounded-xl p-3">
            <p className="text-sm font-semibold text-[var(--canon-text-primary)]">{t("scheduleAiHintTitle")}</p>
            <p className="mt-2 text-xs text-[var(--canon-text-secondary)]">{t("scheduleAiHintBody")}</p>
          </div>
        </aside>
      </div>

      {viewMode === "gantt" && milestones.length > 0 ? (
        <div className="canon-glass p-3 lg:hidden">
          <h3 className="mb-3 text-sm font-semibold text-[var(--canon-text-primary)]">{t("scheduleMobileList")}</h3>
          <ScheduleMilestoneSections
            partitions={partitions}
            projectId={projectId}
            selectedId={selectedId}
            onSelect={setSelectedId}
            compact
          />
        </div>
      ) : null}
    </div>
  );
}

function ScheduleMilestoneSections({
  partitions,
  projectId,
  selectedId,
  onSelect,
  compact,
}: {
  partitions: Record<"overdue" | "lookahead" | "later" | "done", ProjectMilestoneRow[]>;
  projectId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  const tDetail = useTranslations("dashboardDetail");

  const sections: Array<{
    key: "overdue" | "lookahead" | "later" | "done";
    title: string;
    empty: string;
  }> = [
    { key: "overdue", title: tDetail("scheduleOverdue"), empty: tDetail("scheduleSectionEmptyOverdue") },
    { key: "lookahead", title: tDetail("scheduleLookahead", { days: 7 }), empty: tDetail("scheduleSectionEmptyLookahead") },
    { key: "later", title: tDetail("scheduleLater"), empty: tDetail("scheduleSectionEmptyLater") },
    { key: "done", title: tDetail("scheduleDone"), empty: tDetail("scheduleSectionEmptyDone") },
  ];

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {sections.map((section) => {
        const items = partitions[section.key];
        if (section.key === "done" && items.length === 0) return null;
        return (
          <div key={section.key}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--canon-text-muted)]">
                {section.title}
              </h4>
              <span className="text-xs tabular-nums text-[var(--canon-text-muted)]">{items.length}</span>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-[var(--canon-text-muted)]">{section.empty}</p>
            ) : (
              <ul className="space-y-2">
                {items.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(m.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                        selectedId === m.id
                          ? "border-[var(--canon-gold)] bg-[rgba(255,193,7,0.08)]"
                          : "border-[var(--canon-border-glass)] hover:bg-[rgba(255,255,255,0.04)]"
                      }`}
                    >
                      <span className="font-medium text-[var(--canon-text-primary)]">{m.title}</span>
                      <span className="mt-1 block text-xs text-[var(--canon-text-muted)]">
                        {new Date(`${m.target_date}T12:00:00`).toLocaleDateString()} · {m.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      {!compact ? (
        <Link
          href={`/dashboard/tasks?project_id=${encodeURIComponent(projectId)}`}
          className="text-sm text-[var(--canon-cyan)] hover:underline"
        >
          {tDetail("viewProjectTasks")}
        </Link>
      ) : null}
    </div>
  );
}
