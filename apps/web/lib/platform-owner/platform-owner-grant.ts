import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlatformOwnerRole } from "./constants";
import { parsePlatformOwnerRole } from "./owner-capabilities";

export async function getPlatformOwnerGrant(
  supabase: SupabaseClient,
  userId: string
): Promise<
  { ok: true; role: PlatformOwnerRole } | { ok: false; reason: "db_error" | "not_granted" | "invalid_role" }
> {
  const { data, error } = await supabase
    .from("platform_owner_grants")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { ok: false, reason: "db_error" };
  if (!data?.role) return { ok: false, reason: "not_granted" };
  const role = parsePlatformOwnerRole(String(data.role));
  if (!role) return { ok: false, reason: "invalid_role" };
  return { ok: true, role };
}
