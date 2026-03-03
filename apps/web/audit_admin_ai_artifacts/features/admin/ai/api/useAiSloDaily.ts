"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { adminAiKeys } from "@/lib/engine/queryKeys";
import { getAiSloDaily } from "./adminAiApi";

export function useAiSloDaily(tenantId: string | null, lastNDays: number = 7) {
  return useQuery({
    queryKey: adminAiKeys.slo(tenantId ?? "", lastNDays),
    queryFn: async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const getAuthToken = async () => session?.access_token ?? null;
      return getAiSloDaily(tenantId!, lastNDays, getAuthToken);
    },
    enabled: !!tenantId,
  });
}
