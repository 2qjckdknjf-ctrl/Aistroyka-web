"use client";

import { useQuery } from "@tanstack/react-query";
import { OnboardingWizard } from "./OnboardingWizard";
import { Skeleton } from "@/components/ui";

async function fetchActivationStatus(): Promise<{
  showOnboarding: boolean;
}> {
  const res = await fetch("/api/activation/status", { credentials: "include" });
  if (!res.ok) return { showOnboarding: false };
  const json = await res.json();
  return { showOnboarding: json.showOnboarding === true };
}

/**
 * Renders onboarding wizard when user has no projects; otherwise renders children.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useQuery({
    queryKey: ["activation-status"],
    queryFn: fetchActivationStatus,
    staleTime: 30 * 1000,
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Skeleton className="h-64 w-full rounded-[var(--aistroyka-radius-card)]" />
      </div>
    );
  }

  if (data?.showOnboarding) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-8" aria-label="Onboarding">
        <div className="mb-8 text-center">
          <h1 className="text-aistroyka-title font-bold text-aistroyka-text-primary">
            Welcome to Aistroyka
          </h1>
          <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
            Complete these steps to get started.
          </p>
        </div>
        <OnboardingWizard />
      </section>
    );
  }

  return <>{children}</>;
}
