"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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

function CopyIdButton({
  id,
  label = "Copy ID",
  copiedLabel = "Copied",
}: {
  id: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Button variant="secondary" onClick={copy} className="text-sm">
      {copied ? copiedLabel : label}
    </Button>
  );
}

export default function ReportDetailPage() {
  const tPage = useTranslations("dashboardPageMeta");
  const tDetail = useTranslations("dashboardDetail");
  const params = useParams();
  const id = params?.id as string | undefined;
  const [data, setData] = useState<ReportDetail | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <p className="text-aistroyka-text-secondary p-4">{tDetail("missingReportId")}</p>
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
          title={tDetail("reportNotFound")}
          subtitle={error ?? tDetail("accessDeniedHint")}
          action={<Link href="/dashboard/daily-reports" className="text-aistroyka-accent hover:underline">{tDetail("backToReports")}</Link>}
        />
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/dashboard/daily-reports" className="text-aistroyka-subheadline text-aistroyka-accent hover:underline">
          {tDetail("reports")}
        </Link>
        <CopyIdButton id={data.id} label={tDetail("copyId")} copiedLabel={tDetail("copied")} />
        <span className="text-aistroyka-caption text-aistroyka-text-tertiary" title={tDetail("deepLink")}>
          {tDetail("reportIdLabel")} <span className="font-mono">{data.id.slice(0, 8)}…</span>
        </span>
      </div>
      <SectionHeader
        title={`Report ${data.id.slice(0, 8)}…`}
        subtitle={tPage("reportDetailSubtitle")}
      />

      <Card className="mb-4">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("status")}</dt>
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
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("worker")}</dt>
            <dd>
              <Link href={`/dashboard/workers/${data.user_id}`} className="font-mono text-aistroyka-accent hover:underline">{data.user_id.slice(0, 8)}…</Link>
            </dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("created")}</dt>
            <dd className="tabular-nums">{new Date(data.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("submitted")}</dt>
            <dd className="tabular-nums">{data.submitted_at ? new Date(data.submitted_at).toLocaleString() : "—"}</dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("mediaAttachments")}</dt>
            <dd>{data.media?.length ?? 0}</dd>
          </div>
          {data.reviewed_at && (
            <>
              <div>
                <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("reviewedAt")}</dt>
                <dd className="tabular-nums">{new Date(data.reviewed_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("reviewedBy")}</dt>
                <dd className="font-mono text-sm">{data.reviewed_by?.slice(0, 8) ?? "—"}…</dd>
              </div>
            </>
          )}
        </dl>
        {data.status === "submitted" && (
          <div className="mt-4 pt-4 border-t border-aistroyka-border">
            {data.reviewed_at && (
              <p className="text-aistroyka-caption text-aistroyka-warning mb-2">
                {tDetail("resubmittedHint")}
              </p>
            )}
            <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary mb-2">{tDetail("managerApproval")}</h3>
            <ReportApprovalCard reportId={data.id} onSuccess={refetch} />
          </div>
        )}
        {data.manager_note && (
          <div className="mt-4 pt-4 border-t border-aistroyka-border">
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("managerNote")}</dt>
            <dd className="text-aistroyka-subheadline text-aistroyka-text-secondary mt-1">{data.manager_note}</dd>
          </div>
        )}
      </Card>

      {data.media?.length ? (
        <Card className="mb-4">
          <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary mb-2">{tDetail("mediaGallery")}</h3>
          <ul className="list-disc list-inside text-aistroyka-subheadline text-aistroyka-text-secondary">
            {data.media.map((m, i) => (
              <li key={i}>
                {m.media_id ? (
                  <Link href="/dashboard/uploads" className="text-aistroyka-accent hover:underline font-mono">{tDetail("media")} {m.media_id.slice(0, 8)}…</Link>
                ) : m.upload_session_id ? (
                  <span className="font-mono">{tDetail("session")} {m.upload_session_id.slice(0, 8)}…</span>
                ) : (
                  "—"
                )}
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="mb-4">
          <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">{tDetail("noMediaAttached")}</p>
        </Card>
      )}

      <Card>
        <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary mb-2">{tDetail("aiAnalysis")}</h3>
        {analysis ? (
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("status")}</dt>
              <dd>
                <Badge variant={analysis.status === "success" ? "success" : analysis.status === "failed" ? "danger" : "warning"}>{analysis.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("jobs")}</dt>
              <dd className="tabular-nums">{analysis.jobCount}</dd>
            </div>
            {analysis.summary && (
              <>
                <div>
                  <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("analyzed")}</dt>
                  <dd className="tabular-nums">{analysis.summary.analyzed} / {analysis.summary.mediaTotal}</dd>
                </div>
                <div>
                  <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("failed")}</dt>
                  <dd className="tabular-nums">{analysis.summary.failed}</dd>
                </div>
              </>
            )}
          </dl>
        ) : (
          <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">{tDetail("noAiJobsYet")}</p>
        )}
      </Card>
    </>
  );
}
