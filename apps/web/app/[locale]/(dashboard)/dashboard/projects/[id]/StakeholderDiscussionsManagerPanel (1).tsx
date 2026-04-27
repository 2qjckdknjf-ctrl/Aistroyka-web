"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Button, Badge } from "@/components/ui";

type Row = {
  id: string;
  kind: string;
  status: string;
  title: string;
  updated_at: string;
};

async function fetchList(projectId: string): Promise<Row[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/stakeholder-discussions`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  const j = await res.json();
  return j.data ?? [];
}

export function StakeholderDiscussionsManagerPanel({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"general" | "document_clarification" | "milestone_decision" | "request_followup">(
    "general"
  );
  const [context, setContext] = useState("");

  const listQuery = useQuery({
    queryKey: ["stakeholder-discussions", projectId],
    queryFn: () => fetchList(projectId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/stakeholder-discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          kind,
          title: title.trim(),
          context: context.trim() || null,
          initial_status: "awaiting_stakeholder",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Create failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-discussions", projectId] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-activity", projectId] });
      setTitle("");
      setContext("");
      setOpen(false);
    },
  });

  return (
    <Card className="border-l-4 border-l-aistroyka-info p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
            Discussions &amp; resolution
          </h3>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">
            Structured threads with outcomes — not chat. Use for clarifications and decisions with the client.
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "New discussion"}
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
              <option value="general">General</option>
              <option value="document_clarification">Document clarification</option>
              <option value="milestone_decision">Milestone decision</option>
              <option value="request_followup">Request follow-up</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">Title</label>
            <input
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short topic"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-aistroyka-text-secondary">Context (optional)</label>
            <textarea
              className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              rows={3}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="What needs to be decided or clarified?"
            />
          </div>
          {createMutation.isError && createMutation.error instanceof Error ? (
            <p className="text-sm text-aistroyka-error" role="alert">
              {createMutation.error.message}
            </p>
          ) : null}
          <Button
            type="button"
            size="sm"
            loading={createMutation.isPending}
            disabled={title.trim().length < 1}
            onClick={() => createMutation.mutate()}
          >
            Create &amp; notify client
          </Button>
        </div>
      ) : null}

      {listQuery.isPending ? (
        <p className="mt-3 text-sm text-aistroyka-text-tertiary">Loading…</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {(listQuery.data ?? []).length === 0 ? (
            <li className="text-sm text-aistroyka-text-tertiary">No discussions yet.</li>
          ) : (
            (listQuery.data ?? []).map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-aistroyka-border-subtle px-3 py-2 text-sm"
              >
                <div>
                  <Link
                    href={`/dashboard/projects/${projectId}/discussions/${r.id}`}
                    className="font-medium text-aistroyka-accent hover:underline"
                  >
                    {r.title}
                  </Link>
                  <span className="ml-2 text-aistroyka-text-tertiary">
                    {r.kind} · {r.status}
                  </span>
                </div>
                <Badge className="bg-aistroyka-surface-raised text-aistroyka-text-secondary">{r.status}</Badge>
              </li>
            ))
          )}
        </ul>
      )}
    </Card>
  );
}
