/**
 * Phase 2B.4 — canonical platform API inventory (baseline batch 2B_platform_negative_tests).
 * Must stay aligned with AISTROYKA_PHASE2A_API_ROUTE_MATRIX.csv recommended_fix_batch rows
 * and AISTROYKA_PHASE2B4_PLATFORM_ROUTE_SECURITY_MATRIX.csv (29 method rows).
 */

export type PlatformGuardMode = "read" | "write" | "critical";

export type PlatformMethodInventoryRow = {
  routePath: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  guardMode: PlatformGuardMode;
  /** Relative to apps/web */
  routeFile: string;
};

export const PHASE2B4_PLATFORM_METHODS: readonly PlatformMethodInventoryRow[] = [
  {
    routePath: "/api/v1/platform/audit",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/audit/route.ts",
  },
  {
    routePath: "/api/v1/platform/billing/pilot-status",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/billing/pilot-status/route.ts",
  },
  {
    routePath: "/api/v1/platform/billing/pilot-workspaces",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/billing/pilot-workspaces/route.ts",
  },
  {
    routePath: "/api/v1/platform/billing/pilot-workspaces",
    method: "POST",
    guardMode: "write",
    routeFile: "app/api/v1/platform/billing/pilot-workspaces/route.ts",
  },
  {
    routePath: "/api/v1/platform/billing/pilot-workspaces/:workspaceId",
    method: "DELETE",
    guardMode: "write",
    routeFile: "app/api/v1/platform/billing/pilot-workspaces/[workspaceId]/route.ts",
  },
  {
    routePath: "/api/v1/platform/billing/process-pending-events",
    method: "POST",
    guardMode: "write",
    routeFile: "app/api/v1/platform/billing/process-pending-events/route.ts",
  },
  {
    routePath: "/api/v1/platform/billing/provider-status",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/billing/provider-status/route.ts",
  },
  {
    routePath: "/api/v1/platform/billing/reprocess-event",
    method: "POST",
    guardMode: "write",
    routeFile: "app/api/v1/platform/billing/reprocess-event/route.ts",
  },
  {
    routePath: "/api/v1/platform/billing/reprocess-workspace-events",
    method: "POST",
    guardMode: "write",
    routeFile: "app/api/v1/platform/billing/reprocess-workspace-events/route.ts",
  },
  {
    routePath: "/api/v1/platform/billing/workspace-status",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/billing/workspace-status/route.ts",
  },
  {
    routePath: "/api/v1/platform/critical/echo",
    method: "POST",
    guardMode: "critical",
    routeFile: "app/api/v1/platform/critical/echo/route.ts",
  },
  {
    routePath: "/api/v1/platform/diagnostics",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/diagnostics/route.ts",
  },
  {
    routePath: "/api/v1/platform/health",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/health/route.ts",
  },
  {
    routePath: "/api/v1/platform/leads",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/leads/route.ts",
  },
  {
    routePath: "/api/v1/platform/leads/:id",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/leads/[id]/route.ts",
  },
  {
    routePath: "/api/v1/platform/leads/:id",
    method: "PATCH",
    guardMode: "write",
    routeFile: "app/api/v1/platform/leads/[id]/route.ts",
  },
  {
    routePath: "/api/v1/platform/leads/bulk",
    method: "PATCH",
    guardMode: "write",
    routeFile: "app/api/v1/platform/leads/bulk/route.ts",
  },
  {
    routePath: "/api/v1/platform/overview",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/overview/route.ts",
  },
  {
    routePath: "/api/v1/platform/support/tickets",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/support/tickets/route.ts",
  },
  {
    routePath: "/api/v1/platform/support/tickets",
    method: "PATCH",
    guardMode: "write",
    routeFile: "app/api/v1/platform/support/tickets/route.ts",
  },
  {
    routePath: "/api/v1/platform/support/tickets/:ticketId/messages",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/support/tickets/[ticketId]/messages/route.ts",
  },
  {
    routePath: "/api/v1/platform/support/tickets/:ticketId/messages",
    method: "POST",
    guardMode: "write",
    routeFile: "app/api/v1/platform/support/tickets/[ticketId]/messages/route.ts",
  },
  {
    routePath: "/api/v1/platform/tenants",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/tenants/route.ts",
  },
  {
    routePath: "/api/v1/platform/tenants/:tenantId",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/tenants/[tenantId]/route.ts",
  },
  {
    routePath: "/api/v1/platform/testing/quality",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/testing/quality/route.ts",
  },
  {
    routePath: "/api/v1/platform/testing/safe-audit/refresh",
    method: "POST",
    guardMode: "read",
    routeFile: "app/api/v1/platform/testing/safe-audit/refresh/route.ts",
  },
  {
    routePath: "/api/v1/platform/testing/safe-audit/runs",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/testing/safe-audit/runs/route.ts",
  },
  {
    routePath: "/api/v1/platform/testing/safe-audit/save",
    method: "POST",
    guardMode: "write",
    routeFile: "app/api/v1/platform/testing/safe-audit/save/route.ts",
  },
  {
    routePath: "/api/v1/platform/users",
    method: "GET",
    guardMode: "read",
    routeFile: "app/api/v1/platform/users/route.ts",
  },
] as const;

export const PHASE2B4_EXPECTED = {
  routeFiles: 25,
  methods: 29,
  read: 18,
  write: 10,
  critical: 1,
  get: 17,
  post: 8,
  patch: 3,
  delete: 1,
  negativeIdentitiesPerMethod: 6,
  negativeIdentityProofs: 174,
} as const;

/** Concrete middleware pathname for parameterized routes. */
export function concretePlatformPath(routePath: string): string {
  return routePath
    .replace(":workspaceId", "ws-1")
    .replace(":id", "lead-1")
    .replace(":ticketId", "ticket-1")
    .replace(":tenantId", "tenant-1");
}
