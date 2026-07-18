import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageTasks, canReadTasks } from "@/lib/domain/tasks/task.policy";
import { isLiteWorkerClient } from "@/lib/tenant/client-profile";

/** Managers and assigned workers can read task chat (assignment checked in service). */
export function canAccessTaskChat(ctx: TenantContext): boolean {
  return canReadTasks(ctx);
}

/** Soft-delete: sender always; non-lite managers via canManageTasks. */
export function canSoftDeleteTaskMessage(ctx: TenantContext, senderUserId: string): boolean {
  if (ctx.userId === senderUserId) return true;
  return !isLiteWorkerClient(ctx) && canManageTasks(ctx);
}
