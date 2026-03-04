/**
 * Tenant domain policy. Re-exports lib/tenant authorization.
 */

export {
  authorize,
  canManageProjects,
  canReadProjects,
  type ResourceAction,
} from "@/lib/tenant/tenant.policy";
