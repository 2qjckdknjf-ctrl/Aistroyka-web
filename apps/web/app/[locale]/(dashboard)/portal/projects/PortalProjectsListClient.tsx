"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

type Row = { id: string; name: string };

export function PortalProjectsListClient() {
  const t = useTranslations("portalPage");
  const [data, setData] = useState<Row[] | null>(null);
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
          setError(t("loadError"));
          setData([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  if (error) {
    return <DashboardGlassCard className="p-aistroyka-4 text-aistroyka-text-secondary">{error}</DashboardGlassCard>;
  }
  if (data === null) {
    return <div className="h-24 animate-pulse rounded bg-aistroyka-surface-muted" />;
  }
  if (data.length === 0) {
    return <DashboardGlassCard className="p-aistroyka-4 text-aistroyka-text-secondary">{t("empty")}</DashboardGlassCard>;
  }

  return (
    <ul className="flex flex-col gap-aistroyka-3">
      {data.map((p) => (
        <li key={p.id}>
          <DashboardGlassCard className="flex flex-row flex-wrap items-center justify-between gap-aistroyka-4 p-aistroyka-4">
            <span className="font-medium text-aistroyka-text-primary">{p.name}</span>
            <Link
              href={`/dashboard/projects/${p.id}/client`}
              className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
            >
              {t("openPortal")} →
            </Link>
          </DashboardGlassCard>
        </li>
      ))}
    </ul>
  );
}
