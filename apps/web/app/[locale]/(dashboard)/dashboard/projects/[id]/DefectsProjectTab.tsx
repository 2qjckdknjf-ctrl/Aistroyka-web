"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Button, Badge, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui";
import { blockingBadgeClass, defectStatusBadgeClass, formatStatusLabel } from "./statusBadgeStyles";

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

export function DefectsProjectTab({ projectId }: { projectId: string }) {
  const tDetail = useTranslations("dashboardDetail");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [blocking, setBlocking] = useState(false);

  const listQuery = useQuery({
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
          initial_status: "open",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Create failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-defects", projectId] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-activity", projectId] });
      setTitle("");
      setDescription("");
      setBlocking(false);
      setOpen(false);
    },
  });

  if (listQuery.isError) {
    return <p className="p-4 text-sm text-aistroyka-error">{(listQuery.error as Error).message}</p>;
  }

  const rows = listQuery.data ?? [];

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-aistroyka-text-secondary">
        {tDetail("defectsProjectHint")}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen((o) => !o)}>
          {open ? tDetail("close") : tDetail("addItem")}
        </Button>
      </div>
      {open ? (
        <Card className="p-3 space-y-2">
          <input
            className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
            placeholder={tDetail("title")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm"
            rows={2}
            placeholder={tDetail("description")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={blocking} onChange={(e) => setBlocking(e.target.checked)} />
            {tDetail("blocksHandoverUntilResolved")}
          </label>
          <Button type="button" size="sm" disabled={!title.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? tDetail("saving") : tDetail("create")}
          </Button>
        </Card>
      ) : null}

      {listQuery.isPending ? <p className="text-sm text-aistroyka-text-secondary">{tDetail("loading")}</p> : null}

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{tDetail("title")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("blocking")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("due")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Link href={`/dashboard/projects/${projectId}/defects/${r.id}`} className="font-medium text-aistroyka-accent hover:underline">
                  {r.title}
                </Link>
              </TableCell>
              <TableCell>
                <Badge className={defectStatusBadgeClass(r.status)}>{formatStatusLabel(r.status)}</Badge>
              </TableCell>
              <TableCell>
                {r.is_blocking ? <Badge className={blockingBadgeClass}>{tDetail("blocking")}</Badge> : <span>{tDetail("no")}</span>}
              </TableCell>
              <TableCell>{r.due_date ? new Date(r.due_date).toLocaleDateString() : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 && !listQuery.isPending ? (
        <p className="text-sm text-aistroyka-text-secondary">{tDetail("noPunchListItemsYet")}</p>
      ) : null}
    </div>
  );
}
