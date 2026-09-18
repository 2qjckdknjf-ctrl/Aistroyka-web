/**
 * Contractor-ops field daily log (TASK-AISTROYKA-003).
 * Distinct from Phase 7 manager/owner daily-digest and from one-shot analyze-video-daily.
 */

export type FieldDailyLogStatus = "draft" | "confirmed";

export interface FieldDailyLog {
  id: string;
  project_id: string;
  tenant_id: string;
  work_date: string;
  status: FieldDailyLogStatus;
  /** Free-form note / spoken transcript seed */
  note: string | null;
  summary: string | null;
  work_done: string | null;
  blockers: string | null;
  weather: string | null;
  /** Optional media / upload session ids attached to the log */
  media_refs: string[];
  created_by: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFieldDailyLogInput {
  project_id: string;
  work_date: string;
  note?: string | null;
  summary?: string | null;
  work_done?: string | null;
  blockers?: string | null;
  weather?: string | null;
  media_refs?: string[];
}

export interface UpdateFieldDailyLogDraftInput {
  work_date?: string;
  note?: string | null;
  summary?: string | null;
  work_done?: string | null;
  blockers?: string | null;
  weather?: string | null;
  media_refs?: string[];
}

/** Pure gate: only drafts may be edited. */
export function fieldDailyLogEditBlockedReason(status: FieldDailyLogStatus): string | null {
  if (status !== "draft") return "Only draft logs can be edited";
  return null;
}

/** Pure gate: only drafts may be confirmed. */
export function fieldDailyLogConfirmBlockedReason(status: FieldDailyLogStatus): string | null {
  if (status !== "draft") return "Only draft logs can be confirmed";
  return null;
}

export function isValidWorkDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
