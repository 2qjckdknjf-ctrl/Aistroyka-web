"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui";
import type { PlanCode } from "@aistroyka/contracts";
import type { SetupReadinessV2 } from "@/lib/platform/plan-fit/orchestration/setup-readiness.types";
import {
  getPrimaryCtaForSetup,
  getSetupChecklistViewModel,
  getStepButtonLabelKey,
  getContinueSetupSubtitleKey,
} from "./continue-workspace-setup.view-model";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

export function ContinueWorkspaceSetupScreen({
  selectedPlanCode,
  setup,
}: {
  selectedPlanCode: PlanCode;
  setup?: SetupReadinessV2 | null;
}) {
  const t = useTranslations("planFitOnboarding");

  const checklist = getSetupChecklistViewModel(setup);
  const cta = getPrimaryCtaForSetup(setup);
  const subtitleKey = getContinueSetupSubtitleKey(checklist);

  return (
    <DashboardGlassCard className="mx-auto max-w-xl p-6">
      <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
        {t("continueSetupTitle")}
      </h2>
      <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
        {t(subtitleKey)}
      </p>
      <p className="mt-4 text-sm text-aistroyka-text-secondary">
        {t("planLabelPrefix")}:{" "}
        <span className="font-medium text-aistroyka-text-primary">{t(`planCode_${selectedPlanCode}`)}</span>
      </p>

      <div className="mt-6 space-y-3">
        <p className="text-sm font-medium text-aistroyka-text-primary">
          {t("setupProgress")}
        </p>
        <ul className="space-y-2">
          {checklist.map((step) => (
            <li
              key={step.key}
              className={`flex flex-col gap-1 rounded-card border px-4 py-3 ${
                step.isRecommended
                  ? "border-aistroyka-accent bg-aistroyka-accent/5"
                  : "border-aistroyka-border-subtle bg-aistroyka-surface-muted/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    step.completed
                      ? "bg-aistroyka-success/20 text-aistroyka-success"
                      : "bg-aistroyka-surface-muted text-aistroyka-text-tertiary"
                  }`}
                  aria-hidden
                >
                  {step.completed ? "✓" : "—"}
                </span>
                <span className={`text-sm font-medium ${step.completed ? "text-aistroyka-text-secondary line-through" : "text-aistroyka-text-primary"}`}>
                  {t(step.labelKey)}
                </span>
                {step.isRecommended && (
                  <span className="ml-auto rounded-full bg-aistroyka-accent/20 px-2 py-0.5 text-xs font-medium text-aistroyka-accent">
                    {t("nextStep")}
                  </span>
                )}
              </div>
              {!step.completed && (
                <p className="pl-9 text-sm text-aistroyka-text-tertiary">
                  {t(step.descriptionKey)}
                </p>
              )}
              {!step.completed && (
                <div className="pl-9">
                  <Link href={step.route} className="inline-block">
                    <Button variant={step.isRecommended ? "primary" : "secondary"} size="sm">
                      {t(getStepButtonLabelKey(step.key))}
                    </Button>
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <Link href={cta.href} className="inline-block">
          <Button variant="primary">
            {cta.isOpenDashboard ? t("openDashboard") : t(cta.labelKey)}
          </Button>
        </Link>
      </div>
    </DashboardGlassCard>
  );
}
