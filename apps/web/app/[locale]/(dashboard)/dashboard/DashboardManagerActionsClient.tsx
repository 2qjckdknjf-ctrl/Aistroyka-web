"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";
import { Button, ErrorState, Skeleton } from "@/components/ui";
import type {
  ManagerActionItem,
  ManagerActionSeverity,
} from "@/lib/domain/dashboard/manager-actions.service";
import { limitManagerActionsForPhoneDensity } from "./ops-overview-density.utils";

interface ManagerActionsResponse {
  items: ManagerActionItem[];
  counts: Record<ManagerActionSeverity, number>;
}

async function fetchManagerActions(): Promise<ManagerActionsResponse> {
  const res = await fetch("/api/v1/dashboard/manager-actions", { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.error === "string" ? body.error : "Failed to load manager actions");
  }
  const json = await res.json();
  return json.data;
}

function severityClass(severity: ManagerActionSeverity): string {
  switch (severity) {
    case "critical":
      return "border-l-aistroyka-error bg-aistroyka-error/5";
    case "high":
      return "border-l-aistroyka-warning bg-aistroyka-warning/10";
    case "medium":
      return "border-l-aistroyka-info bg-aistroyka-info/5";
    case "low":
      return "border-l-aistroyka-border-subtle bg-aistroyka-surface-muted/30";
    default: {
      const _exhaustive: never = severity;
      return _exhaustive;
    }
  }
}

function ActionRow({
  item,
  openLabel,
  internalOnlyLabel,
}: {
  item: ManagerActionItem;
  openLabel: string;
  internalOnlyLabel: string;
}) {
  return (
    <li className={`rounded-md border-l-4 px-3 py-2 ${severityClass(item.severity)}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-aistroyka-text-primary">{item.title}</p>
          <p className="mt-0.5 text-xs text-aistroyka-text-tertiary">{item.reason}</p>
        </div>
        <Link href={item.href} className="text-sm font-medium text-aistroyka-accent hover:underline">
          {openLabel}
        </Link>
      </div>
      <p className="mt-2 text-xs text-aistroyka-text-secondary">{item.recommended_action}</p>
      {item.type === "internal_cost_overrun" ? (
        <p className="mt-1 text-xs font-medium text-aistroyka-warning">{internalOnlyLabel}</p>
      ) : null}
    </li>
  );
}

export function DashboardManagerActionsClient() {
  const t = useTranslations("dashboard");
  const [expandedPhone, setExpandedPhone] = useState(false);
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["dashboard-manager-actions"],
    queryFn: fetchManagerActions,
    staleTime: 60 * 1000,
  });

  const phoneSlice = useMemo(() => {
    if (!data) return { visible: [] as ManagerActionItem[], hiddenCount: 0 };
    if (expandedPhone) return { visible: data.items, hiddenCount: 0 };
    return limitManagerActionsForPhoneDensity(data.items, { phone: true, limit: 3 });
  }, [data, expandedPhone]);

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : t("managerActionsFailed")}
        onRetry={() => refetch()}
      />
    );
  }

  if (isPending || !data) {
    return (
      <DashboardGlassCard>
        <Skeleton className="mb-3 h-5 w-56" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </DashboardGlassCard>
    );
  }

  return (
    <DashboardGlassCard intensity="strong" aria-label={t("managerActionsAria")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
            {t("managerActionsTitle")}
          </h2>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">{t("managerActionsHint")}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-aistroyka-text-tertiary">
          <span>
            {t("managerActionsCritical")}: {data.counts.critical}
          </span>
          <span>
            {t("managerActionsHigh")}: {data.counts.high}
          </span>
        </div>
      </div>

      {data.items.length === 0 ? (
        <p className="mt-3 text-sm text-aistroyka-text-secondary">{t("managerActionsEmpty")}</p>
      ) : (
        <>
          {/* Phone density: top 3 + expand */}
          <ul className="mt-4 space-y-2 sm:hidden">
            {phoneSlice.visible.map((item) => (
              <ActionRow
                key={item.id}
                item={item}
                openLabel={t("managerActionsOpen")}
                internalOnlyLabel={t("managerActionsInternalOnly")}
              />
            ))}
          </ul>
          {phoneSlice.hiddenCount > 0 ? (
            <div className="mt-3 sm:hidden">
              <Button variant="ghost" size="sm" onClick={() => setExpandedPhone(true)}>
                {t("opsShowMoreActions", { count: phoneSlice.hiddenCount })}
              </Button>
            </div>
          ) : null}
          {expandedPhone && data.items.length > 3 ? (
            <div className="mt-2 sm:hidden">
              <Button variant="ghost" size="sm" onClick={() => setExpandedPhone(false)}>
                {t("opsShowFewerActions")}
              </Button>
            </div>
          ) : null}

          {/* Tablet/desktop: full list */}
          <ul className="mt-4 hidden space-y-2 sm:block">
            {data.items.map((item) => (
              <ActionRow
                key={item.id}
                item={item}
                openLabel={t("managerActionsOpen")}
                internalOnlyLabel={t("managerActionsInternalOnly")}
              />
            ))}
          </ul>
        </>
      )}
    </DashboardGlassCard>
  );
}
