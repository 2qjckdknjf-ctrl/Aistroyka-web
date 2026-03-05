"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Card,
  Skeleton,
  EmptyState,
  Badge,
} from "@/components/ui";

interface ReportRow {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  project_id: string | null;
}

export function DashboardReportsClient() {
  const [data, setData] = useState<ReportRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/reports?limit=50", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json: { data?: ReportRow[] }) => {
        setData(json.data ?? []);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading && !data) {
    return (
      <Card>
        <Skeleton lines={5} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="text-aistroyka-text-secondary">{error}</p>
      </Card>
    );
  }

  if (!data?.length) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">📋</span>}
          title="No reports yet"
          subtitle="Daily reports will appear here once workers submit them."
        />
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <Table aria-label="Reports">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Report ID</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
            <TableHeaderCell>Submitted</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <span className="font-mono text-aistroyka-caption truncate max-w-[100px] block" title={r.id}>
                  {r.id.slice(0, 8)}…
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={r.status === "submitted" ? "success" : "neutral"}>{r.status}</Badge>
              </TableCell>
              <TableCell className="text-aistroyka-text-secondary tabular-nums">
                {new Date(r.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
              </TableCell>
              <TableCell className="text-aistroyka-text-secondary tabular-nums">
                {r.submitted_at
                  ? new Date(r.submitted_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
                  : "—"}
              </TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/daily-reports/${r.id}`}
                  className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded"
                >
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
