"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { Card } from "@/components/ui";
import {
  detectLaunchRole,
  getCompletedCount,
  getRoleFirstActions,
  LAUNCH_STEPS,
  type ActivationStatusResponse,
  type LaunchStepKey,
} from "@/lib/help/launch-steps";

async function fetchActivationStatus(): Promise<ActivationStatusResponse> {
  const res = await fetch("/api/v1/activation/status", { credentials: "include" });
  if (!res.ok) return {};
  return (await res.json()) as ActivationStatusResponse;
}

export function HelpStartChecklist() {
  const t = useTranslations("helpCenter.launch");
  const tHelp = useTranslations("helpCenter");
  const locale = useLocale();
  const pathname = usePathname();
  const role = detectLaunchRole(pathname);
  const [hints, setHints] = useState<
    Array<{ step: LaunchStepKey; title: string; reason: string; action: string; href: string }>
  >([]);
  const { data, isPending } = useQuery({
    queryKey: ["activation-status-help"],
    queryFn: fetchActivationStatus,
    staleTime: 20 * 1000,
  });

  const completed = getCompletedCount(data);
  const total = LAUNCH_STEPS.length;
  const roleFirstActions = getRoleFirstActions(role, data);

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
    loadHints();
    return () => controller.abort();
  }, [data?.getStarted, locale, role]);

  return (
    <Card className="p-5">
      <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{t("title")}</h2>
      <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
        {isPending ? t("loading") : t("progress", { completed, total })}
      </p>
      <p className="mt-1 text-aistroyka-caption text-aistroyka-text-tertiary">
        {t("roleApplied", { role: tHelp(`roles.${role}`) })}
      </p>
      {roleFirstActions.length > 0 ? (
        <div className="mt-3 rounded-[var(--aistroyka-radius-md)] bg-aistroyka-surface-raised px-3 py-2">
          <p className="text-aistroyka-caption text-aistroyka-text-tertiary">{t("rolePlanTitle")}</p>
          <ol className="mt-2 space-y-1 text-aistroyka-caption text-aistroyka-text-primary">
            {roleFirstActions.map((step, idx) => (
              <li key={step}>
                {idx + 1}. {t(`stepLabels.${step}`)}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <ul className="mt-4 space-y-2">
        {LAUNCH_STEPS.map((step) => {
          const done = Boolean(data?.getStarted?.[step.key]);
          return (
            <li key={step.key} className="flex items-center justify-between gap-3 rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={done ? "text-aistroyka-success" : "text-aistroyka-text-tertiary"} aria-hidden>
                  {done ? "✓" : "○"}
                </span>
                <span className={done ? "text-aistroyka-text-primary" : "text-aistroyka-text-secondary"}>
                  {t(`stepLabels.${step.key}`)}
                </span>
              </div>
              <Link href={step.href} className="text-aistroyka-caption font-medium text-aistroyka-accent hover:underline">
                {done ? t("review") : t("doNow")}
              </Link>
            </li>
          );
        })}
      </ul>
      {hints.length > 0 ? (
        <div className="mt-4 border-t border-aistroyka-border-subtle pt-3">
          <p className="text-aistroyka-caption font-medium text-aistroyka-text-secondary">{t("aiHintsTitle")}</p>
          <ul className="mt-2 space-y-2">
            {hints.slice(0, 3).map((hint) => (
              <li key={hint.step} className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle px-3 py-2">
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

