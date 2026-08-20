"use client";

import { Link } from "@/i18n/navigation";

import type { UpgradePromptViewModel } from "@/lib/platform/plan-fit/upgrade-prompt.types";
import { getFeatureUpgradePromptDisplayProps } from "@/lib/platform/plan-fit/upgrade-prompt-presentation";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

export interface FeatureUpgradePromptCardProps {
  prompt: UpgradePromptViewModel;
  /** Compact inline style vs full card */
  variant?: "card" | "inline";
}

/**
 * Non-blocking contextual upgrade prompt.
 * Step 11: soft surface, no paywall, safe CTA to /billing.
 */
export function FeatureUpgradePromptCard({ prompt, variant = "card" }: FeatureUpgradePromptCardProps) {
  if (!prompt.showPrompt) return null;

  const { title, description, ctaLabel, ctaTargetRoute } = getFeatureUpgradePromptDisplayProps(prompt);

  const content = (
    <>
      <p className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">{title}</p>
      <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">{description}</p>
      <Link
        href={ctaTargetRoute}
        className="mt-3 inline-block text-aistroyka-caption font-medium text-aistroyka-accent hover:underline"
      >
        {ctaLabel}
      </Link>
    </>
  );

  if (variant === "inline") {
    return (
      <div className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-4 py-3">
        {content}
      </div>
    );
  }

  return (
    <DashboardGlassCard className="border-l-4 border-l-aistroyka-accent/50">
      {content}
    </DashboardGlassCard>
  );
}
