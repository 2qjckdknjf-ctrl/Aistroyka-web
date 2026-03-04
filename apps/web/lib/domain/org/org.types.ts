export type OrgRole = "org_owner" | "org_admin" | "org_viewer";

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface OrganizationTenant {
  organization_id: string;
  tenant_id: string;
}

export interface OrganizationMember {
  organization_id: string;
  user_id: string;
  org_role: OrgRole;
}
