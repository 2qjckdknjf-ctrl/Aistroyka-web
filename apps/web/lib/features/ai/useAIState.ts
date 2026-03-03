"use client";

import { useEffect, useState, useMemo } from "react";
import {
  getCurrentAIState,
  getProjectIdsWithActiveRisk,
  getProjectRisk,
  subscribeAIState,
  subscribeAIEvents,
  subscribeProjectRisk,
  type AIState,
  type AIStateRow,
  type AIEventRow,
  type RiskScoreRow,
} from "@/lib/services/aiSignature";

export interface UseAIStateResult {
  state: AIState;
  lastEventId: string | null;
  updatedAt: string | null;
  lastEvent: AIEventRow | null;
  isLoading: boolean;
}

/**
 * Subscribe to canonical AI state and optional events for a project or global.
 * Drives AISignalLine and StructuralGridActivation from backend.
 */
export function useAIState(projectId?: string | null): UseAIStateResult {
  const [row, setRow] = useState<AIStateRow | null>(null);
  const [lastEvent, setLastEvent] = useState<AIEventRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const scopeKey = projectId ?? "global";
  useEffect(() => {
    setIsLoading(true);
    const unsubState = subscribeAIState(projectId ?? undefined, (r) => {
      setRow(r);
      setIsLoading(false);
    });
    const unsubEvents = subscribeAIEvents(projectId ?? undefined, (ev) => {
      setLastEvent(ev);
    });
    return () => {
      unsubState();
      unsubEvents();
    };
  }, [scopeKey, projectId]);

  return {
    state: row?.current_state ?? "idle",
    lastEventId: row?.last_event_id ?? null,
    updatedAt: row?.updated_at ?? null,
    lastEvent,
    isLoading,
  };
}

/**
 * Project IDs that have at least one active risk_detected event.
 * Refetches on mount and when events change (subscribe to all events).
 */
export function useProjectIdsWithActiveRisk(): string[] {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    getProjectIdsWithActiveRisk().then(setIds);
    const unsub = subscribeAIEvents(null, () => {
      getProjectIdsWithActiveRisk().then(setIds);
    });
    return unsub;
  }, []);

  return ids;
}

export type RiskTrend = "up" | "down" | "neutral";

export interface UseProjectRiskResult {
  risk: RiskScoreRow | null;
  previousScore: number | null;
  trend: RiskTrend;
  isLoading: boolean;
}

/**
 * Subscribe to risk score for a project or portfolio (projectId = null/undefined).
 * Trend compares current total_score to previous value.
 */
export function useProjectRisk(projectId?: string | null): UseProjectRiskResult {
  const [risk, setRisk] = useState<RiskScoreRow | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const scopeKey = projectId ?? "portfolio";
  useEffect(() => {
    setIsLoading(true);
    const unsub = subscribeProjectRisk(projectId ?? undefined, (row) => {
      setRisk((prevRow) => {
        setPreviousScore(prevRow?.total_score ?? null);
        return row;
      });
      setIsLoading(false);
    });
    return unsub;
  }, [scopeKey, projectId]);

  const trend: RiskTrend = useMemo(() => {
    if (risk?.total_score == null || previousScore == null) return "neutral";
    if (risk.total_score > previousScore) return "up";
    if (risk.total_score < previousScore) return "down";
    return "neutral";
  }, [risk?.total_score, previousScore]);

  return { risk, previousScore, trend, isLoading };
}

/**
 * Fetch risk scores for multiple projects in parallel (one-time; no subscription).
 * Use for projects table Risk column.
 */
export function useProjectRisks(projectIds: string[]): Record<string, RiskScoreRow | null> {
  const [riskMap, setRiskMap] = useState<Record<string, RiskScoreRow | null>>({});

  useEffect(() => {
    if (projectIds.length === 0) {
      setRiskMap({});
      return;
    }
    let cancelled = false;
    Promise.all(projectIds.map((id) => getProjectRisk(id)))
      .then((rows) => {
        if (cancelled) return;
        const next: Record<string, RiskScoreRow | null> = {};
        projectIds.forEach((id, i) => {
          next[id] = rows[i] ?? null;
        });
        setRiskMap(next);
      })
      .catch(() => {
        if (!cancelled) setRiskMap({});
      });
    return () => {
      cancelled = true;
    };
  }, [projectIds.join(",")]);

  return riskMap;
}
