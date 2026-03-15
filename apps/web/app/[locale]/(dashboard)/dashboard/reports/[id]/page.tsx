"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Card, SectionHeader, Skeleton, EmptyState, Badge, Button } from "@/components/ui";
import { ReportApprovalCard } from "@/components/approvals";

interface ReportDetail {
  id: string;
  user_id: string;
  day_id: string | null;
  status: string;
  created_at: string;
  submitted_at: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  manager_note?: string | null;
  media: { media_id: string | null; upload_session_id: string | null }[];
}

interface AnalysisStatus {
  status: string;
  reportId: string;
  jobCount: number;
  summary: { mediaTotal: number; analyzed: number; failed: number } | null;
}

function CopyIdButton({ id, label = "Copy ID" }: { id: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Button variant="secondary" onClick={copy} className="text-sm">
      {copied ? "Copied" : label}
    </Button>
  );
}

export default function ReportDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [data, setData] = useState<ReportDetail | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportsPath = "/dashboard/reports";

  function refetch() {
    if (!id) return;
    fetch(`/api/v1/reports/${id}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Not found"))))
      .then((res) => setData((res as { data: ReportDetail }).data ?? null))
      .catch(() => setData(null));
  }

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/v1/reports/${id}`, { credentials: "include" }).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Not found")))),
      fetch(`/api/v1/reports/${id}/analysis-status`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([reportRes, analysisRes]) => {
        setData((reportRes as { data: ReportDetail }).data ?? null);
        setAnalysis(analysisRes as AnalysisStatus | null);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setData(null);
        setAnalysis(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return (
      <Card>
        <p className="text-aistroyka-text-secondary p-4">Missing report id.</p>
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
          action={<Link href={reportsPath} className="text-aistroyka-accent hover:underline">← Back to reports</Link>}
        />
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={reportsPath} className="text-aistroyka-subheadline text-aistroyka-accent hover:underline">
          ← Reports
        </Link>
        <CopyIdButton id={data.id} />
        <span className="text-aistroyka-caption text-aistroyka-text-tertiary" title="Deep link">
          Report ID: <span className="font-mono">{data.id.slice(0, 8)}…</span>
        </span>
      </div>
      <SectionHeader title={`Report ${data.id.slice(0, 8)}…`} subtitle="Detail, media gallery and AI analysis." />

      <Card className="mb-4">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Status</dt>
            <dd>
              <Badge
                variant={
                  data.status === "approved"
                    ? "success"
                    : data.status === "submitted"
                      ? "warning"
                      : data.status === "changes_requested" || data.status === "rejected"
                        ? "danger"
                        : "neutral"
                }
              >
                {data.status}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Worker</dt>
            <dd>
              <Link href={`/dashboard/workers/${data.user_id}`} className="font-mono text-aistroyka-accent hover:underline">{data.user_id.slice(0, 8)}…</Link>
            </dd>
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
          {data.reviewed_at && (
            <>
              <div>
                <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Reviewed at</dt>
                <dd className="tabular-nums">{new Date(data.reviewed_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Reviewed by</dt>
                <dd className="font-mono text-sm">{data.reviewed_by?.slice(0, 8) ?? "—"}…</dd>
              </div>
            </>
          )}
        </dl>
        {data.status === "submitted" && (
          <div className="mt-4 pt-4 border-t border-aistroyka-border">
            {data.reviewed_at && (
              <p className="text-aistroyka-caption text-amber-600 mb-2">
                Resubmitted after changes were requested.
              </p>
            )}
            <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary mb-2">Manager approval</h3>
            <ReportApprovalCard reportId={data.id} onSuccess={refetch} />
          </div>
        )}
        {data.manager_note && (
          <div className="mt-4 pt-4 border-t border-aistroyka-border">
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Manager note</dt>
            <dd className="text-aistroyka-subheadline text-aistroyka-text-secondary mt-1">{data.manager_note}</dd>
          </div>
        )}
      </Card>

      {data.media?.length ? (
        <Card className="mb-4">
          <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary mb-2">Media gallery</h3>
          <ul className="list-disc list-inside text-aistroyka-subheadline text-aistroyka-text-secondary">
            {data.media.map((m, i) => (
              <li key={i}>
                {m.media_id ? (
                  <Link href="/dashboard/uploads" className="text-aistroyka-accent hover:underline font-mono">Media {m.media_id.slice(0, 8)}…</Link>
                ) : m.upload_session_id ? (
                  <span className="font-mono">Session {m.upload_session_id.slice(0, 8)}…</span>
                ) : (
                  "—"
                )}
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="mb-4">
          <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">No media attached.</p>
        </Card>
      )}

      <Card>
        <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary mb-2">AI analysis</h3>
        {analysis ? (
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Status</dt>
              <dd>
                <Badge variant={analysis.status === "success" ? "success" : analysis.status === "failed" ? "danger" : "warning"}>{analysis.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Jobs</dt>
              <dd className="tabular-nums">{analysis.jobCount}</dd>
            </div>
            {analysis.summary && (
              <>
                <div>
                  <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Analyzed</dt>
                  <dd className="tabular-nums">{analysis.summary.analyzed} / {analysis.summary.mediaTotal}</dd>
                </div>
                <div>
                  <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">Failed</dt>
                  <dd className="tabular-nums">{analysis.summary.failed}</dd>
                </div>
              </>
            )}
          </dl>
        ) : (
          <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">No AI jobs for this report yet.</p>
        )}
      </Card>
    </>
  );
}
