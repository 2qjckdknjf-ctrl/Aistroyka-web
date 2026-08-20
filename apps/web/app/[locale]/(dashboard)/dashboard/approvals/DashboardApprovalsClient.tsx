"use client";

import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Skeleton, EmptyState, Badge, Button } from "@/components/ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";
import { ReportReviewSplit } from "@/components/dashboard/ReportReviewSplit";
import {
  approvalHref,
  approvalSelectionKey,
  countApprovalsByKind,
  filterApprovalsByKind,
  parseApprovalKindFilter,
  parseApprovalSelection,
  sortApprovalsOldestFirst,
  type ApprovalKindFilter,
} from "./approvals-workspace.utils";

interface PendingApprovalRow {
  kind: "report" | "document";
  id: string;
  status: string;
  pending_at: string;
  project_id: string | null;
  worker_id?: string;
  title?: string;
  document_type?: "document" | "act" | "contract";
}

async function fetchPendingApprovals(): Promise<PendingApprovalRow[]> {
  const res = await fetch("/api/v1/approvals/pending?limit=50", {
    credentials: "include",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

function formatAge(
  dateStr: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 60) return t("minutesAgoShort", { count: Math.max(0, diffM) });
  if (diffH < 24) return t("hoursAgoShort", { count: diffH });
  return t("daysAgoShort", { count: diffD });
}

export function DashboardApprovalsClient() {
  const tDetail = useTranslations("dashboardDetail");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const kindFilter = parseApprovalKindFilter(searchParams?.get("kind"));
  const selected = parseApprovalSelection(searchParams?.get("focus"));

  const { data: items, isPending, isError } = useQuery({
    queryKey: ["approvals-pending"],
    queryFn: fetchPendingApprovals,
    staleTime: 30 * 1000,
  });

  const setQueryParam = useCallback(
    (key: "kind" | "focus", value: string | null) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      if (!value || (key === "kind" && value === "all")) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const sorted = useMemo(() => sortApprovalsOldestFirst(items ?? []), [items]);
  const counts = useMemo(() => countApprovalsByKind(sorted), [sorted]);
  const visible = useMemo(
    () => filterApprovalsByKind(sorted, kindFilter),
    [sorted, kindFilter],
  );
  const selectedItem = useMemo(() => {
    if (!selected) return null;
    return visible.find((item) => item.kind === selected.kind && item.id === selected.id) ?? null;
  }, [selected, visible]);

  if (isPending) {
    return (
      <DashboardGlassCard>
        <Skeleton lines={6} />
      </DashboardGlassCard>
    );
  }

  if (isError) {
    return (
      <DashboardGlassCard>
        <p className="p-4 text-aistroyka-text-secondary">{tDetail("failedLoadPendingApprovals")}</p>
      </DashboardGlassCard>
    );
  }

  if (!items?.length) {
    return (
      <DashboardGlassCard>
        <EmptyState
          icon={<span className="text-2xl">✓</span>}
          title={tDetail("noPendingApprovals")}
          subtitle={tDetail("allReportsReviewed")}
          action={
            <Link href="/dashboard/reports" className="text-aistroyka-accent hover:underline">
              {tDetail("viewAllReportsArrow")}
            </Link>
          }
        />
      </DashboardGlassCard>
    );
  }

  const filterChips: Array<{ id: ApprovalKindFilter; label: string }> = [
    { id: "all", label: tDetail("approvalsFilterAll") },
    { id: "report", label: tDetail("reportReview") },
    { id: "document", label: tDetail("documentReview") },
  ];

  const queueList = (
    <DashboardGlassCard contentClassName="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-aistroyka-border p-4">
        <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
          <strong className="text-aistroyka-text-primary">{visible.length}</strong>{" "}
          {tDetail("itemsAwaitingApproval")}
        </p>
        <div
          role="group"
          aria-label={tDetail("approvalsKindFilter")}
          className="flex flex-wrap gap-1"
        >
          {filterChips.map((chip) => {
            const pressed = kindFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={pressed}
                onClick={() => setQueryParam("kind", chip.id === "all" ? null : chip.id)}
                className={`min-h-aistroyka-touch rounded-[var(--aistroyka-radius-lg)] border px-3 text-aistroyka-caption font-medium ${
                  pressed
                    ? "border-aistroyka-accent bg-aistroyka-accent-light text-aistroyka-accent"
                    : "border-aistroyka-border-subtle text-aistroyka-text-secondary hover:text-aistroyka-text-primary"
                }`}
              >
                {chip.label}
                <span className="ml-1 tabular-nums text-aistroyka-text-tertiary">({counts[chip.id]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="p-4 text-aistroyka-subheadline text-aistroyka-text-secondary">
          {tDetail("approvalsEmptyForFilter")}
        </p>
      ) : (
        <ul className="divide-y divide-aistroyka-border">
          {visible.map((item) => {
            const key = approvalSelectionKey(item);
            const isSelected = selectedItem?.kind === item.kind && selectedItem.id === item.id;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setQueryParam("focus", key)}
                  className={`flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left transition-colors hover:bg-aistroyka-surface-raised ${
                    isSelected ? "bg-aistroyka-accent-light/40" : ""
                  }`}
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate font-mono text-aistroyka-caption text-aistroyka-accent">
                      {item.id.slice(0, 8)}…
                    </span>
                    <Badge variant="warning">
                      {item.kind === "report" ? tDetail("reportReview") : tDetail("documentReview")}
                    </Badge>
                    {item.kind === "report" && item.worker_id ? (
                      <span className="text-aistroyka-caption text-aistroyka-text-tertiary">
                        {tDetail("worker")} {item.worker_id.slice(0, 8)}…
                      </span>
                    ) : null}
                    {item.kind === "document" && item.title ? (
                      <span className="max-w-[260px] truncate text-aistroyka-caption text-aistroyka-text-tertiary">
                        {item.title}
                      </span>
                    ) : null}
                    {item.project_id ? (
                      <span className="text-aistroyka-caption text-aistroyka-text-tertiary">
                        · {tDetail("project")} {item.project_id.slice(0, 8)}…
                      </span>
                    ) : null}
                  </div>
                  <span className="tabular-nums text-aistroyka-caption text-aistroyka-text-tertiary">
                    {item.pending_at ? formatAge(item.pending_at, tDetail) : "—"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-aistroyka-border p-4">
        <Link
          href="/dashboard/reports"
          className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
        >
          {tDetail("viewAllReportsArrow")}
        </Link>
      </div>
    </DashboardGlassCard>
  );

  const decisionPane = (
    <DashboardGlassCard
      className={selectedItem ? "border-l-4 border-l-aistroyka-warning" : undefined}
      contentClassName="space-y-3 p-4"
    >
      <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
        {tDetail("approvalsDecisionPane")}
      </h3>
      {selectedItem ? (
        <>
          <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
            {selectedItem.kind === "report"
              ? tDetail("approvalsDecisionHintReport")
              : tDetail("approvalsDecisionHintDocument")}
          </p>
          <dl className="grid gap-2 text-aistroyka-caption">
            <div>
              <dt className="text-aistroyka-text-tertiary">{tDetail("status")}</dt>
              <dd>
                <Badge variant="warning">{selectedItem.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-aistroyka-text-tertiary">{tDetail("pendingSince")}</dt>
              <dd className="tabular-nums text-aistroyka-text-secondary">
                {selectedItem.pending_at
                  ? `${formatAge(selectedItem.pending_at, tDetail)} · ${new Date(selectedItem.pending_at).toLocaleString()}`
                  : "—"}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Link href={approvalHref(selectedItem)}>
              <Button variant="primary" size="sm">
                {tDetail("approvalsOpenReview")}
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => setQueryParam("focus", null)}>
              {tDetail("approvalsClearSelection")}
            </Button>
          </div>
        </>
      ) : (
        <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
          {tDetail("approvalsSelectHint")}
        </p>
      )}
    </DashboardGlassCard>
  );

  return (
    <ReportReviewSplit
      evidenceLabel={tDetail("approvalsQueue")}
      decisionLabel={tDetail("approvalsDecisionPane")}
      evidence={queueList}
      decision={decisionPane}
    />
  );
}
