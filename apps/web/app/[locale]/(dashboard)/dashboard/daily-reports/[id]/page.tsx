"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Card, SectionHeader, Skeleton, EmptyState, Badge } from "@/components/ui";

interface ReportDetail {
  id: string;
  user_id: string;
  day_id: string | null;
  status: string;
  created_at: string;
  submitted_at: string | null;
  media: { media_id: string | null; upload_session_id: string | null }[];
}

export default function ReportDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [data, setData] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/reports/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json: { data?: ReportDetail }) => {
        setData(json.data ?? null);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return (
      <Card>
        <p className="text-aistroyka-text-secondary">Missing report id.</p>
      </Card>
    );
  }

  if (loading && !data) {
    return (
      <Card>
        <Skeleton lines={4} />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">⚠️</span>}
          title="Report not found"
          subtitle={error ?? "You may not have access."}
          action={<Link href="/dashboard/daily-reports" className="text-aistroyka-accent hover:underline">← Back to reports</Link>}
        />
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href="/dashboard/daily-reports"
          className="text-aistroyka-subheadline text-aistroyka-accent hover:underline"
        >
          ← Reports
        </Link>
      </div>
      <SectionHeader title={`Report ${data.id.slice(0, 8)}…`} subtitle="Detail and media." />

      <Card className="mb-4">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Status</dt>
            <dd><Badge variant={data.status === "submitted" ? "success" : "neutral"}>{data.status}</Badge></dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Created</dt>
            <dd className="tabular-nums">{new Date(data.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Submitted</dt>
            <dd className="tabular-nums">{data.submitted_at ? new Date(data.submitted_at).toLocaleString() : "—"}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Media attachments</dt>
            <dd>{data.media?.length ?? 0}</dd>
          </div>
        </dl>
      </Card>

      {data.media?.length ? (
        <Card>
          <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary mb-2">Media</h3>
          <ul className="list-disc list-inside text-aistroyka-subheadline text-aistroyka-text-secondary">
            {data.media.map((m, i) => (
              <li key={i}>
                {m.media_id ? `Media ${m.media_id.slice(0, 8)}…` : m.upload_session_id ? `Session ${m.upload_session_id.slice(0, 8)}…` : "—"}
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">No media attached. AI analysis status available via report analysis-status API.</p>
        </Card>
      )}
    </>
  );
}
