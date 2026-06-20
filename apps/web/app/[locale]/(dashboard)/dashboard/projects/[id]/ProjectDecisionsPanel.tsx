"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Button,
  EmptyState,
  Skeleton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui";
import type { ClientRequestDecisionType, ClientRequestManager } from "@/lib/domain/client-requests/client-requests.types";

const DECISION_TYPES: ClientRequestDecisionType[] = [
  "design_choice",
  "material_choice",
  "estimate_approval",
  "cost_change_customer_facing",
  "schedule_change",
  "document_approval",
  "work_acceptance",
  "general_question",
  "other",
];

async function fetchDecisionRequests(projectId: string): Promise<ClientRequestManager[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/decision-requests?status=all`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("load_failed");
  const json = await res.json();
  return json.data ?? [];
}

function isOverdueOpen(row: ClientRequestManager): boolean {
  if (row.status !== "open" || !row.due_at) return false;
  return new Date(row.due_at).getTime() < Date.now();
}

export function ProjectDecisionsPanel({ projectId }: { projectId: string }) {
  const t = useTranslations("dashboardDetail");
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [decisionType, setDecisionType] = useState<ClientRequestDecisionType>("general_question");
  const [dueAt, setDueAt] = useState("");
  const [description, setDescription] = useState("");
  const [customerAmount, setCustomerAmount] = useState("");
  const [customerCurrency, setCustomerCurrency] = useState("EUR");

  const listQuery = useQuery({
    queryKey: ["decision-requests", projectId],
    queryFn: () => fetchDecisionRequests(projectId),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        type: decisionType,
        title: title.trim(),
        description: description.trim() || null,
        due_at: dueAt.trim() || null,
      };
      if (decisionType === "estimate_approval" && customerAmount.trim()) {
        const n = Number(customerAmount);
        if (!Number.isNaN(n)) {
          body.customer_visible_amount = n;
          body.customer_visible_currency = customerCurrency.trim() || "EUR";
        }
      }
      const res = await fetch(`/api/v1/projects/${projectId}/decision-requests`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j.error === "string" ? j.error : "create_failed");
      }
      return res.json();
    },
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setDueAt("");
      setCustomerAmount("");
      qc.invalidateQueries({ queryKey: ["decision-requests", projectId] });
    },
  });

  if (listQuery.isPending) return <Skeleton className="h-64" />;
  if (listQuery.isError) {
    return (
      <p className="text-aistroyka-text-secondary p-4" role="alert">
        {t("decisionRequestsLoadFailed")}
      </p>
    );
  }

  const rows = listQuery.data ?? [];

  return (
    <div className="p-4 space-y-8">
      <p className="text-aistroyka-caption text-aistroyka-text-secondary max-w-2xl">{t("decisionRequestsPanelHint")}</p>
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/dashboard/projects/${projectId}/client`}
          className="text-aistroyka-caption text-aistroyka-accent hover:underline"
        >
          {t("decisionRequestsOpenCustomerView")}
        </Link>
      </div>

      <section aria-labelledby="decisions-create-heading" className="rounded-lg border border-aistroyka-border-subtle p-4 space-y-4">
        <h2 id="decisions-create-heading" className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
          {t("decisionRequestsCreateHeading")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-aistroyka-text-secondary">{t("title")}</span>
            <input
              className="input-field-sm text-aistroyka-text-primary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-aistroyka-text-secondary">{t("decisionRequestsTypeLabel")}</span>
            <select
              className="input-field-sm text-aistroyka-text-primary"
              value={decisionType}
              onChange={(e) => setDecisionType(e.target.value as ClientRequestDecisionType)}
            >
              {DECISION_TYPES.map((dt) => (
                <option key={dt} value={dt}>
                  {dt.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-aistroyka-text-secondary">{t("decisionRequestsDueOptional")}</span>
            <input
              type="datetime-local"
              className="input-field-sm text-aistroyka-text-primary"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </label>
          {decisionType === "estimate_approval" ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-aistroyka-text-secondary">{t("decisionRequestsCustomerAmountOptional")}</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="flex-1 input-field-sm text-aistroyka-text-primary"
                  value={customerAmount}
                  onChange={(e) => setCustomerAmount(e.target.value)}
                  placeholder="0"
                />
                <input
                  className="w-24 input-field-sm text-aistroyka-text-primary"
                  value={customerCurrency}
                  onChange={(e) => setCustomerCurrency(e.target.value)}
                  maxLength={8}
                  aria-label={t("decisionRequestsCurrencyLabel")}
                />
              </div>
            </label>
          ) : null}
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-aistroyka-text-secondary">{t("decisionRequestsDescriptionLabel")}</span>
          <textarea
            className="input-field-sm min-h-[88px] text-aistroyka-text-primary"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {createMutation.isError ? (
          <p className="text-sm text-aistroyka-danger" role="alert">
            {t("decisionRequestsCreateFailed")}
          </p>
        ) : null}
        {createMutation.isSuccess ? (
          <p className="text-sm text-aistroyka-success" role="status">
            {t("decisionRequestsCreated")}
          </p>
        ) : null}
        <Button
          type="button"
          variant="primary"
          disabled={!title.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? t("decisionRequestsCreating") : t("decisionRequestsSubmit")}
        </Button>
      </section>

      {rows.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">✅</span>}
          title={t("decisions")}
          subtitle={t("decisionRequestsEmpty")}
        />
      ) : (
        <Table aria-label={t("decisions")}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("title")}</TableHeaderCell>
              <TableHeaderCell>{t("type")}</TableHeaderCell>
              <TableHeaderCell>{t("status")}</TableHeaderCell>
              <TableHeaderCell>{t("due")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <span className="font-medium text-aistroyka-text-primary">{r.title}</span>
                  {isOverdueOpen(r) ? (
                    <span className="ml-2 inline-flex rounded px-2 py-0.5 text-xs font-medium bg-aistroyka-danger/15 text-aistroyka-danger">
                      {t("decisionRequestsOverdue")}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-aistroyka-caption">{r.decision_type ?? "—"}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell>{r.due_at ? new Date(r.due_at).toLocaleString() : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
