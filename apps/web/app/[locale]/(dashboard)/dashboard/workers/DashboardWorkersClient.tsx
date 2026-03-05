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

interface WorkerRow {
  user_id: string;
  last_day_date: string | null;
  last_started_at: string | null;
  last_ended_at: string | null;
  last_report_submitted_at: string | null;
}

export function DashboardWorkersClient() {
  const [data, setData] = useState<WorkerRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/workers", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json: { data?: WorkerRow[] }) => {
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
          icon={<span className="text-2xl">👷</span>}
          title="No workers yet"
          subtitle="Worker day and report data will appear here once workers use the app."
        />
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <Table aria-label="Workers">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Worker (ID)</TableHeaderCell>
            <TableHeaderCell>Last day</TableHeaderCell>
            <TableHeaderCell>Day status</TableHeaderCell>
            <TableHeaderCell>Last report</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((w) => (
            <TableRow key={w.user_id}>
              <TableCell>
                <span className="font-mono text-aistroyka-caption truncate max-w-[120px] block" title={w.user_id}>
                  {w.user_id.slice(0, 8)}…
                </span>
              </TableCell>
              <TableCell className="text-aistroyka-text-secondary tabular-nums">
                {w.last_day_date ?? "—"}
              </TableCell>
              <TableCell>
                {w.last_started_at && w.last_ended_at ? (
                  <Badge variant="success">Ended</Badge>
                ) : w.last_started_at ? (
                  <Badge variant="warning">Started</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-aistroyka-text-secondary tabular-nums">
                {w.last_report_submitted_at
                  ? new Date(w.last_report_submitted_at).toLocaleString(undefined, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : "—"}
              </TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/workers/${encodeURIComponent(w.user_id)}/days`}
                  className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded"
                >
                  Days
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
