"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui";
import {
  dashboardAiReadinessBadgeVariant,
  type DashboardAiReadiness,
} from "@/lib/platform/ai/dashboard-ai-readiness";

const LABEL_KEYS = {
  not_configured: "aiReadinessNotConfigured",
  configured_unverified: "aiReadinessConfiguredUnverified",
  degraded: "aiReadinessDegraded",
} as const;

const HINT_KEYS = {
  not_configured: "aiReadinessHintNotConfigured",
  configured_unverified: "aiReadinessHintConfiguredUnverified",
  degraded: "aiReadinessHintDegraded",
} as const;

export function AiReadinessStatusChip({
  readiness,
  className = "",
}: {
  readiness: DashboardAiReadiness;
  className?: string;
}) {
  const t = useTranslations("dashboardDetail");
  const label = t(LABEL_KEYS[readiness]);
  const hint = t(HINT_KEYS[readiness]);

  return (
    <div
      className={`mb-4 flex flex-wrap items-center gap-2 ${className}`.trim()}
      data-testid="ai-readiness-status-chip"
    >
      <Badge
        variant={dashboardAiReadinessBadgeVariant(readiness)}
        className="uppercase tracking-wide"
      >
        <span role="status" aria-live="polite">
          {label}
        </span>
      </Badge>
      <p className="text-aistroyka-caption text-aistroyka-text-secondary">{hint}</p>
    </div>
  );
}
