/**
 * Account layer types (Stage 2.1). Additive; tenant context unchanged.
 */

export type AccountType = "platform" | "contractor" | "client";

export type AccountStatus = "active" | "suspended" | "closed";

export type AccountMemberRole = "owner" | "admin" | "member" | "viewer";

export type AccountMemberStatus = "active" | "invited" | "removed";

export interface Account {
  id: string;
  account_type: AccountType;
  display_name: string;
  slug: string | null;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface AccountMember {
  id: string;
  account_id: string;
  user_id: string;
  role: AccountMemberRole;
  status: AccountMemberStatus;
  created_at: string;
  updated_at: string;
}

export interface UserAccountSummary {
  account: Account;
  membership: AccountMember;
}
