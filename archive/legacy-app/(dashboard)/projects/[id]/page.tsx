import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UploadMediaForm } from "../UploadMediaForm";
import { JobStatusBadge } from "../JobStatusBadge";
import { TriggerAnalysisButton } from "../TriggerAnalysisButton";
import { JobListPolling } from "../JobListPolling";
import type { JobWithAnalysis, AiAnalysis } from "@/lib/types";

function AnalysisBlock({ a }: { a: AiAnalysis }) {
  return (
    <div className="mb-2 last:mb-0">
      <p>
        <strong>Stage:</strong> {a.stage} ·{" "}
        <strong>Completion:</strong> {a.completion_percent}% ·{" "}
        <strong>Risk:</strong> {a.risk_level}
      </p>
      {a.detected_issues?.length > 0 && (
        <p>
          <strong>Issues:</strong> {a.detected_issues.join(", ")}
        </p>
      )}
      {a.recommendations?.length > 0 && (
        <p>
          <strong>Recommendations:</strong> {a.recommendations.join(", ")}
        </p>
      )}
    </div>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, user_id")
    .eq("id", id)
    .single();

  if (!project || project.user_id !== user?.id) notFound();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      `
      id,
      status,
      created_at,
      updated_at,
      error_message,
      ai_analysis (id, stage, completion_percent, risk_level, detected_issues, recommendations, created_at)
    `
    )
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const { data: media } = await supabase
    .from("media")
    .select("id, path, job_id, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const jobsTyped = (jobs ?? []) as JobWithAnalysis[];
  const hasActiveJobs = jobsTyped.some(
    (j) => j.status === "pending" || j.status === "processing"
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/projects"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Projects
        </Link>
        <h1 className="text-xl font-semibold">{project.name}</h1>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-medium">Upload media</h2>
        <UploadMediaForm projectId={id} />
      </section>

      {media && media.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-medium">Media</h2>
          <ul className="space-y-2">
            {media.map((m) => (
              <li key={m.id} className="text-sm text-gray-600">
                {m.path}
                {m.job_id && (
                  <span className="ml-2">
                    (job: {m.job_id.slice(0, 8)}…)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-medium">Jobs & AI analysis</h2>
        <JobListPolling hasActiveJobs={hasActiveJobs}>
          {jobsTyped.length > 0 ? (
            <ul className="space-y-4">
              {jobsTyped.map((job) => {
                const analyses: AiAnalysis[] = Array.isArray(job.ai_analysis)
                  ? job.ai_analysis
                  : job.ai_analysis
                    ? [job.ai_analysis]
                    : [];
                return (
                  <li
                    key={job.id}
                    className="rounded border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-gray-500">
                        {job.id.slice(0, 8)}…
                      </span>
                      <JobStatusBadge status={job.status} />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Created {new Date(job.created_at).toLocaleString()}
                    </p>
                    <TriggerAnalysisButton
                      projectId={id}
                      jobId={job.id}
                      status={job.status}
                    />
                    {job.error_message && (
                      <p className="mt-2 text-sm text-red-600">
                        Error: {job.error_message}
                      </p>
                    )}
                    {analyses.length > 0 && (
                      <div className="mt-3 rounded bg-gray-50 p-3 text-sm">
                        {analyses.map((a) => (
                          <AnalysisBlock key={a.id} a={a} />
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              No jobs yet. Upload media to create analysis jobs.
            </p>
          )}
        </JobListPolling>
      </section>
    </main>
  );
}
