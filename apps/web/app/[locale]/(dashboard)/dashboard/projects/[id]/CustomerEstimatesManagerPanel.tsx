"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button, Badge, Input } from "@/components/ui";
import type { CustomerEstimateRow } from "@/lib/domain/customer-estimates/customer-estimates.types";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

async function fetchCustomerEstimates(projectId: string): Promise<CustomerEstimateRow[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/estimates`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export function CustomerEstimatesManagerPanel({ projectId }: { projectId: string }) {
  const t = useTranslations("dashboardDetail");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("RUB");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [linkedDocId, setLinkedDocId] = useState("");

  const query = useQuery({
    queryKey: ["customer-estimates", projectId],
    queryFn: () => fetchCustomerEstimates(projectId),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["customer-estimates", projectId] });
    queryClient.invalidateQueries({ queryKey: ["client-project-view", projectId] });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/estimates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          total_amount: Number(amount),
          currency,
          valid_until: validUntil || null,
          linked_document_id: linkedDocId.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Create failed");
      }
    },
    onSuccess: () => {
      invalidateAll();
      setOpen(false);
      setTitle("");
      setAmount("");
      setDescription("");
      setValidUntil("");
      setLinkedDocId("");
    },
  });

  const patchMutation = useMutation({
    mutationFn: async (args: {
      estimateId: string;
      body: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/v1/projects/${projectId}/estimates/${args.estimateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(args.body),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(typeof b.error === "string" ? b.error : "Update failed");
      }
    },
    onSuccess: () => {
      invalidateAll();
      setEditingId(null);
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (estimateId: string) => {
      const res = await fetch(`/api/v1/projects/${projectId}/estimates/${estimateId}/send`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Send failed");
      }
    },
    onSuccess: () => {
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ["decision-requests", projectId] });
    },
  });

  const rows = query.data ?? [];

  return (
    <DashboardGlassCard className="border-l-4 border-l-aistroyka-success p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-aistroyka-text-primary">{t("customerEstimatesManagerHeading")}</h3>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">{t("customerEstimatesManagerHint")}</p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? t("customerEstimatesCloseForm") : t("customerEstimatesNewDraft")}
        </Button>
      </div>

      {open ? (
        <div className="mt-4 grid gap-3 rounded border border-aistroyka-border-subtle p-3 sm:grid-cols-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("title")} aria-label={t("title")} />
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            placeholder={t("customerEstimatesTotalPlaceholder")}
            aria-label={t("customerEstimatesTotalPlaceholder")}
          />
          <Input
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            placeholder={t("decisionRequestsCurrencyLabel")}
            aria-label={t("decisionRequestsCurrencyLabel")}
          />
          <Input value={validUntil} onChange={(e) => setValidUntil(e.target.value)} type="date" aria-label={t("customerEstimatesValidUntil")} />
          <Input
            value={linkedDocId}
            onChange={(e) => setLinkedDocId(e.target.value)}
            placeholder={t("customerEstimatesLinkedDocOptional")}
            className="sm:col-span-2"
            aria-label={t("customerEstimatesLinkedDocOptional")}
          />
          <textarea
            className="rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm sm:col-span-2 text-aistroyka-text-primary"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("customerEstimatesDescriptionPlaceholder")}
          />
          <Button
            type="button"
            size="sm"
            disabled={!title.trim() || !amount || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {t("customerEstimatesCreateDraft")}
          </Button>
          {createMutation.isError ? (
            <p className="text-sm text-aistroyka-error sm:col-span-2">{(createMutation.error as Error).message}</p>
          ) : null}
        </div>
      ) : null}

      <ul className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-aistroyka-text-tertiary">{t("customerEstimatesEmptyManager")}</li>
        ) : (
          rows.map((row) => (
            <li key={row.id} className="rounded border border-aistroyka-border-subtle p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-aistroyka-text-primary">{row.title}</p>
                  <p className="text-aistroyka-text-secondary">
                    {Number(row.total_amount).toLocaleString()} {row.currency}
                  </p>
                  {row.customer_note ? (
                    <p className="mt-1 text-xs text-aistroyka-text-tertiary">{t("customerEstimatesCustomerNote", { note: row.customer_note })}</p>
                  ) : null}
                </div>
                <Badge className="bg-aistroyka-surface-raised text-aistroyka-text-secondary">{row.status}</Badge>
              </div>

              {row.status === "draft" && editingId === row.id ? (
                <DraftEditor
                  row={row}
                  onCancel={() => setEditingId(null)}
                  onSave={(body) => patchMutation.mutate({ estimateId: row.id, body })}
                  isPending={patchMutation.isPending}
                  t={t}
                />
              ) : null}

              {row.status === "draft" && editingId !== row.id ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => setEditingId(row.id)}>
                    {t("customerEstimatesEditDraft")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={sendMutation.isPending}
                    onClick={() => sendMutation.mutate(row.id)}
                  >
                    {t("customerEstimatesSendForApproval")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={patchMutation.isPending}
                    onClick={() => patchMutation.mutate({ estimateId: row.id, body: { status: "cancelled" } })}
                  >
                    {t("customerEstimatesCancelDraft")}
                  </Button>
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>
      {patchMutation.isError ? <p className="mt-2 text-sm text-aistroyka-error">{(patchMutation.error as Error).message}</p> : null}
    </DashboardGlassCard>
  );
}

function DraftEditor({
  row,
  onCancel,
  onSave,
  isPending,
  t,
}: {
  row: CustomerEstimateRow;
  onCancel: () => void;
  onSave: (body: Record<string, unknown>) => void;
  isPending: boolean;
  t: (key: string, values?: Record<string, string>) => string;
}) {
  const [title, setTitle] = useState(row.title);
  const [amount, setAmount] = useState(String(row.total_amount));
  const [currency, setCurrency] = useState(row.currency);
  const [description, setDescription] = useState(row.description ?? "");
  const [validUntil, setValidUntil] = useState(row.valid_until ?? "");
  const [linkedDocId, setLinkedDocId] = useState(row.linked_document_id ?? "");

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2 border-t border-aistroyka-border-subtle pt-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label={t("title")} />
      <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" aria-label={t("customerEstimatesTotalPlaceholder")} />
      <Input value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label={t("decisionRequestsCurrencyLabel")} />
      <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} aria-label={t("customerEstimatesValidUntil")} />
      <Input
        value={linkedDocId}
        onChange={(e) => setLinkedDocId(e.target.value)}
        placeholder={t("customerEstimatesLinkedDocOptional")}
        className="sm:col-span-2"
      />
      <textarea
        className="sm:col-span-2 rounded border border-aistroyka-border-subtle p-2 text-aistroyka-text-primary"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex gap-2 sm:col-span-2">
        <Button
          type="button"
          size="sm"
          disabled={isPending || !title.trim()}
          onClick={() =>
            onSave({
              title: title.trim(),
              total_amount: Number(amount),
              currency,
              description: description.trim() || null,
              valid_until: validUntil || null,
              linked_document_id: linkedDocId.trim() || null,
            })
          }
        >
          {t("customerEstimatesSaveDraft")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {t("customerEstimatesCloseForm")}
        </Button>
      </div>
    </div>
  );
}
