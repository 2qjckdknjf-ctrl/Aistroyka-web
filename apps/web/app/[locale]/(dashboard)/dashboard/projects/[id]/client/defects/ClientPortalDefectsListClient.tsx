"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Button, Badge, Skeleton, EmptyState } from "@/components/ui";
import { blockingBadgeClass, defectStatusBadgeClass, formatStatusLabel } from "../../statusBadgeStyles";

type Row = {
  id: string;
  title: string;
  status: string;
  is_blocking: boolean;
  due_date: string | null;
  updated_at: string;
};

async function fetchList(projectId: string): Promise<Row[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/defects`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  const j = await res.json();
  return j.data ?? [];
}

export function ClientPortalDefectsListClient({ projectId }: { projectId: string }) {
  const tDetail = useTranslations("dashboardDetail");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [blocking, setBlocking] = useState(false);

  const q = useQuery({
    queryKey: ["project-defects", projectId],
    queryFn: () => fetchList(projectId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/defects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          is_blocking: blocking,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Could not submit");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-defects", projectId] });
      setTitle("");
      setDescription("");
      setBlocking(false);
      setOpen(false);
    },
  });

  if (q.isPending) {
    return (
      <Card>
        <Skeleton className="h-32" />
      </Card>
    );
  }

  if (q.isError) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">📌</span>}
          title={tDetail("couldNotLoadPunchList")}
          subtitle={q.error instanceof Error ? q.error.message : ""}
        />
      </Card>
    );
  }

  const rows = q.data ?? [];

  return (
    <div className="space-y-4">
      <Link href={`/dashboard/projects/${projectId}/client`} className="text-aistroyka-accent hover:underline text-sm font-medium">
        {tDetail("backToClientPortal")}
      </Link>
      <Card className="p-4">
        <h1 className="text-aistroyka-title3 font-semibold">{tDetail("punchList")}</h1>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">
          {tDetail("reportSnagsHint")}
        </p>
        <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => setOpen((o) => !o)}>
          {open ? tDetail("cancel") : tDetail("reportAnItem")}
        </Button>
        {open ? (
          <div className="mt-4 space-y-2 rounded border border-aistroyka-border-subtle p-3">
            <input
              className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              placeholder={tDetail("shortTitle")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
              rows={3}
              placeholder={tDetail("whatNeedsAttention")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={blocking} onChange={(e) => setBlocking(e.target.checked)} />
              {tDetail("mayBlockCompletion")}
            </label>
            <Button type="button" size="sm" disabled={!title.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? tDetail("submitting") : tDetail("submit")}
            </Button>
          </div>
        ) : null}
        <ul className="mt-4 space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/dashboard/projects/${projectId}/client/defects/${r.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-aistroyka-border-subtle p-3 hover:bg-aistroyka-surface-raised"
              >
                <span className="font-medium text-aistroyka-text-primary">{r.title}</span>
                <span className="flex flex-wrap items-center gap-2">
                  {r.is_blocking ? <Badge className={blockingBadgeClass}>{tDetail("blocking")}</Badge> : null}
                  <Badge className={defectStatusBadgeClass(r.status)}>{formatStatusLabel(r.status)}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {rows.length === 0 ? <p className="mt-3 text-sm text-aistroyka-text-secondary">{tDetail("noItemsYet")}</p> : null}
      </Card>
    </div>
  );
}
