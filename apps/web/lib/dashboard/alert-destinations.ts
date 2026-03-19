/**
 * Alert drill-down — honest linkage model.
 *
 * Schema (`public.alerts`) has no resource_type/resource_id → no entity-linked URLs.
 * - context_routed: known type → best operational screen + anchored list link
 * - list_anchor_only: unknown type → only safe destination is full list row (no fake project URL)
 */

export type AlertLinkage = "context_routed" | "list_anchor_only";

export interface AlertDestination {
  linkage: AlertLinkage;
  alertType: string;
  /** Best screen to investigate (null = no dedicated screen for this type) */
  contextHref: string | null;
  contextLabel: string | null;
  /** Always valid: same tenant, same row */
  anchoredListHref: string;
  anchoredListLabel: string;
  /** Shown under CTAs when linkage is list-only */
  honestyNote: string | null;
}

const ANCHORED = (id: string) => `/dashboard/alerts#alert-${id}`;

export function getAlertDestinations(alertId: string, type: string): AlertDestination {
  const anchoredListHref = ANCHORED(alertId);
  const anchoredListLabel = "Highlight on alerts list";

  const base = (
    linkage: AlertLinkage,
    contextHref: string | null,
    contextLabel: string | null,
    honestyNote: string | null
  ): AlertDestination => ({
    linkage,
    alertType: type,
    contextHref,
    contextLabel,
    anchoredListHref,
    anchoredListLabel,
    honestyNote,
  });

  switch (type) {
    case "ai_budget_exceeded":
    case "ai_budget_soft_exceeded":
    case "job_fail_spike":
      return base(
        "context_routed",
        "/dashboard/ai",
        "AI jobs & usage",
        null
      );
    case "slo_breach":
      return base(
        "context_routed",
        "/dashboard",
        "Dashboard overview",
        null
      );
    case "quota_spike":
      return base(
        "context_routed",
        "/dashboard",
        "Dashboard overview (usage)",
        null
      );
    default:
      return base(
        "list_anchor_only",
        null,
        null,
        "No dedicated screen for this alert type — open the list to see this row."
      );
  }
}
