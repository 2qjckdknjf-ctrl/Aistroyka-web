/** Count field reports awaiting manager approval. */
export function countPendingReportApprovals(reports: ReadonlyArray<{ status: string }>): number {
  return reports.filter((report) => report.status === "submitted").length;
}

export function reportStatusBadgeVariant(
  status: string,
): "neutral" | "success" | "warning" | "danger" {
  switch (status) {
    case "approved":
      return "success";
    case "submitted":
      return "warning";
    case "changes_requested":
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
}

export function analysisStatusBadgeVariant(
  status: string,
): "neutral" | "success" | "warning" | "danger" {
  switch (status) {
    case "success":
      return "success";
    case "failed":
      return "danger";
    case "queued":
    case "running":
      return "warning";
    default:
      return "neutral";
  }
}

/** Manager decision column is primary when the report still awaits approval. */
export function shouldPrioritizeReportDecision(status: string): boolean {
  return status === "submitted";
}

