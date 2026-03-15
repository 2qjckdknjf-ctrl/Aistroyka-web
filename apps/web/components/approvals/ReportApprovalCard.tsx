"use client";

import { useState } from "react";
import { Button, Textarea } from "@/components/ui";

interface ReportApprovalCardProps {
  reportId: string;
  onSuccess: () => void;
}

export function ReportApprovalCard({ reportId, onSuccess }: ReportApprovalCardProps) {
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleReview(reviewStatus: "approved" | "rejected" | "changes_requested") {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(`/api/v1/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: reviewStatus,
          manager_note: reviewStatus === "changes_requested" && note.trim() ? note.trim() : null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? res.statusText);
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
        Approve, reject, or request changes.
      </p>
      {error && <p className="text-sm text-aistroyka-error">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleReview("approved")}
          disabled={status === "loading"}
        >
          Approve
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleReview("rejected")}
          disabled={status === "loading"}
        >
          Reject
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleReview("changes_requested")}
          disabled={status === "loading"}
        >
          Request changes
        </Button>
      </div>
      <div>
        <label className="text-aistroyka-caption text-aistroyka-text-tertiary block mb-1">
          Note (optional, recommended for &quot;Request changes&quot;)
        </label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note for the worker..."
          rows={2}
          className="max-w-md"
        />
      </div>
    </div>
  );
}
