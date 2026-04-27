export type StakeholderRole = "client_viewer" | "client_decision_maker";

export type StakeholderStatus = "invited" | "active" | "revoked";

export interface ProjectStakeholderRow {
  id: string;
  tenant_id: string;
  project_id: string;
  email: string;
  stakeholder_role: StakeholderRole;
  token: string;
  status: StakeholderStatus;
  user_id: string | null;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Manager list (no raw token). */
export interface ProjectStakeholderListItem {
  id: string;
  email: string;
  stakeholder_role: StakeholderRole;
  status: StakeholderStatus;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface InviteStakeholderInput {
  email: string;
  stakeholder_role: StakeholderRole;
}
