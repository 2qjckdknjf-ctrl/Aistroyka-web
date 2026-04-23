export function formatPortfolioStateLabel(state: string): string {
  return state.replace(/_/g, " ");
}

export function portfolioStateBadgeClass(state: string): string {
  switch (state) {
    case "critical":
      return "bg-aistroyka-error/20 text-aistroyka-error";
    case "attention":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
    case "healthy":
      return "bg-aistroyka-success/20 text-aistroyka-success";
    default:
      return "bg-aistroyka-text-tertiary/15 text-aistroyka-text-secondary";
  }
}
