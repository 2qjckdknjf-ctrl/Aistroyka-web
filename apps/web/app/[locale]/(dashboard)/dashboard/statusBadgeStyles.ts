export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export function taskStatusBadgeClass(status: string): string {
  switch (status) {
    case "done":
      return "bg-aistroyka-success/20 text-aistroyka-success";
    case "in_progress":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
    case "cancelled":
      return "bg-aistroyka-error/20 text-aistroyka-error";
    case "pending":
    default:
      return "bg-aistroyka-text-tertiary/15 text-aistroyka-text-secondary";
  }
}

export function aiRequestStatusBadgeClass(status: string): string {
  switch (status) {
    case "success":
      return "bg-aistroyka-success/20 text-aistroyka-success";
    case "failed":
    case "dead":
      return "bg-aistroyka-error/20 text-aistroyka-error";
    case "queued":
    case "running":
    default:
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
  }
}
