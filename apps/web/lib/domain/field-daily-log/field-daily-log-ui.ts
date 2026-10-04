import type { TenantContext, TenantRoleDb } from "@/lib/tenant/tenant.types";
import { canManageProjects, isPortalOnlyStakeholderRole } from "@/lib/tenant/tenant.policy";

function ctxForRole(role: TenantRoleDb): TenantContext {
  return {
    tenantId: "tenant",
    userId: "user",
    role,
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "ui",
  };
}

/** Same gate as field-daily-log.service requireWriter. Viewers/stakeholders cannot mutate. */
export function canWriteFieldDailyLogs(role: TenantRoleDb | null | undefined): boolean {
  if (!role) return false;
  const ctx = ctxForRole(role);
  if (isPortalOnlyStakeholderRole(ctx)) return false;
  return canManageProjects(ctx);
}
