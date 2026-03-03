/**
 * Single QueryClient with centralized cache/retry/error policies.
 * Used by QueryClientProvider in app layout.
 */

import { QueryClient } from "@tanstack/react-query";

/** Normalize error so React Query sees a stable type; 401/403/404 should not retry. Exported for tests. */
export function isNoRetryStatus(error: unknown): boolean {
  if (error != null && typeof error === "object" && "status" in error) {
    const s = (error as { status?: number }).status;
    return s === 401 || s === 403 || s === 404;
  }
  return false;
}

/** Retry policy: no retry for 401/403/404; otherwise retry up to 2 times. */
export function defaultRetry(failureCount: number, error: unknown): boolean {
  if (isNoRetryStatus(error)) return false;
  return failureCount < 2;
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30s
        gcTime: 10 * 60 * 1000, // 10m (formerly cacheTime)
        retry: defaultRetry,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        throwOnError: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
