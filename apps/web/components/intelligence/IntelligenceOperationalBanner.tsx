"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { ManagerOperationalContextData } from "./types";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

export function IntelligenceOperationalBanner({
  operational,
}: {
  operational: ManagerOperationalContextData;
}) {
  const tDetail = useTranslations("dashboardDetail");
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
    <section aria-label={tDetail("intelligenceReliabilityAndNextSteps")}>
    <DashboardGlassCard
      className={
        isAttention
          ? "border-l-4 border-l-aistroyka-warning bg-aistroyka-warning/10"
          : "border-l-4 border-l-aistroyka-success bg-aistroyka-success/10"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
            {tDetail(`operationalState_${operational.state}`)}
            <span className="mx-2 text-aistroyka-text-tertiary">·</span>
            <span className="font-medium">{tDetail(`trustBand_${operational.trust_band}`)}</span>
          </p>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">{operational.trust_summary}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <p className="text-xs text-aistroyka-text-tertiary font-mono">
            {tDetail("refLabel")}: {operational.request_id.slice(0, 8)}…
          </p>
          <button
            type="button"
            onClick={copyRef}
            className="text-xs font-medium text-aistroyka-accent hover:underline"
          >
            {copied ? tDetail("copied") : tDetail("copyFullIdForAdmin")}
          </button>
        </div>
      </div>

      {operational.disclaimers.length > 0 && (
        <ul className="mt-3 list-disc pl-5 text-sm text-aistroyka-warning space-y-1">
          {operational.disclaimers.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}

      {operational.why_bullets.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
            {tDetail("whyYouAreSeeingThis")}
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
            {tDetail("suggestedNextSteps")}
          </p>
          <ol className="mt-1 list-decimal pl-5 text-sm text-aistroyka-text-primary space-y-1">
            {operational.next_step_hints.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ol>
        </div>
      )}
    </DashboardGlassCard>
    </section>
  );
}
