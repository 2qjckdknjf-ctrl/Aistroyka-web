import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageProjects } from "@/lib/tenant/tenant.policy";

const ROLE_ORDER: Record<string, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };

export function canReadTasks(ctx: TenantContext): boolean {
  return (ROLE_ORDER[ctx.role] ?? 0) >= ROLE_ORDER.viewer;
}

/** Manager/admin: create, update, assign tasks. */
export function canManageTasks(ctx: TenantContext): boolean {
  return canManageProjects(ctx);
}
