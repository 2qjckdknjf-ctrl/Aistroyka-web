/** Aligned with DB / project-members.repository (includes project owner). */
export type ProjectMemberRole = "worker" | "contractor" | "manager" | "owner";
export type ProjectMemberStatus = "active" | "inactive" | "removed";

export interface ProjectMember {
  tenant_id: string;
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
  status: ProjectMemberStatus;
  created_at: string;
}
