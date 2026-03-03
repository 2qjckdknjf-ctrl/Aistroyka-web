/**
 * AI Signature SDK: canonical AI state and events from backend.
 * - getCurrentAIState(projectId?) — fetch current state from ai_state_cache
 * - subscribeAIState(projectId?, callback) — realtime updates for ai_state_cache
 * - subscribeAIEvents(projectId?, callback) — realtime inserts/updates for ai_events
 */

import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type AIState = "idle" | "analyzing" | "risk_detected" | "optimization_found" | "milestone_achieved";

export interface AIStateRow {
  project_id: string | null;
  current_state: AIState;
  last_event_id: string | null;
  updated_at: string;
}

export interface AIEventRow {
  id: string;
  project_id: string | null;
  type: "analyzing" | "risk_detected" | "optimization_found" | "milestone_achieved";
  severity: number | null;
  title: string;
  summary: string;
  drivers: Record<string, unknown>;
  sources: Record<string, unknown>;
  created_at: string;
  expires_at: string | null;
  origin: string;
  status: string;
}

/** Risk Scoring Engine v1: row from ai_risk_scores. */
export interface RiskScoreRow {
  project_id: string | null;
  schedule_risk: number;
  cost_risk: number;
  event_risk: number;
  quality_risk: number;
  total_score: number;
  calculated_at: string;
}

/** Risk history: row from ai_risk_score_history (for sparklines). */
export interface RiskScoreHistoryRow {
  project_id: string | null;
  schedule_risk: number;
  cost_risk: number;
  event_risk: number;
  quality_risk: number;
  total_score: number;
  calculated_at: string;
}

/** Risk trend: 24h/7d deltas from get_risk_trend RPC. */
export interface RiskTrendRow {
  score_now: number | null;
  score_24h: number | null;
  score_7d: number | null;
  delta_24h: number | null;
  delta_7d: number | null;
  velocity_24h: number | null;
  velocity_7d: number | null;
}

/**
 * Fetch current AI state for a project or global (projectId = null/undefined).
 */
export async function getCurrentAIState(projectId?: string | null): Promise<AIStateRow | null> {
  const supabase = createClient();
  const q = supabase.from("ai_state_cache").select("project_id, current_state, last_event_id, updated_at");
  if (projectId != null) {
    q.eq("project_id", projectId);
  } else {
    q.is("project_id", null);
  }
  const { data, error } = await q.maybeSingle();
  if (error) {
    if (process.env.NODE_ENV === "development") console.warn("[aiSignature] getCurrentAIState error", error);
    return null;
  }
  return data as AIStateRow | null;
}

/**
 * Subscribe to ai_state_cache changes for a project or global.
 * Returns an unsubscribe function.
 */
export function subscribeAIState(
  projectId: string | null | undefined,
  callback: (row: AIStateRow | null) => void
): () => void {
  const supabase = createClient();
  let channel: RealtimeChannel;

  const filter =
    projectId != null ? `project_id=eq.${projectId}` : "project_id=is.null";

  channel = supabase
    .channel(`ai_state_cache:${projectId ?? "global"}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ai_state_cache", filter },
      () => {
        getCurrentAIState(projectId ?? undefined).then((row) => callback(row));
      }
    )
    .subscribe();

  // Initial fetch
  getCurrentAIState(projectId ?? undefined).then((row) => callback(row));

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Fetch project IDs that have at least one active risk_detected event.
 * Used to show AISignalLine on project table rows.
 */
export async function getProjectIdsWithActiveRisk(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_events")
    .select("project_id")
    .eq("type", "risk_detected")
    .eq("status", "active")
    .not("project_id", "is", null);
  if (error) {
    if (process.env.NODE_ENV === "development") console.warn("[aiSignature] getProjectIdsWithActiveRisk error", error);
    return [];
  }
  const ids = new Set((data ?? []).map((r: { project_id: string }) => r.project_id));
  return Array.from(ids);
}

/**
 * Subscribe to ai_events (INSERT/UPDATE) for a project or all events (projectId = null).
 * Returns an unsubscribe function.
 */
export function subscribeAIEvents(
  projectId: string | null | undefined,
  callback: (event: AIEventRow) => void
): () => void {
  const supabase = createClient();
  const filter =
    projectId != null ? `project_id=eq.${projectId}` : undefined;

  const channel = supabase
    .channel(`ai_events:${projectId ?? "all"}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "ai_events", ...(filter ? { filter } : {}) },
      (payload) => {
        const row = payload.new as AIEventRow;
        if (row) callback(row);
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "ai_events", ...(filter ? { filter } : {}) },
      (payload) => {
        const row = payload.new as AIEventRow;
        if (row) callback(row);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Fetch current risk score for a project or portfolio (projectId = null/undefined).
 */
export async function getProjectRisk(projectId?: string | null): Promise<RiskScoreRow | null> {
  const supabase = createClient();
  const q = supabase
    .from("ai_risk_scores")
    .select("project_id, schedule_risk, cost_risk, event_risk, quality_risk, total_score, calculated_at");
  if (projectId != null) {
    q.eq("project_id", projectId);
  } else {
    q.is("project_id", null);
  }
  const { data, error } = await q.maybeSingle();
  if (error) {
    if (process.env.NODE_ENV === "development") console.warn("[aiSignature] getProjectRisk error", error);
    return null;
  }
  return data as RiskScoreRow | null;
}

/**
 * Subscribe to ai_risk_scores changes for a project or portfolio.
 * Returns an unsubscribe function.
 */
export function subscribeProjectRisk(
  projectId: string | null | undefined,
  callback: (row: RiskScoreRow | null) => void
): () => void {
  const supabase = createClient();
  const filter =
    projectId != null ? `project_id=eq.${projectId}` : "project_id=is.null";

  const channel = supabase
    .channel(`ai_risk_scores:${projectId ?? "portfolio"}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ai_risk_scores", filter },
      () => {
        getProjectRisk(projectId ?? undefined).then((row) => callback(row));
      }
    )
    .subscribe();

  getProjectRisk(projectId ?? undefined).then((row) => callback(row));

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Fetch risk score history for a project or portfolio (projectId = null/undefined).
 * Use for sparklines; order ascending by calculated_at. Optional from/to as ISO strings; limit default 30.
 */
export async function getProjectRiskHistory(
  projectId?: string | null,
  options?: { from?: string; to?: string; limit?: number }
): Promise<RiskScoreHistoryRow[]> {
  const supabase = createClient();
  const limit = Math.min(options?.limit ?? 30, 200);
  let q = supabase
    .from("ai_risk_score_history")
    .select("project_id, schedule_risk, cost_risk, event_risk, quality_risk, total_score, calculated_at")
    .order("calculated_at", { ascending: true })
    .limit(limit);
  if (projectId != null) {
    q = q.eq("project_id", projectId);
  } else {
    q = q.is("project_id", null);
  }
  if (options?.from) q = q.gte("calculated_at", options.from);
  if (options?.to) q = q.lte("calculated_at", options.to);
  const { data, error } = await q;
  if (error) {
    if (process.env.NODE_ENV === "development") console.warn("[aiSignature] getProjectRiskHistory error", error);
    return [];
  }
  return (data ?? []) as RiskScoreHistoryRow[];
}

/**
 * Fetch risk trend (score_now, delta_24h, delta_7d, velocity_24h, velocity_7d) via get_risk_trend RPC.
 */
export async function getProjectRiskTrend(projectId?: string | null): Promise<RiskTrendRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_risk_trend", {
    p_project_id: projectId ?? null,
  });
  if (error) {
    if (process.env.NODE_ENV === "development") console.warn("[aiSignature] getProjectRiskTrend error", error);
    return null;
  }
  return data as RiskTrendRow | null;
}

/**
 * Subscribe to risk history by polling. Returns unsubscribe function.
 * Use for dashboards that refresh sparkline periodically.
 */
export function subscribeProjectRiskHistory(
  projectId: string | null | undefined,
  callback: (rows: RiskScoreHistoryRow[]) => void,
  options?: { limit?: number; intervalMs?: number }
): () => void {
  const intervalMs = options?.intervalMs ?? 60_000;
  const limit = options?.limit ?? 30;
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    getProjectRiskHistory(projectId, { from, to, limit }).then((rows) => {
      if (!cancelled) callback(rows);
    });
  };
  run();
  const id = setInterval(run, intervalMs);
  return () => {
    cancelled = true;
    clearInterval(id);
  };
}
