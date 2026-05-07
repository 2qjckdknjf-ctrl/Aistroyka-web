"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Button, Badge, Skeleton, EmptyState } from "@/components/ui";
import { discussionStatusBadgeClass } from "../../../statusBadgeStyles";
import { formatPortalStatus } from "@/lib/i18n/portal-status-labels";

type Entry = { id: string; entry_kind: string; body: string; created_at: string };

type Detail = {
  id: string;
  kind: string;
  status: string;
  title: string;
  context: string | null;
  entries: Entry[];
  resolution_summary: string | null;
  resolved_at: string | null;
};

async function fetchDetail(projectId: string, discussionId: string): Promise<Detail> {
  const res = await fetch(`/api/v1/projects/${projectId}/stakeholder-discussions/${discussionId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Failed to load");
  }
  const j = await res.json();
  return j.data;
}

export function ClientPortalDiscussionDetailClient({
  projectId,
  discussionId,
}: {
  projectId: string;
  discussionId: string;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const tPortal = useTranslations("portalStatus");
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"feedback" | "clarification" | "option_selected">("feedback");

  const q = useQuery({
    queryKey: ["stakeholder-discussion", projectId, discussionId],
    queryFn: () => fetchDetail(projectId, discussionId),
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/stakeholder-discussions/${discussionId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ entry_kind: kind, body }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Could not send");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-discussion", projectId, discussionId] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-discussions", projectId] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-activity", projectId] });
      setBody("");
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
          icon={<span className="text-2xl">💬</span>}
          title={tDetail("discussionUnavailable")}
          subtitle={q.error instanceof Error ? q.error.message : tDetail("accessDeniedHint")}
        />
      </Card>
    );
  }

  const d = q.data!;
  const canRespond = d.status === "open" || d.status === "awaiting_stakeholder";

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/projects/${projectId}/client/discussions`}
        className="text-aistroyka-subheadline text-aistroyka-accent hover:underline"
      >
        {tDetail("backToAllDiscussions")}
      </Link>

      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{d.title}</h1>
          <Badge className={discussionStatusBadgeClass(d.status)}>{formatPortalStatus(d.status, "discussion", tPortal)}</Badge>
        </div>
        <p className="mt-1 text-xs capitalize text-aistroyka-text-tertiary">{d.kind.replace(/_/g, " ")}</p>
        {d.context ? <p className="mt-3 text-sm text-aistroyka-text-secondary whitespace-pre-wrap">{d.context}</p> : null}
        {d.resolution_summary ? (
          <div className="mt-4 rounded border border-aistroyka-success/30 bg-aistroyka-success/5 p-3">
            <p className="text-xs font-medium uppercase text-aistroyka-success">{tDetail("resolution")}</p>
            <p className="mt-1 text-sm text-aistroyka-text-primary whitespace-pre-wrap">{d.resolution_summary}</p>
          </div>
        ) : null}
      </Card>

      <Card className="p-4">
        <h2 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{tDetail("updates")}</h2>
        <ul className="mt-3 space-y-3">
          {d.entries.length === 0 ? (
            <li className="text-sm text-aistroyka-text-tertiary">{tDetail("noUpdatesYet")}</li>
          ) : (
            d.entries.map((e) => (
              <li key={e.id} className="rounded border border-aistroyka-border-subtle p-3 text-sm">
                <p className="text-xs text-aistroyka-text-tertiary capitalize">{e.entry_kind.replace(/_/g, " ")}</p>
                <p className="mt-1 text-aistroyka-text-primary whitespace-pre-wrap">{e.body}</p>
              </li>
            ))
          )}
        </ul>
      </Card>

      {canRespond ? (
        <Card className="p-4 border-l-4 border-l-aistroyka-warning">
          <h2 className="font-semibold text-aistroyka-text-primary">{tDetail("yourResponseTitle")}</h2>
          <p className="mt-1 text-xs text-aistroyka-text-tertiary">
            {tDetail("yourResponseHint")}
          </p>
          <div className="mt-3">
            <label className="text-xs font-medium text-aistroyka-text-secondary">{tDetail("type")}</label>
            <select
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
            >
              <option value="feedback">{tDetail("requestKindFeedback")}</option>
              <option value="clarification">{tDetail("clarification")}</option>
              <option value="option_selected">{tDetail("optionSelected")}</option>
            </select>
          </div>
          <textarea
            className="mt-3 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={tDetail("yourStructuredResponse")}
          />
          {addMutation.isError && addMutation.error instanceof Error ? (
            <p className="mt-2 text-sm text-aistroyka-error">{addMutation.error.message}</p>
          ) : null}
          <Button
            type="button"
            className="mt-3"
            size="sm"
            loading={addMutation.isPending}
            disabled={body.trim().length < 1}
            onClick={() => addMutation.mutate()}
          >
            {tDetail("submitResponse")}
          </Button>
        </Card>
      ) : (
        <p className="text-sm text-aistroyka-text-tertiary">
          {d.status === "resolved" || d.status === "closed"
            ? tDetail("discussionClosed")
            : tDetail("waitingForYourTeam")}
        </p>
      )}
    </div>
  );
}
