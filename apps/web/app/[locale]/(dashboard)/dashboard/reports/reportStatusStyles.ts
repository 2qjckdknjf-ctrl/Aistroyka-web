export function formatReportStatus(status: string): string {
  return status.replace(/_/g, " ");
}

export function reportStatusBadgeClass(status: string): string {
  switch (status) {
    case "approved":
      return "bg-aistroyka-success/20 text-aistroyka-success";
    case "submitted":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
    case "changes_requested":
    case "rejected":
      return "bg-aistroyka-error/20 text-aistroyka-error";
    case "draft":
    default:
      return "bg-aistroyka-text-tertiary/15 text-aistroyka-text-secondary";
  }
}

export function analysisStatusBadgeClass(status: string): string {
  switch (status) {
    case "success":
      return "bg-aistroyka-success/20 text-aistroyka-success";
    case "failed":
      return "bg-aistroyka-error/20 text-aistroyka-error";
    case "queued":
    case "running":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
    case "none":
    default:
      return "bg-aistroyka-text-tertiary/15 text-aistroyka-text-secondary";
  }
}
