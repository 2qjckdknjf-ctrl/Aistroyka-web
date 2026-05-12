import type { HandoverReadinessResult } from "./project-handover.types";

export type HandoverPackAudience = "owner" | "manager";

/** next-intl `getTranslations('handoverPack')` callback shape */
export type HandoverPackTranslate = (
  key: string,
  values?: Record<string, string | number | Date>
) => string;

export interface HandoverPackSection {
  id: string;
  summary: string;
  href: string | null;
  lines?: string[];
}

export interface HandoverPackHandoverSnapshot {
  status: string;
  handover_notes: string | null;
  handed_over_at: string | null;
  completed_at: string | null;
}

export interface HandoverOwnerPackPayload {
  audience: "owner";
  generated_at: string;
  project: { id: string; name: string };
  handover: HandoverPackHandoverSnapshot | null;
  sections: HandoverPackSection[];
}

export interface HandoverManagerPackPayload {
  audience: "manager";
  generated_at: string;
  project: { id: string; name: string };
  readiness: HandoverReadinessResult;
  /** Customer-safe sections; align with what stakeholders see when portal is enabled. */
  sections: HandoverPackSection[];
  /** True when client portal view was used to build sections; if false, sections are minimal (summary + defects only). */
  portal_preview_full: boolean;
}
