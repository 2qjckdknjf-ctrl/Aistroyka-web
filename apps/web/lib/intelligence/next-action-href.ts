/**
 * Safe drill-down for NextActions on project detail (analysis-derived).
 * Aligns with dashboard manager routes; no fabricated entity links.
 */

const intel = (projectId: string) =>
  `/dashboard/projects/${projectId}?tab=intelligence`;
const uploads = (projectId: string) =>
  `/dashboard/projects/${projectId}?tab=uploads`;
const ai = (projectId: string) => `/dashboard/projects/${projectId}?tab=ai`;

/** Map action title (stable from computeActionItems) to dashboard project tab. */
export function getNextActionHref(projectId: string, title: string): string {
  if (title === "Improve analysis data quality") return uploads(projectId);
  if (title === "Continue monitoring progress") return uploads(projectId);
  if (title === "Verify sudden completion jump") return ai(projectId);
  if (title === "Review outlier analysis") return ai(projectId);
  if (title === "Review intelligence dashboards") return intel(projectId);
  return intel(projectId);
}

export function getNextActionCtaLabel(title: string): string {
  if (title === "Improve analysis data quality") return "Open uploads";
  if (title === "Continue monitoring progress") return "Open uploads";
  if (title === "Verify sudden completion jump") return "Open AI analyses";
  if (title === "Review outlier analysis") return "Open AI analyses";
  if (title === "Review intelligence dashboards") return "Open intelligence";
  return "Open intelligence";
}
