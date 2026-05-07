"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Button, Badge, Skeleton, EmptyState } from "@/components/ui";
import { changeOrderStatusBadgeClass } from "../../statusBadgeStyles";
import { formatPortalStatus } from "@/lib/i18n/portal-status-labels";

type Event = {
  id: string;
  from_status: string | null;
  to_status: string;
  actor_user_id: string;
  note: string | null;
  created_at: string;
};

type Detail = {
  id: string;
  kind: string;
  status: string;
  title: string;
  description: string | null;
  schedule_impact_level: string;
  budget_impact_level: string;
  schedule_impact_summary: string | null;
  budget_impact_summary: string | null;
  schedule_delta_days: number | null;
  budget_delta_amount: number | null;
  linked_discussion_id: string | null;
  linked_document_id: string | null;
  linked_request_id: string | null;
  linked_milestone_id: string | null;
  created_by: string;
  implemented_at: string | null;
  implemented_by: string | null;
  created_at: string;
  updated_at: string;
  events: Event[];
};

const NEXT: Record<string, string[]> = {
  draft: ["proposed", "archived"],
  proposed: ["under_review", "approved", "rejected", "draft", "archived"],
  under_review: ["approved", "rejected", "proposed", "archived"],
  approved: ["implemented", "archived"],
  rejected: ["draft", "proposed", "archived"],
  implemented: ["archived"],
  archived: [],
};

async function fetchDetail(projectId: string, changeOrderId: string): Promise<Detail> {
  const res = await fetch(`/api/v1/projects/${projectId}/change-orders/${changeOrderId}`, { credentials: "include" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Failed to load");
  }
  const j = await res.json();
  if (j.audience !== "manager") {
    throw new Error("Manager view required");
  }
  return j.data;
}

export function ManagerChangeOrderDetailClient({
  projectId,
  changeOrderId,
}: {
  projectId: string;
  changeOrderId: string;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const queryClient = useQueryClient();
  const [toStatus, setToStatus] = useState("");
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleLevel, setScheduleLevel] = useState("none");
  const [budgetLevel, setBudgetLevel] = useState("none");
  const [scheduleSummary, setScheduleSummary] = useState("");
  const [budgetSummary, setBudgetSummary] = useState("");
  const [scheduleDays, setScheduleDays] = useState("");
  const [budgetAmt, setBudgetAmt] = useState("");

  const q = useQuery({
    queryKey: ["change-order", projectId, changeOrderId, "manager"],
    queryFn: () => fetchDetail(projectId, changeOrderId),
  });

  const d = q.data;
  useEffect(() => {
    if (!d) return;
    setTitle(d.title);
    setDescription(d.description ?? "");
    setScheduleLevel(d.schedule_impact_level);
    setBudgetLevel(d.budget_impact_level);
    setScheduleSummary(d.schedule_impact_summary ?? "");
    setBudgetSummary(d.budget_impact_summary ?? "");
    setScheduleDays(d.schedule_delta_days != null ? String(d.schedule_delta_days) : "");
    setBudgetAmt(d.budget_delta_amount != null ? String(d.budget_delta_amount) : "");
    const next = NEXT[d.status] ?? [];
    setToStatus(next[0] ?? "");
  }, [d]);

  const editable =
    d && (d.status === "draft" || d.status === "proposed" || d.status === "under_review");

  const patchMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/change-orders/${changeOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          schedule_impact_level: scheduleLevel,
          budget_impact_level: budgetLevel,
          schedule_impact_summary: scheduleSummary.trim() || null,
          budget_impact_summary: budgetSummary.trim() || null,
          schedule_delta_days: scheduleDays === "" ? null : Number(scheduleDays),
          budget_delta_amount: budgetAmt === "" ? null : Number(budgetAmt),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Save failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change-order", projectId, changeOrderId] });
      queryClient.invalidateQueries({ queryKey: ["change-orders", projectId] });
    },
  });

  const transitionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/change-orders/${changeOrderId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to_status: toStatus, note: note.trim() || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Transition failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change-order", projectId, changeOrderId] });
      queryClient.invalidateQueries({ queryKey: ["change-orders", projectId] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-activity", projectId] });
      setNote("");
    },
  });

  if (q.isPending) {
    return (
      <Card>
        <Skeleton className="h-40" />
      </Card>
    );
  }

  if (q.isError) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">📋</span>}
          title={tDetail("changeOrderUnavailable")}
          subtitle={q.error instanceof Error ? q.error.message : ""}
        />
      </Card>
    );
  }

  const row = q.data!;
  const options = NEXT[row.status] ?? [];

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/projects/${projectId}`} className="text-aistroyka-subheadline text-aistroyka-accent hover:underline">
        {tDetail("backToProject")}
      </Link>
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-aistroyka-title3 font-semibold">{row.title}</h1>
          <Badge className={changeOrderStatusBadgeClass(row.status)}>{formatPortalStatus(row.status, "changeOrder", tPortal)}</Badge>
        </div>
        <p className="mt-1 text-xs text-aistroyka-text-tertiary">
          {tDetail("kind")}: {row.kind.replace(/_/g, " ")} · {tDetail("createdBy")} {row.created_by.slice(0, 8)}…
        </p>
      </Card>

      {editable ? (
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold">{tDetail("editDetails")}</h2>
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("title")}</label>
            <input
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("rationale")}</label>
            <textarea
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("scheduleImpactLevel")}</label>
              <select
                className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
                value={scheduleLevel}
                onChange={(e) => setScheduleLevel(e.target.value)}
              >
                <option value="none">{tDetail("noChange")}</option>
                <option value="minor_shift">{tDetail("minorShift")}</option>
                <option value="deadline_shift">{tDetail("deadlineShift")}</option>
                <option value="major_shift">{tDetail("majorShift")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("budgetImpactLevel")}</label>
              <select
                className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
                value={budgetLevel}
                onChange={(e) => setBudgetLevel(e.target.value)}
              >
                <option value="none">{tDetail("noChange")}</option>
                <option value="minor_increase">{tDetail("minorIncrease")}</option>
                <option value="major_increase">{tDetail("majorIncrease")}</option>
                <option value="tbd">{tDetail("tbd")}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("scheduleNotes")}</label>
            <input
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={scheduleSummary}
              onChange={(e) => setScheduleSummary(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("budgetNotes")}</label>
            <input
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={budgetSummary}
              onChange={(e) => setBudgetSummary(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("scheduleDeltaDays")}</label>
              <input
                className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
                value={scheduleDays}
                onChange={(e) => setScheduleDays(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("budgetDeltaAmount")}</label>
              <input
                className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
                value={budgetAmt}
                onChange={(e) => setBudgetAmt(e.target.value)}
                inputMode="decimal"
              />
            </div>
          </div>
          <Button type="button" size="sm" onClick={() => patchMutation.mutate()} disabled={patchMutation.isPending}>
            {patchMutation.isPending ? tDetail("saving") : tDetail("saveChanges")}
          </Button>
        </Card>
      ) : (
        <Card className="p-4">
          <h2 className="font-semibold">{tDetail("summary")}</h2>
          {row.description ? <p className="mt-2 text-sm whitespace-pre-wrap">{row.description}</p> : null}
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-aistroyka-text-tertiary">{tDetail("scheduleImpact")}</dt>
              <dd>{row.schedule_impact_level.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="text-aistroyka-text-tertiary">{tDetail("budgetImpact")}</dt>
              <dd>{row.budget_impact_level.replace(/_/g, " ")}</dd>
            </div>
            {row.schedule_impact_summary ? (
              <div className="sm:col-span-2">
                <dt className="text-aistroyka-text-tertiary">{tDetail("scheduleNotes")}</dt>
                <dd>{row.schedule_impact_summary}</dd>
              </div>
            ) : null}
            {row.budget_impact_summary ? (
              <div className="sm:col-span-2">
                <dt className="text-aistroyka-text-tertiary">{tDetail("budgetNotes")}</dt>
                <dd>{row.budget_impact_summary}</dd>
              </div>
            ) : null}
          </dl>
        </Card>
      )}

      {options.length > 0 ? (
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold">{tDetail("statusTransition")}</h2>
          <select
            className="w-full max-w-md rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
            value={toStatus}
            onChange={(e) => setToStatus(e.target.value)}
          >
            {options.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("noteOptionalAudit")}</label>
            <input
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => transitionMutation.mutate()}
            disabled={!toStatus || transitionMutation.isPending}
          >
            {transitionMutation.isPending ? tDetail("applying") : tDetail("applyTransition")}
          </Button>
          {transitionMutation.isError ? (
            <p className="text-sm text-aistroyka-error">
              {transitionMutation.error instanceof Error ? transitionMutation.error.message : tDetail("error")}
            </p>
          ) : null}
        </Card>
      ) : null}

      <Card className="p-4">
        <h2 className="font-semibold">{tDetail("history")}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {row.events.map((e) => (
            <li key={e.id} className="rounded border border-aistroyka-border-subtle p-2">
              <span className="text-xs text-aistroyka-text-tertiary">
                {e.from_status ?? "—"} → {e.to_status} · {e.actor_user_id.slice(0, 8)}… ·{" "}
                {new Date(e.created_at).toLocaleString()}
              </span>
              {e.note ? <p className="mt-1">{e.note}</p> : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
