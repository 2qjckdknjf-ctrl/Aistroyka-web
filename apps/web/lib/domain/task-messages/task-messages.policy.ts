import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadTasks } from "@/lib/domain/tasks/task.policy";

/** Managers and assigned workers can read task chat (assignment checked in service). */
export function canAccessTaskChat(ctx: TenantContext): boolean {
  return canReadTasks(ctx);
}

/** DB roles map owner/admin to managers and member to field workers. */
export function isTaskChatManager(ctx: TenantContext): boolean {
  return ctx.role === "owner" || ctx.role === "admin";
}

/** Soft-delete: sender always; managers may moderate the task chat. */
export function canSoftDeleteTaskMessage(ctx: TenantContext, senderUserId: string): boolean {
  if (ctx.userId === senderUserId) return true;
  return isTaskChatManager(ctx);
}
