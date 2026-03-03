"use client";

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/engine/queryKeys";
import { fetchProject } from "./useProject";

/** Prefetch project details (e.g. on link hover). */
export function usePrefetchProject() {
  const queryClient = useQueryClient();
  return (projectId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.project(projectId),
      queryFn: () => fetchProject(projectId),
    });
  };
}
