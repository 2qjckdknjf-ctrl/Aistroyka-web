"use client";

/**
 * AIS-RECON-017 Manager UI for Finding Ledger.
 * No prices/margin. Create/review only — never mutates estimates.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, EmptyState, Input, Skeleton } from "@/components/ui";
import { CanonSurface } from "@/components/canon/CanonSurface";

type Finding = {
  id: string;
  kind: string;
  status: string;
  title: string;
  summary: string;
  expected_quantity: number | null;
  observed_quantity: number | null;
  unit: string | null;
  source_document_ref: string | null;
  source_revision: string | null;
  created_at: string;
};

async function fetchFindings(projectId: string): Promise<Finding[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/reconciliation/findings`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("FAILED_LOAD_FINDINGS");
  const json = (await res.json()) as { data?: { findings?: Finding[] } };
  return json.data?.findings ?? [];
}

async function createFinding(
  projectId: string,
  body: {
    title: string;
    summary: string;
    expected_quantity: number;
    observed_quantity: number;
    unit: string;
    source_document_ref?: string;
    source_revision?: string;
  }
): Promise<Finding> {
  const res = await fetch(`/api/v1/projects/${projectId}/reconciliation/findings`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "quantity_mismatch", ...body }),
  });
  const json = (await res.json()) as { data?: Finding; error?: string };
  if (!res.ok || !json.data) throw new Error(json.error ?? "CREATE_FAILED");
  return json.data;
}

async function reviewFinding(findingId: string, status: "accepted" | "rejected"): Promise<void> {
  const res = await fetch(`/api/v1/reconciliation/findings/${findingId}/review`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const json = (await res.json()) as { error?: string };
    throw new Error(json.error ?? "REVIEW_FAILED");
  }
}

export function ProjectReconciliationFindingsPanel({
  projectId,
  skin = "default",
}: {
  projectId: string;
  skin?: "default" | "canon";
}) {
  const t = useTranslations("dashboardDetail");
  const isCanon = skin === "canon";
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [expected, setExpected] = useState("");
  const [observed, setObserved] = useState("");
  const [unit, setUnit] = useState("m2");
  const [sourceRef, setSourceRef] = useState("");
  const [sourceRevision, setSourceRevision] = useState("");

  const { data, isPending, isError } = useQuery({
    queryKey: ["reconciliation-findings", projectId],
    queryFn: () => fetchFindings(projectId),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createFinding(projectId, {
        title,
        summary,
        expected_quantity: Number(expected),
        observed_quantity: Number(observed),
        unit,
        source_document_ref: sourceRef.trim() || undefined,
        source_revision: sourceRevision.trim() || undefined,
      }),
    onSuccess: () => {
      setTitle("");
      setSummary("");
      setExpected("");
      setObserved("");
      setSourceRef("");
      setSourceRevision("");
      queryClient.invalidateQueries({ queryKey: ["reconciliation-findings", projectId] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (args: { id: string; status: "accepted" | "rejected" }) =>
      reviewFinding(args.id, args.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation-findings", projectId] });
    },
  });

  const canSubmit =
    title.trim().length > 0 &&
    summary.trim().length > 0 &&
    unit.trim().length > 0 &&
    Number.isFinite(Number(expected)) &&
    Number.isFinite(Number(observed));

  const body = (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-lg font-semibold text-aistroyka-text-primary">
          {t("reconTitle")}
        </h2>
        <p className="mt-1 text-sm text-aistroyka-text-secondary">{t("reconSubtitle")}</p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          createMutation.mutate();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-aistroyka-text-secondary">{t("reconTitleField")}</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-aistroyka-text-secondary">{t("reconSummary")}</span>
          <textarea
            className="min-h-[72px] rounded-md border border-aistroyka-border bg-transparent px-3 py-2"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={t("reconSummaryPlaceholder")}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-aistroyka-text-secondary">{t("reconExpected")}</span>
            <Input
              inputMode="decimal"
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-aistroyka-text-secondary">{t("reconObserved")}</span>
            <Input
              inputMode="decimal"
              value={observed}
              onChange={(e) => setObserved(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-aistroyka-text-secondary">{t("reconUnit")}</span>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-aistroyka-text-secondary">{t("reconSourceRef")}</span>
            <Input value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-aistroyka-text-secondary">{t("reconSourceRevision")}</span>
            <Input value={sourceRevision} onChange={(e) => setSourceRevision(e.target.value)} />
          </label>
        </div>
        <Button type="submit" disabled={createMutation.isPending || !canSubmit}>
          {createMutation.isPending ? t("reconCreating") : t("reconCreate")}
        </Button>
        {createMutation.isError ? (
          <p className="text-sm text-red-400" role="alert">
            {t("reconCreateFailed")}
          </p>
        ) : null}
      </form>

      <div>
        <h3 className="mb-2 text-sm font-medium text-aistroyka-text-primary">
          {t("reconList")}
        </h3>
        {isPending ? <Skeleton className="h-24 w-full" /> : null}
        {isError ? <p className="text-sm text-red-400">{t("reconLoadFailed")}</p> : null}
        {!isPending && !isError && (data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={<span aria-hidden>◇</span>}
            title={t("reconEmpty")}
            subtitle={t("reconEmptyHint")}
          />
        ) : null}
        <ul className="space-y-3">
          {(data ?? []).map((finding) => (
            <li key={finding.id} className="rounded-md border border-aistroyka-border p-3 text-sm">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-aistroyka-text-primary">{finding.title}</span>
                <span className="text-xs text-aistroyka-text-secondary">
                  {finding.kind} · {finding.status}
                </span>
              </div>
              <p className="text-aistroyka-text-secondary">{finding.summary}</p>
              <p className="mt-1 text-aistroyka-text-secondary">
                {finding.expected_quantity ?? "—"} → {finding.observed_quantity ?? "—"}{" "}
                {finding.unit ?? ""}
              </p>
              {finding.status === "needs_review" || finding.status === "open" ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={reviewMutation.isPending}
                    onClick={() =>
                      reviewMutation.mutate({ id: finding.id, status: "accepted" })
                    }
                  >
                    {t("reconAccept")}
                  </Button>
                  <Button
                    type="button"
                    disabled={reviewMutation.isPending}
                    onClick={() =>
                      reviewMutation.mutate({ id: finding.id, status: "rejected" })
                    }
                  >
                    {t("reconReject")}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return <CanonSurface isCanon={isCanon}>{body}</CanonSurface>;
}
