/**
 * Admin AI Observability: read-only calls to Edge aistroyka-admin-ai.
 * All actions require user JWT; Edge enforces owner/admin via tenant_members.
 */

import { getPublicEnv } from "@/lib/env";

const getAdminAiUrl = () => {
  const base = (getPublicEnv().NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  return base ? `${base}/functions/v1/aistroyka-admin-ai` : "";
};

async function adminFetch<T>(
  body: Record<string, unknown>,
  getAuthToken: () => Promise<string | null>
): Promise<{ data: T }> {
  const url = getAdminAiUrl();
  if (!url) throw new Error("Admin AI endpoint not configured");
  const token = await getAuthToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { data?: T; error?: string; message?: string };
  if (!res.ok) {
    const err = new Error((data.message as string) ?? data.error ?? res.statusText) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return { data: data.data as T };
}

export type UsageSummary = {
  requests: number;
  errors: number;
  error_rate: number;
  p95_ms: number | null;
  retrieval_low_confidence_rate: number | null;
  budget_exceeded_count: number;
  memory_used_rate?: number;
  memory_summary_used_rate?: number;
  summaries_freshness_stale_count?: number;
};

export type SecurityEventRow = {
  id: string;
  created_at: string;
  severity: string;
  event_type: string;
  request_id: string | null;
  details: Record<string, unknown>;
  tenant_id?: string;
  project_id?: string;
};

export type BreakerRow = {
  key: string;
  state: string;
  opened_at: string | null;
  last_event_at: string;
  updated_at: string;
};

export type SloDailyRow = {
  day: string;
  tenant_id: string | null;
  mode: string;
  requests: number;
  errors: number;
  p50_ms: number | null;
  p95_ms: number | null;
  p99_ms: number | null;
  avg_tokens: number | null;
  cost_events: number;
  breaker_open_events: number;
  retrieval_low_confidence_rate: number | null;
};

export type RecentIssueRow = {
  timestamp: string;
  event_type: string;
  tenant_id?: string;
  request_id?: string;
};

export type RequestByIdResult = {
  llm: {
    id: string;
    created_at: string;
    mode: string;
    total_ms: number | null;
    latency_ms: number | null;
    tokens_used: number;
    fallback_used: boolean;
    fallback_reason: string | null;
    error_category: string | null;
    groundedness_passed: boolean | null;
    retrieval_used: boolean;
    retrieval_count: number | null;
    retrieval_avg_similarity: number | null;
    injection_detected: boolean;
    security_blocked: boolean;
    tenant_id: string | null;
    project_id: string | null;
  } | null;
  retrieval_logs: Array<{
    id: string;
    created_at: string;
    project_id: string;
    retrieved_count: number;
    avg_similarity: number | null;
    max_similarity: number | null;
    low_confidence: boolean;
  }>;
  chat_messages: Array<{
    id: string;
    thread_id: string;
    role: string;
    content: string;
    request_id: string | null;
    low_confidence: boolean;
    error_kind: string | null;
    created_at: string;
  }>;
};

export async function getAiUsageSummary(
  tenantId: string,
  range: { from: string; to: string },
  getAuthToken: () => Promise<string | null>
): Promise<UsageSummary> {
  const { data } = await adminFetch<UsageSummary>(
    { action: "get_ai_usage_summary", tenant_id: tenantId, range },
    getAuthToken
  );
  return data;
}

export async function listAiSecurityEvents(
  tenantId: string,
  options: {
    range?: { from: string; to: string };
    limit?: number;
    severity?: string;
    event_type?: string;
  },
  getAuthToken: () => Promise<string | null>
): Promise<SecurityEventRow[]> {
  const { data } = await adminFetch<SecurityEventRow[]>(
    {
      action: "list_ai_security_events",
      tenant_id: tenantId,
      range: options.range,
      limit: options.limit ?? 50,
      severity: options.severity,
      event_type: options.event_type,
    },
    getAuthToken
  );
  return data ?? [];
}

export async function getAiBreakerState(
  getAuthToken: () => Promise<string | null>
): Promise<BreakerRow[]> {
  const { data } = await adminFetch<BreakerRow[]>(
    { action: "get_ai_breaker_state" },
    getAuthToken
  );
  return data ?? [];
}

export async function getAiSloDaily(
  tenantId: string,
  lastNDays: number,
  getAuthToken: () => Promise<string | null>
): Promise<SloDailyRow[]> {
  const { data } = await adminFetch<SloDailyRow[]>(
    { action: "get_ai_slo_daily", tenant_id: tenantId, last_n_days: lastNDays },
    getAuthToken
  );
  return data ?? [];
}

export async function listRecentIssues(
  options: { tenant_id?: string; limit?: number },
  getAuthToken: () => Promise<string | null>
): Promise<RecentIssueRow[]> {
  const { data } = await adminFetch<RecentIssueRow[]>(
    { action: "list_recent_issues", tenant_id: options.tenant_id, limit: options.limit ?? 20 },
    getAuthToken
  );
  return data ?? [];
}

export async function getRequestById(
  requestId: string,
  tenantId?: string,
  getAuthToken?: () => Promise<string | null>
): Promise<RequestByIdResult> {
  if (!getAuthToken) throw new Error("getAuthToken required");
  const { data } = await adminFetch<RequestByIdResult>(
    { action: "get_request_by_id", request_id: requestId, tenant_id: tenantId },
    getAuthToken
  );
  return data;
}
