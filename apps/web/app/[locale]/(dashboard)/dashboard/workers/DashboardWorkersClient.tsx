"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  Button,
} from "@/components/ui";
import { exportTableToCsv } from "@/lib/cockpit/csvExport";

interface WorkerRow {
  user_id: string;
  last_day_date: string | null;
  last_started_at: string | null;
  last_ended_at: string | null;
  last_report_submitted_at: string | null;
  anomalies?: { open_shift: boolean; overtime: boolean; no_activity: boolean };
}

export function DashboardWorkersClient() {
  const tDetail = useTranslations("dashboardDetail");
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
          title={tDetail("noWorkersYet")}
          subtitle={tDetail("workerDayDataAppears")}
        />
      </Card>
    );
  }

  const copyWorkerId = (userId: string) => {
    navigator.clipboard.writeText(userId);
  };

  const exportCsv = () => {
    const headers = ["User ID", "Last day", "Day status", "Last report"];
    const rows = data.map((w) => [
      w.user_id,
      w.last_day_date ?? "",
      w.last_started_at && w.last_ended_at ? "Ended" : w.last_started_at ? "Started" : "",
      w.last_report_submitted_at ?? "",
    ]);
    exportTableToCsv(headers, rows, "workers.csv");
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-2 flex justify-end">
        <Button variant="secondary" onClick={exportCsv} className="text-sm">{tDetail("exportCsv")}</Button>
      </div>
      <Table aria-label={tDetail("workers")}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{tDetail("workerId")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("lastDay")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("dayStatus")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("anomalies")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("lastReport")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("action")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((w) => (
            <TableRow key={w.user_id}>
              <TableCell>
                <Link href={`/dashboard/workers/${encodeURIComponent(w.user_id)}`} className="font-mono text-aistroyka-caption text-aistroyka-accent hover:underline truncate max-w-[120px] block" title={w.user_id}>
                  {w.user_id.slice(0, 8)}…
                </Link>
                <Button variant="secondary" className="mt-1 text-xs py-0 px-1" onClick={() => copyWorkerId(w.user_id)}>{tDetail("copyId")}</Button>
              </TableCell>
              <TableCell className="text-aistroyka-text-secondary tabular-nums">
                {w.last_day_date ?? "—"}
              </TableCell>
              <TableCell>
                {w.last_started_at && w.last_ended_at ? (
                  <Badge variant="success">{tDetail("ended")}</Badge>
                ) : w.last_started_at ? (
                  <Badge variant="warning">{tDetail("started")}</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {w.anomalies && (w.anomalies.open_shift || w.anomalies.overtime || w.anomalies.no_activity) ? (
                  <span className="flex flex-wrap gap-1">
                    {w.anomalies.open_shift && <Badge variant="warning">{tDetail("openShift")}</Badge>}
                    {w.anomalies.overtime && <Badge variant="warning">{tDetail("overtime")}</Badge>}
                    {w.anomalies.no_activity && <Badge variant="danger">{tDetail("noActivity")}</Badge>}
                  </span>
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
                  href={`/dashboard/workers/${encodeURIComponent(w.user_id)}`}
                  className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded"
                >
                  {tDetail("view")}
                </Link>
                {" · "}
                <Link
                  href={`/dashboard/workers/${encodeURIComponent(w.user_id)}/days`}
                  className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded"
                >
                  {tDetail("days")}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
