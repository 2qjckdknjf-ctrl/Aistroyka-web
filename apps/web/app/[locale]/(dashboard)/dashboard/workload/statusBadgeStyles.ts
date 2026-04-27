export function workloadPriorityBadgeClass(priority: string): string {
  switch (priority) {
    case "urgent":
      return "bg-aistroyka-error/20 text-aistroyka-error";
    case "high":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
    case "normal":
    default:
      return "bg-aistroyka-text-tertiary/15 text-aistroyka-text-secondary";
  }
}

export function formatWorkloadPriority(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function recurringRuleStateBadgeClass(active: boolean): string {
  return active
    ? "bg-aistroyka-success/15 text-aistroyka-success"
    : "bg-aistroyka-text-tertiary/15 text-aistroyka-text-secondary";
}
