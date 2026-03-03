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
} as const;
