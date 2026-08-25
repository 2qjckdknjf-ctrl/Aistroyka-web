"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Skeleton,
  EmptyState,
  Badge,
} from "@/components/ui";
import { CanonPageHeader } from "@/components/canon";

interface DayRow {
  id: string;
  day_date: string;
  started_at: string | null;
  ended_at: string | null;
  created_at?: string;
}

export function WorkerDaysCanonPage() {
  const t = useTranslations("canon");
  const tDetail = useTranslations("dashboardDetail");
  const tPage = useTranslations("dashboardPageMeta");
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
      <div className="canon-glass p-4">
        <p className="text-[var(--canon-text-secondary)]">{tDetail("missingWorker")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CanonPageHeader
        title={tDetail("dayTimeline")}
        subtitle={tPage("workerDetailSubtitle")}
        showFavorite={false}
        actions={
          <Link href={`/dashboard/workers/${encodeURIComponent(userId)}`} className="canon-ghost-btn text-sm">
            {tPage("backToWorkers")}
          </Link>
        }
      />

      <p className="text-sm text-[var(--canon-text-secondary)]">
        {tDetail("worker")} {userId.slice(0, 8)}… — {tDetail("last31Days")}
      </p>

      {loading && !data ? (
        <div className="canon-glass p-4">
          <Skeleton lines={5} />
        </div>
      ) : error ? (
        <div className="canon-glass p-4">
          <p className="text-[var(--canon-text-secondary)]">{error}</p>
        </div>
      ) : !data?.length ? (
        <div className="canon-glass p-4">
          <EmptyState
            icon={<span className="text-2xl">📅</span>}
            title={tDetail("noDays")}
            subtitle={tDetail("noDayRecords")}
          />
        </div>
      ) : (
        <div className="canon-glass overflow-hidden">
          <Table aria-label={tDetail("workerDays")}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{tDetail("date")}</TableHeaderCell>
                <TableHeaderCell>{tDetail("started")}</TableHeaderCell>
                <TableHeaderCell>{tDetail("ended")}</TableHeaderCell>
                <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="tabular-nums">{d.day_date}</TableCell>
                  <TableCell className="tabular-nums text-[var(--canon-text-secondary)]">
                    {d.started_at
                      ? new Date(d.started_at).toLocaleTimeString(undefined, { timeStyle: "short" })
                      : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums text-[var(--canon-text-secondary)]">
                    {d.ended_at
                      ? new Date(d.ended_at).toLocaleTimeString(undefined, { timeStyle: "short" })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {d.started_at && d.ended_at ? (
                      <Badge variant="success">{tDetail("ended")}</Badge>
                    ) : d.started_at ? (
                      <Badge variant="warning">{tDetail("started")}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
