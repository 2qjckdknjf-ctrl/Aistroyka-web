"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function GovernanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Governance dashboard error:", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-4xl px-aistroyka-4 py-aistroyka-8">
      <ErrorState
        message={error.message || "Failed to load AI Governance dashboard."}
        onRetry={reset}
      />
    </main>
  );
}
