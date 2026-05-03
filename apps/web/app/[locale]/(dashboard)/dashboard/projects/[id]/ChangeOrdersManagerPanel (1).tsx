"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Button, Badge } from "@/components/ui";
import { changeOrderStatusBadgeClass, formatStatusLabel } from "./statusBadgeStyles";

type Row = {
  id: string;
  kind: string;
  status: string;
  title: string;
  updated_at: string;
};

async function fetchList(projectId: string): Promise<Row[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/change-orders`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  const j = await res.json();
  return j.data ?? [];
}

export function ChangeOrdersManagerPanel({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<
    "owner_variation" | "manager_proposed" | "document_linked" | "decision_derived" | "other"
  >("manager_proposed");
  const [initialStatus, setInitialStatus] = useState<"draft" | "proposed">("draft");
  const [scheduleLevel, setScheduleLevel] = useState<"none" | "minor_shift" | "deadline_shift" | "major_shift">(
    "none"
  );
  const [budgetLevel, setBudgetLevel] = useState<"none" | "minor_increase" | "major_increase" | "tbd">("none");
  const [scheduleSummary, setScheduleSummary] = useState("");
  const [budgetSummary, setBudgetSummary] = useState("");

  const listQuery = useQuery({
    queryKey: ["change-orders", projectId],
    queryFn: () => fetchList(projectId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/change-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          kind,
          title: title.trim(),
          description: description.trim() || null,
          initial_status: initialStatus,
          schedule_impact_level: scheduleLevel,
          budget_impact_level: budgetLevel,
          schedule_impact_summary: scheduleSummary.trim() || null,
          budget_impact_summary: budgetSummary.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Create failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change-orders", projectId] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-activity", projectId] });
      setTitle("");
      setDescription("");
      setScheduleSummary("");
      setBudgetSummary("");
      setOpen(false);
    },
  });

  return (
    <Card className="border-l-4 border-l-aistroyka-warning p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
            Change orders &amp; variations
          </h3>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">
            Formal change-control — scope, schedule, and cost impact. Not accounting or legal automation.
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "New change order"}
        </Button>
      </div>

      {open ? (
        <div className="mt-4 space-y-3 rounded-lg border border-aistroyka-border-subtle p-3">
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">Kind</label>
            <select
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
            >
              <option value="owner_variation">Owner-requested variation</option>
              <option value="manager_proposed">Manager-proposed change</option>
              <option value="document_linked">Linked to a document</option>
              <option value="decision_derived">From a decision / discussion</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">Initial status</label>
            <select
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={initialStatus}
              onChange={(e) => setInitialStatus(e.target.value as typeof initialStatus)}
            >
              <option value="draft">Draft (internal)</option>
              <option value="proposed">Proposed (visible to client when shared)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">Title</label>
            <input
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short description of the change"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">Rationale</label>
            <textarea
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-aistroyka-text-secondary">Schedule impact</label>
              <select
                className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
                value={scheduleLevel}
                onChange={(e) => setScheduleLevel(e.target.value as typeof scheduleLevel)}
              >
                <option value="none">No change</option>
                <option value="minor_shift">Minor shift</option>
                <option value="deadline_shift">Deadline shift</option>
                <option value="major_shift">Major shift</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-aistroyka-text-secondary">Budget impact</label>
              <select
                className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
                value={budgetLevel}
                onChange={(e) => setBudgetLevel(e.target.value as typeof budgetLevel)}
              >
                <option value="none">No change</option>
                <option value="minor_increase">Minor increase</option>
                <option value="major_increase">Major increase</option>
                <option value="tbd">TBD</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">Schedule impact notes (optional)</label>
            <input
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={scheduleSummary}
              onChange={(e) => setScheduleSummary(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">Budget impact notes (optional)</label>
            <input
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={budgetSummary}
              onChange={(e) => setBudgetSummary(e.target.value)}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!title.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "Creating…" : "Create"}
          </Button>
          {createMutation.isError ? (
            <p className="text-sm text-aistroyka-error">
              {createMutation.error instanceof Error ? createMutation.error.message : "Error"}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {listQuery.isPending ? <p className="text-sm text-aistroyka-text-secondary">Loading…</p> : null}
        {listQuery.data?.length === 0 ? (
          <p className="text-sm text-aistroyka-text-secondary">No change orders yet.</p>
        ) : null}
        {listQuery.data?.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/30 px-3 py-2"
          >
            <div>
              <Link
                href={`/dashboard/projects/${projectId}/change-orders/${r.id}`}
                className="font-medium text-aistroyka-accent hover:underline"
              >
                {r.title}
              </Link>
              <p className="text-xs text-aistroyka-text-tertiary">
                {r.kind.replace(/_/g, " ")} · updated {new Date(r.updated_at).toLocaleString()}
              </p>
            </div>
            <Badge className={changeOrderStatusBadgeClass(r.status)}>{formatStatusLabel(r.status)}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
