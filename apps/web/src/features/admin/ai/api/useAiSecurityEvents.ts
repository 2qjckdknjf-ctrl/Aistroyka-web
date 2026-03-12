"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { adminAiKeys } from "@/lib/engine/queryKeys";
import { listAiSecurityEvents } from "./adminAiApi";

export function useAiSecurityEvents(
  tenantId: string | null,
  range: { from: string; to: string },
  filters?: { severity?: string; event_type?: string }
) {
  return useQuery({
    queryKey: adminAiKeys.security(tenantId ?? "", range, filters),
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
      return listAiSecurityEvents(
        tenantId!,
        { range, limit: 50, severity: filters?.severity, event_type: filters?.event_type },
        getAuthToken
      );
    },
    enabled: !!tenantId,
  });
}
