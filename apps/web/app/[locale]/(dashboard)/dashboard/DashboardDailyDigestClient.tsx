"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, Skeleton, ErrorState } from "@/components/ui";

type PortfolioDigest = {
  headline: string;
  generated_at: string;
  lines: Array<{ id: string; text: string; severity: string; href?: string }>;
};

async function fetchPortfolioDigest(): Promise<PortfolioDigest | null> {
  const res = await fetch("/api/v1/dashboard/daily-digest", { credentials: "include" });
  if (res.status === 403) return null;
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? "Failed to load digest");
  }
  const json = (await res.json()) as { data: PortfolioDigest };
  return json.data;
}

function lineBorderClass(severity: string) {
  if (severity === "critical") return "border-l-aistroyka-error bg-aistroyka-error/5";
  if (severity === "warning") return "border-l-aistroyka-warning bg-aistroyka-warning/10";
  return "border-l-aistroyka-info bg-aistroyka-info/5";
}

export function DashboardDailyDigestClient() {
  const t = useTranslations("dashboard");
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["dashboard-daily-digest"],
    queryFn: fetchPortfolioDigest,
    staleTime: 120 * 1000,
  });

  if (isPending) {
    return (
      <Card className="p-4" aria-busy>
        <Skeleton className="mb-3 h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
      </Card>
    );
  }

  if (data === null) {
    return null;
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : t("dailyDigestFailed")}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data) return null;

  return (
    <Card className="p-4" aria-label={t("dailyDigestAria")}>
      <h3 className="text-base font-semibold text-aistroyka-text-primary">{t("dailyDigestTitle")}</h3>
      <p className="mt-1 text-xs text-aistroyka-text-tertiary">{t("dailyDigestHint")}</p>
      {data.lines.length === 0 ? (
        <p className="mt-3 text-sm text-aistroyka-text-secondary">{t("dailyDigestEmpty")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {data.lines.map((line) => (
            <li
              key={line.id}
              className={`rounded-md border-l-4 px-3 py-2 text-sm ${lineBorderClass(line.severity)}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-aistroyka-text-primary">{line.text}</span>
                {line.href ? (
                  <Link href={line.href} className="shrink-0 font-medium text-aistroyka-accent hover:underline">
                    {t("dailyDigestOpen")}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
