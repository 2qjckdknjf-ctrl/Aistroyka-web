import { createClient } from "@/lib/supabase/server";
import { JobStatusBadge } from "../projects/JobStatusBadge";
import { AISystemHealth } from "./AISystemHealth";
import { computeCalibration } from "@/lib/intelligence/calibration";
import { Card, SectionHeader, EmptyState } from "@/components/ui";
import type { JobStatus } from "@/lib/types";

type JobRow = {
  id: string;
  media_id: string;
  status: string;
  started_at: string;
  error_message: string | null;
  media: { project_id: string } | { project_id: string }[] | null;
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("analysis_jobs")
    .select("id, media_id, status, started_at, error_message, media(project_id)")
    .order("started_at", { ascending: false })
    .limit(100);

  const { data: analysisRows } = await supabase
    .from("ai_analysis")
    .select(
      "stage, completion_percent, risk_level, detected_issues, recommendations, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const analyses = (analysisRows ?? []) as Array<{
    stage: string | null;
    completion_percent: number;
    risk_level: string;
    detected_issues: string[] | null;
    recommendations: string[] | null;
    created_at: string;
  }>;
  const calibrationResult =
    analyses.length >= 2 ? computeCalibration(analyses, 10) : null;

  return (
    <>
      <Card className="mb-aistroyka-8 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          Admin — Jobs (read-only)
        </h1>
        <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          All jobs across projects. No actions available.
        </p>
        <p className="mt-aistroyka-3 flex flex-wrap gap-aistroyka-4">
          <a href="/admin/governance" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">AI Governance & Audit →</a>
          <a href="/admin/trust" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">AI Trust Dashboard →</a>
        </p>
      </Card>

      <section className="mb-aistroyka-8">
        <SectionHeader title="AI System Health" />
        <AISystemHealth result={calibrationResult} />
      </section>

      <section>
        <SectionHeader title="Jobs" />
        {jobs && jobs.length > 0 ? (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-aistroyka-subheadline">
                <thead>
                  <tr className="border-b border-aistroyka-border-subtle bg-aistroyka-surface-raised">
                    <th className="table-cell font-semibold text-aistroyka-text-primary">Job ID</th>
                    <th className="table-cell font-semibold text-aistroyka-text-primary">Project ID</th>
                    <th className="table-cell font-semibold text-aistroyka-text-primary">Status</th>
                    <th className="table-cell font-semibold text-aistroyka-text-primary">Started</th>
                    <th className="table-cell font-semibold text-aistroyka-text-primary">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {(jobs as unknown as JobRow[]).map((job) => (
                    <tr
                      key={job.id}
                      className="border-b border-aistroyka-border-subtle last:border-0 transition-colors hover:bg-aistroyka-surface-raised/50"
                    >
                      <td className="table-cell font-mono text-aistroyka-text-secondary">{job.id.slice(0, 8)}…</td>
                      <td className="table-cell font-mono text-aistroyka-text-secondary">{((Array.isArray(job.media) ? job.media[0]?.project_id : job.media?.project_id) ?? job.media_id).slice(0, 8)}…</td>
                      <td className="table-cell">
                        <JobStatusBadge status={job.status as JobStatus} />
                      </td>
                      <td className="table-cell text-aistroyka-text-secondary tabular-nums">{new Date(job.started_at).toLocaleString()}</td>
                      <td className="table-cell text-aistroyka-error">{job.error_message ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon={
                <svg className="h-aistroyka-empty-icon w-aistroyka-empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              title="No jobs yet"
              subtitle="Analysis jobs will appear here."
            />
          </Card>
        )}
      </section>
    </>
  );
}
