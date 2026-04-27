/** Wave 4 Step 17 — finite recurring operational rules (not a generic automation platform). */

export const RECURRING_RULE_KINDS = [
  "handover_blocked_followup",
  "blocking_defects_followup",
  "stale_discussion_manager",
  "aftercare_open_review",
] as const;

export type RecurringRuleKind = (typeof RECURRING_RULE_KINDS)[number];

export type RecurringCadence = "daily" | "weekly" | "every_n_days";

export interface RecurringOperationalRuleRow {
  id: string;
  tenant_id: string;
  project_id: string | null;
  rule_kind: RecurringRuleKind;
  audience: "manager";
  cadence: RecurringCadence;
  cadence_days: number | null;
  active: boolean;
  last_fired_at: string | null;
  next_due_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringFireEventRow {
  id: string;
  tenant_id: string;
  rule_id: string;
  project_id: string | null;
  rule_kind: string;
  dedupe_key: string;
  fired_at: string;
  payload: Record<string, unknown>;
}
