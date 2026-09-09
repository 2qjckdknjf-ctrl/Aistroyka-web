/**
 * Build AgentExecutionContext from tenant + project membership. Never from model output.
 * Tenant role and project role stay distinct; capability roles are derived, not union-escalated.
 */

import type { TenantContext } from "@/lib/tenant/tenant.types";
import type { AgentExecutionContext, AgentExecutionRole, AgentSource } from "./types";
import { getMembership } from "@/lib/domain/project-members/project-members.repository";
import type { SupabaseClient } from "@supabase/supabase-js";

export function mapClientProfileToSource(profile: string): AgentSource {
  switch (profile) {
    case "ios_manager":
    case "ios_full":
      return "IOS_MANAGER";
    case "ios_worker":
    case "ios_lite":
      return "IOS_WORKER";
    case "android_manager":
    case "android_full":
    case "android_worker":
    case "android_lite":
      return "ANDROID";
    case "web":
      return "WEB";
    default:
      return "API";
  }
}

/**
 * Capability roles for skill policy.
 * Tenant `member` is not manager. Project worker stays worker.
 * Tenant owner/admin get `admin` (explicit tenant-admin capability).
 * Project manager/owner get `manager`.
 */
export function deriveAgentCapabilityRoles(input: {
  tenantRole: TenantContext["role"];
  projectRole: string | null;
}): AgentExecutionRole[] {
  const roles: AgentExecutionRole[] = [];
  switch (input.tenantRole) {
    case "owner":
    case "admin":
      roles.push("admin");
      break;
    case "viewer":
      roles.push("viewer");
      break;
    case "stakeholder":
      roles.push("client");
      break;
    case "member":
      break;
    default: {
      const _exhaustive: never = input.tenantRole;
      return _exhaustive;
    }
  }

  switch (input.projectRole) {
    case "manager":
    case "owner":
      roles.push("manager");
      break;
    case "worker":
    case "contractor":
      roles.push("worker");
      break;
    default:
      break;
  }

  return [...new Set(roles)];
}

export async function buildAgentExecutionContext(input: {
  supabase: SupabaseClient;
  tenant: TenantContext;
  projectId: string;
  requestId: string;
  locale: string;
}): Promise<AgentExecutionContext> {
  const membership = await getMembership(
    input.supabase,
    input.tenant.tenantId,
    input.projectId,
    input.tenant.userId
  );
  const projectRole = membership?.role ?? null;
  const roles = deriveAgentCapabilityRoles({
    tenantRole: input.tenant.role,
    projectRole,
  });
  return {
    tenantId: input.tenant.tenantId,
    projectId: input.projectId,
    userId: input.tenant.userId,
    actorType: "user",
    tenantRole: input.tenant.role,
    projectRole,
    roles,
    permissions: input.tenant.permissionSet ? [...input.tenant.permissionSet] : [],
    requestId: input.requestId,
    traceId: input.tenant.traceId || input.requestId,
    locale: input.locale,
    source: mapClientProfileToSource(input.tenant.clientProfile),
    timestamp: new Date().toISOString(),
  };
}
