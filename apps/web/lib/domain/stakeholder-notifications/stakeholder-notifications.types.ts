export type StakeholderNotificationKind =
  | "stakeholder_invite_sent"
  | "stakeholder_invite_reminder"
  | "client_request_new"
  | "client_request_reminder";

export type StakeholderNotificationStatus =
  | "pending"
  | "delivered_in_app"
  | "email_sent"
  | "email_failed"
  | "email_skipped"
  | "read";

export type StakeholderNotificationChannel = "in_app" | "email" | "both";

export interface StakeholderNotificationRow {
  id: string;
  tenant_id: string;
  project_id: string;
  recipient_user_id: string | null;
  recipient_email: string;
  kind: StakeholderNotificationKind;
  status: StakeholderNotificationStatus;
  channel: StakeholderNotificationChannel;
  payload: Record<string, unknown>;
  stakeholder_invite_id: string | null;
  client_request_id: string | null;
  email_attempted_at: string | null;
  email_delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StakeholderNotificationPublic {
  id: string;
  kind: StakeholderNotificationKind;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
  client_request_id: string | null;
  stakeholder_invite_id: string | null;
  email_delivered_at: string | null;
}

export interface StakeholderDeliverySummary {
  id: string;
  kind: StakeholderNotificationKind;
  recipient_email: string;
  recipient_user_id: string | null;
  status: StakeholderNotificationStatus;
  email_delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  client_request_id: string | null;
  stakeholder_invite_id: string | null;
  payload: Record<string, unknown>;
}
