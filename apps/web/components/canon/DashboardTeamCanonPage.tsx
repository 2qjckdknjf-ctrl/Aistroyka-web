"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EmptyState, Skeleton } from "@/components/ui";
import type { ContractorDirectoryListItem } from "@/lib/domain/contractor-directory/contractor-directory.types";
import { CanonPageHeader } from "./CanonPageHeader";

interface WorkerRow {
  user_id: string;
  last_day_date: string | null;
  last_started_at: string | null;
  last_ended_at: string | null;
  last_report_submitted_at: string | null;
}

async function fetchWorkers(): Promise<WorkerRow[]> {
  const res = await fetch("/api/v1/workers", { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function fetchContractors(): Promise<ContractorDirectoryListItem[]> {
  const res = await fetch("/api/v1/contractors/directory", { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

function memberStatus(worker: WorkerRow): "on_site" | "offline" | "idle" {
  if (worker.last_started_at && !worker.last_ended_at) return "on_site";
  if (worker.last_report_submitted_at) return "idle";
  return "offline";
}

export function DashboardTeamCanonPage() {
  const t = useTranslations("canon");
  const tDetail = useTranslations("dashboardDetail");
  const [tab, setTab] = useState<"all" | "workers" | "contractors">("all");

  const workersQuery = useQuery({ queryKey: ["canon-workers"], queryFn: fetchWorkers });
  const contractorsQuery = useQuery({ queryKey: ["canon-contractors"], queryFn: fetchContractors });

  const workers = workersQuery.data ?? [];
  const contractors = contractorsQuery.data ?? [];
  const total = workers.length + contractors.length;
  const onSite = workers.filter((w) => memberStatus(w) === "on_site").length;

  const activity = useMemo(() => {
    const items: Array<{ id: string; title: string; time: string; href: string }> = [];
    for (const w of workers) {
      if (w.last_report_submitted_at) {
        items.push({
          id: `w-${w.user_id}`,
          title: t("teamActivityReport", { id: w.user_id.slice(0, 8) }),
          time: w.last_report_submitted_at,
          href: `/dashboard/workers/${encodeURIComponent(w.user_id)}`,
        });
      }
    }
    return items.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 6);
  }, [workers, t]);

  const loading = workersQuery.isPending || contractorsQuery.isPending;

  if (loading) {
    return (
      <div className="p-4">
        <Skeleton lines={6} />
      </div>
    );
  }

  const showWorkers = tab === "all" || tab === "workers";
  const showContractors = tab === "all" || tab === "contractors";

  return (
    <div className="space-y-4">
      <CanonPageHeader
        title={t("teamTitle")}
        subtitle={t("screen08Label")}
        actions={
          <Link href="/dashboard/contractors" className="canon-ghost-btn !text-xs">
            {t("teamOpenDirectory")}
          </Link>
        }
      />

      <div className="canon-scroll-x grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: t("teamStatTotal"), value: total },
          { label: t("teamStatWorkers"), value: workers.length },
          { label: t("teamStatContractors"), value: contractors.length },
          { label: t("teamStatOnSite"), value: onSite },
        ].map((stat) => (
          <div key={stat.label} className="canon-glass p-3 text-center">
            <p className="text-xs text-[var(--canon-text-muted)]">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--canon-text-primary)]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="canon-scroll-x flex gap-2">
        {(
          [
            { key: "all" as const, label: t("teamTabAll") },
            { key: "workers" as const, label: t("teamTabWorkers") },
            { key: "contractors" as const, label: t("teamTabContractors") },
          ]
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`shrink-0 px-3 py-1.5 text-sm font-medium ${
              tab === item.key
                ? "border-b-2 border-[var(--canon-gold)] text-[var(--canon-gold)]"
                : "text-[var(--canon-text-muted)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="canon-team-workspace">
        <section className="min-w-0 space-y-4">
          {total === 0 ? (
            <div className="canon-glass p-8">
              <EmptyState
                icon={<span className="text-2xl">👥</span>}
                title={tDetail("noWorkersYet")}
                subtitle={tDetail("workerDayDataAppears")}
              />
            </div>
          ) : (
            <div className="canon-team-grid">
              {showWorkers
                ? workers.map((w) => (
                    <Link
                      key={w.user_id}
                      href={`/dashboard/workers/${encodeURIComponent(w.user_id)}`}
                      className="canon-team-card canon-glass"
                    >
                      <div className="canon-team-avatar" aria-hidden>
                        {w.user_id.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--canon-text-primary)]">
                          {t("teamWorkerLabel")} {w.user_id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-[var(--canon-text-muted)]">{tDetail("workers")}</p>
                      </div>
                      <span className={`canon-team-status canon-team-status--${memberStatus(w)}`} />
                    </Link>
                  ))
                : null}
              {showContractors
                ? contractors.map((c) => (
                    <Link
                      key={c.user_id}
                      href={`/dashboard/contractors/${encodeURIComponent(c.user_id)}`}
                      className="canon-team-card canon-glass"
                    >
                      <div className="canon-team-avatar canon-team-avatar--contractor" aria-hidden>
                        {(c.profile?.company_name ?? "C").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--canon-text-primary)]">
                          {c.profile?.company_name ?? t("teamContractorFallback")}
                        </p>
                        <p className="truncate text-xs text-[var(--canon-text-muted)]">
                          {c.profile?.specializations?.join(", ") || tDetail("contractor")}
                        </p>
                      </div>
                      <span className="canon-team-status canon-team-status--idle" />
                    </Link>
                  ))
                : null}
            </div>
          )}
        </section>

        <aside className="canon-team-sidebar space-y-4">
          <div className="canon-glass p-4">
            <p className="text-sm font-semibold text-[var(--canon-text-primary)]">{t("teamActivityTitle")}</p>
            {activity.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--canon-text-muted)]">{t("teamActivityEmpty")}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {activity.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="block rounded-lg px-2 py-1.5 hover:bg-[rgba(255,255,255,0.04)]">
                      <p className="text-sm text-[var(--canon-text-primary)]">{item.title}</p>
                      <p className="text-[10px] text-[var(--canon-text-muted)]">
                        {new Date(item.time).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="canon-ai-panel rounded-xl p-3">
            <p className="text-sm font-semibold text-[var(--canon-text-primary)]">{t("teamChatTitle")}</p>
            <p className="mt-2 text-xs text-[var(--canon-text-secondary)]">{t("teamChatHint")}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
