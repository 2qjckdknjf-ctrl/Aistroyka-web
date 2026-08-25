"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CanonPageHeader } from "./CanonPageHeader";
import { CanonProgressRing } from "./CanonProgressRing";

type Row = { id: string; name: string };

type ProgressMap = Record<string, number>;

async function fetchProjectProgressPct(projectId: string): Promise<number | null> {
  const res = await fetch(`/api/v1/portal/projects/${projectId}/progress`, { credentials: "include" });
  if (!res.ok) return null;
  const json = await res.json();
  const progress = json.data?.progress as { tasks_done?: number; tasks_total?: number } | undefined;
  const total = progress?.tasks_total ?? 0;
  const done = progress?.tasks_done ?? 0;
  if (total <= 0) return null;
  return Math.round((done / total) * 100);
}

export function PortalCanonProjectsList() {
  const t = useTranslations("canon");
  const tPortal = useTranslations("portalPage");
  const [data, setData] = useState<Row[] | null>(null);
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/portal/projects", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<{ data?: Row[] }>;
      })
      .then((j) => {
        if (!cancelled) {
          setData(j.data ?? []);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(tPortal("loadError"));
          setData([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tPortal]);

  useEffect(() => {
    if (!data?.length) return;
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        data.slice(0, 12).map(async (project) => {
          const pct = await fetchProjectProgressPct(project.id);
          return pct != null ? [project.id, pct] as const : null;
        }),
      );
      if (cancelled) return;
      const map: ProgressMap = {};
      for (const entry of entries) {
        if (entry) map[entry[0]] = entry[1];
      }
      setProgressMap(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <CanonPageHeader
        title={tPortal("title")}
        subtitle={t("screen10Label")}
        showFavorite={false}
      />

      <div className="canon-portal-hero canon-glass p-4 sm:p-6">
        <p className="text-lg font-semibold text-[var(--canon-text-primary)]">{t("portalGreeting")}</p>
        <p className="mt-1 text-sm text-[var(--canon-text-secondary)]">{tPortal("subtitle")}</p>
      </div>

      {error ? (
        <p className="text-sm text-[var(--canon-danger)]">{error}</p>
      ) : data === null ? (
        <div className="h-24 animate-pulse rounded-xl bg-[rgba(255,255,255,0.04)]" />
      ) : data.length === 0 ? (
        <p className="canon-glass p-6 text-sm text-[var(--canon-text-muted)]">{tPortal("empty")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((project) => {
            const pct = progressMap[project.id];
            return (
              <li key={project.id}>
                <Link
                  href={`/dashboard/projects/${project.id}/client`}
                  className="canon-portal-project-card canon-glass block p-4"
                >
                  <div className="flex items-center gap-4">
                    <CanonProgressRing value={pct ?? 0} size={64} label={t("portalRingProgress")} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--canon-text-primary)]">{project.name}</p>
                      <p className="mt-1 text-xs text-[var(--canon-text-muted)]">
                        {pct != null ? `${pct}%` : t("portalProgressPending")}
                      </p>
                      <p className="mt-1 text-xs text-[var(--canon-cyan)]">{tPortal("openPortal")} →</p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
