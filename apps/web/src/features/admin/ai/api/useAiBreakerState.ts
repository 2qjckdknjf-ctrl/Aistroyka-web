"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { adminAiKeys } from "@/lib/engine/queryKeys";
import { getAiBreakerState } from "./adminAiApi";

export function useAiBreakerState() {
  return useQuery({
    queryKey: adminAiKeys.breaker(),
    queryFn: async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const getAuthToken = async () => session?.access_token ?? null;
      return getAiBreakerState(getAuthToken);
    },
  });
}
