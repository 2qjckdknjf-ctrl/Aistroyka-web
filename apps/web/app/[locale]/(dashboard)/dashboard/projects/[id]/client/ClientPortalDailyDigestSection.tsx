"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

type DigestPayload = {
  headline: string;
  generated_at: string;
  lines: Array<{ id: string; text: string; severity: string; href?: string }>;
};

async function fetchOwnerDigest(projectId: string, locale: string): Promise<DigestPayload> {
  const qs = new URLSearchParams({ audience: "owner", locale });
  const res = await fetch(`/api/v1/projects/${projectId}/daily-digest?${qs.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? "Failed to load");
  }
  const json = (await res.json()) as { data: DigestPayload };
  return json.data;
}

function lineBorderClass(severity: string) {
  if (severity === "critical") return "border-l-aistroyka-error bg-aistroyka-error/5";
  if (severity === "warning") return "border-l-aistroyka-warning bg-aistroyka-warning/10";
  return "border-l-aistroyka-info bg-aistroyka-info/5";
}

export function ClientPortalDailyDigestSection({ projectId }: { projectId: string }) {
  const locale = useLocale();
  const t = useTranslations("dashboardDetail");
  const query = useQuery({
    queryKey: ["daily-digest", "owner", projectId, locale],
    queryFn: () => fetchOwnerDigest(projectId, locale),
    enabled: !!projectId,
  });

  if (query.isPending) {
    return (
      <DashboardGlassCard className="p-4">
        <Skeleton className="h-24" />
      </DashboardGlassCard>
    );
  }

  if (query.isError) {
    return null;
  }

  const data = query.data!;

  return (
    <DashboardGlassCard className="border-l-4 border-l-aistroyka-accent p-4">
      <h3 className="font-semibold text-aistroyka-text-primary">{t("clientDailyDigestTitle")}</h3>
      <p className="mt-1 text-sm text-aistroyka-text-secondary">{t("clientDailyDigestHint")}</p>
      {data.lines.length === 0 ? (
        <p className="mt-3 text-sm text-aistroyka-text-secondary">{t("clientDailyDigestEmpty")}</p>
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
                    {t("clientDailyDigestOpen")}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardGlassCard>
  );
}
