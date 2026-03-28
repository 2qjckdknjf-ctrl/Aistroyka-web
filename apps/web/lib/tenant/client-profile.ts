import type { TenantContext } from "@/lib/tenant/tenant.types";

/** Field worker apps (not ios_manager / full clients). Used to enforce peer isolation on worker surfaces. */
export function isLiteWorkerClient(ctx: TenantContext): boolean {
  return ctx.clientProfile === "ios_lite" || ctx.clientProfile === "android_lite";
}
