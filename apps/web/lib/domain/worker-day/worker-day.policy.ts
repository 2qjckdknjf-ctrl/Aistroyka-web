import type { TenantContext } from "@/lib/tenant/tenant.types";

const ROLE_ORDER: Record<string, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };

/** Worker Lite: at least member to start/end day and create reports. */
export function canManageWorkerDay(ctx: TenantContext): boolean {
  return (ROLE_ORDER[ctx.role] ?? 0) >= ROLE_ORDER.member;
}
