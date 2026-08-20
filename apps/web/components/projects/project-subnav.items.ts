export type ProjectSubnavKey = "overview" | "reports" | "documents" | "schedule" | "decisions";

export interface ProjectSubnavItem {
  key: ProjectSubnavKey;
  href: string;
  tab: string | null;
  labelKey: ProjectSubnavKey;
}

const SAFE_PROJECT_SUBNAV: Array<Omit<ProjectSubnavItem, "href"> & { tab: string | null }> = [
  { key: "overview", tab: null, labelKey: "overview" },
  { key: "reports", tab: "reports", labelKey: "reports" },
  { key: "documents", tab: "documents", labelKey: "documents" },
  { key: "schedule", tab: "schedule", labelKey: "schedule" },
  { key: "decisions", tab: "decisions", labelKey: "decisions" },
];

export function getProjectSubnavItems(projectId: string): ProjectSubnavItem[] {
  const base = `/dashboard/projects/${encodeURIComponent(projectId)}`;
  return SAFE_PROJECT_SUBNAV.map((item) => ({
    ...item,
    href: item.tab ? `${base}?tab=${item.tab}` : base,
  }));
}

export function isProjectSubnavItemActive(item: ProjectSubnavItem, activeTab: string): boolean {
  if (item.tab === null) return activeTab === "overview";
  return activeTab === item.tab;
}
