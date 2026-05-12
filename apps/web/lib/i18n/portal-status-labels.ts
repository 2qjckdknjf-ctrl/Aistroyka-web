export type PortalStatusGroup =
  | "document"
  | "clientRequest"
  | "changeOrder"
  | "discussion"
  | "defect"
  | "serviceRequest"
  | "milestone"
  | "handover"
  | "issue"
  | "customerEstimate"
  | "report"
  | "task";

type Translate = (key: string, values?: Record<string, string | number | Date>) => string;

/**
 * Localized status for dashboard / portal UI. Keys live in messages `portalStatus` as `{group}_{rawStatus}`.
 */
export function formatPortalStatus(raw: string, group: PortalStatusGroup, t: Translate): string {
  const key = `${group}_${raw}`;
  const label = t(key);
  const missing = label === key || label === `portalStatus.${key}`;
  if (missing) return raw.replace(/_/g, " ");
  return label;
}
