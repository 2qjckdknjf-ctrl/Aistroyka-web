/** Wave 4 Step 21 — commercial / billing control (finite model, not accounting). */

export type CommercialItemKind =
  | "invoice"
  | "expected_revenue"
  | "deposit"
  | "credit_note"
  | "other";

export type CommercialItemStatus =
  | "draft"
  | "issued"
  | "due"
  | "overdue"
  | "paid"
  | "cancelled";

export type CommercialItemEventKind = "created" | "status_change" | "payment_recorded" | "updated";

export interface CommercialItemRow {
  id: string;
  tenant_id: string;
  project_id: string;
  kind: CommercialItemKind;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  due_date: string | null;
  status: CommercialItemStatus;
  paid_at: string | null;
  linked_change_order_id: string | null;
  linked_document_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCommercialItemInput {
  kind: CommercialItemKind;
  title: string;
  description?: string | null;
  amount: number;
  currency?: string;
  due_date?: string | null;
  linked_change_order_id?: string | null;
  linked_document_id?: string | null;
}

export interface UpdateCommercialItemInput {
  kind?: CommercialItemKind;
  title?: string;
  description?: string | null;
  amount?: number;
  currency?: string;
  due_date?: string | null;
  status?: CommercialItemStatus;
  paid_at?: string | null;
  linked_change_order_id?: string | null;
  linked_document_id?: string | null;
}

export interface CommercialAggregates {
  itemCount: number;
  overdueCount: number;
  outstandingAmount: number;
  currency: string;
}
