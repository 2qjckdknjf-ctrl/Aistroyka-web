export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

const NEUTRAL_BADGE = "bg-aistroyka-text-tertiary/15 text-aistroyka-text-secondary";

export function changeOrderStatusBadgeClass(status: string): string {
  switch (status) {
    case "proposed":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
    case "under_review":
      return "bg-aistroyka-info/20 text-aistroyka-info";
    case "approved":
    case "implemented":
      return "bg-aistroyka-success/20 text-aistroyka-success";
    case "rejected":
      return "bg-aistroyka-error/20 text-aistroyka-error";
    case "draft":
    case "archived":
    default:
      return NEUTRAL_BADGE;
  }
}

export function serviceRequestStatusBadgeClass(status: string): string {
  switch (status) {
    case "reported":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
    case "triaged":
    case "in_progress":
      return "bg-aistroyka-info/20 text-aistroyka-info";
    case "resolved":
      return "bg-aistroyka-success/20 text-aistroyka-success";
    case "closed":
    default:
      return NEUTRAL_BADGE;
  }
}

export function defectStatusBadgeClass(status: string): string {
  switch (status) {
    case "open":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
    case "in_progress":
    case "ready_for_verification":
      return "bg-aistroyka-info/20 text-aistroyka-info";
    case "resolved":
      return "bg-aistroyka-success/20 text-aistroyka-success";
    case "closed":
    default:
      return NEUTRAL_BADGE;
  }
}

export function discussionStatusBadgeClass(status: string): string {
  switch (status) {
    case "awaiting_stakeholder":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
    case "open":
    case "awaiting_manager":
      return "bg-aistroyka-info/20 text-aistroyka-info";
    case "resolved":
      return "bg-aistroyka-success/20 text-aistroyka-success";
    case "closed":
    default:
      return NEUTRAL_BADGE;
  }
}

export function handoverStatusBadgeClass(status: string): string {
  switch (status) {
    case "handover_ready":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
    case "handed_over":
    case "completed":
      return "bg-aistroyka-success/20 text-aistroyka-success";
    case "in_progress":
    default:
      return "bg-aistroyka-info/20 text-aistroyka-info";
  }
}

export function clientRequestStatusBadgeClass(status: string): string {
  switch (status) {
    case "open":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
    case "responded":
      return "bg-aistroyka-accent/15 text-aistroyka-accent";
    default:
      return NEUTRAL_BADGE;
  }
}

export function issueStatusBadgeClass(status: string): string {
  switch (status) {
    case "resolved":
    case "closed":
      return "bg-aistroyka-success/20 text-aistroyka-success";
    case "in_review":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
    case "open":
    default:
      return "bg-aistroyka-text-tertiary/15 text-aistroyka-text-secondary";
  }
}

export const blockingBadgeClass = "bg-aistroyka-warning/20 text-aistroyka-warning";
