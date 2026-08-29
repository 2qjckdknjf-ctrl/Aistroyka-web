/**
 * Build AgentExecutionContext from tenant + project membership. Never from model output.
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

export function tenantRoleToAgentRole(role: TenantContext["role"]): AgentExecutionRole {
  switch (role) {
    case "owner":
    case "admin":
      return "admin";
    case "member":
      return "manager";
    case "viewer":
      return "viewer";
    case "stakeholder":
      return "client";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
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
  const roles: AgentExecutionRole[] = [tenantRoleToAgentRole(input.tenant.role)];
  if (membership?.role === "worker") roles.push("worker");
  if (membership?.role === "manager" || membership?.role === "owner") roles.push("manager");
  if (membership?.role === "contractor") roles.push("worker");

  const unique = [...new Set(roles)];
  return {
    tenantId: input.tenant.tenantId,
    projectId: input.projectId,
    userId: input.tenant.userId,
    actorType: "user",
    roles: unique,
    permissions: input.tenant.permissionSet ? [...input.tenant.permissionSet] : [],
    requestId: input.requestId,
    traceId: input.tenant.traceId || input.requestId,
    locale: input.locale,
    source: mapClientProfileToSource(input.tenant.clientProfile),
    timestamp: new Date().toISOString(),
  };
}
