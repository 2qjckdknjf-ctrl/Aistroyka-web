export const DEFAULT_PROJECT_DETAIL_TAB = "workers";

/** Single primary project-detail destination set (PD-P1-04). */
export const PROJECT_DETAIL_TAB_IDS = [
  "workers",
  "contractors",
  "reports",
  "uploads",
  "ai",
  "intelligence",
  "schedule",
  "documents",
  "decisions",
  "costs",
  "estimate",
] as const;

export type ProjectDetailTabId = (typeof PROJECT_DETAIL_TAB_IDS)[number];

const PROJECT_DETAIL_TABS = new Set<string>(PROJECT_DETAIL_TAB_IDS);

export function resolveProjectDetailTab(tab: string | null | undefined): ProjectDetailTabId {
  return tab && PROJECT_DETAIL_TABS.has(tab)
    ? (tab as ProjectDetailTabId)
    : DEFAULT_PROJECT_DETAIL_TAB;
}

export function projectDetailTabHref(projectId: string, tab: string): string {
  const resolved = resolveProjectDetailTab(tab);
  if (resolved === DEFAULT_PROJECT_DETAIL_TAB) {
    return `/dashboard/projects/${projectId}`;
  }
  return `/dashboard/projects/${projectId}?tab=${resolved}`;
}
