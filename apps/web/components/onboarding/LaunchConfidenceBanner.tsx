"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { Button, Card } from "@/components/ui";
import { resolveLaunchBannerDensity } from "@/lib/help/launch-banner-density";
import {
  detectLaunchRole,
  getCompletedCount,
  getNextLaunchStep,
  getRoleFirstActions,
  LAUNCH_STEPS,
  type ActivationStatusResponse,
  type LaunchStepKey,
} from "@/lib/help/launch-steps";

async function fetchActivationStatus(): Promise<ActivationStatusResponse> {
  const res = await fetch("/api/activation/status", { credentials: "include" });
  if (!res.ok) return {};
  return (await res.json()) as ActivationStatusResponse;
}

export function LaunchConfidenceBanner() {
  const t = useTranslations("helpCenter.launch");
  const tHelp = useTranslations("helpCenter");
  const locale = useLocale();
  const pathname = usePathname();
  const role = detectLaunchRole(pathname);
  const [userExpanded, setUserExpanded] = useState(false);
  const [hints, setHints] = useState<
    Array<{ step: LaunchStepKey; title: string; reason: string; action: string; href: string }>
  >([]);

  const { data } = useQuery({
    queryKey: ["activation-status-banner"],
    queryFn: fetchActivationStatus,
    staleTime: 20 * 1000,
  });

  const completed = getCompletedCount(data);
  const total = LAUNCH_STEPS.length;
  const nextStep = getNextLaunchStep(data);
  const roleFirstActions = getRoleFirstActions(role, data);
  const density = resolveLaunchBannerDensity({ completed, total, userExpanded });

  useEffect(() => {
    const controller = new AbortController();
    async function loadHints() {
      try {
        const res = await fetch("/api/v1/help/hints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: controller.signal,
          body: JSON.stringify({ locale, role, getStarted: data?.getStarted ?? {} }),
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          hints: Array<{ step: LaunchStepKey; title: string; reason: string; action: string; href: string }>;
        };
        setHints(json.hints ?? []);
      } catch {
        setHints([]);
      }
    }
    if (density === "expanded") {
      loadHints();
    } else {
      setHints([]);
    }
    return () => controller.abort();
  }, [data?.getStarted, density, locale, role]);

  if (density === "hidden") return null;

  if (density === "compact") {
    return (
      <Card
        className="mb-4 border-aistroyka-accent/30 bg-aistroyka-accent-light/30 p-3"
        data-testid="launch-confidence-banner-compact"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
            {t("progress", { completed, total })}
          </p>
          <div className="flex flex-wrap gap-2">
            {nextStep ? (
              <Link href={nextStep.href}>
                <Button variant="primary">{t(`stepLabels.${nextStep.key}`)}</Button>
              </Link>
            ) : null}
            <Button
              variant="secondary"
              type="button"
              onClick={() => setUserExpanded(true)}
              data-testid="launch-confidence-banner-expand"
            >
              {t("showSetupGuide")}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="mb-4 border-aistroyka-accent/30 bg-aistroyka-accent-light/30 p-4"
      data-testid="launch-confidence-banner-expanded"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{t("title")}</h2>
          <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
            {t("progress", { completed, total })}
          </p>
          <p className="mt-1 text-aistroyka-caption text-aistroyka-text-tertiary">
            {t("roleApplied", { role: tHelp(`roles.${role}`) })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {nextStep ? (
            <Link href={nextStep.href}>
              <Button variant="primary">{t(`stepLabels.${nextStep.key}`)}</Button>
            </Link>
          ) : null}
          <Link href="/dashboard/help">
            <Button variant="secondary">{t("openHelp")}</Button>
          </Link>
          {completed > 0 ? (
            <Button
              variant="secondary"
              type="button"
              onClick={() => setUserExpanded(false)}
              data-testid="launch-confidence-banner-collapse"
            >
              {t("hideSetupGuide")}
            </Button>
          ) : null}
        </div>
      </div>
      {roleFirstActions.length > 0 ? (
        <div className="mt-4 border-t border-aistroyka-border-subtle pt-3">
          <p className="text-aistroyka-caption font-medium text-aistroyka-text-secondary">{t("rolePlanTitle")}</p>
          <ol className="mt-2 space-y-1 text-aistroyka-caption text-aistroyka-text-primary">
            {roleFirstActions.map((key, idx) => (
              <li key={key}>
                {idx + 1}. {t(`stepLabels.${key}`)}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {hints.length > 0 ? (
        <div className="mt-4 border-t border-aistroyka-border-subtle pt-3">
          <p className="text-aistroyka-caption font-medium text-aistroyka-text-secondary">{t("aiHintsTitle")}</p>
          <ul className="mt-2 space-y-2">
            {hints.slice(0, 2).map((hint) => (
              <li key={hint.step} className="rounded-[var(--aistroyka-radius-md)] bg-aistroyka-surface px-3 py-2">
                <p className="text-aistroyka-caption font-semibold text-aistroyka-text-primary">{hint.title}</p>
                <p className="mt-1 text-aistroyka-caption text-aistroyka-text-tertiary">{hint.reason}</p>
                <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">{hint.action}</p>
                <Link href={hint.href} className="mt-1 inline-flex text-aistroyka-caption text-aistroyka-accent hover:underline">
                  {t("goToHint")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
