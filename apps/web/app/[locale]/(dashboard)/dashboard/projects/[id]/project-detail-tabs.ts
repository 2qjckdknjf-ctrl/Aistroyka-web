export const DEFAULT_PROJECT_DETAIL_TAB = "workers";

const PROJECT_DETAIL_TABS = new Set([
  "workers",
  "contractors",
  "reports",
  "uploads",
  "ai",
  "intelligence",
  "schedule",
  "documents",
  "costs",
  "estimate",
  "decisions",
]);

export function resolveProjectDetailTab(tab: string | null | undefined): string {
  return tab && PROJECT_DETAIL_TABS.has(tab) ? tab : DEFAULT_PROJECT_DETAIL_TAB;
}
