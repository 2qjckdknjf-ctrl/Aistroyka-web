"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Badge,
  Skeleton,
  EmptyState,
  TablePagination,
} from "@/components/ui";
import type { LeadRow } from "@/app/api/v1/platform/leads/route";

const STATUS_VARIANT: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  new: "danger",
  reviewed: "warning",
  contacted: "success",
  archived: "neutral",
};

export function PlatformLeadsClient() {
  const tDetail = useTranslations("dashboardDetail");
  const [data, setData] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/v1/platform/leads?${params}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? "Forbidden" : res.statusText);
        return res.json();
      })
      .then((json: { data?: LeadRow[] }) => {
        setData(json.data ?? []);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : tDetail("failedLoad"));
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const total = data.length;
  const start = (page - 1) * pageSize;
  const pageData = data.slice(start, start + pageSize);

  if (error) {
    return (
      <Card>
        <p className="text-aistroyka-text-secondary">{error}</p>
      </Card>
    );
  }

  if (loading && data.length === 0) {
    return (
      <Card>
        <Skeleton lines={6} />
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-aistroyka-border-subtle px-4 py-3">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{tDetail("contactLeads")}</h2>
        <select
          aria-label={tDetail("filterByStatus")}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1.5 text-aistroyka-caption"
        >
          <option value="">{tDetail("allStatuses")}</option>
          <option value="new">{tDetail("new")}</option>
          <option value="reviewed">{tDetail("reviewed")}</option>
          <option value="contacted">{tDetail("contacted")}</option>
          <option value="archived">{tDetail("archived")}</option>
        </select>
      </div>
      {pageData.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={<span className="text-2xl">📋</span>}
            title={tDetail("noLeads")}
            subtitle={tDetail("contactFormSubmissionsAppear")}
          />
        </div>
      ) : (
        <>
          <Table aria-label={tDetail("leads")}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{tDetail("date")}</TableHeaderCell>
                <TableHeaderCell>{tDetail("name")}</TableHeaderCell>
                <TableHeaderCell>{tDetail("email")}</TableHeaderCell>
                <TableHeaderCell>{tDetail("company")}</TableHeaderCell>
                <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
                <TableHeaderCell className="w-0">{tDetail("actions")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="tabular-nums text-aistroyka-text-secondary whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                  </TableCell>
                  <TableCell className="font-medium text-aistroyka-text-primary">{row.name}</TableCell>
                  <TableCell className="text-aistroyka-text-secondary">{row.email}</TableCell>
                  <TableCell className="text-aistroyka-text-secondary">{row.company ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[row.status] ?? "neutral"}>{row.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/platform-admin/leads/${row.id}`}
                      className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
                    >
                      {tDetail("view")}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalCount={total}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            pageSizeOptions={[25, 50, 100]}
          />
        </>
      )}
    </Card>
  );
}
