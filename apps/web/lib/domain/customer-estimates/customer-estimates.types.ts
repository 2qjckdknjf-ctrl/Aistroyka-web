export type CustomerEstimateStatus =
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled"
  | "superseded";

export interface CustomerEstimateRow {
  id: string;
  tenant_id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: CustomerEstimateStatus;
  total_amount: number;
  currency: string;
  valid_until: string | null;
  created_by: string | null;
  sent_to_customer_at: string | null;
  approved_by_customer_at: string | null;
  rejected_by_customer_at: string | null;
  customer_note: string | null;
  linked_document_id: string | null;
  linked_decision_request_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerEstimatePublic {
  id: string;
  title: string;
  description: string | null;
  status: CustomerEstimateStatus;
  total_amount: number;
  currency: string;
  valid_until: string | null;
  sent_to_customer_at: string | null;
  approved_by_customer_at: string | null;
  rejected_by_customer_at: string | null;
  customer_note: string | null;
  linked_document_id: string | null;
  linked_decision_request_id: string | null;
}

export interface CreateCustomerEstimateInput {
  title: string;
  description?: string | null;
  total_amount: number;
  currency?: string;
  valid_until?: string | null;
  linked_document_id?: string | null;
}

/** Manager-only patch. Draft-only for field edits; `status: cancelled` only from `draft`. */
export interface PatchCustomerEstimateInput {
  title?: string;
  description?: string | null;
  total_amount?: number;
  currency?: string;
  valid_until?: string | null;
  linked_document_id?: string | null;
  status?: "cancelled";
}
