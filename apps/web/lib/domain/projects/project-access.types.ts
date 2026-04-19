/**
 * Project access and membership types.
 * MVP: minimal role model for project-scoped access.
 */

/** Project role: manager (operational), internal_member (worker/contractor), owner (customer/decision). */
export type ProjectRole = "manager" | "internal_member" | "owner";

/** Membership for a user in a project. Null when no membership. */
export interface ProjectMembership {
  projectId: string;
  tenantId: string;
  userId: string;
  role: ProjectRole;
  source: "project_members" | "tenant_owner";
}
