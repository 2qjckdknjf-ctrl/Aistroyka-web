/** Canonical Project Command Center tab order (redesign 2026-08-19). */
export const PROJECT_COMMAND_TAB_ORDER = [
  "overview",
  "reports",
  "documents",
  "schedule",
  "decisions",
  "workers",
  "contractors",
  "costs",
  "estimate",
  "intelligence",
  "ai",
  "uploads",
] as const;

export type ProjectCommandTab = (typeof PROJECT_COMMAND_TAB_ORDER)[number];

export const DEFAULT_PROJECT_DETAIL_TAB: ProjectCommandTab = "overview";

const PROJECT_DETAIL_TABS = new Set<string>(PROJECT_COMMAND_TAB_ORDER);

export function resolveProjectDetailTab(tab: string | null | undefined): ProjectCommandTab {
  if (tab && PROJECT_DETAIL_TABS.has(tab)) {
    return tab as ProjectCommandTab;
  }
  return DEFAULT_PROJECT_DETAIL_TAB;
}

export function isProjectCommandTab(tab: string): tab is ProjectCommandTab {
  return PROJECT_DETAIL_TABS.has(tab);
}
