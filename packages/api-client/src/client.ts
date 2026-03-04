/**
 * Typed API client for Aistroyka v1. Use with baseUrl and optional getToken (e.g. Supabase session).
 */

import type { HealthResponse, AnalyzeImageRequest, AnalysisResult, Project, ProjectsListResponse } from "./types";
import { fetcher, type FetcherOptions } from "./fetcher";

const V1 = "/api/v1";

export interface ApiClientOptions extends FetcherOptions {}

export function createClient(options: ApiClientOptions) {
  const f = <T>(method: string, path: string, body?: unknown) =>
    fetcher<T>(options, method, path, body);

  return {
    health: () => f<HealthResponse>("GET", `${V1}/health`),
    projects: {
      list: () => f<ProjectsListResponse>("GET", `${V1}/projects`),
      create: (name: string) => f<{ success: true; data: { id: string } }>("POST", `${V1}/projects`, { name }),
    },
    ai: {
      analyzeImage: (req: AnalyzeImageRequest) => f<AnalysisResult>("POST", `${V1}/ai/analyze-image`, req),
    },
    worker: {
      tasksToday: () => f<{ data: Array<{ id: string; title: string; status: string }> }>("GET", `${V1}/worker/tasks/today`),
      sync: (since?: string) =>
        f<{ serverTime: string; traceId: string; data: { tasks: unknown[]; reports: unknown[]; uploadSessions: unknown[] } }>(
          "GET",
          since ? `${V1}/worker/sync?since=${encodeURIComponent(since)}` : `${V1}/worker/sync`
        ),
    },
  };
}

export type ApiClient = ReturnType<typeof createClient>;
