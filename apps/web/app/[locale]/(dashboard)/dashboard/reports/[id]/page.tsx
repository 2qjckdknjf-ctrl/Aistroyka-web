"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { SectionHeader, Skeleton, EmptyState, Badge, Button } from "@/components/ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";
import { ReportReviewSplit } from "@/components/dashboard/ReportReviewSplit";
import { ReportApprovalCard, ReportApprovalHistory } from "@/components/approvals";
import {
  analysisStatusBadgeVariant,
  reportStatusBadgeVariant,
  shouldPrioritizeReportDecision,
} from "../daily-reports/reports-list.utils";

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
  worker_note?: string | null;
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
      <DashboardGlassCard>
        <p className="text-aistroyka-text-secondary p-4">{tDetail("missingReportId")}</p>
      </DashboardGlassCard>
    );
  }

  if (loading && !data) {
    return (
      <DashboardGlassCard>
        <Skeleton lines={4} />
      </DashboardGlassCard>
    );
  }

  if (error || !data) {
    return (
      <DashboardGlassCard>
        <EmptyState
          icon={<span className="text-2xl">⚠️</span>}
          title={tDetail("reportNotFound")}
          subtitle={error ?? tDetail("accessDeniedHint")}
          action={<Link href={reportsPath} className="text-aistroyka-accent hover:underline">{tDetail("backToReports")}</Link>}
        />
      </DashboardGlassCard>
    );
  }

  const decisionFirst = shouldPrioritizeReportDecision(data.status);

  const evidence = (
    <>
      <DashboardGlassCard>
        <h3 className="mb-3 text-aistroyka-headline font-semibold text-aistroyka-text-primary">
          {tDetail("reportEvidenceSection")}
        </h3>
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("status")}</dt>
            <dd>
              <Badge variant={reportStatusBadgeVariant(data.status)}>{data.status}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("worker")}</dt>
            <dd>
              <Link href={`/dashboard/workers/${data.user_id}`} className="font-mono text-aistroyka-accent hover:underline">
                {data.user_id.slice(0, 8)}…
              </Link>
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
          {data.worker_note ? (
            <div className="sm:col-span-2">
              <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("workerNote")}</dt>
              <dd className="mt-1 whitespace-pre-wrap text-aistroyka-subheadline text-aistroyka-text-secondary">
                {data.worker_note}
              </dd>
            </div>
          ) : null}
          {data.reviewed_at ? (
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
          ) : null}
        </dl>
      </DashboardGlassCard>

      {data.media?.length ? (
        <DashboardGlassCard>
          <h3 className="mb-2 text-aistroyka-headline font-semibold text-aistroyka-text-primary">{tDetail("mediaGallery")}</h3>
          <ul className="list-inside list-disc text-aistroyka-subheadline text-aistroyka-text-secondary">
            {data.media.map((m, i) => (
              <li key={i}>
                {m.media_id ? (
                  <Link href="/dashboard/uploads" className="font-mono text-aistroyka-accent hover:underline">
                    {tDetail("media")} {m.media_id.slice(0, 8)}…
                  </Link>
                ) : m.upload_session_id ? (
                  <span className="font-mono">
                    {tDetail("session")} {m.upload_session_id.slice(0, 8)}…
                  </span>
                ) : (
                  "—"
                )}
              </li>
            ))}
          </ul>
        </DashboardGlassCard>
      ) : (
        <DashboardGlassCard>
          <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">{tDetail("noMediaAttached")}</p>
        </DashboardGlassCard>
      )}

      <DashboardGlassCard>
        <h3 className="mb-2 text-aistroyka-headline font-semibold text-aistroyka-text-primary">{tDetail("aiAnalysis")}</h3>
        {analysis ? (
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("status")}</dt>
              <dd>
                <Badge variant={analysisStatusBadgeVariant(analysis.status)}>{analysis.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("jobs")}</dt>
              <dd className="tabular-nums">{analysis.jobCount}</dd>
            </div>
            {analysis.summary ? (
              <>
                <div>
                  <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("analyzed")}</dt>
                  <dd className="tabular-nums">
                    {analysis.summary.analyzed} / {analysis.summary.mediaTotal}
                  </dd>
                </div>
                <div>
                  <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("failed")}</dt>
                  <dd className="tabular-nums">{analysis.summary.failed}</dd>
                </div>
              </>
            ) : null}
          </dl>
        ) : (
          <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">{tDetail("noAiJobsYet")}</p>
        )}
      </DashboardGlassCard>
    </>
  );

  const decision = (
    <DashboardGlassCard
      className={decisionFirst ? "border-l-4 border-l-aistroyka-warning" : undefined}
    >
      <h3 className="mb-2 text-aistroyka-headline font-semibold text-aistroyka-text-primary">
        {tDetail("reportDecisionSection")}
      </h3>
      {data.status === "submitted" ? (
        <>
          {data.reviewed_at ? (
            <p className="mb-2 text-aistroyka-caption text-aistroyka-warning">{tDetail("resubmittedHint")}</p>
          ) : null}
          <h4 className="mb-2 text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
            {tDetail("managerApproval")}
          </h4>
          <ReportApprovalCard reportId={data.id} onSuccess={refetch} />
        </>
      ) : (
        <>
          <p className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">{tDetail("decisionWaiting")}</p>
          <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">{tDetail("decisionWaitingHint")}</p>
        </>
      )}
      {data.manager_note ? (
        <div className="mt-4 border-t border-aistroyka-border pt-4">
          <dt className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("managerNote")}</dt>
          <dd className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">{data.manager_note}</dd>
        </div>
      ) : null}
      <ReportApprovalHistory reportId={data.id} />
    </DashboardGlassCard>
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={reportsPath} className="text-aistroyka-subheadline text-aistroyka-accent hover:underline">
          {tDetail("reports")}
        </Link>
        <CopyIdButton id={data.id} label={tDetail("copyId")} copiedLabel={tDetail("copied")} />
        <span className="text-aistroyka-caption text-aistroyka-text-tertiary" title={tDetail("deepLink")}>
          {tDetail("reportIdLabel")} <span className="font-mono">{data.id.slice(0, 8)}…</span>
        </span>
      </div>
      <SectionHeader title={`Report ${data.id.slice(0, 8)}…`} subtitle={tPage("reportDetailSubtitle")} />

      <ReportReviewSplit
        evidenceLabel={tDetail("reportEvidenceSection")}
        decisionLabel={tDetail("reportDecisionSection")}
        evidence={evidence}
        decision={decision}
      />
    </>
  );
}
