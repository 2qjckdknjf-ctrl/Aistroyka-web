"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { DashboardTasksClient } from "@/app/[locale]/(dashboard)/dashboard/tasks/DashboardTasksClient";
import { CanonPageHeader, CanonTasksAiPanel } from "@/components/canon";
import { useFilterParams } from "@/lib/cockpit/useFilterParams";
import { usePathname, useRouter } from "@/i18n/navigation";

async function fetchMe(): Promise<{ user_id: string } | null> {
  const res = await fetch("/api/v1/me", { credentials: "include" });
  if (!res.ok) return null;
  const json = await res.json();
  return typeof json.user_id === "string" ? { user_id: json.user_id } : null;
}

async function fetchProjects(): Promise<{ id: string; name: string }[]> {
  const res = await fetch("/api/v1/projects", { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

type TaskScope = "all" | "mine" | "overdue" | "review";

function parseScope(raw: string | null): TaskScope {
  if (raw === "mine" || raw === "overdue" || raw === "review") return raw;
  return "all";
}

export function DashboardTasksCanonPage() {
  const t = useTranslations("canon");
  const tNav = useTranslations("nav");
  const tDetail = useTranslations("dashboardDetail");
  const [openCreate, setOpenCreate] = useState<(() => void) | null>(null);
  const { params, setParam, setParams } = useFilterParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const scope = parseScope(searchParams?.get("scope") ?? null);

  const meQuery = useQuery({
    queryKey: ["me-canon-tasks"],
    queryFn: fetchMe,
    staleTime: 5 * 60_000,
  });
  const projectsQuery = useQuery({
    queryKey: ["projects-canon-task-filter"],
    queryFn: fetchProjects,
    staleTime: 60_000,
  });

  function setScope(next: TaskScope) {
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    if (next === "all") qs.delete("scope");
    else qs.set("scope", next);

    if (next === "mine" && meQuery.data?.user_id) {
      qs.set("worker_id", meQuery.data.user_id);
    } else if (next !== "mine") {
      qs.delete("worker_id");
    }

    if (next === "review") qs.set("status", "in_progress");
    else qs.delete("status");

    qs.set("page", "1");
    const out = qs.toString();
    router.replace(out ? `${pathname}?${out}` : pathname, { scroll: false });
  }

  useEffect(() => {
    if (scope === "mine" && meQuery.data?.user_id && params.worker_id !== meQuery.data.user_id) {
      setParam("worker_id", meQuery.data.user_id);
    }
  }, [scope, meQuery.data?.user_id, params.worker_id, setParam]);

  const tabs: { key: TaskScope; label: string }[] = [
    { key: "all", label: t("taskTabAll") },
    { key: "mine", label: t("taskTabMine") },
    { key: "overdue", label: t("taskTabOverdue", { count: "…" }) },
    { key: "review", label: t("taskTabReview", { count: "…" }) },
  ];

  return (
    <div className="space-y-6">
      <CanonPageHeader
        title={tNav("tasks")}
        subtitle={t("screen04Label")}
        actions={
          <button type="button" className="canon-gold-btn" onClick={() => openCreate?.()}>
            <Plus size={18} aria-hidden />
            {t("createTask")}
          </button>
        }
      />

      <div className="canon-scroll-x flex flex-wrap items-center gap-2 pb-1">
        <label className="flex items-center gap-2 text-xs text-[var(--canon-text-muted)]">
          {tDetail("project")}
          <select
            className="canon-ghost-btn !py-1 !text-xs"
            value={params.project_id}
            onChange={(e) => setParam("project_id", e.target.value)}
            aria-label={tDetail("project")}
          >
            <option value="">{tDetail("all")}</option>
            {(projectsQuery.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="text-xs font-medium text-[var(--canon-text-muted)]"
          onClick={() => {
            setParams({ project_id: "", worker_id: "", status: "", q: "" });
            setScope("all");
          }}
        >
          {t("resetFilters")}
        </button>
      </div>

      <div className="canon-scroll-x flex flex-wrap gap-2 border-b border-[var(--canon-border-glass)] pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setScope(tab.key)}
            className={`px-3 py-1.5 text-sm font-medium ${
              scope === tab.key
                ? "border-b-2 border-[var(--canon-gold)] text-[var(--canon-gold)]"
                : "text-[var(--canon-text-muted)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <DashboardTasksClient
          skin="canon"
          onRegisterCreateHandler={(open) => setOpenCreate(() => open)}
        />
        <CanonTasksAiPanel />
      </div>
    </div>
  );
}
