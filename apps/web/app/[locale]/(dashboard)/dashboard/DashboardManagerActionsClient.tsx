"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, ErrorState, Skeleton } from "@/components/ui";
import type {
  ManagerActionItem,
  ManagerActionSeverity,
} from "@/lib/domain/dashboard/manager-actions.service";

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
  }
}

export function DashboardManagerActionsClient() {
  const t = useTranslations("dashboard");
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["dashboard-manager-actions"],
    queryFn: fetchManagerActions,
    staleTime: 60 * 1000,
  });

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
      <Card className="p-4">
        <Skeleton className="mb-3 h-5 w-56" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </Card>
    );
  }

  return (
    <Card className="p-4" aria-label={t("managerActionsAria")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
            {t("managerActionsTitle")}
          </h2>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">
            {t("managerActionsHint")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-aistroyka-text-tertiary">
          <span>{t("managerActionsCritical")}: {data.counts.critical}</span>
          <span>{t("managerActionsHigh")}: {data.counts.high}</span>
        </div>
      </div>

      {data.items.length === 0 ? (
        <p className="mt-3 text-sm text-aistroyka-text-secondary">
          {t("managerActionsEmpty")}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {data.items.map((item) => (
            <li
              key={item.id}
              className={`rounded-md border-l-4 px-3 py-2 ${severityClass(item.severity)}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-aistroyka-text-primary">{item.title}</p>
                  <p className="mt-0.5 text-xs text-aistroyka-text-tertiary">{item.reason}</p>
                </div>
                <Link
                  href={item.href}
                  className="text-sm font-medium text-aistroyka-accent hover:underline"
                >
                  {t("managerActionsOpen")}
                </Link>
              </div>
              <p className="mt-2 text-xs text-aistroyka-text-secondary">
                {item.recommended_action}
              </p>
              {item.type === "internal_cost_overrun" ? (
                <p className="mt-1 text-xs font-medium text-aistroyka-warning">
                  {t("managerActionsInternalOnly")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
