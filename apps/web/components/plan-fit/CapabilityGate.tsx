"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPlanSurface } from "@/lib/plan-fit/api-client";
import { getContextualPlanPrompt } from "@/lib/platform/plan-fit/upgrade-prompt";
import { getCapabilityGateRenderMode } from "@/lib/platform/plan-fit/upgrade-prompt-presentation";
import type { CapabilityKeyForPrompt } from "@/lib/platform/plan-fit/upgrade-prompt.types";
import { FeatureUpgradePromptCard } from "./FeatureUpgradePromptCard";
import { Skeleton } from "@/components/ui";

export interface CapabilityGateProps {
  capabilityKey: CapabilityKeyForPrompt;
  children: React.ReactNode;
  /** When true, show skeleton while loading. When false, show children (graceful degradation). */
  blockWhileLoading?: boolean;
}

/**
 * Soft capability gate: when capability unavailable, show upgrade prompt instead of children.
 * When surface unavailable, shows children (no blocking). Legacy-safe.
 */
export function CapabilityGate({ capabilityKey, children, blockWhileLoading = true }: CapabilityGateProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["plan-surface"],
    queryFn: fetchPlanSurface,
    staleTime: 60 * 1000,
  });

  const mode = getCapabilityGateRenderMode(data?.surface, capabilityKey, isLoading, blockWhileLoading);

  if (mode === "skeleton") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-[var(--aistroyka-radius-md)]" />
        <Skeleton className="h-48 w-full rounded-[var(--aistroyka-radius-md)]" />
      </div>
    );
  }

  if (mode === "prompt") {
    const prompt = getContextualPlanPrompt(capabilityKey, data?.surface);
    return prompt ? <FeatureUpgradePromptCard prompt={prompt} variant="card" /> : <>{children}</>;
  }

  return <>{children}</>;
}
