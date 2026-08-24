import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadTasks } from "@/lib/domain/tasks/task.policy";

/** Managers and assigned workers can read task chat (assignment checked in service). */
export function canAccessTaskChat(ctx: TenantContext): boolean {
  return canReadTasks(ctx);
}

/** Soft-delete: sender always; scoped managers after service-level access resolution. */
export function canSoftDeleteTaskMessage(
  ctx: TenantContext,
  senderUserId: string,
  hasManagerAccess: boolean
): boolean {
  if (ctx.userId === senderUserId) return true;
  return hasManagerAccess;
}
