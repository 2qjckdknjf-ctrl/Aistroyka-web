"use client";

import {
  CheckCircle2,
  CloudSun,
  Download,
  FileText,
  MessageSquare,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ReportApprovalHistory } from "@/components/approvals";
import {
  analysisStatusBadgeVariant,
  reportStatusBadgeVariant,
} from "@/app/[locale]/(dashboard)/dashboard/daily-reports/reports-list.utils";
import { Badge } from "@/components/ui";
import { CanonPageHeader, CanonReportDecisionPanel } from "@/components/canon";
import { getCanonProjectGradient } from "@/components/canon/canon-project-visual";

export interface ReportReviewCanonData {
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
  media: { media_id: string | null; upload_session_id: string | null; file_url?: string | null }[];
}

export interface ReportAnalysisCanonData {
  status: string;
  reportId: string;
  jobCount: number;
  summary: { mediaTotal: number; analyzed: number; failed: number } | null;
}

type ReportReviewCanonViewProps = {
  report: ReportReviewCanonData;
  analysis: ReportAnalysisCanonData | null;
  projectLabel?: string;
  onRefetch: () => void;
};

function statusReviewBadge(status: string, t: ReturnType<typeof useTranslations<"canon">>) {
  if (status === "submitted") return t("reportStatusReview");
  if (status === "approved") return t("reportStatusApproved");
  if (status === "rejected") return t("reportStatusRejected");
  if (status === "changes_requested") return t("reportStatusChanges");
  return status;
}

export function ReportReviewCanonView({
  report,
  analysis,
  projectLabel,
  onRefetch,
}: ReportReviewCanonViewProps) {
  const t = useTranslations("canon");
  const tDetail = useTranslations("dashboardDetail");
  const canReview = report.status === "submitted";
  const mediaCount = report.media?.length ?? 0;
  const mediaUrls = (report.media ?? []).map((m) => m.file_url).filter((u): u is string => Boolean(u));
  const beforeUrl = mediaUrls[0];
  const afterUrl = mediaUrls[1] ?? mediaUrls[0];
  const gradient = getCanonProjectGradient(report.id);

  const workflowSteps = [
    { key: "info", label: t("reportStepInfo"), state: "done" as const },
    { key: "media", label: t("reportStepMedia", { count: mediaCount }), state: "done" as const },
    { key: "norms", label: t("reportStepNorms"), state: "done" as const },
    { key: "verify", label: t("reportStepVerify"), state: "current" as const },
    { key: "decision", label: t("reportStepDecision"), state: "pending" as const },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <nav className="text-sm text-[var(--canon-text-muted)]">
        <Link href="/dashboard/reports" className="hover:text-[var(--canon-cyan)]">
          {tDetail("reports")}
        </Link>
        {projectLabel ? (
          <>
            <span className="mx-2">/</span>
            <span className="text-[var(--canon-text-secondary)]">{projectLabel}</span>
          </>
        ) : null}
      </nav>

      <CanonPageHeader
        title={t("reportReviewTitle")}
        subtitle={t("screen05Label")}
        showFavorite={false}
        actions={
          <>
            <span className="canon-risk-badge canon-risk-badge--medium">
              {statusReviewBadge(report.status, t)}
            </span>
            <button
              type="button"
              className="canon-ghost-btn !text-xs"
              onClick={() => {
                if (typeof window !== "undefined") window.print();
              }}
            >
              <Download size={16} aria-hidden />
              <span className="hidden sm:inline">{t("exportPdf")}</span>
            </button>
          </>
        }
      />

      <div className="canon-meta-bar canon-glass p-3 sm:p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--canon-text-muted)]">
            {t("reportMetaProject")}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--canon-text-primary)]">
            {projectLabel ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--canon-text-muted)]">
            {tDetail("worker")}
          </p>
          <Link
            href={`/dashboard/workers/${report.user_id}`}
            className="mt-1 text-sm font-medium text-[var(--canon-cyan)] hover:underline"
          >
            {report.user_id.slice(0, 8)}…
          </Link>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--canon-text-muted)]">
            {t("reportMetaDate")}
          </p>
          <p className="mt-1 text-sm text-[var(--canon-text-primary)]">
            {new Date(report.created_at).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--canon-text-muted)]">
            {t("reportMetaShift")}
          </p>
          <p className="mt-1 text-sm text-[var(--canon-text-primary)]">{t("shiftNotRecorded")}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--canon-text-muted)]">
            {t("reportMetaWeather")}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm text-[var(--canon-text-primary)]">
            <CloudSun size={16} className="text-[var(--canon-gold)]" aria-hidden />
            {t("weatherNotRecorded")}
          </p>
        </div>
      </div>

      <div className="canon-workflow-steps canon-scroll-x" aria-label={t("reportWorkflow")}>
        {workflowSteps.map((step) => (
          <div
            key={step.key}
            className={`canon-workflow-step ${
              step.state === "done"
                ? "canon-workflow-step--done"
                : step.state === "current"
                  ? "canon-workflow-step--current"
                  : ""
            }`}
          >
            {step.state === "done" ? (
              <CheckCircle2 size={14} className="mb-1 text-[var(--canon-success)]" aria-hidden />
            ) : null}
            <span className="font-medium text-[var(--canon-text-primary)]">{step.label}</span>
          </div>
        ))}
      </div>

      <div className="canon-report-workspace">
        <section className="canon-glass p-4 space-y-4 min-w-0">
          <h2 className="canon-section-title">{t("reportSections")}</h2>
          <ul className="space-y-2 text-sm">
            {workflowSteps.map((step) => (
              <li key={step.key} className="flex items-center gap-2 text-[var(--canon-text-secondary)]">
                {step.state === "done" ? (
                  <CheckCircle2 size={16} className="text-[var(--canon-success)]" aria-hidden />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-[var(--canon-border-glass)]" aria-hidden />
                )}
                {step.label}
              </li>
            ))}
          </ul>
          <div className="border-t border-[var(--canon-border-glass)] pt-4">
            <p className="text-sm text-[var(--canon-text-secondary)]">
              {report.worker_note ?? t("reportNoWorksListed")}
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--canon-text-muted)]">{t("reportPlannedVolume")}</dt>
                <dd className="font-semibold tabular-nums text-[var(--canon-text-primary)]">—</dd>
              </div>
              <div>
                <dt className="text-[var(--canon-text-muted)]">{t("reportActualVolume")}</dt>
                <dd className="font-semibold tabular-nums text-[var(--canon-text-primary)]">—</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-[var(--canon-text-muted)]">{t("reportVolumesPending")}</p>
          </div>
        </section>

        <section className="canon-glass p-4 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="canon-section-title">{t("reportEvidence")}</h2>
            {beforeUrl ? (
              <a
                href={beforeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="canon-ghost-btn !text-xs"
              >
                {t("fullscreen")}
              </a>
            ) : null}
          </div>

          <div className="canon-before-after">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-[var(--canon-text-muted)]">
                {t("before")}
              </p>
              <div
                className="aspect-video rounded-xl border border-[var(--canon-border-glass)] overflow-hidden"
                style={beforeUrl ? undefined : { background: gradient }}
              >
                {beforeUrl ? (
                  <img src={beforeUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-[var(--canon-text-muted)]">
                {t("after")}
              </p>
              <div
                className="aspect-video rounded-xl border border-[var(--canon-border-glass)] overflow-hidden"
                style={afterUrl ? undefined : { background: gradient, filter: "brightness(1.15)" }}
              >
                {afterUrl ? (
                  <img src={afterUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
            </div>
          </div>

          {report.media?.length ? (
            <ul className="flex gap-2 overflow-x-auto pb-1">
              {report.media.slice(0, 6).map((m, i) => (
                <li key={i} className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[var(--canon-border-glass)]">
                  {m.file_url ? (
                    <img src={m.file_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full" style={{ background: gradient }} title={m.media_id ?? m.upload_session_id ?? ""} />
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--canon-text-muted)]">
              {t("completedWorks")}
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-[var(--canon-text-secondary)]">
              {report.worker_note ? (
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--canon-success)]" aria-hidden />
                  <span>{report.worker_note}</span>
                </li>
              ) : (
                <li className="text-[var(--canon-text-muted)]">{t("reportNoWorksListed")}</li>
              )}
            </ul>
          </div>

          <div className="canon-data-table-wrap">
            <table className="canon-data-table">
              <thead>
                <tr>
                  <th>{t("colWork")}</th>
                  <th>{t("colUnit")}</th>
                  <th>{t("colPlan")}</th>
                  <th>{t("colFact")}</th>
                  <th>{t("colDeviation")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="text-center text-[var(--canon-text-muted)]">
                    {t("reportVolumesPending")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--canon-text-muted)]">{t("deviationNote")}</p>
        </section>

        <section className="canon-report-decision-col canon-glass p-4 space-y-4 min-w-0 canon-report-decision-sticky lg:sticky lg:top-[calc(var(--canon-topbar-h)+12px)] lg:self-start">
          <h2 className="canon-section-title">{t("reportDecision")}</h2>
          <CanonReportDecisionPanel
            reportId={report.id}
            canReview={canReview}
            onSuccess={onRefetch}
          />

          <div className="canon-ai-panel rounded-xl p-3">
            <p className="text-sm font-semibold text-[var(--canon-text-primary)]">
              {t("reportAiAnalysis")}
            </p>
            {analysis ? (
              <div className="mt-2">
                <Badge variant={analysisStatusBadgeVariant(analysis.status)}>{analysis.status}</Badge>
                {analysis.summary ? (
                  <p className="mt-2 text-xs text-[var(--canon-text-muted)]">
                    {analysis.summary.analyzed}/{analysis.summary.mediaTotal} {tDetail("analyzed")}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[var(--canon-text-muted)]">{tDetail("noAiJobsYet")}</p>
            )}
            <p className="mt-3 text-xs text-[var(--canon-text-secondary)]">{t("reportAiHint")}</p>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--canon-text-muted)]">
              <MessageSquare size={14} aria-hidden />
              {t("reportComments")}
            </h3>
            <ul className="mt-3 space-y-3 text-sm text-[var(--canon-text-secondary)]">
              {report.manager_note ? <li>{report.manager_note}</li> : null}
              {report.worker_note ? <li>{report.worker_note}</li> : null}
              {!report.manager_note && !report.worker_note ? (
                <li className="text-[var(--canon-text-muted)]">{t("reportNoComments")}</li>
              ) : null}
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--canon-text-muted)]">
                <FileText size={14} aria-hidden />
                {t("reportAttachments")}
              </h3>
              <button
                type="button"
                className="text-xs text-[var(--canon-cyan)] disabled:opacity-40"
                disabled={!mediaUrls.length}
                onClick={() => {
                  for (const url of mediaUrls) {
                    window.open(url, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                {t("downloadAll")}
              </button>
            </div>
            <ul className="mt-2 space-y-2 text-sm">
              {report.media?.length
                ? report.media.slice(0, 4).map((m, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--canon-border-glass)] px-3 py-2">
                      <span className="truncate font-mono text-xs">
                        {m.media_id?.slice(0, 12) ?? m.upload_session_id?.slice(0, 12) ?? "file"}…
                      </span>
                      {m.file_url ? (
                        <a href={m.file_url} target="_blank" rel="noopener noreferrer" aria-label={t("downloadAll")}>
                          <Download size={14} className="shrink-0 text-[var(--canon-cyan)]" />
                        </a>
                      ) : (
                        <Download size={14} className="shrink-0 text-[var(--canon-text-muted)]" aria-hidden />
                      )}
                    </li>
                  ))
                : (
                  <li className="text-[var(--canon-text-muted)]">{tDetail("noMediaAttached")}</li>
                )}
            </ul>
          </div>

          {report.manager_note ? (
            <p className="text-sm text-[var(--canon-text-secondary)]">
              <span className="font-medium text-[var(--canon-text-primary)]">{tDetail("managerNote")}: </span>
              {report.manager_note}
            </p>
          ) : null}

          <ReportApprovalHistory reportId={report.id} />
        </section>
      </div>

      <div className="canon-glass p-3 text-xs text-[var(--canon-text-muted)] sm:p-4">
        <span className="font-medium text-[var(--canon-text-secondary)]">{tDetail("status")}: </span>
        <Badge variant={reportStatusBadgeVariant(report.status)}>{report.status}</Badge>
        <span className="mx-2">·</span>
        <span>{tDetail("reportIdLabel")}</span>
        <span className="font-mono">{report.id.slice(0, 8)}…</span>
      </div>
    </div>
  );
}
