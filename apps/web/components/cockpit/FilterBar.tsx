"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useFilterParams } from "@/lib/cockpit/useFilterParams";
import { DateRangePicker } from "@/components/ui";
import { getSavedViews, saveView, deleteSavedView, type SavedView } from "@/lib/cockpit/savedViews";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

interface FilterBarProps {
  projects: { id: string; name: string }[];
  workers?: { user_id: string }[];
  showProject?: boolean;
  showWorker?: boolean;
  showDateRange?: boolean;
  showStatus?: boolean;
  statusOptions?: { value: string; label: string }[];
  showSearch?: boolean;
  searchPlaceholder?: string;
  showSavedViews?: boolean;
}

export function FilterBar({
  projects,
  workers = [],
  showProject = true,
  showWorker = false,
  showDateRange = true,
  showStatus = false,
  statusOptions = [],
  showSearch = true,
  searchPlaceholder,
  showSavedViews = true,
}: FilterBarProps) {
  const tDetail = useTranslations("dashboardDetail");
  const { params, setParam, setParams } = useFilterParams();
  const [searchInput, setSearchInput] = useState(params.q);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  useEffect(() => {
    setSavedViews(getSavedViews());
  }, []);

  useEffect(() => {
    setSearchInput(params.q);
  }, [params.q]);

  const debouncedSearch = useCallback(() => {
    const t = setTimeout(() => {
      setParam("q", searchInput.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, setParam]);

  useEffect(() => {
    return debouncedSearch();
  }, [searchInput, debouncedSearch]);

  const applySavedView = useCallback((view: SavedView) => {
    const keys: (keyof import("@/lib/cockpit/useFilterParams").FilterParams)[] = [
      "project_id", "worker_id", "from", "to", "status", "q", "page", "pageSize",
    ];
    const updates: Partial<import("@/lib/cockpit/useFilterParams").FilterParams> = {};
    for (const k of keys) {
      if (view.params[k] !== undefined) updates[k] = view.params[k];
    }
    setParams(updates);
  }, [setParams]);

  const saveCurrentView = useCallback(() => {
    const name = window.prompt(tDetail("nameThisView"));
    if (!name?.trim()) return;
    const current = {
      project_id: params.project_id,
      worker_id: params.worker_id,
      from: params.from,
      to: params.to,
      status: params.status,
      q: params.q,
      page: "1",
      pageSize: params.pageSize,
    };
    saveView(name.trim(), current);
    setSavedViews(getSavedViews());
  }, [params, tDetail]);

  const setPreset = useCallback((preset: "7d" | "30d" | "90d") => {
    const to = new Date();
    const from = new Date();
    if (preset === "7d") from.setDate(from.getDate() - 7);
    else if (preset === "30d") from.setDate(from.getDate() - 30);
    else from.setDate(from.getDate() - 90);
    setParams({
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    });
  }, [setParams]);

  return (
    <DashboardGlassCard contentClassName="flex flex-wrap items-center gap-3 px-4 py-3">
      {showProject && (
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-project" className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("project")}</label>
          <select
            id="filter-project"
            aria-label={tDetail("filterByProject")}
            value={params.project_id}
            onChange={(e) => setParam("project_id", e.target.value)}
            className="min-w-[140px] rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1.5 text-aistroyka-caption text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
          >
            <option value="">{tDetail("allProjects")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}
      {showWorker && workers.length > 0 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-worker" className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("worker")}</label>
          <select
            id="filter-worker"
            aria-label={tDetail("filterByWorker")}
            value={params.worker_id}
            onChange={(e) => setParam("worker_id", e.target.value)}
            className="min-w-[140px] rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1.5 text-aistroyka-caption text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
          >
            <option value="">{tDetail("allWorkers")}</option>
            {workers.map((w) => (
              <option key={w.user_id} value={w.user_id}>{w.user_id.slice(0, 8)}…</option>
            ))}
          </select>
        </div>
      )}
      {showDateRange && (
        <div className="flex flex-col gap-1">
          <span className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("dateRange")}</span>
          <DateRangePicker
            from={params.from}
            to={params.to}
            onFromChange={(v) => setParam("from", v)}
            onToChange={(v) => setParam("to", v)}
            onPreset={setPreset}
          />
        </div>
      )}
      {showStatus && statusOptions.length > 0 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-status" className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("status")}</label>
          <select
            id="filter-status"
            aria-label={tDetail("filterByStatus")}
            value={params.status}
            onChange={(e) => setParam("status", e.target.value)}
            className="min-w-[100px] rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1.5 text-aistroyka-caption text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
          >
            <option value="">{tDetail("all")}</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}
      {showSearch && (
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-search" className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("search")}</label>
          <input
            id="filter-search"
            type="search"
            placeholder={searchPlaceholder ?? tDetail("searchPlaceholder")}
            aria-label={tDetail("search")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="min-w-[160px] rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1.5 text-aistroyka-caption text-aistroyka-text-primary placeholder:text-aistroyka-text-tertiary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
          />
        </div>
      )}
      {showSavedViews && (
        <div className="flex flex-col gap-1">
          <span className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("savedViews")}</span>
          <div className="flex gap-2">
            <select
              aria-label={tDetail("applySavedView")}
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                const v = savedViews.find((s) => s.id === id);
                if (v) applySavedView(v);
                e.target.value = "";
              }}
              className="min-w-[120px] rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1.5 text-aistroyka-caption text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
            >
              <option value="">{tDetail("applyView")}</option>
              {savedViews.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={saveCurrentView}
              className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-2 py-1.5 text-aistroyka-caption font-medium text-aistroyka-text-primary hover:bg-aistroyka-surface focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
            >
              {tDetail("saveCurrent")}
            </button>
          </div>
        </div>
      )}
    </DashboardGlassCard>
  );
}
