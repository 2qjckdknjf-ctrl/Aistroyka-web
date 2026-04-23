"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Badge, Skeleton, ErrorState } from "@/components/ui";
import { recurringRuleStateBadgeClass } from "./statusBadgeStyles";

type RuleRow = {
  id: string;
  rule_kind: string;
  cadence: string;
  cadence_days: number | null;
  active: boolean;
  last_fired_at: string | null;
  next_due_at: string | null;
};

async function fetchRules(): Promise<{ rules: RuleRow[]; canToggle: boolean }> {
  const res = await fetch("/api/v1/recurring-operations/rules", { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === "string" ? err.error : "Failed to load");
  }
  const j = await res.json();
  return j.data;
}

export function RecurringOperationsPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["recurring-operations", "rules"], queryFn: fetchRules });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/v1/recurring-operations/rules/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-operations", "rules"] }),
  });

  if (q.isPending) {
    return (
      <Card className="p-4">
        <Skeleton className="h-6 w-48 mb-3" />
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  if (q.isError) {
    return (
      <ErrorState
        message={q.error instanceof Error ? q.error.message : "Failed to load"}
        onRetry={() => q.refetch()}
      />
    );
  }

  const { rules, canToggle } = q.data ?? { rules: [], canToggle: false };

  return (
    <Card className="p-4 border border-aistroyka-border-subtle">
      <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Recurring operations</h2>
      <p className="mt-1 text-sm text-aistroyka-text-secondary">
        Finite scheduled checks (cron). When conditions still apply, managers get in-app notifications and matching rows
        appear in your inbox for seven days after each run. This is not a custom workflow builder.
      </p>
      {rules.length === 0 ? (
        <p className="mt-3 text-sm text-aistroyka-text-tertiary">
          No rules yet — they are created on the next successful cron tick for your workspace.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rules.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded border border-aistroyka-border-subtle p-3 text-sm"
            >
              <div>
                <p className="font-medium text-aistroyka-text-primary">{formatKind(r.rule_kind)}</p>
                <p className="text-aistroyka-text-tertiary text-xs mt-0.5">
                  Cadence: {formatCadence(r)} · Last fired: {r.last_fired_at ? r.last_fired_at.slice(0, 16) : "—"} · Next due:{" "}
                  {r.next_due_at ? r.next_due_at.slice(0, 16) : "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {r.active ? (
                  <Badge className={recurringRuleStateBadgeClass(true)}>Active</Badge>
                ) : (
                  <Badge className={recurringRuleStateBadgeClass(false)}>Off</Badge>
                )}
                {canToggle ? (
                  <button
                    type="button"
                    className="rounded border border-aistroyka-border-subtle px-2 py-1 text-xs font-medium hover:bg-aistroyka-surface-raised"
                    disabled={toggle.isPending}
                    onClick={() => toggle.mutate({ id: r.id, active: !r.active })}
                  >
                    {r.active ? "Turn off" : "Turn on"}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function formatKind(kind: string): string {
  return kind.replace(/_/g, " ");
}

function formatCadence(r: RuleRow): string {
  if (r.cadence === "every_n_days" && r.cadence_days) return `every ${r.cadence_days} days`;
  return r.cadence;
}
