"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input, Button, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, Skeleton, EmptyState } from "@/components/ui";
import type { ContractorDirectoryListItem } from "@/lib/domain/contractor-directory/contractor-directory.types";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

async function fetchDirectory(params: { q: string; specialization: string }): Promise<ContractorDirectoryListItem[]> {
  const sp = new URLSearchParams();
  if (params.q.trim()) sp.set("q", params.q.trim());
  if (params.specialization.trim()) sp.set("specialization", params.specialization.trim());
  const res = await fetch(`/api/v1/contractors/directory?${sp.toString()}`, { credentials: "include" });
  if (!res.ok) throw new Error("load_failed");
  const json = await res.json();
  return json.data ?? [];
}

export function ContractorsDirectoryClient() {
  const t = useTranslations("contractorDirectory");
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState("");
  const [applied, setApplied] = useState({ q: "", specialization: "" });

  const query = useQuery({
    queryKey: ["contractor-directory", applied.q, applied.specialization],
    queryFn: () => fetchDirectory({ q: applied.q, specialization: applied.specialization }),
  });

  const applyFilters = () => setApplied({ q, specialization: spec });

  if (query.isPending) {
    return (
      <DashboardGlassCard>
        <Skeleton className="h-40" />
      </DashboardGlassCard>
    );
  }

  if (query.isError) {
    return (
      <DashboardGlassCard className="p-4">
        <p className="text-aistroyka-error text-sm">{t("loadFailed")}</p>
      </DashboardGlassCard>
    );
  }

  const rows = query.data ?? [];

  return (
    <div className="space-y-4">
      <DashboardGlassCard className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
          <div className="min-w-[200px] flex-1">
            <Input
              id="cd-search"
              label={t("searchLabel")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <Input
              id="cd-spec"
              label={t("filterSpecialization")}
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              placeholder={t("specializationPlaceholder")}
            />
          </div>
          <Button type="button" onClick={applyFilters}>
            {t("applyFilters")}
          </Button>
        </div>
      </DashboardGlassCard>

      {rows.length === 0 ? (
        <EmptyState icon={<span className="text-2xl">📇</span>} title={t("emptyTitle")} subtitle={t("emptySubtitle")} />
      ) : (
        <DashboardGlassCard className="overflow-x-auto" contentClassName="p-0">
          <Table aria-label={t("tableAria")}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("colContractor")}</TableHeaderCell>
                <TableHeaderCell>{t("colQuality")}</TableHeaderCell>
                <TableHeaderCell>{t("colProjects")}</TableHeaderCell>
                <TableHeaderCell>{t("colTasksDone")}</TableHeaderCell>
                <TableHeaderCell>{t("colReports")}</TableHeaderCell>
                <TableHeaderCell>{t("colActions")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const label =
                  row.profile?.company_name?.trim() ||
                  `${row.user_id.slice(0, 8)}…`;
                return (
                  <TableRow key={row.user_id}>
                    <TableCell>
                      <p className="font-medium text-aistroyka-text-primary">{label}</p>
                      <p className="text-xs font-mono text-aistroyka-text-tertiary">{row.user_id}</p>
                    </TableCell>
                    <TableCell>{row.metrics.quality_score}</TableCell>
                    <TableCell>{row.metrics.active_projects}</TableCell>
                    <TableCell>{row.metrics.tasks_completed}</TableCell>
                    <TableCell>{row.metrics.reports_submitted}</TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/contractors/${row.user_id}`}
                        className="text-sm font-medium text-aistroyka-accent hover:underline"
                      >
                        {t("openProfile")}
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DashboardGlassCard>
      )}
    </div>
  );
}
