import { createClient } from "@/lib/supabase/server";
import { JobStatusBadge } from "@/app/(dashboard)/projects/JobStatusBadge";
import type { JobStatus } from "@/lib/types";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, project_id, status, created_at, updated_at, error_message")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold">Admin — Jobs (read-only)</h1>
      <p className="mt-1 text-sm text-gray-600">
        All jobs across projects. No actions available.
      </p>
      {jobs && jobs.length > 0 ? (
        <div className="mt-4 overflow-x-auto border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 font-medium">Job ID</th>
                <th className="px-3 py-2 font-medium">Project ID</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-mono text-gray-600">
                    {job.id.slice(0, 8)}…
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-600">
                    {job.project_id.slice(0, 8)}…
                  </td>
                  <td className="px-3 py-2">
                    <JobStatusBadge status={job.status as JobStatus} />
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {new Date(job.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-red-600">
                    {job.error_message ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-sm text-gray-500">No jobs yet.</p>
      )}
    </main>
  );
}
