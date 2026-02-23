"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "pending" | "processing" | "completed" | "failed";

export function TriggerAnalysisButton({
  projectId,
  jobId,
  status,
}: {
  projectId: string;
  jobId: string;
  status: Status;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "pending") return null;

  async function handleClick() {
    setError(null);
    setLoading(true);
    const res = await fetch(
      `/api/projects/${projectId}/jobs/${jobId}/trigger`,
      { method: "POST" }
    );
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to trigger");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded border border-gray-400 bg-white px-2 py-1 text-sm disabled:opacity-50"
      >
        {loading ? "Triggering…" : "Trigger analysis"}
      </button>
      {error && (
        <span className="ml-2 text-sm text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
