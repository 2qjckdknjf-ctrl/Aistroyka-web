"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Button, Badge, Skeleton, EmptyState } from "@/components/ui";
import { discussionStatusBadgeClass, formatStatusLabel } from "../../statusBadgeStyles";

type Entry = {
  id: string;
  entry_kind: string;
  body: string;
  created_at: string;
  author_user_id: string;
};

type Detail = {
  id: string;
  kind: string;
  status: string;
  title: string;
  context: string | null;
  created_by: string;
  entries: Entry[];
  resolution_summary: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
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

export function ManagerDiscussionDetailClient({
  projectId,
  discussionId,
}: {
  projectId: string;
  discussionId: string;
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"question" | "clarification" | "feedback">("question");
  const [resolution, setResolution] = useState("");

  const q = useQuery({
    queryKey: ["stakeholder-discussion", projectId, discussionId, "manager"],
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
        throw new Error((j as { error?: string }).error ?? "Could not add");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-discussion", projectId, discussionId] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-discussions", projectId] });
      setBody("");
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/stakeholder-discussions/${discussionId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resolution_summary: resolution }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Could not resolve");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-discussion", projectId, discussionId] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-discussions", projectId] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-activity", projectId] });
      setResolution("");
    },
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/stakeholder-discussions/${discussionId}/close`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Could not close");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-discussion", projectId, discussionId] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-discussions", projectId] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-activity", projectId] });
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
          title="Discussion unavailable"
          subtitle={q.error instanceof Error ? q.error.message : ""}
        />
      </Card>
    );
  }

  const d = q.data!;
  const open = d.status !== "closed" && d.status !== "resolved";

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/projects/${projectId}`} className="text-aistroyka-subheadline text-aistroyka-accent hover:underline">
        ← Project
      </Link>
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-aistroyka-title3 font-semibold">{d.title}</h1>
          <Badge className={discussionStatusBadgeClass(d.status)}>{formatStatusLabel(d.status)}</Badge>
        </div>
        <p className="mt-1 text-xs text-aistroyka-text-tertiary">Created by user {d.created_by.slice(0, 8)}…</p>
        {d.context ? <p className="mt-3 text-sm whitespace-pre-wrap">{d.context}</p> : null}
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold">History</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {d.entries.map((e) => (
            <li key={e.id} className="rounded border border-aistroyka-border-subtle p-2">
              <span className="text-xs text-aistroyka-text-tertiary">
                {e.entry_kind} · author {e.author_user_id.slice(0, 8)}…
              </span>
              <p className="mt-1 whitespace-pre-wrap">{e.body}</p>
            </li>
          ))}
        </ul>
      </Card>

      {open ? (
        <>
          <Card className="p-4">
            <h2 className="font-semibold">Add update</h2>
            <select
              className="mt-2 w-full max-w-md rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
            >
              <option value="question">Question</option>
              <option value="clarification">Clarification</option>
              <option value="feedback">Feedback</option>
            </select>
            <textarea
              className="mt-2 w-full rounded border border-aistroyka-border-subtle p-2 text-sm"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <Button
              type="button"
              size="sm"
              className="mt-2"
              loading={addMutation.isPending}
              disabled={body.trim().length < 1}
              onClick={() => addMutation.mutate()}
            >
              Post update
            </Button>
          </Card>

          <Card className="p-4 border-l-4 border-l-aistroyka-success">
            <h2 className="font-semibold">Resolve</h2>
            <textarea
              className="mt-2 w-full rounded border border-aistroyka-border-subtle p-2 text-sm"
              rows={2}
              placeholder="Short resolution summary (visible to client)"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            />
            <Button
              type="button"
              size="sm"
              className="mt-2"
              loading={resolveMutation.isPending}
              disabled={resolution.trim().length < 1}
              onClick={() => resolveMutation.mutate()}
            >
              Mark resolved
            </Button>
          </Card>

          <Button type="button" variant="ghost" size="sm" loading={closeMutation.isPending} onClick={() => closeMutation.mutate()}>
            Close without resolution
          </Button>
        </>
      ) : null}
    </div>
  );
}
