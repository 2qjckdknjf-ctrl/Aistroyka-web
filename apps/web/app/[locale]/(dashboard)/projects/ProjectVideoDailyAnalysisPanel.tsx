"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import type { DailyWorkVideoAnalysis } from "@aistroyka/contracts";
import { Button } from "@/components/ui";
import { CopyRequestIdButton } from "@/components/ai/CopyRequestIdButton";

const IS_DEV_OR_STAGING =
  typeof process !== "undefined" &&
  (process.env.NODE_ENV !== "production" ||
    (process.env.NEXT_PUBLIC_ENV ?? "").toLowerCase() === "staging" ||
    (process.env.NEXT_PUBLIC_VERCEL_ENV ?? "").toLowerCase() === "staging");

export function ProjectVideoDailyAnalysisPanel({ projectId }: { projectId: string }) {
  const t = useTranslations("projectDetail");
  const tRisk = useTranslations("risk");
  const [videoUrl, setVideoUrl] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DailyWorkVideoAnalysis | null>(null);
  const [requestId, setRequestId] = useState("");

  const run = useCallback(async () => {
    const url = videoUrl.trim();
    if (!url) {
      setError(t("videoDailyEmptyVideoUrl"));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setRequestId("");
    try {
      const body: { video_url: string; project_id: string; work_date?: string } = {
        video_url: url,
        project_id: projectId,
      };
      const wd = workDate.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(wd)) {
        body.work_date = wd;
      }
      const res = await fetch("/api/v1/ai/analyze-video-daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const rid = res.headers.get("X-Request-Id") ?? "";
      setRequestId(rid);
      const json = (await res.json()) as DailyWorkVideoAnalysis & { error?: string; request_id?: string };
      if (!res.ok) {
        throw new Error(json.error ?? t("videoDailyError"));
      }
      setResult(json as DailyWorkVideoAnalysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("videoDailyError"));
    } finally {
      setLoading(false);
    }
  }, [projectId, t, videoUrl, workDate]);

  const riskLabel = (level: string) => {
    if (level === "low" || level === "medium" || level === "high") return tRisk(level);
    return level;
  };

  return (
    <div className="space-y-aistroyka-4 p-4">
      <p className="text-sm text-aistroyka-text-secondary">{t("videoDailyIntro")}</p>
      <div className="space-y-3">
        <div>
          <label htmlFor="video-daily-url" className="mb-1 block text-sm font-medium text-aistroyka-text-primary">
            {t("videoDailyVideoUrlLabel")}
          </label>
          <input
            id="video-daily-url"
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder={t("videoDailyVideoUrlPlaceholder")}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm text-aistroyka-text-primary placeholder:text-aistroyka-text-tertiary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2"
          />
        </div>
        <div>
          <label htmlFor="video-daily-date" className="mb-1 block text-sm font-medium text-aistroyka-text-primary">
            {t("videoDailyWorkDateLabel")}
          </label>
          <input
            id="video-daily-date"
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            className="max-w-xs rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2"
          />
          <p className="mt-1 text-xs text-aistroyka-text-tertiary">{t("videoDailyWorkDateHint")}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={run} disabled={loading} loading={loading}>
          {loading ? t("videoDailyAnalyzing") : t("videoDailyAnalyze")}
        </Button>
        {IS_DEV_OR_STAGING && requestId ? <CopyRequestIdButton requestId={requestId} /> : null}
      </div>
      {error ? (
        <div className="rounded border border-aistroyka-danger/40 bg-aistroyka-danger/10 px-3 py-2 text-sm text-aistroyka-text-primary" role="alert">
          {error}
        </div>
      ) : null}
      {result ? (
        <div className="surface-glass-muted space-y-3 rounded p-4 text-sm">
          <div>
            <span className="font-medium text-aistroyka-text-primary">{t("videoDailyWorkDate")}:</span>{" "}
            <span className="text-aistroyka-text-secondary">{result.work_date}</span>
          </div>
          <div>
            <span className="font-medium text-aistroyka-text-primary">{t("videoDailySummary")}</span>
            <p className="mt-1 whitespace-pre-wrap text-aistroyka-text-secondary">{result.summary}</p>
          </div>
          {result.activities_observed.length > 0 ? (
            <div>
              <span className="font-medium text-aistroyka-text-primary">{t("videoDailyActivities")}</span>
              <ul className="mt-1 list-inside list-disc text-aistroyka-text-secondary">
                {result.activities_observed.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.materials_or_equipment_visible && result.materials_or_equipment_visible.length > 0 ? (
            <div>
              <span className="font-medium text-aistroyka-text-primary">{t("videoDailyMaterials")}</span>
              <ul className="mt-1 list-inside list-disc text-aistroyka-text-secondary">
                {result.materials_or_equipment_visible.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <span className="font-medium text-aistroyka-text-primary">{t("videoDailyCompletion")}:</span>{" "}
            <span className="text-aistroyka-text-secondary">{result.completion_estimate_percent}%</span>
          </div>
          <div>
            <span className="font-medium text-aistroyka-text-primary">{t("videoDailyRisk")}:</span>{" "}
            <span className="text-aistroyka-text-secondary">{riskLabel(result.risk_level)}</span>
          </div>
          {result.issues_and_risks.length > 0 ? (
            <div>
              <span className="font-medium text-aistroyka-text-primary">{t("videoDailyIssues")}</span>
              <ul className="mt-1 list-inside list-disc text-aistroyka-text-secondary">
                {result.issues_and_risks.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.recommendations.length > 0 ? (
            <div>
              <span className="font-medium text-aistroyka-text-primary">{t("videoDailyRecommendations")}</span>
              <ul className="mt-1 list-inside list-disc text-aistroyka-text-secondary">
                {result.recommendations.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.visibility_notes ? (
            <div>
              <span className="font-medium text-aistroyka-text-primary">{t("videoDailyVisibility")}</span>
              <p className="mt-1 text-aistroyka-text-tertiary">{result.visibility_notes}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
