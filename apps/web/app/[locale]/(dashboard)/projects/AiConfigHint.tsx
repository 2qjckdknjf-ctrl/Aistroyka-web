"use client";

import { useEffect, useState } from "react";

/**
 * When there are active jobs, check if AI is configured. If not, show a short hint.
 */
export function AiConfigHint({ showWhenActive }: { showWhenActive: boolean }) {
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    if (!showWhenActive) {
      setAiConfigured(null);
      return;
    }
    let cancelled = false;
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d && typeof d.aiConfigured === "boolean") {
          setAiConfigured(d.aiConfigured);
        }
      })
      .catch(() => setAiConfigured(null));
    return () => {
      cancelled = true;
    };
  }, [showWhenActive]);

  if (!showWhenActive || aiConfigured !== false) return null;

  return (
    <div
      className="mb-4 rounded-aistroyka-lg border border-aistroyka-warning/50 bg-aistroyka-warning/20 px-4 py-3 text-sm text-aistroyka-text-primary"
      role="status"
    >
      <p className="font-medium">AI analysis is not configured</p>
      <p className="mt-1 text-aistroyka-warning">
        Set <code className="rounded bg-aistroyka-warning/20 px-1">AI_ANALYSIS_URL</code>{" "}
        (e.g. to this app’s <code className="rounded bg-aistroyka-warning/20 px-1">/api/ai/analyze-image</code>) and{" "}
        <code className="rounded bg-aistroyka-warning/20 px-1">OPENAI_API_KEY</code> in your environment so jobs can complete.
      </p>
    </div>
  );
}
