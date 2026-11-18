"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Skeleton, EmptyState } from "@/components/ui";
import { ReportReviewCanonView, type ReportAnalysisCanonData, type ReportReviewCanonData } from "@/components/canon/ReportReviewCanonView";

export default function ReportDetailPage() {
  const tDetail = useTranslations("dashboardDetail");
  const params = useParams();
  const id = params?.id as string | undefined;
  const [data, setData] = useState<ReportReviewCanonData | null>(null);
  const [analysis, setAnalysis] = useState<ReportAnalysisCanonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportsPath = "/dashboard/reports";

  function refetch() {
    if (!id) return;
    fetch(`/api/v1/reports/${id}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Not found"))))
      .then((res) => setData((res as { data: ReportReviewCanonData }).data ?? null))
      .catch(() => setData(null));
  }

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/v1/reports/${id}`, { credentials: "include" }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("Not found")),
      ),
      fetch(`/api/v1/reports/${id}/analysis-status`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([reportRes, analysisRes]) => {
        setData((reportRes as { data: ReportReviewCanonData }).data ?? null);
        setAnalysis(analysisRes as ReportAnalysisCanonData | null);
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
      <div className="canon-glass p-4">
        <p className="text-[var(--canon-text-secondary)]">{tDetail("missingReportId")}</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="canon-glass p-4">
        <Skeleton lines={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="canon-glass p-4">
        <EmptyState
          icon={<span className="text-2xl">⚠️</span>}
          title={tDetail("reportNotFound")}
          subtitle={error ?? tDetail("accessDeniedHint")}
          action={
            <Link href={reportsPath} className="text-[var(--canon-cyan)] hover:underline">
              {tDetail("backToReports")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <ReportReviewCanonView
      report={data}
      analysis={analysis}
      onRefetch={refetch}
    />
  );
}
