"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui";

type CanonReportDecisionPanelProps = {
  reportId: string;
  canReview: boolean;
  onSuccess: () => void;
};

export function CanonReportDecisionPanel({
  reportId,
  canReview,
  onSuccess,
}: CanonReportDecisionPanelProps) {
  const t = useTranslations("canon");
  const tDetail = useTranslations("dashboardDetail");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleReview(reviewStatus: "approved" | "rejected" | "changes_requested") {
    const trimmed = note.trim();
    if (
      (reviewStatus === "rejected" || reviewStatus === "changes_requested") &&
      !trimmed
    ) {
      setError(tDetail("enterNoteBeforeRejectOrChanges"));
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(`/api/v1/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: reviewStatus,
          manager_note: trimmed ? trimmed : null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? res.statusText);
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : tDetail("failed"));
    } finally {
      setStatus("idle");
    }
  }

  if (!canReview) {
    return (
      <p className="text-sm text-[var(--canon-text-muted)]">{tDetail("decisionWaitingHint")}</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <button
          type="button"
          disabled={status === "loading"}
          onClick={() => handleReview("approved")}
          className="canon-decision-card canon-decision-card--approve"
        >
          <span className="font-semibold text-[var(--canon-success)]">{t("reportApprove")}</span>
          <span className="mt-1 block text-xs text-[var(--canon-text-muted)]">{t("reportApproveHint")}</span>
        </button>
        <button
          type="button"
          disabled={status === "loading"}
          onClick={() => handleReview("changes_requested")}
          className="canon-decision-card canon-decision-card--changes"
        >
          <span className="font-semibold text-[var(--canon-gold)]">{t("reportRequestChanges")}</span>
          <span className="mt-1 block text-xs text-[var(--canon-text-muted)]">{t("reportRequestChangesHint")}</span>
        </button>
        <button
          type="button"
          disabled={status === "loading"}
          onClick={() => handleReview("rejected")}
          className="canon-decision-card canon-decision-card--reject"
        >
          <span className="font-semibold text-[var(--canon-danger)]">{t("reportReject")}</span>
          <span className="mt-1 block text-xs text-[var(--canon-text-muted)]">{t("reportRejectHint")}</span>
        </button>
      </div>
      <label className="block text-xs font-medium text-[var(--canon-text-muted)]">
        {tDetail("noteRequiredForRejectOrChanges")}
        <Textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (error) setError(null);
          }}
          placeholder={tDetail("addNoteForWorker")}
          rows={3}
          className="mt-1 w-full border-[var(--canon-border-glass)] bg-transparent text-[var(--canon-text-primary)]"
        />
      </label>
      {error ? <p className="text-sm text-[var(--canon-danger)]">{error}</p> : null}
    </div>
  );
}
