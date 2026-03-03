import type { JobStatus } from "@/lib/types";
import { Badge } from "@/components/ui";

const variantMap: Record<JobStatus, "neutral" | "warning" | "success" | "danger"> = {
  pending: "neutral",
  queued: "neutral",
  processing: "warning",
  completed: "success",
  failed: "danger",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge variant={variantMap[status]}>{status}</Badge>;
}
