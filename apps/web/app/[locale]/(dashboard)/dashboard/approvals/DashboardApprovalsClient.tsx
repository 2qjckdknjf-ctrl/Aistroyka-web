"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Skeleton, EmptyState, Badge } from "@/components/ui";

interface ReportRow {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  project_id: string | null;
}

async function fetchPendingReports(): Promise<ReportRow[]> {
  const res = await fetch("/api/v1/reports?status=submitted&limit=50", {
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
  const { data: reports, isPending, isError } = useQuery({
    queryKey: ["approvals-pending"],
    queryFn: fetchPendingReports,
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

  if (!reports?.length) {
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
          <strong className="text-aistroyka-text-primary">{reports.length}</strong> report
          {reports.length !== 1 ? "s" : ""} awaiting approval. Oldest first.
        </p>
      </div>
      <ul className="divide-y divide-aistroyka-border">
        {reports.map((r) => (
          <li key={r.id}>
            <Link
              href={`/dashboard/reports/${r.id}`}
              className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-aistroyka-surface-raised transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-aistroyka-caption text-aistroyka-accent truncate">
                  {r.id.slice(0, 8)}…
                </span>
                <Badge variant="warning">Pending</Badge>
                <span className="text-aistroyka-caption text-aistroyka-text-tertiary">
                  Worker {r.user_id.slice(0, 8)}…
                </span>
              </div>
              <span className="text-aistroyka-caption text-aistroyka-text-tertiary tabular-nums">
                {r.submitted_at ? formatAge(r.submitted_at) : "—"}
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
