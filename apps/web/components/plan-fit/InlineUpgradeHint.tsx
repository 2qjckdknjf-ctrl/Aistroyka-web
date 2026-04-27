"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { fetchPlanSurface } from "@/lib/plan-fit/api-client";
import { getContextualPlanPrompt } from "@/lib/platform/plan-fit/upgrade-prompt";
import { getFeatureUpgradePromptDisplayProps, shouldShowInlineUpgradeHint } from "@/lib/platform/plan-fit/upgrade-prompt-presentation";
import type { CapabilityKeyForPrompt } from "@/lib/platform/plan-fit/upgrade-prompt.types";

export interface InlineUpgradeHintProps {
  capabilityKey: CapabilityKeyForPrompt;
}

/**
 * Compact inline hint when capability is unavailable.
 * Step 11: non-blocking, soft tone.
 */
export function InlineUpgradeHint({ capabilityKey }: InlineUpgradeHintProps) {
  const { data } = useQuery({
    queryKey: ["plan-surface"],
    queryFn: fetchPlanSurface,
    staleTime: 60 * 1000,
  });

  if (!shouldShowInlineUpgradeHint(data?.surface, capabilityKey)) return null;

  const prompt = getContextualPlanPrompt(capabilityKey, data?.surface);
  if (!prompt) return null;

  const { description, ctaLabel, ctaTargetRoute } = getFeatureUpgradePromptDisplayProps(prompt);

  return (
    <div className="mb-4 rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-4 py-2">
      <p className="text-aistroyka-caption text-aistroyka-text-secondary">
        {description}{" "}
        <Link href={ctaTargetRoute} className="font-medium text-aistroyka-accent hover:underline">
          {ctaLabel}
        </Link>
      </p>
    </div>
  );
}
