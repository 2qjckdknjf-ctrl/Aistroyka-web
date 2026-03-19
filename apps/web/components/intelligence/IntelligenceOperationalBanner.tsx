"use client";

import { useState, useCallback } from "react";
import type { ManagerOperationalContextData } from "./types";
import { Card } from "@/components/ui";

const STATE_LABEL: Record<ManagerOperationalContextData["state"], string> = {
  healthy: "Data coverage: good",
  partial_data: "Data coverage: partial",
  insufficient_data: "Data coverage: thin",
  low_confidence_health: "Health model: lower confidence",
};

const TRUST_BADGE: Record<ManagerOperationalContextData["trust_band"], string> = {
  high: "Trust: high",
  medium: "Trust: medium — verify key calls",
  low: "Trust: low — gather more field data",
};

export function IntelligenceOperationalBanner({
  operational,
}: {
  operational: ManagerOperationalContextData;
}) {
  const [copied, setCopied] = useState(false);
  const copyRef = useCallback(() => {
    void navigator.clipboard?.writeText(operational.request_id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [operational.request_id]);

  const isAttention =
    operational.state !== "healthy" || operational.trust_band !== "high";

  return (
    <section aria-label="Intelligence reliability and next steps">
    <Card
      className={
        isAttention
          ? "border-l-4 border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20"
          : "border-l-4 border-l-emerald-600/60 bg-emerald-50/30 dark:bg-emerald-950/15"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
            {STATE_LABEL[operational.state]}
            <span className="mx-2 text-aistroyka-text-tertiary">·</span>
            <span className="font-medium">{TRUST_BADGE[operational.trust_band]}</span>
          </p>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">{operational.trust_summary}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <p className="text-xs text-aistroyka-text-tertiary font-mono">
            Ref: {operational.request_id.slice(0, 8)}…
          </p>
          <button
            type="button"
            onClick={copyRef}
            className="text-xs font-medium text-aistroyka-accent hover:underline"
          >
            {copied ? "Copied" : "Copy full ID for admin"}
          </button>
        </div>
      </div>

      {operational.disclaimers.length > 0 && (
        <ul className="mt-3 list-disc pl-5 text-sm text-amber-800 dark:text-amber-200 space-y-1">
          {operational.disclaimers.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}

      {operational.why_bullets.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
            Why you&apos;re seeing this
          </p>
          <ul className="mt-1 list-disc pl-5 text-sm text-aistroyka-text-secondary space-y-1">
            {operational.why_bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {operational.next_step_hints.length > 0 && (
        <div className="mt-3 border-t border-aistroyka-border-subtle pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
            Suggested next steps
          </p>
          <ol className="mt-1 list-decimal pl-5 text-sm text-aistroyka-text-primary space-y-1">
            {operational.next_step_hints.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ol>
        </div>
      )}
    </Card>
    </section>
  );
}
