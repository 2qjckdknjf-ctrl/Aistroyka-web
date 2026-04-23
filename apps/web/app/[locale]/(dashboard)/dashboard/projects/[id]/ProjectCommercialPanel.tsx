"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Skeleton,
  EmptyState,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Button,
  Card,
  Input,
  Select,
  Badge,
} from "@/components/ui";
import type { CommercialItemRow, CommercialItemKind, CommercialItemStatus } from "@/lib/domain/commercial/commercial.types";
import { isEffectivelyOverdue } from "@/lib/domain/commercial/commercial.overdue";

async function fetchItems(projectId: string): Promise<CommercialItemRow[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/commercial-items`, { credentials: "include" });
  if (!res.ok) return [];
  const j = await res.json();
  return j.data ?? [];
}

const KINDS: { value: CommercialItemKind; label: string }[] = [
  { value: "invoice", label: "Invoice" },
  { value: "expected_revenue", label: "Expected revenue" },
  { value: "deposit", label: "Deposit" },
  { value: "credit_note", label: "Credit / adjustment" },
  { value: "other", label: "Other" },
];

const STATUSES: CommercialItemStatus[] = [
  "draft",
  "issued",
  "due",
  "overdue",
  "paid",
  "cancelled",
];

function statusBadgeClass(s: CommercialItemStatus, row: CommercialItemRow): string {
  if (s === "paid") return "bg-aistroyka-success/20 text-aistroyka-success";
  if (s === "cancelled") return "bg-aistroyka-text-tertiary/20 text-aistroyka-text-tertiary";
  if (isEffectivelyOverdue({ status: s, due_date: row.due_date })) return "bg-aistroyka-error/20 text-aistroyka-error";
  if (s === "due" || s === "issued") return "bg-aistroyka-warning/20 text-aistroyka-warning";
  return "bg-aistroyka-info/20 text-aistroyka-info";
}

function statusLabel(s: CommercialItemStatus, row: CommercialItemRow): string {
  if (isEffectivelyOverdue({ status: s, due_date: row.due_date }) && s !== "paid" && s !== "cancelled") {
    return "Overdue";
  }
  return s.replace(/_/g, " ");
}

export function ProjectCommercialPanel({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [kind, setKind] = useState<CommercialItemKind>("invoice");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("RUB");
  const [dueDate, setDueDate] = useState("");

  const q = useQuery({
    queryKey: ["commercial-items", projectId],
    queryFn: () => fetchItems(projectId),
    enabled: !!projectId,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/commercial-items`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title: title.trim(),
          amount: parseFloat(amount),
          currency,
          due_date: dueDate || null,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(typeof e.error === "string" ? e.error : "Failed to create");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commercial-items", projectId] });
      qc.invalidateQueries({ queryKey: ["project-summary", projectId] });
      setCreating(false);
      setTitle("");
      setAmount("");
      setDueDate("");
    },
  });

  const patchMut = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/v1/projects/${projectId}/commercial-items/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(typeof e.error === "string" ? e.error : "Failed to update");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commercial-items", projectId] });
      qc.invalidateQueries({ queryKey: ["project-summary", projectId] });
    },
  });

  if (q.isPending) return <Skeleton className="h-48 m-4" />;
  if (q.isError) return <p className="p-4 text-aistroyka-error">Failed to load commercial items.</p>;

  const rows = q.data ?? [];

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Commercial &amp; billing</h3>
          <p className="text-sm text-aistroyka-text-secondary">
            Invoices and billing lines — not accounting. Track issue → payment and link change orders when relevant.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setCreating(!creating)}>
          {creating ? "Close form" : "Add line"}
        </Button>
      </div>

      {creating ? (
        <Card className="p-4 border border-aistroyka-border-subtle">
          <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary mb-3">New commercial line</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm">
              <span className="text-aistroyka-text-tertiary">Kind</span>
              <Select value={kind} onChange={(e) => setKind(e.target.value as CommercialItemKind)} className="mt-1 w-full">
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-aistroyka-text-tertiary">Title</span>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" placeholder="e.g. Progress invoice #3" />
            </label>
            <label className="block text-sm">
              <span className="text-aistroyka-text-tertiary">Amount</span>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
            </label>
            <label className="block text-sm">
              <span className="text-aistroyka-text-tertiary">Currency</span>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1" />
            </label>
            <label className="block text-sm">
              <span className="text-aistroyka-text-tertiary">Due date</span>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" />
            </label>
          </div>
          {createMut.isError ? (
            <p className="mt-2 text-sm text-aistroyka-error">{(createMut.error as Error).message}</p>
          ) : null}
          <Button
            type="button"
            className="mt-3"
            disabled={!title.trim() || !amount || createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            {createMut.isPending ? "Saving…" : "Create draft"}
          </Button>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">📄</span>}
          title="No commercial lines"
          subtitle="Add billing or expected revenue lines to track payment status against this project."
        />
      ) : (
        <Table aria-label="Commercial items">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Kind</TableHeaderCell>
              <TableHeaderCell>Amount</TableHeaderCell>
              <TableHeaderCell>Due</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Next action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium text-aistroyka-text-primary">{row.title}</TableCell>
                <TableCell className="text-aistroyka-text-secondary">{row.kind.replace(/_/g, " ")}</TableCell>
                <TableCell>
                  {row.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {row.currency}
                </TableCell>
                <TableCell>{row.due_date ?? "—"}</TableCell>
                <TableCell>
                  <Badge className={statusBadgeClass(row.status, row)}>{statusLabel(row.status, row)}</Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={row.status}
                    onChange={(e) =>
                      patchMut.mutate({
                        id: row.id,
                        body: { status: e.target.value as CommercialItemStatus },
                      })
                    }
                    className="max-w-[11rem] text-sm"
                    disabled={patchMut.isPending}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
