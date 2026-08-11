/**
 * Progressive disclosure for LaunchConfidenceBanner (PD-P2-04).
 * First-run (0 completed) stays expanded; returning partial progress starts compact.
 */

export type LaunchBannerDensity = "hidden" | "expanded" | "compact";

export function resolveLaunchBannerDensity(input: {
  completed: number;
  total: number;
  userExpanded: boolean;
}): LaunchBannerDensity {
  if (input.total <= 0 || input.completed >= input.total) {
    return "hidden";
  }
  if (input.completed === 0) {
    return "expanded";
  }
  return input.userExpanded ? "expanded" : "compact";
}
