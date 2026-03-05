"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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

interface DayRow {
  id: string;
  day_date: string;
  started_at: string | null;
  ended_at: string | null;
  created_at?: string;
}

export default function WorkerDaysPage() {
  const params = useParams();
  const userId = params?.userId as string | undefined;
  const [data, setData] = useState<DayRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/v1/workers/${encodeURIComponent(userId)}/days?limit=31`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json: { data?: DayRow[] }) => {
        setData(json.data ?? []);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) {
    return (
      <Card>
        <p className="text-aistroyka-text-secondary">Missing worker.</p>
      </Card>
    );
  }

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

  return (
    <>
      <div className="mb-4">
        <Link
          href="/dashboard/workers"
          className="text-aistroyka-subheadline text-aistroyka-accent hover:underline"
        >
          ← Workers
        </Link>
      </div>
      <h1 className="text-aistroyka-title3 font-bold text-aistroyka-text-primary mb-2">
        Day timeline
      </h1>
      <p className="text-aistroyka-subheadline text-aistroyka-text-secondary mb-4">
        Worker {userId.slice(0, 8)}… — last 31 days
      </p>
      {!data?.length ? (
        <Card>
          <EmptyState
            icon={<span className="text-2xl">📅</span>}
            title="No days"
            subtitle="No day records for this worker in the selected range."
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table aria-label="Worker days">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Started</TableHeaderCell>
                <TableHeaderCell>Ended</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="tabular-nums">{d.day_date}</TableCell>
                  <TableCell className="text-aistroyka-text-secondary tabular-nums">
                    {d.started_at
                      ? new Date(d.started_at).toLocaleTimeString(undefined, { timeStyle: "short" })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-aistroyka-text-secondary tabular-nums">
                    {d.ended_at
                      ? new Date(d.ended_at).toLocaleTimeString(undefined, { timeStyle: "short" })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {d.started_at && d.ended_at ? (
                      <Badge variant="success">Ended</Badge>
                    ) : d.started_at ? (
                      <Badge variant="warning">Started</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
