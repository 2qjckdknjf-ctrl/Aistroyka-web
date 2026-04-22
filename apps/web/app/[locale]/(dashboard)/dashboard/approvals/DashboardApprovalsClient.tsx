"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Skeleton, EmptyState, Badge } from "@/components/ui";

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

function formatAge(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 60) return `${diffM}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  return `${diffD}d ago`;
}

export function DashboardApprovalsClient() {
  const { data: items, isPending, isError } = useQuery({
    queryKey: ["approvals-pending"],
    queryFn: fetchPendingApprovals,
    staleTime: 30 * 1000,
  });

  if (isPending) {
    return (
      <Card>
        <Skeleton lines={6} />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <p className="text-aistroyka-text-secondary p-4">Failed to load pending approvals.</p>
      </Card>
    );
  }

  if (!items?.length) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">✓</span>}
          title="No pending approvals"
          subtitle="All reports have been reviewed. New submissions will appear here."
          action={
            <Link href="/dashboard/reports" className="text-aistroyka-accent hover:underline">
              View all reports →
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-aistroyka-border">
        <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
          <strong className="text-aistroyka-text-primary">{items.length}</strong> item
          {items.length !== 1 ? "s" : ""} awaiting approval. Oldest first.
        </p>
      </div>
      <ul className="divide-y divide-aistroyka-border">
        {items.map((item) => (
          <li key={`${item.kind}:${item.id}`}>
            <Link
              href={
                item.kind === "report"
                  ? `/dashboard/reports/${item.id}`
                  : `/dashboard/projects/${item.project_id ?? ""}?tab=documents`
              }
              className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-aistroyka-surface-raised transition-colors"
            >
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="font-mono text-aistroyka-caption text-aistroyka-accent truncate">
                  {item.id.slice(0, 8)}…
                </span>
                <Badge variant="warning">
                  {item.kind === "report" ? "Report review" : "Document review"}
                </Badge>
                {item.kind === "report" && item.worker_id ? (
                  <span className="text-aistroyka-caption text-aistroyka-text-tertiary">
                    Worker {item.worker_id.slice(0, 8)}…
                  </span>
                ) : null}
                {item.kind === "document" && item.title ? (
                  <span className="text-aistroyka-caption text-aistroyka-text-tertiary truncate max-w-[260px]">
                    {item.title}
                  </span>
                ) : null}
                {item.project_id && (
                  <span className="text-aistroyka-caption text-aistroyka-text-tertiary">
                    · Project {item.project_id.slice(0, 8)}…
                  </span>
                )}
              </div>
              <span className="text-aistroyka-caption text-aistroyka-text-tertiary tabular-nums">
                {item.pending_at ? formatAge(item.pending_at) : "—"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="p-4 border-t border-aistroyka-border">
        <Link
          href="/dashboard/reports"
          className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
        >
          View all reports →
        </Link>
      </div>
    </Card>
  );
}
