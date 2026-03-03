"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/engine/queryKeys";
import type { ProjectRow } from "@/lib/supabase/rpc";

async function fetchProjects(): Promise<ProjectRow[]> {
  const res = await fetch("/api/projects", { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error((body as { error?: string })?.error ?? res.statusText) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const json = (await res.json()) as { data?: ProjectRow[] };
  return json.data ?? [];
}

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: fetchProjects,
  });
}
