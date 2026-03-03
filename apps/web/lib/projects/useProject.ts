"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/engine/queryKeys";

export type ProjectDetail = { id: string; name: string; tenant_id: string };

export async function fetchProject(projectId: string): Promise<ProjectDetail | null> {
  const res = await fetch(`/api/projects/${projectId}`, { credentials: "include" });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error((body as { error?: string })?.error ?? res.statusText) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const json = (await res.json()) as { data?: ProjectDetail };
  return json.data ?? null;
}

export function useProject(projectId: string | null) {
  return useQuery({
    queryKey: queryKeys.project(projectId ?? ""),
    queryFn: () => fetchProject(projectId!),
    enabled: !!projectId,
  });
}

