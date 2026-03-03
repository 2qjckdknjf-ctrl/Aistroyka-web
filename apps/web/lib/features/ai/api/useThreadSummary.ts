"use client";

import { useQuery } from "@tanstack/react-query";
import { getThreadSummary } from "./chatApi";

const STALE_MS = 45_000; // 45s cache

export function useThreadSummary(threadId: string | null, getAuthToken: () => Promise<string | null>) {
  return useQuery({
    queryKey: ["ai", "threadSummary", threadId ?? ""],
    queryFn: async () => {
      if (!threadId) return null;
      return getThreadSummary(threadId, getAuthToken);
    },
    enabled: !!threadId,
    staleTime: STALE_MS,
    gcTime: 60_000,
  });
}
