import type { JobStatus } from "@/lib/types";

const styles: Record<JobStatus, string> = {
  pending: "bg-gray-200 text-gray-700",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}
