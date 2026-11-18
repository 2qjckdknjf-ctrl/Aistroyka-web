"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Button, Badge, Skeleton, ErrorState } from "@/components/ui";
import type { GovernanceCaseStatus, GovernanceCaseWithProjects } from "@/lib/domain/governance/governance.types";
import { CanonSurface } from "@/components/canon/CanonSurface";

async function fetchCase(id: string): Promise<GovernanceCaseWithProjects> {
  const res = await fetch(`/api/v1/governance/cases/${id}`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === "string" ? err.error : "Failed to load");
  }
  const j = await res.json();
  return j.data;
}

export function GovernanceCaseDetailClient({
  caseId,
  skin = "default",
}: {
  caseId: string;
  skin?: "default" | "canon";
}) {
  const t = useTranslations("governancePage");
  const isCanon = skin === "canon";

  const renderStatus = (value: GovernanceCaseStatus) => {
    try {
      return t(`status.${value}`);
    } catch {
      return value.replace(/_/g, " ");
    }
  };

  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["governance-case", caseId], queryFn: () => fetchCase(caseId) });
  const [status, setStatus] = useState<GovernanceCaseStatus>("open");
  const [outcome, setOutcome] = useState("");

  const c = q.data;
  useEffect(() => {
    if (!c) return;
    setStatus(c.status);
    setOutcome(c.decision_outcome ?? "");
  }, [c]);

  const updateMut = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/v1/governance/cases/${caseId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : t("updateFailed"));
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["governance-case", caseId] });
      qc.invalidateQueries({ queryKey: ["governance-cases"] });
    },
  });

  if (q.isError) {
    return (
      <ErrorState
        message={q.error instanceof Error ? q.error.message : t("loadFailed")}
        onRetry={() => q.refetch()}
      />
    );
  }
  if (q.isPending || !c) {
    return (
      <CanonSurface isCanon={isCanon} className="p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-32 w-full" />
      </CanonSurface>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/governance" className="text-sm text-aistroyka-accent hover:underline">
        {t("backToCases")}
      </Link>
      <CanonSurface isCanon={isCanon} className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2 items-start justify-between">
          <div>
            <h1 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{c.title}</h1>
            <p className="text-xs text-aistroyka-text-tertiary mt-1 font-mono">{c.id}</p>
          </div>
          {c.severity === "critical" ? (
            <Badge className="bg-aistroyka-error/20 text-aistroyka-error">{t("severity.critical")}</Badge>
          ) : c.severity === "high" ? (
            <Badge className="bg-aistroyka-warning/20 text-aistroyka-warning">{t("severity.high")}</Badge>
          ) : (
            <Badge>{t("severity.medium")}</Badge>
          )}
        </div>
        {c.rationale ? <p className="text-sm text-aistroyka-text-secondary">{c.rationale}</p> : null}
        <div>
          <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">{t("decisionRequiredLabel")}</p>
          <p className="text-sm text-aistroyka-text-primary mt-1">{c.decision_required}</p>
        </div>
        <div>
          <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">{t("affectedProjectsLabel")}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {c.projects.map((p) => (
              <li key={p.project_id}>
                <Link
                  href={`/dashboard/projects/${p.project_id}`}
                  className="inline-block rounded border border-aistroyka-border-subtle px-2 py-1 text-sm text-aistroyka-accent hover:bg-aistroyka-surface-raised"
                >
                  {p.project_name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {c.decision_outcome ? (
          <div>
            <p className="text-aistroyka-caption font-semibold uppercase text-aistroyka-text-tertiary">{t("recordedOutcomeLabel")}</p>
            <p className="text-sm text-aistroyka-text-primary mt-1">{c.decision_outcome}</p>
          </div>
        ) : null}
      </CanonSurface>

      <CanonSurface isCanon={isCanon} className="p-4 space-y-4 border border-aistroyka-border-subtle">
        <h2 className="text-aistroyka-subheadline font-semibold">{t("updateStatusTitle")}</h2>
        <label className="block text-sm">
          <span className="text-aistroyka-text-secondary">{t("table.status")}</span>
          <select
            className="mt-1 w-full max-w-md rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as GovernanceCaseStatus)}
          >
            {(
              ["open", "under_review", "decision_required", "decided", "resolved", "archived"] as GovernanceCaseStatus[]
            ).map((s) => (
              <option key={s} value={s}>
                {renderStatus(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-aistroyka-text-secondary">{t("decisionOutcomeLabel")}</span>
          <textarea
            className="mt-1 w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm min-h-[100px]"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder={t("decisionOutcomePlaceholder")}
          />
        </label>
        {updateMut.isError ? (
          <p className="text-sm text-aistroyka-error">
            {updateMut.error instanceof Error ? updateMut.error.message : t("error")}
          </p>
        ) : null}
        <Button
          type="button"
          variant="primary"
          disabled={updateMut.isPending}
          onClick={() => {
            updateMut.mutate({
              status,
              decision_outcome: outcome.trim() || null,
            });
          }}
        >
          {updateMut.isPending ? t("saving") : t("save")}
        </Button>
      </CanonSurface>
    </div>
  );
}
