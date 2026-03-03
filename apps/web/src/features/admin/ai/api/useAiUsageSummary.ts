"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { adminAiKeys } from "@/lib/engine/queryKeys";
import { getAiUsageSummary } from "./adminAiApi";

export function useAiUsageSummary(tenantId: string | null, range: { from: string; to: string }) {
  return useQuery({
    queryKey: adminAiKeys.usage(tenantId ?? "", range),
    queryFn: async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const getAuthToken = async () => session?.access_token ?? null;
      return getAiUsageSummary(tenantId!, range, getAuthToken);
    },
    enabled: !!tenantId,
  });
}
