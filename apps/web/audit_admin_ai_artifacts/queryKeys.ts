/**
 * Standard query keys for React Query.
 * Components should use hooks (useProjects, useProject) rather than keys directly.
 */

export const queryKeys = {
  projects: ["projects"] as const,
  project: (projectId: string) => ["project", projectId] as const,
  /** AI executive summary for a project (P2 may add real endpoint). */
  aiSummary: (projectId: string) => ["ai", "summary", projectId] as const,
  /** AI explain risk (P2 may add real endpoint). */
  aiExplain: (projectId: string) => ["ai", "explain", projectId] as const,
  /** AI history (stub for P2). */
  aiHistory: (projectId: string) => ["ai", "history", projectId] as const,
  /** P2: Copilot chat thread (client storage or server thread id). */
  thread: (projectId: string) => ["ai", "thread", projectId] as const,
  /** P2.1: Server threads list for project. */
  threads: (projectId: string) => ["ai", "threads", projectId] as const,
  /** P2.1: Server thread detail (messages). */
  threadDetail: (projectId: string, threadId: string) => ["ai", "threadDetail", projectId, threadId] as const,
} as const;

/** Alias for chat/conversation layer. */
export const aiKeys = {
  thread: (projectId: string) => queryKeys.thread(projectId),
  threads: (projectId: string) => queryKeys.threads(projectId),
  threadDetail: (projectId: string, threadId: string) => queryKeys.threadDetail(projectId, threadId),
} as const;

/** Admin AI observability: read-only KPIs, security events, breaker, SLO, request lookup. */
export const adminAiKeys = {
  usage: (tenantId: string, range: { from: string; to: string }) =>
    ["admin", "ai", "usage", tenantId, range.from, range.to] as const,
  security: (
    tenantId: string,
    range: { from: string; to: string },
    filters?: { severity?: string; event_type?: string }
  ) => ["admin", "ai", "security", tenantId, range.from, range.to, filters ?? {}] as const,
  breaker: () => ["admin", "ai", "breaker"] as const,
  slo: (tenantId: string, lastNDays: number) => ["admin", "ai", "slo", tenantId, lastNDays] as const,
  recentIssues: (tenantId?: string) => ["admin", "ai", "recentIssues", tenantId ?? ""] as const,
  requestById: (requestId: string) => ["admin", "ai", "requestById", requestId] as const,
} as const;
