"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function TrustError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Trust dashboard error:", error);
  }, [error]);
  return (
    <main className="mx-auto max-w-4xl px-aistroyka-4 py-aistroyka-8">
      <ErrorState message={error.message || "Failed to load Trust dashboard."} onRetry={reset} />
    </main>
  );
}
