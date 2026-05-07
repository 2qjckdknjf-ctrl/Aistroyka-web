"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { handoverStatusBadgeClass } from "./statusBadgeStyles";
import { formatPortalStatus } from "@/lib/i18n/portal-status-labels";

type Blocker = {
  code: string;
  title: string;
  detail: string;
  count: number;
  href: string | null;
};

type ManagerPayload = {
  handover: { id: string; status: string; handover_notes: string | null; handed_over_at: string | null; completed_at: string | null };
  readiness: { ready: boolean; blockers: Blocker[] };
};

async function fetchHandover(projectId: string): Promise<ManagerPayload> {
  const res = await fetch(`/api/v1/projects/${projectId}/handover`, { credentials: "include" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Failed to load");
  }
  const j = await res.json();
  if (j.audience !== "manager") throw new Error("Manager access required");
  return j.data;
}

export function HandoverManagerPanel({ projectId }: { projectId: string }) {
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const q = useQuery({
    queryKey: ["project-handover", projectId],
    queryFn: () => fetchHandover(projectId),
  });

  const transition = useMutation({
    mutationFn: async (to_status: string) => {
      const res = await fetch(`/api/v1/projects/${projectId}/handover/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to_status, note: note.trim() || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Transition failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-handover", projectId] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-activity", projectId] });
      queryClient.invalidateQueries({ queryKey: ["client-project-view", projectId] });
      setNote("");
    },
  });

  if (q.isPending) {
    return (
      <Card className="border-l-4 border-l-aistroyka-success p-4">
        <p className="text-sm text-aistroyka-text-secondary">{tDetail("loadingHandover")}</p>
      </Card>
    );
  }

  if (q.isError) {
    return (
      <Card className="border-l-4 border-l-aistroyka-success p-4">
        <p className="text-sm text-aistroyka-error">{q.error instanceof Error ? q.error.message : tDetail("error")}</p>
      </Card>
    );
  }

  const { handover, readiness } = q.data!;
  const NEXT_LABEL: Record<string, string> = {
    in_progress: tDetail("markReadyForHandover"),
    handover_ready: tDetail("recordHandoverToClient"),
    handed_over: tDetail("markProjectCompleted"),
  };
  const nextStatus =
    handover.status === "in_progress"
      ? "handover_ready"
      : handover.status === "handover_ready"
        ? "handed_over"
        : handover.status === "handed_over"
          ? "completed"
          : null;

  return (
    <Card className="border-l-4 border-l-aistroyka-success p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
            {tDetail("handoverCompletion")}
          </h3>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">
            {tDetail("handoverManagerHint")}
          </p>
        </div>
        <Badge className={handoverStatusBadgeClass(handover.status)}>{formatPortalStatus(handover.status, "handover", tPortal)}</Badge>
      </div>

      <p className="mt-3 text-sm">
        <Link href={`/dashboard/projects/${projectId}/handover/pack`} className="font-medium text-aistroyka-accent hover:underline">
          {tDetail("handoverPackPreviewLink")}
        </Link>
      </p>

      {!readiness.ready ? (
        <div className="mt-4 rounded-lg border border-aistroyka-warning/40 bg-aistroyka-warning/10 p-3">
          <p className="text-sm font-medium text-aistroyka-warning">{tDetail("blockedResolveBeforeAdvancing")}</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-aistroyka-text-secondary">
            {readiness.blockers.map((b) => (
              <li key={b.code}>
                <span className="font-medium text-aistroyka-text-primary">{b.title}</span>
                {b.count > 1 ? ` (${b.count})` : ""} — {b.detail}
                {b.href ? (
                  <>
                    {" "}
                    <Link href={b.href} className="text-aistroyka-accent hover:underline">
                      {tDetail("open")}
                    </Link>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-sm text-aistroyka-success">{tDetail("noBlockingItemsForHandover")}</p>
      )}

      {nextStatus ? (
        <div className="mt-4 space-y-2 rounded-lg border border-aistroyka-border-subtle p-3">
          {(nextStatus === "handed_over" || nextStatus === "completed") && (
            <div>
              <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("noteOptionalSharedWithClient")}</label>
              <textarea
                className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={tDetail("shortSummaryForClientRecord")}
              />
            </div>
          )}
          <Button
            type="button"
            size="sm"
            disabled={transition.isPending || (!readiness.ready && (nextStatus === "handover_ready" || nextStatus === "handed_over"))}
            onClick={() => transition.mutate(nextStatus)}
          >
            {transition.isPending ? tDetail("applying") : NEXT_LABEL[handover.status] ?? tDetail("advance")}
          </Button>
          {transition.isError ? (
            <p className="text-sm text-aistroyka-error">
              {transition.error instanceof Error ? transition.error.message : tDetail("error")}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-aistroyka-text-tertiary">{tDetail("projectMarkedCompleted")}</p>
      )}
    </Card>
  );
}
