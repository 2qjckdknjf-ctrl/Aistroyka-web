"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const ADMIN_ROLES = ["owner", "admin"];

export type AdminTenant = { id: string; name?: string };

export function useAdminTenants() {
  return useQuery({
    queryKey: ["admin", "tenants"],
    queryFn: async (): Promise<AdminTenant[]> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data: memberships } = await supabase
        .from("tenant_members")
        .select("tenant_id, role")
        .eq("user_id", user.id);
      const ids = (memberships ?? [])
        .filter((m) => m.role && ADMIN_ROLES.includes(m.role as string))
        .map((m) => m.tenant_id as string);
      if (ids.length === 0) return [];
      const { data: tenants } = await supabase.from("tenants").select("id, name").in("id", ids);
      return (tenants ?? []).map((t) => ({ id: t.id, name: (t as { name?: string }).name }));
    },
  });
}
