"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { adminAiKeys } from "@/lib/engine/queryKeys";
import { getRequestById } from "./adminAiApi";

export function useRequestById(requestId: string | null, tenantId?: string | null) {
  return useQuery({
    queryKey: adminAiKeys.requestById(requestId ?? ""),
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
      return getRequestById(requestId!, tenantId ?? undefined, getAuthToken);
    },
    enabled: !!requestId?.trim(),
  });
}
