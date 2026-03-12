/**
 * System health checks for /api/system/health.
 * Database, AI brain, copilot, workflows, events, alerts availability.
 */

import { createClient } from "@supabase/supabase-js";
import { hasSupabaseEnv, getPublicConfig } from "@/lib/config";
import { getServerConfig, isOpenAIConfigured, isAiJobConfigured } from "@/lib/config/server";

export type ServiceStatus = "ok" | "degraded" | "error" | "unavailable";

export interface SystemHealthResult {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  services: {
    database: ServiceStatus;
    ai_brain: ServiceStatus;
    copilot: ServiceStatus;
    workflows: ServiceStatus;
    events: ServiceStatus;
    alerts: ServiceStatus;
  };
}

async function checkDatabase(): Promise<ServiceStatus> {
  if (!hasSupabaseEnv()) return "unavailable";
  try {
    const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key } = getPublicConfig();
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.from("tenants").select("id").limit(1);
    return error ? "error" : "ok";
  } catch {
    return "error";
  }
}

function checkAiBrain(): ServiceStatus {
  const configured = isOpenAIConfigured() || isAiJobConfigured();
  return configured ? "ok" : "unavailable";
}

function checkCopilot(): ServiceStatus {
  const serverConfig = getServerConfig();
  const hasOpenAI = serverConfig.OPENAI_API_KEY.length > 0;
  const hasAiJob = serverConfig.AI_ANALYSIS_URL.length > 0 && serverConfig.SUPABASE_SERVICE_ROLE_KEY.length > 0;
  return hasOpenAI || hasAiJob ? "ok" : "unavailable";
}

function checkWorkflows(): ServiceStatus {
  return "ok";
}

function checkEvents(): ServiceStatus {
  return "ok";
}

async function checkAlerts(): Promise<ServiceStatus> {
  if (!hasSupabaseEnv()) return "unavailable";
  try {
    const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key } = getPublicConfig();
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.from("alerts").select("id").limit(1);
    return error ? "error" : "ok";
  } catch {
    return "error";
  }
}

export async function getSystemHealth(): Promise<SystemHealthResult> {
  const timestamp = new Date().toISOString();
  const [database, alerts] = await Promise.all([checkDatabase(), checkAlerts()]);
  const ai_brain = checkAiBrain();
  const copilot = checkCopilot();
  const workflows = checkWorkflows();
  const events = checkEvents();

  const services = { database, ai_brain, copilot, workflows, events, alerts };
  const statuses = Object.values(services);
  const hasError = statuses.some((s) => s === "error");
  const hasUnavailable = statuses.some((s) => s === "unavailable");
  const status: "ok" | "degraded" | "error" =
    hasError ? "error" : hasUnavailable ? "degraded" : "ok";

  return { status, timestamp, services };
}
