"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Textarea } from "@/components/ui";

interface ReportApprovalCardProps {
  reportId: string;
  onSuccess: () => void;
}

export function ReportApprovalCard({ reportId, onSuccess }: ReportApprovalCardProps) {
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

  return (
    <div className="space-y-3">
      <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
        {tDetail("approveRejectOrRequestChanges")}
      </p>
      {error && <p className="text-sm text-aistroyka-error">{error}</p>}
      <div>
        <label className="text-aistroyka-caption text-aistroyka-text-tertiary block mb-1">
          {tDetail("noteRequiredForRejectOrChanges")}
        </label>
        <Textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (error) setError(null);
          }}
          placeholder={tDetail("addNoteForWorker")}
          rows={2}
          className="max-w-md"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleReview("approved")}
          disabled={status === "loading"}
        >
          {tDetail("approve")}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleReview("rejected")}
          disabled={status === "loading"}
        >
          {tDetail("reject")}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleReview("changes_requested")}
          disabled={status === "loading"}
        >
          {tDetail("requestChanges")}
        </Button>
      </div>
    </div>
  );
}
