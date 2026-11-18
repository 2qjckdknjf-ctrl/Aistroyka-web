/**
 * AIS-RECON-017 — Tender reconciliation Finding Ledger (contractor-internal).
 * Findings never auto-mutate estimates/orders. Customer/portal must not see
 * internal cost/margin fields (none are stored here).
 */

export type ReconciliationFindingKind =
  | "quantity_mismatch"
  | "scope_mismatch"
  | "missing_scale_or_unit"
  | "contradictory_revision"
  | "duplicate_evidence"
  | "unavailable_source";

export type ReconciliationFindingStatus =
  | "open"
  | "needs_review"
  | "accepted"
  | "rejected"
  | "superseded";

export type ReconciliationFindingDto = {
  id: string;
  project_id: string;
  kind: ReconciliationFindingKind;
  status: ReconciliationFindingStatus;
  title: string;
  summary: string;
  expected_quantity: number | null;
  observed_quantity: number | null;
  unit: string | null;
  source_document_ref: string | null;
  source_revision: string | null;
  estimate_ref: string | null;
  measurement_method: string | null;
  uncertainty: string;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};
