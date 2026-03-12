"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { adminAiKeys } from "@/lib/engine/queryKeys";
import { listRecentIssues } from "./adminAiApi";

export function useRecentIssues(tenantId?: string | null, limit?: number) {
  return useQuery({
    queryKey: adminAiKeys.recentIssues(tenantId ?? undefined),
    queryFn: async () => {
      const supabase = createClient();
      let session: { access_token?: string } | null = null;
      try {
        const res = await supabase.auth.getSession();
        session = res?.data?.session ?? null;
      } catch {
        // fallthrough
      }
      const getAuthToken = async () => session?.access_token ?? null;
      return listRecentIssues({ tenant_id: tenantId ?? undefined, limit }, getAuthToken);
    },
  });
}
